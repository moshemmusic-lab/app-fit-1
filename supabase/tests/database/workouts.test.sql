-- Workouts: idempotent uploads, data rules and who can read or write them.
begin;
create extension if not exists pgtap with schema extensions;
select plan(20);

-- Two users: Ana (1111…) and Luis (2222…). Luis has a custom exercise Ana cannot use.
insert into auth.users (id, email) values
  ('11111111-1111-1111-1111-111111111111', 'ana@example.com'),
  ('22222222-2222-2222-2222-222222222222', 'luis@example.com');

insert into public.exercises (id, owner_id, tracking_type, primary_muscle, equipment) values
  ('33333333-3333-3333-3333-333333333333', '22222222-2222-2222-2222-222222222222',
   'weight_reps', 'chest', 'machine');

-- Builds a workout like the phone sends it: one exercise with p_sets sets.
-- Created inside this transaction, so it disappears with the rollback.
create function public.test_workout_payload(
  p_sets integer,
  p_exercise_id uuid default null,
  p_weight numeric default 100,
  p_ended_at text default '2026-11-03T11:00:00Z'
)
returns jsonb
language sql
as $$
  select jsonb_build_object(
    'id', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'title', 'Pierna',
    'notes', '',
    'visibility', 'followers',
    'started_at', '2026-11-03T10:00:00Z',
    'ended_at', p_ended_at,
    'exercises', jsonb_build_array(
      jsonb_build_object(
        'id', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
        'exercise_id', coalesce(
          p_exercise_id,
          (select id from public.exercises where slug = 'barbell-back-squat')
        ),
        'position', 0,
        'notes', '',
        'sets', (
          select jsonb_agg(
            jsonb_build_object(
              'id', ('cccccccc-cccc-cccc-cccc-' || lpad(n::text, 12, '0'))::uuid,
              'position', n,
              'set_type', 'normal',
              'weight_kg', p_weight,
              'reps', 5,
              'completed_at', '2026-11-03T10:30:00Z'
            )
          )
          from generate_series(0, p_sets - 1) n
        )
      )
    )
  );
$$;

grant execute on function public.test_workout_payload(integer, uuid, numeric, text) to authenticated;

-- ---------------------------------------------------------------------------
-- As Ana
-- ---------------------------------------------------------------------------

set local role authenticated;
set local request.jwt.claims to '{"sub": "11111111-1111-1111-1111-111111111111", "role": "authenticated"}';

select lives_ok(
  $$ select public.save_workout(public.test_workout_payload(2)) $$,
  'A user can save a finished workout'
);

select results_eq(
  $$ select
       (select count(*)::int from public.workouts),
       (select count(*)::int from public.workout_exercises),
       (select count(*)::int from public.workout_sets) $$,
  $$ values (1, 1, 2) $$,
  'The workout, its exercise and its sets are saved'
);

select lives_ok(
  $$ select public.save_workout(public.test_workout_payload(2)) $$,
  'Uploading the same workout again works'
);

select results_eq(
  $$ select
       (select count(*)::int from public.workouts),
       (select count(*)::int from public.workout_exercises),
       (select count(*)::int from public.workout_sets) $$,
  $$ values (1, 1, 2) $$,
  '…and leaves exactly one copy'
);

select lives_ok(
  $$ select public.save_workout(public.test_workout_payload(3, null, 102.5)) $$,
  'Uploading a changed version of the workout works'
);

select results_eq(
  $$ select count(*)::int, min(weight_kg) from public.workout_sets $$,
  $$ values (3, 102.500::numeric) $$,
  '…and replaces the sets saved before'
);

select results_eq(
  $$ select user_id, title, visibility, ended_at - started_at from public.workouts $$,
  $$ values ('11111111-1111-1111-1111-111111111111'::uuid, 'Pierna', 'followers', interval '1 hour') $$,
  'The workout belongs to the user who saved it'
);

select throws_ok(
  $$ insert into public.workouts (id, user_id, title, started_at, ended_at)
     values (gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'Directo', now(), now()) $$,
  '42501',
  null,
  'A user cannot write the workouts table directly'
);

select throws_ok(
  $$ select public.save_workout(public.test_workout_payload(1, null, -5)) $$,
  '23514',
  null,
  'A negative weight is rejected'
);

select throws_ok(
  $$ select public.save_workout(public.test_workout_payload(1, null, 100, '2026-11-03T09:00:00Z')) $$,
  '23514',
  null,
  'A workout cannot end before it starts'
);

select throws_ok(
  $$ select public.save_workout(public.test_workout_payload(1, gen_random_uuid())) $$,
  '22023',
  null,
  'An unknown exercise is rejected'
);

select throws_ok(
  $$ select public.save_workout(
       public.test_workout_payload(1, '33333333-3333-3333-3333-333333333333')
     ) $$,
  '22023',
  null,
  'Someone else''s custom exercise is rejected'
);

-- ---------------------------------------------------------------------------
-- As Luis
-- ---------------------------------------------------------------------------

set local request.jwt.claims to '{"sub": "22222222-2222-2222-2222-222222222222", "role": "authenticated"}';

select is_empty(
  $$ select 1 from public.workouts $$,
  'A user cannot see someone else''s workouts'
);

select is_empty(
  $$ select 1 from public.workout_exercises $$,
  '…nor their exercises'
);

select is_empty(
  $$ select 1 from public.workout_sets $$,
  '…nor their sets'
);

select throws_ok(
  $$ select public.save_workout(public.test_workout_payload(1)) $$,
  '42501',
  null,
  'A user cannot overwrite someone else''s workout'
);

-- ---------------------------------------------------------------------------
-- Without a session
-- ---------------------------------------------------------------------------

reset role;
set local role anon;

select throws_ok(
  $$ select public.save_workout('{}'::jsonb) $$,
  '42501',
  null,
  'Someone without a session cannot save workouts'
);

-- ---------------------------------------------------------------------------
-- Back as the database owner
-- ---------------------------------------------------------------------------

reset role;

select results_eq(
  $$ select count(*)::int, min(weight_kg) from public.workout_sets
     where workout_exercise_id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb' $$,
  $$ values (3, 102.500::numeric) $$,
  'Rejected uploads changed nothing'
);

select lives_ok(
  $$ delete from auth.users where id = '11111111-1111-1111-1111-111111111111' $$,
  'Deleting an account works'
);

select results_eq(
  $$ select
       (select count(*)::int from public.workouts
        where id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
       (select count(*)::int from public.workout_sets
        where workout_exercise_id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb') $$,
  $$ values (0, 0) $$,
  '…and deletes its workouts and sets'
);

select * from finish();
rollback;
