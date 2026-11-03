-- Who can read and write profiles, settings, onboarding answers and avatars.
begin;
create extension if not exists pgtap with schema extensions;
select plan(26);

-- Two users: Ana (1111…) and Luis (2222…).
insert into auth.users (id, email) values
  ('11111111-1111-1111-1111-111111111111', 'ana@example.com'),
  ('22222222-2222-2222-2222-222222222222', 'luis@example.com');

-- ---------------------------------------------------------------------------
-- Sign-up creates both rows with private defaults
-- ---------------------------------------------------------------------------

select results_eq(
  $$ select count(*)::int from public.profiles
     where id in ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222') $$,
  array[2],
  'Signing up creates a profile'
);

select results_eq(
  $$ select units, default_workout_visibility, health_data_consent_at is null
     from public.user_settings where user_id = '11111111-1111-1111-1111-111111111111' $$,
  $$ values ('kg', 'followers', true) $$,
  'Signing up creates settings with kg, followers-only workouts and no consent'
);

-- ---------------------------------------------------------------------------
-- As Ana
-- ---------------------------------------------------------------------------

set local role authenticated;
set local request.jwt.claims to '{"sub": "11111111-1111-1111-1111-111111111111", "role": "authenticated"}';

select results_eq(
  $$ select count(*)::int from public.profiles
     where id in ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222') $$,
  array[2],
  'A signed-in user can see other profiles'
);

select isnt_empty(
  $$ select 1 from public.user_settings where user_id = '11111111-1111-1111-1111-111111111111' $$,
  'A user can see their own settings'
);

select is_empty(
  $$ select 1 from public.user_settings where user_id = '22222222-2222-2222-2222-222222222222' $$,
  'A user cannot see someone else''s settings'
);

select lives_ok(
  $$ update public.profiles set bio = 'Entreno por las mañanas'
     where id = '11111111-1111-1111-1111-111111111111' $$,
  'A user can edit their own bio'
);

select lives_ok(
  $$ update public.profiles set bio = 'Hackeado'
     where id = '22222222-2222-2222-2222-222222222222' $$,
  'Editing someone else''s profile runs without error…'
);

select lives_ok(
  $$ update public.user_settings set units = 'lb'
     where user_id = '11111111-1111-1111-1111-111111111111' $$,
  'A user can change their own units'
);

select lives_ok(
  $$ update public.user_settings set units = 'lb'
     where user_id = '22222222-2222-2222-2222-222222222222' $$,
  'Editing someone else''s settings runs without error…'
);

select throws_ok(
  $$ update public.profiles set role = 'admin'
     where id = '11111111-1111-1111-1111-111111111111' $$,
  '42501',
  null,
  'A user cannot change their own role'
);

select throws_ok(
  $$ update public.user_settings set health_data_consent_at = now()
     where user_id = '11111111-1111-1111-1111-111111111111' $$,
  '42501',
  null,
  'A user cannot write the consent date directly'
);

select throws_ok(
  $$ insert into public.profiles (id) values (gen_random_uuid()) $$,
  '42501',
  null,
  'A user cannot create profiles'
);

select throws_ok(
  $$ delete from public.profiles where id = '11111111-1111-1111-1111-111111111111' $$,
  '42501',
  null,
  'A user cannot delete profiles (only deleting the account does)'
);

select throws_ok(
  $$ update public.profiles set avatar_path = '22222222-2222-2222-2222-222222222222/foto.jpg'
     where id = '11111111-1111-1111-1111-111111111111' $$,
  '23514',
  null,
  'A profile photo must live in the owner''s folder'
);

-- Onboarding
select throws_ok(
  $$ select public.complete_onboarding('ana_fit', 'Ana', 'strength', 'beginner', 'kg', false) $$,
  '22023',
  null,
  'Onboarding cannot finish without health data consent'
);

select throws_ok(
  $$ select public.complete_onboarding('Ana Fit!', 'Ana', 'strength', 'beginner', 'kg', true) $$,
  '23514',
  null,
  'Usernames only allow lowercase letters, numbers and underscores'
);

select lives_ok(
  $$ select public.complete_onboarding('ana_fit', 'Ana', 'strength', 'beginner', 'kg', true) $$,
  'Onboarding finishes with valid answers and consent'
);

select results_eq(
  $$ select p.username, s.training_goal, s.health_data_consent_at is not null,
            s.onboarding_completed_at is not null
     from public.profiles p join public.user_settings s on s.user_id = p.id
     where p.id = '11111111-1111-1111-1111-111111111111' $$,
  $$ values ('ana_fit', 'strength', true, true) $$,
  'Onboarding saves the answers and records consent'
);

-- Avatars
select lives_ok(
  $$ insert into storage.objects (bucket_id, name)
     values ('avatars', '11111111-1111-1111-1111-111111111111/avatar.jpg') $$,
  'A user can upload a photo to their own folder'
);

select throws_ok(
  $$ insert into storage.objects (bucket_id, name)
     values ('avatars', '22222222-2222-2222-2222-222222222222/avatar.jpg') $$,
  '42501',
  null,
  'A user cannot upload a photo to someone else''s folder'
);

-- ---------------------------------------------------------------------------
-- As Luis
-- ---------------------------------------------------------------------------

set local request.jwt.claims to '{"sub": "22222222-2222-2222-2222-222222222222", "role": "authenticated"}';

select throws_ok(
  $$ select public.complete_onboarding('ana_fit', 'Luis', 'cardio', 'advanced', 'kg', true) $$,
  '23505',
  null,
  'Two users cannot share a username'
);

-- ---------------------------------------------------------------------------
-- Signed out
-- ---------------------------------------------------------------------------

set local role anon;
set local request.jwt.claims to '{"role": "anon"}';

select throws_ok(
  $$ select 1 from public.profiles $$,
  '42501',
  null,
  'Signed-out visitors cannot read profiles'
);

select throws_ok(
  $$ select public.complete_onboarding('anon_user', 'Anon', 'strength', 'beginner', 'kg', true) $$,
  '42501',
  null,
  'Signed-out visitors cannot complete onboarding'
);

-- ---------------------------------------------------------------------------
-- Back as the database owner: check nothing leaked
-- ---------------------------------------------------------------------------

reset role;

select results_eq(
  $$ select bio from public.profiles where id = '22222222-2222-2222-2222-222222222222' $$,
  $$ values (null::text) $$,
  '…but someone else''s profile stays unchanged'
);

select results_eq(
  $$ select units from public.user_settings where user_id = '22222222-2222-2222-2222-222222222222' $$,
  $$ values ('kg') $$,
  '…and someone else''s settings stay unchanged'
);

select results_eq(
  $$ select bio from public.profiles where id = '11111111-1111-1111-1111-111111111111' $$,
  $$ values ('Entreno por las mañanas') $$,
  'The owner''s own edit was saved'
);

select * from finish();
rollback;
