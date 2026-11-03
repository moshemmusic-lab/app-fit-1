-- Routines and folders: idempotent saves, data rules and who can read or change them.
begin;
create extension if not exists pgtap with schema extensions;
select plan(24);

-- Two users: Ana (1111…) and Luis (2222…). Luis has a folder Ana must not be able to use.
insert into auth.users (id, email) values
  ('11111111-1111-1111-1111-111111111111', 'ana@example.com'),
  ('22222222-2222-2222-2222-222222222222', 'luis@example.com');

insert into public.routine_folders (id, owner_id, name) values
  ('44444444-4444-4444-4444-444444444444', '22222222-2222-2222-2222-222222222222', 'De Luis');

-- A routine like the phone sends it: one exercise with p_sets target sets.
create function public.test_routine_payload(
  p_sets integer,
  p_folder_id uuid default null,
  p_name text default 'Torso A',
  p_exercise_id uuid default null
)
returns jsonb
language sql
as $$
  select jsonb_build_object(
    'id', 'dddddddd-dddd-dddd-dddd-dddddddddddd',
    'folder_id', p_folder_id,
    'name', p_name,
    'notes', '',
    'exercises', jsonb_build_array(
      jsonb_build_object(
        'id', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
        'exercise_id', coalesce(
          p_exercise_id,
          (select id from public.exercises where slug = 'barbell-bench-press')
        ),
        'position', 0,
        'rest_seconds', 120,
        'notes', '',
        'sets', (
          select jsonb_agg(
            jsonb_build_object(
              'id', ('ffffffff-ffff-ffff-ffff-' || lpad(n::text, 12, '0'))::uuid,
              'position', n,
              'set_type', case when n = 0 then 'warmup' else 'normal' end,
              'target_reps', 8,
              'target_weight_kg', 60
            )
          )
          from generate_series(0, p_sets - 1) n
        )
      )
    )
  );
$$;

grant execute on function public.test_routine_payload(integer, uuid, text, uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- As Ana
-- ---------------------------------------------------------------------------

set local role authenticated;
set local request.jwt.claims to '{"sub": "11111111-1111-1111-1111-111111111111", "role": "authenticated"}';

select lives_ok(
  $$ insert into public.routine_folders (id, name)
     values ('33333333-3333-3333-3333-333333333333', 'Fuerza') $$,
  'A user can create a folder (owned by them automatically)'
);

select results_eq(
  $$ select owner_id from public.routine_folders where id = '33333333-3333-3333-3333-333333333333' $$,
  $$ values ('11111111-1111-1111-1111-111111111111'::uuid) $$,
  'The new folder belongs to whoever created it'
);

select is_empty(
  $$ select 1 from public.routine_folders where id = '44444444-4444-4444-4444-444444444444' $$,
  'A user cannot see someone else''s folders'
);

select lives_ok(
  $$ select public.save_routine(
       public.test_routine_payload(3, '33333333-3333-3333-3333-333333333333')
     ) $$,
  'A user can save a routine in their own folder'
);

select results_eq(
  $$ select
       (select count(*)::int from public.routines),
       (select count(*)::int from public.routine_exercises),
       (select count(*)::int from public.routine_sets) $$,
  $$ values (1, 1, 3) $$,
  'The routine, its exercise and its target sets are saved'
);

select lives_ok(
  $$ select public.save_routine(public.test_routine_payload(2, null, 'Torso A editada')) $$,
  'Saving the same routine again works'
);

select results_eq(
  $$ select r.name, r.folder_id, (select count(*)::int from public.routine_sets)
     from public.routines r $$,
  $$ values ('Torso A editada', null::uuid, 2) $$,
  '…and replaces it instead of making a copy'
);

select results_eq(
  $$ select visibility, owner_id from public.routines $$,
  $$ values ('private', '11111111-1111-1111-1111-111111111111'::uuid) $$,
  'A new routine is private and belongs to the user who saved it'
);

select lives_ok(
  $$ update public.routines set folder_id = '33333333-3333-3333-3333-333333333333' $$,
  'A user can move their routine to one of their folders'
);

select throws_ok(
  $$ update public.routines set folder_id = '44444444-4444-4444-4444-444444444444' $$,
  '23503',
  null,
  'A routine cannot go into someone else''s folder'
);

select throws_ok(
  $$ select public.save_routine(
       public.test_routine_payload(1, '44444444-4444-4444-4444-444444444444')
     ) $$,
  '22023',
  null,
  'Saving into someone else''s folder is rejected'
);

select throws_ok(
  $$ update public.routines set name = 'Directo' $$,
  '42501',
  null,
  'The routine content can only change through save_routine()'
);

select throws_ok(
  $$ insert into public.routine_sets (id, routine_exercise_id, position)
     values (gen_random_uuid(), 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 9) $$,
  '42501',
  null,
  'A user cannot write target sets directly'
);

select throws_ok(
  $$ select public.save_routine(public.test_routine_payload(1, null, '   ')) $$,
  '23514',
  null,
  'A routine needs a name'
);

select throws_ok(
  $$ select public.save_routine(public.test_routine_payload(1, null, 'X', gen_random_uuid())) $$,
  '22023',
  null,
  'An unknown exercise is rejected'
);

select lives_ok(
  $$ select public.save_workout(jsonb_build_object(
       'id', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
       'routine_id', 'dddddddd-dddd-dddd-dddd-dddddddddddd',
       'title', 'Torso A',
       'started_at', '2026-11-03T10:00:00Z',
       'ended_at', '2026-11-03T11:00:00Z',
       'exercises', '[]'::jsonb
     )) $$,
  'A workout can be saved as started from the user''s routine'
);

select results_eq(
  $$ select routine_id from public.workouts $$,
  $$ values ('dddddddd-dddd-dddd-dddd-dddddddddddd'::uuid) $$,
  '…and remembers that routine'
);

select lives_ok(
  $$ delete from public.routine_folders where id = '33333333-3333-3333-3333-333333333333' $$,
  'A user can delete their folder'
);

select results_eq(
  $$ select folder_id, deleted_at is null from public.routines $$,
  $$ values (null::uuid, true) $$,
  '…and its routines stay, without folder'
);

select lives_ok(
  $$ update public.routines set deleted_at = now() $$,
  'A user can delete their routine (soft delete)'
);

-- ---------------------------------------------------------------------------
-- As Luis
-- ---------------------------------------------------------------------------

set local request.jwt.claims to '{"sub": "22222222-2222-2222-2222-222222222222", "role": "authenticated"}';

select is_empty(
  $$ select 1 from public.routines union all select 1 from public.routine_sets $$,
  'A user cannot see someone else''s routines nor their sets'
);

select throws_ok(
  $$ select public.save_routine(public.test_routine_payload(1)) $$,
  '42501',
  null,
  'A user cannot overwrite someone else''s routine'
);

select throws_ok(
  $$ select public.save_workout(jsonb_build_object(
       'id', gen_random_uuid(),
       'routine_id', 'dddddddd-dddd-dddd-dddd-dddddddddddd',
       'title', 'Robada',
       'started_at', '2026-11-03T10:00:00Z',
       'ended_at', '2026-11-03T11:00:00Z',
       'exercises', '[]'::jsonb
     )) $$,
  '22023',
  null,
  'A workout cannot be linked to someone else''s routine'
);

-- ---------------------------------------------------------------------------
-- Without a session
-- ---------------------------------------------------------------------------

reset role;
set local role anon;

select throws_ok(
  $$ select public.save_routine('{}'::jsonb) $$,
  '42501',
  null,
  'Someone without a session cannot save routines'
);

select * from finish();
rollback;
