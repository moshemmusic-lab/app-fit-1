-- Custom exercises: who can create, see, change, use and delete them.
begin;
create extension if not exists pgtap with schema extensions;
select plan(23);

-- Two users: Ana (1111…) and Luis (2222…).
insert into auth.users (id, email) values
  ('11111111-1111-1111-1111-111111111111', 'ana@example.com'),
  ('22222222-2222-2222-2222-222222222222', 'luis@example.com');

-- A custom exercise like the phone sends it.
create function public.test_custom_exercise(
  p_name text default 'Press Technogym',
  p_tracking_type text default 'weight_reps',
  p_id uuid default 'cccccccc-cccc-cccc-cccc-cccccccccccc'
)
returns jsonb
language sql
as $$
  select jsonb_build_object(
    'id', p_id,
    'locale', 'es-ES',
    'name', p_name,
    'tracking_type', p_tracking_type,
    'primary_muscle', 'chest',
    'equipment', 'machine'
  );
$$;

grant execute on function public.test_custom_exercise(text, text, uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- As Ana
-- ---------------------------------------------------------------------------

set local role authenticated;
set local request.jwt.claims to '{"sub": "11111111-1111-1111-1111-111111111111", "role": "authenticated"}';

select lives_ok(
  $$ select public.save_custom_exercise(public.test_custom_exercise()) $$,
  'A user can create a custom exercise'
);

select results_eq(
  $$ select e.owner_id, e.slug, t.name
     from public.exercises e
     join public.exercise_translations t on t.exercise_id = e.id
     where e.id = 'cccccccc-cccc-cccc-cccc-cccccccccccc' $$,
  $$ values ('11111111-1111-1111-1111-111111111111'::uuid, null::text, 'Press Technogym') $$,
  'It belongs to its creator, has no slug and has its name'
);

select lives_ok(
  $$ select public.save_custom_exercise(public.test_custom_exercise('Press Technogym 2')) $$,
  'Saving it again works'
);

select results_eq(
  $$ select count(*)::int, min(t.name)
     from public.exercise_translations t
     where t.exercise_id = 'cccccccc-cccc-cccc-cccc-cccccccccccc' $$,
  $$ values (1, 'Press Technogym 2') $$,
  '…and renames it instead of making a copy'
);

select throws_ok(
  $$ select public.save_custom_exercise(public.test_custom_exercise('X', 'duration')) $$,
  '22023',
  null,
  'How an exercise is tracked cannot change after it is created'
);

select throws_ok(
  $$ select public.save_custom_exercise(public.test_custom_exercise('   ')) $$,
  '23514',
  null,
  'A custom exercise needs a name'
);

select throws_ok(
  $$ select public.save_custom_exercise(public.test_custom_exercise(
       'Mi banca',
       'weight_reps',
       (select id from public.exercises where slug = 'barbell-bench-press')
     )) $$,
  '42501',
  null,
  'A global exercise cannot be overwritten'
);

select throws_ok(
  $$ insert into public.exercises (tracking_type, primary_muscle, equipment, owner_id)
     values ('weight_reps', 'chest', 'machine', '11111111-1111-1111-1111-111111111111') $$,
  '42501',
  null,
  'Exercises cannot be inserted directly'
);

select throws_ok(
  $$ update public.exercise_translations set name = 'Directo'
     where exercise_id = 'cccccccc-cccc-cccc-cccc-cccccccccccc' $$,
  '42501',
  null,
  'Names cannot be changed directly'
);

select lives_ok(
  $$ select public.save_workout(jsonb_build_object(
       'id', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
       'title', 'Pecho',
       'started_at', '2026-11-04T10:00:00Z',
       'ended_at', '2026-11-04T11:00:00Z',
       'exercises', jsonb_build_array(jsonb_build_object(
         'id', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
         'exercise_id', 'cccccccc-cccc-cccc-cccc-cccccccccccc',
         'position', 0,
         'sets', jsonb_build_array(jsonb_build_object(
           'id', 'dddddddd-dddd-dddd-dddd-dddddddddddd',
           'position', 0,
           'weight_kg', 50,
           'reps', 10,
           'completed_at', '2026-11-04T10:10:00Z'
         ))
       ))
     )) $$,
  'A user can log their custom exercise in a workout'
);

select lives_ok(
  $$ update public.exercises set deleted_at = now()
     where id = 'cccccccc-cccc-cccc-cccc-cccccccccccc' $$,
  'A user can delete their custom exercise (soft delete)'
);

select results_eq(
  $$ select
       (select deleted_at is not null from public.exercises
        where id = 'cccccccc-cccc-cccc-cccc-cccccccccccc'),
       (select count(*)::int from public.workout_sets
        where id = 'dddddddd-dddd-dddd-dddd-dddddddddddd') $$,
  $$ values (true, 1) $$,
  '…and the workouts that used it keep it'
);

select is_empty(
  $$ update public.exercises set deleted_at = now()
     where slug = 'barbell-bench-press' returning id $$,
  'A global exercise cannot be deleted'
);

select lives_ok(
  $$ select public.save_custom_exercise(public.test_custom_exercise('Press Technogym 3')) $$,
  'Editing a deleted custom exercise works'
);

select results_eq(
  $$ select deleted_at is null from public.exercises
     where id = 'cccccccc-cccc-cccc-cccc-cccccccccccc' $$,
  $$ values (true) $$,
  '…and brings it back to the library'
);

-- ---------------------------------------------------------------------------
-- As Luis
-- ---------------------------------------------------------------------------

set local request.jwt.claims to '{"sub": "22222222-2222-2222-2222-222222222222", "role": "authenticated"}';

select is_empty(
  $$ select 1 from public.exercises where id = 'cccccccc-cccc-cccc-cccc-cccccccccccc'
     union all
     select 1 from public.exercise_translations
     where exercise_id = 'cccccccc-cccc-cccc-cccc-cccccccccccc' $$,
  'A user cannot see someone else''s custom exercises'
);

select throws_ok(
  $$ select public.save_custom_exercise(public.test_custom_exercise('Robado')) $$,
  '42501',
  null,
  'A user cannot change someone else''s custom exercise'
);

select throws_ok(
  $$ select public.save_routine(jsonb_build_object(
       'id', gen_random_uuid(),
       'name', 'Robada',
       'exercises', jsonb_build_array(jsonb_build_object(
         'id', gen_random_uuid(),
         'exercise_id', 'cccccccc-cccc-cccc-cccc-cccccccccccc',
         'position', 0
       ))
     )) $$,
  '22023',
  null,
  'A user cannot use someone else''s custom exercise in a routine'
);

-- ---------------------------------------------------------------------------
-- Without a session, and account deletion
-- ---------------------------------------------------------------------------

reset role;
set local role anon;

select throws_ok(
  $$ select public.save_custom_exercise(public.test_custom_exercise()) $$,
  '42501',
  null,
  'Someone without a session cannot create exercises'
);

reset role;

-- Checked right away here: deleting an exercise that a workout still uses is always refused.
set constraints all immediate;
select throws_ok(
  $$ delete from public.exercises where id = 'cccccccc-cccc-cccc-cccc-cccccccccccc' $$,
  '23503',
  null,
  'An exercise that a workout uses can never be removed for good'
);
set constraints all deferred;

select lives_ok(
  $$ delete from auth.users where id = '11111111-1111-1111-1111-111111111111' $$,
  'An account with custom exercises used in workouts can be deleted'
);

-- References are checked at commit; check them now, as the commit would.
select lives_ok(
  $$ set constraints all immediate $$,
  '…without leaving workouts or routines pointing to a deleted exercise'
);

select results_eq(
  $$ select
       (select count(*)::int from public.exercises
        where owner_id = '11111111-1111-1111-1111-111111111111'),
       (select count(*)::int from public.workouts
        where id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa') $$,
  $$ values (0, 0) $$,
  'Deleting an account deletes its custom exercises and the workouts that used them'
);

select * from finish();
rollback;
