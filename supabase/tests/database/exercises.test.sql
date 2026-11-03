-- Exercise library: content quality and who can read or change it.
begin;
create extension if not exists pgtap with schema extensions;
select plan(18);

-- Two users: Ana (1111…) and Luis (2222…). Ana has a custom exercise (created here as the
-- database owner; the app cannot create them until step 5).
insert into auth.users (id, email) values
  ('11111111-1111-1111-1111-111111111111', 'ana@example.com'),
  ('22222222-2222-2222-2222-222222222222', 'luis@example.com');

insert into public.exercises (id, owner_id, tracking_type, primary_muscle, equipment) values
  ('33333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111',
   'weight_reps', 'chest', 'machine');

insert into public.exercise_translations (exercise_id, locale, name) values
  ('33333333-3333-3333-3333-333333333333', 'es-ES', 'Press de Ana');

-- ---------------------------------------------------------------------------
-- The global library is complete
-- ---------------------------------------------------------------------------

select ok(
  (select count(*) from public.exercises where owner_id is null) >= 140,
  'The global library has at least 140 exercises'
);

select is_empty(
  $$ select e.slug from public.exercises e
     where e.owner_id is null
       and not exists (
         select 1 from public.exercise_translations t
         where t.exercise_id = e.id and t.locale = 'es-ES'
       ) $$,
  'Every global exercise has a Spanish (Spain) name'
);

select is_empty(
  $$ select t.name from public.exercise_translations t
     join public.exercises e on e.id = t.exercise_id
     where e.owner_id is null and t.locale = 'es-ES'
     group by t.name having count(*) > 1 $$,
  'Global exercise names are unique in Spanish'
);

select is_empty(
  $$ select e.slug from public.exercises e
     join public.exercise_translations t on t.exercise_id = e.id
     where e.owner_id is null and cardinality(t.instructions) < 2 $$,
  'Every global exercise has step-by-step instructions'
);

select is_empty(
  $$ select slug from public.exercises where owner_id is null and not ('gym' = any (disciplines)) $$,
  'Every global exercise belongs to the gym discipline'
);

-- ---------------------------------------------------------------------------
-- Data rules enforced by the database
-- ---------------------------------------------------------------------------

select throws_ok(
  $$ insert into public.exercises (tracking_type, primary_muscle, equipment)
     values ('weight_reps', 'chest', 'barbell') $$,
  '23514',
  null,
  'A global exercise needs a slug'
);

select throws_ok(
  $$ insert into public.exercises (slug, tracking_type, primary_muscle, secondary_muscles, equipment)
     values ('bad-muscles', 'weight_reps', 'chest', '{chest,triceps}', 'barbell') $$,
  '23514',
  null,
  'The primary muscle cannot also be a secondary muscle'
);

-- ---------------------------------------------------------------------------
-- As Ana
-- ---------------------------------------------------------------------------

set local role authenticated;
set local request.jwt.claims to '{"sub": "11111111-1111-1111-1111-111111111111", "role": "authenticated"}';

select ok(
  (select count(*) from public.exercises where owner_id is null) >= 140,
  'A signed-in user can read the global library'
);

select isnt_empty(
  $$ select 1 from public.exercise_translations t
     join public.exercises e on e.id = t.exercise_id
     where e.slug = 'barbell-bench-press' and t.locale = 'es-ES' $$,
  'A signed-in user can read exercise names and instructions'
);

select isnt_empty(
  $$ select 1 from public.exercises where id = '33333333-3333-3333-3333-333333333333' $$,
  'A user can see their own custom exercise'
);

select throws_ok(
  $$ insert into public.exercises (slug, tracking_type, primary_muscle, equipment)
     values ('my-exercise', 'weight_reps', 'chest', 'barbell') $$,
  '42501',
  null,
  'A user cannot add exercises to the library'
);

select throws_ok(
  $$ update public.exercises set equipment = 'machine' where slug = 'barbell-bench-press' $$,
  '42501',
  null,
  'A user cannot change a global exercise'
);

select throws_ok(
  $$ delete from public.exercises where slug = 'barbell-bench-press' $$,
  '42501',
  null,
  'A user cannot delete a global exercise'
);

select throws_ok(
  $$ update public.exercise_translations set name = 'Hackeado' where locale = 'es-ES' $$,
  '42501',
  null,
  'A user cannot rename exercises'
);

-- ---------------------------------------------------------------------------
-- As Luis
-- ---------------------------------------------------------------------------

set local request.jwt.claims to '{"sub": "22222222-2222-2222-2222-222222222222", "role": "authenticated"}';

select is_empty(
  $$ select 1 from public.exercises where id = '33333333-3333-3333-3333-333333333333' $$,
  'A user cannot see someone else''s custom exercise'
);

select is_empty(
  $$ select 1 from public.exercise_translations
     where exercise_id = '33333333-3333-3333-3333-333333333333' $$,
  '…nor its name'
);

-- ---------------------------------------------------------------------------
-- Without a session
-- ---------------------------------------------------------------------------

reset role;
set local role anon;

select throws_ok(
  $$ select 1 from public.exercises limit 1 $$,
  '42501',
  null,
  'Someone without a session cannot read the library'
);

reset role;

select results_eq(
  $$ select equipment::text from public.exercises where slug = 'barbell-bench-press' $$,
  $$ values ('barbell') $$,
  'The global library stays unchanged'
);

select * from finish();
rollback;
