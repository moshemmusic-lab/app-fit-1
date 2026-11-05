-- Social: following, who sees which workout, likes, comments, blocking, reports and routines.
begin;
create extension if not exists pgtap with schema extensions;
select plan(56);

-- Ana (1111…) has a public profile, Luis (2222…) a private one, Marta (3333…) is the viewer
-- and Nadie (4444…) has not finished onboarding.
insert into auth.users (id, email) values
  ('11111111-1111-1111-1111-111111111111', 'ana@example.com'),
  ('22222222-2222-2222-2222-222222222222', 'luis@example.com'),
  ('33333333-3333-3333-3333-333333333333', 'marta@example.com'),
  ('44444444-4444-4444-4444-444444444444', 'nadie@example.com');

update public.profiles set username = 'ana', display_name = 'Ana'
where id = '11111111-1111-1111-1111-111111111111';
update public.profiles set username = 'luis', display_name = 'Luis', is_private = true
where id = '22222222-2222-2222-2222-222222222222';
update public.profiles set username = 'marta', display_name = 'Marta Gómez'
where id = '33333333-3333-3333-3333-333333333333';

-- Act as someone (the role stays "authenticated").
create function public.test_login(p_user_id uuid)
returns void
language sql
as $$
  select set_config(
    'request.jwt.claims',
    json_build_object('sub', p_user_id, 'role', 'authenticated')::text,
    true
  );
$$;

-- A one-exercise bench press workout with this visibility, like the phone sends it.
create function public.test_workout(p_id uuid, p_day integer, p_visibility text)
returns jsonb
language sql
as $$
  select jsonb_build_object(
    'id', p_id,
    'title', 'Torso',
    'visibility', p_visibility,
    'started_at', timestamptz '2026-10-01 10:00:00Z' + make_interval(days => p_day),
    'ended_at', timestamptz '2026-10-01 11:00:00Z' + make_interval(days => p_day),
    'exercises', jsonb_build_array(jsonb_build_object(
      'id', md5(p_id::text || 'exercise')::uuid,
      'exercise_id', (select id from public.exercises where slug = 'barbell-bench-press'),
      'position', 0,
      'sets', jsonb_build_array(jsonb_build_object(
        'id', md5(p_id::text || 'set')::uuid,
        'position', 0,
        'weight_kg', 60,
        'reps', 10,
        'completed_at', timestamptz '2026-10-01 10:10:00Z' + make_interval(days => p_day)
      ))
    ))
  );
$$;

-- The ids of the workouts in a feed, in order.
create function public.test_feed_ids(p_feed jsonb)
returns text
language sql
as $$
  select coalesce(string_agg(left(item ->> 'id', 4), ',' order by ordinality), '')
  from jsonb_array_elements(p_feed) with ordinality as t (item, ordinality);
$$;

grant execute on function public.test_login(uuid) to authenticated;
grant execute on function public.test_workout(uuid, integer, text) to authenticated;
grant execute on function public.test_feed_ids(jsonb) to authenticated;

set local role authenticated;

-- Ana: a public (a1…), a followers-only (a2…) and a private (a3…) workout.
select public.test_login('11111111-1111-1111-1111-111111111111');
select public.save_workout(public.test_workout('a1000000-0000-0000-0000-000000000000', 0, 'public'));
select public.save_workout(public.test_workout('a2000000-0000-0000-0000-000000000000', 1, 'followers'));
select public.save_workout(public.test_workout('a3000000-0000-0000-0000-000000000000', 2, 'private'));

-- Luis (private profile): a public (b1…) and a followers-only (b2…) workout.
select public.test_login('22222222-2222-2222-2222-222222222222');
select public.save_workout(public.test_workout('b1000000-0000-0000-0000-000000000000', 3, 'public'));
select public.save_workout(public.test_workout('b2000000-0000-0000-0000-000000000000', 4, 'followers'));

-- ---------------------------------------------------------------------------
-- Following
-- ---------------------------------------------------------------------------

select public.test_login('33333333-3333-3333-3333-333333333333');

select is(public.follow_user('11111111-1111-1111-1111-111111111111')::text, 'accepted',
  'Following a public profile is immediate');
select is(public.follow_user('11111111-1111-1111-1111-111111111111')::text, 'accepted',
  'Following again changes nothing');
select is(public.follow_user('22222222-2222-2222-2222-222222222222')::text, 'pending',
  'Following a private profile sends a request');

select throws_ok($$ select public.follow_user('33333333-3333-3333-3333-333333333333') $$,
  '22023', null, 'Nobody can follow themselves');
select throws_ok($$ select public.follow_user('44444444-4444-4444-4444-444444444444') $$,
  'P0002', null, 'A user without a profile yet cannot be followed');

select throws_ok(
  $$ insert into public.follows (follower_id, following_id, status, accepted_at)
     values ('33333333-3333-3333-3333-333333333333', '44444444-4444-4444-4444-444444444444', 'accepted', now()) $$,
  '42501', null, 'Follows cannot be written directly');

-- ---------------------------------------------------------------------------
-- Who sees which workout
-- ---------------------------------------------------------------------------

select is(public.test_feed_ids(public.get_feed()), 'a200,a100',
  'The feed shows the public and followers workouts of people you follow, not their private ones');
select is(public.test_feed_ids(public.get_feed('22222222-2222-2222-2222-222222222222')), '',
  'A private profile shows nothing until the request is accepted, not even public workouts');

select results_eq(
  $$ select (p ->> 'follow_status'), (p ->> 'can_see')::boolean, (p ->> 'is_private')::boolean,
            (p ->> 'workout_count')::int
     from public.get_profile('22222222-2222-2222-2222-222222222222') p $$,
  $$ values ('pending', false, true, 2) $$,
  'The private profile says the request is pending and its content is hidden');

select is(public.get_workout_detail('a3000000-0000-0000-0000-000000000000'), null,
  'A private workout is only for its owner');
select is(
  public.get_workout_detail('a2000000-0000-0000-0000-000000000000') -> 'exercises' -> 0 ->> 'name',
  'Press de banca con barra',
  'A follower sees a followers workout, with its exercise names');

select is(
  (public.get_feed() -> 0 -> 'user' ->> 'username'),
  'ana',
  'Feed cards say whose workout it is');

-- Luis follows nobody: of Ana's workouts he only sees the public one.
select public.test_login('22222222-2222-2222-2222-222222222222');

select is(public.test_feed_ids(public.get_feed('11111111-1111-1111-1111-111111111111')), 'a100',
  'Someone who does not follow you sees only your public workouts');
select is(public.get_workout_detail('a2000000-0000-0000-0000-000000000000'), null,
  '…and not your followers workouts');
select is(public.test_feed_ids(public.get_feed()), 'b200,b100',
  'Your own feed includes your own workouts');

select is(
  (select count(*)::int from jsonb_array_elements(public.get_follow_requests()) r
   where r -> 'user' ->> 'username' = 'marta'),
  1,
  'A private profile sees the requests waiting for it');

select lives_ok(
  $$ select public.respond_to_follow_request('33333333-3333-3333-3333-333333333333', true) $$,
  'It can accept a request');
select throws_ok(
  $$ select public.respond_to_follow_request('33333333-3333-3333-3333-333333333333', true) $$,
  'P0002', null, 'Answering a request that is no longer pending fails');

select public.test_login('33333333-3333-3333-3333-333333333333');

select is(public.test_feed_ids(public.get_feed('22222222-2222-2222-2222-222222222222')), 'b200,b100',
  'Once accepted, the follower sees the private profile''s workouts');
select is(public.test_feed_ids(public.get_feed(p_limit => 1)), 'b200',
  'The feed comes in pages…');
select is(
  public.test_feed_ids(public.get_feed(p_before => '2026-10-04 10:00:00Z', p_limit => 2)),
  'a200,a100',
  '…and continues after the last workout shown');

-- ---------------------------------------------------------------------------
-- Likes and comments
-- ---------------------------------------------------------------------------

select lives_ok(
  $$ select public.set_workout_like('a2000000-0000-0000-0000-000000000000', true);
     select public.set_workout_like('a2000000-0000-0000-0000-000000000000', true) $$,
  'A follower can like a workout (twice is still one like)');

select results_eq(
  $$ select (s ->> 'like_count')::int, (s ->> 'liked')::boolean
     from public.get_workout_social('a2000000-0000-0000-0000-000000000000') s $$,
  $$ values (1, true) $$,
  'The workout has one like, theirs');

select ok(
  public.add_comment('a2000000-0000-0000-0000-000000000000', '  ¡Buen entreno!  ') is not null,
  'A follower can comment');

select is(
  public.get_comments('a2000000-0000-0000-0000-000000000000') -> 0 ->> 'body',
  '¡Buen entreno!',
  'The comment is stored without the extra spaces');

select throws_ok(
  $$ select public.add_comment('a2000000-0000-0000-0000-000000000000', '   ') $$,
  '23514', null, 'An empty comment is refused');

select throws_ok(
  $$ insert into public.likes (workout_id, user_id)
     values ('a1000000-0000-0000-0000-000000000000', '33333333-3333-3333-3333-333333333333') $$,
  '42501', null, 'Likes cannot be written directly');

select public.test_login('22222222-2222-2222-2222-222222222222');

select throws_ok(
  $$ select public.set_workout_like('a2000000-0000-0000-0000-000000000000', true) $$,
  'P0002', null, 'Someone who cannot see a workout cannot like it…');
select throws_ok(
  $$ select public.add_comment('a2000000-0000-0000-0000-000000000000', 'Hola') $$,
  'P0002', null, '…or comment on it');
select throws_ok(
  $$ select public.delete_comment(
       (select c.id from public.comments c limit 1)
     ) $$,
  'P0002', null, '…or delete its comments');

select public.test_login('11111111-1111-1111-1111-111111111111');

select results_eq(
  $$ select (c -> 0 ->> 'can_delete')::boolean, (s ->> 'comment_count')::int, (s ->> 'liked')::boolean
     from public.get_comments('a2000000-0000-0000-0000-000000000000') c,
          public.get_workout_social('a2000000-0000-0000-0000-000000000000') s $$,
  $$ values (true, 1, false) $$,
  'The owner sees the comment, can delete it, and has not liked their own workout');

select is(
  (select count(*)::int from public.follows),
  1,
  'Each user sees only the follows they are part of');

select lives_ok(
  $$ select public.delete_comment(
       (public.get_comments('a2000000-0000-0000-0000-000000000000') -> 0 ->> 'id')::uuid
     ) $$,
  'The owner of a workout can delete a comment on it');

-- ---------------------------------------------------------------------------
-- Visibility and private profiles
-- ---------------------------------------------------------------------------

select lives_ok(
  $$ select public.set_workout_visibility('a1000000-0000-0000-0000-000000000000', 'private') $$,
  'The owner can change who sees a workout');
select throws_ok(
  $$ select public.set_workout_visibility('a1000000-0000-0000-0000-000000000000', 'everyone') $$,
  '23514', null, 'Only public, followers or private');

select is(public.follow_user('22222222-2222-2222-2222-222222222222')::text, 'pending',
  'Ana asks to follow Luis');

select public.test_login('33333333-3333-3333-3333-333333333333');

select is(public.test_feed_ids(public.get_feed('11111111-1111-1111-1111-111111111111')), 'a200',
  'A workout made private leaves the feed');
select throws_ok(
  $$ select public.set_workout_visibility('a2000000-0000-0000-0000-000000000000', 'public') $$,
  'P0002', null, 'Nobody else can change it');

select public.test_login('22222222-2222-2222-2222-222222222222');
update public.profiles set is_private = false where id = '22222222-2222-2222-2222-222222222222';

select is(
  (select status::text from public.follows
   where follower_id = '11111111-1111-1111-1111-111111111111'
     and following_id = '22222222-2222-2222-2222-222222222222'),
  'accepted',
  'Making a profile public accepts the requests that were waiting');

-- ---------------------------------------------------------------------------
-- Searching and blocking
-- ---------------------------------------------------------------------------

select is(public.search_users('@MAR') -> 0 ->> 'username', 'marta',
  'Search finds people by username, ignoring case and @');
select is(public.search_users('gomez') -> 0 ->> 'username', 'marta',
  '…and by name, ignoring accents');
select is(jsonb_array_length(public.search_users('%')), 0,
  'Typed symbols are not wildcards');

select public.test_login('11111111-1111-1111-1111-111111111111');
select public.block_user('33333333-3333-3333-3333-333333333333');

select is(
  (select count(*)::int from public.follows
   where '33333333-3333-3333-3333-333333333333' in (follower_id, following_id)
     and '11111111-1111-1111-1111-111111111111' in (follower_id, following_id)),
  0,
  'Blocking someone ends the follows between the two');

select public.test_login('33333333-3333-3333-3333-333333333333');

select is(public.get_profile('11111111-1111-1111-1111-111111111111'), null,
  'A blocked user cannot see the profile of who blocked them');
select results_eq(
  $$ select public.test_feed_ids(public.get_feed('11111111-1111-1111-1111-111111111111')),
            jsonb_array_length(public.search_users('ana')),
            (select count(*)::int from public.blocks) $$,
  $$ values ('', 0, 0) $$,
  '…nor their workouts, nor find them, nor learn who blocked them');
select throws_ok($$ select public.follow_user('11111111-1111-1111-1111-111111111111') $$,
  'P0002', null, '…nor follow them again');

select public.test_login('11111111-1111-1111-1111-111111111111');
select public.unblock_user('33333333-3333-3333-3333-333333333333');

-- ---------------------------------------------------------------------------
-- Reports
-- ---------------------------------------------------------------------------

select public.test_login('33333333-3333-3333-3333-333333333333');

select lives_ok(
  $$ select public.report_content('user', '11111111-1111-1111-1111-111111111111', 'spam');
     select public.report_content('user', '11111111-1111-1111-1111-111111111111', 'spam') $$,
  'Anyone can report a user (twice while open is still one report)');
select is((select count(*)::int from public.reports), 1, 'The reporter sees their report');
select throws_ok(
  $$ select public.report_content('workout', 'a3000000-0000-0000-0000-000000000000', 'other') $$,
  'P0002', null, 'A workout you cannot see cannot be reported');

-- ---------------------------------------------------------------------------
-- Sharing and copying routines
-- ---------------------------------------------------------------------------

select public.test_login('11111111-1111-1111-1111-111111111111');
select public.save_custom_exercise(jsonb_build_object(
  'id', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'locale', 'es-ES', 'name', 'Press Technogym',
  'tracking_type', 'weight_reps', 'primary_muscle', 'chest', 'equipment', 'machine'));
select public.save_routine(jsonb_build_object(
  'id', 'dddddddd-dddd-dddd-dddd-dddddddddddd',
  'name', 'Pecho',
  'exercises', jsonb_build_array(
    jsonb_build_object('id', 'e1000000-0000-0000-0000-000000000000',
      'exercise_id', (select id from public.exercises where slug = 'barbell-bench-press'),
      'position', 0,
      'sets', jsonb_build_array(jsonb_build_object(
        'id', 'f1000000-0000-0000-0000-000000000000', 'position', 0, 'target_reps', 8))),
    jsonb_build_object('id', 'e2000000-0000-0000-0000-000000000000',
      'exercise_id', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'position', 1, 'sets', '[]'::jsonb))));

select public.test_login('33333333-3333-3333-3333-333333333333');

select is(jsonb_array_length(public.get_user_routines('11111111-1111-1111-1111-111111111111')), 0,
  'Routines are private until shared');
select throws_ok($$ select public.copy_routine('dddddddd-dddd-dddd-dddd-dddddddddddd') $$,
  'P0002', null, 'A private routine cannot be copied');

select public.test_login('11111111-1111-1111-1111-111111111111');
select public.set_routine_visibility('dddddddd-dddd-dddd-dddd-dddddddddddd', 'public');
select throws_ok($$ select public.copy_routine('dddddddd-dddd-dddd-dddd-dddddddddddd') $$,
  'P0002', null, 'Your own routines are duplicated, not copied');

select public.test_login('33333333-3333-3333-3333-333333333333');

select is(
  public.get_user_routines('11111111-1111-1111-1111-111111111111') -> 0 -> 'exercises' -> 1 ->> 'name',
  'Press Technogym',
  'A shared routine shows its exercises, custom ones too');

select public.copy_routine('dddddddd-dddd-dddd-dddd-dddddddddddd');
select public.copy_routine('dddddddd-dddd-dddd-dddd-dddddddddddd');

select results_eq(
  $$ select
       (select count(*)::int from public.routines),
       (select count(*)::int from public.routine_sets),
       (select count(*)::int from public.exercises where owner_id = '33333333-3333-3333-3333-333333333333'),
       (select count(*)::int from public.routine_exercises re
        join public.exercises x on x.id = re.exercise_id
        where x.owner_id = '33333333-3333-3333-3333-333333333333') $$,
  $$ values (2, 2, 1, 2) $$,
  'Copying gives the copier the routine with its sets and their own copy of the custom exercise, made once');

-- ---------------------------------------------------------------------------
-- Without a session, and deleting an account
-- ---------------------------------------------------------------------------

reset role;
set local role anon;

select throws_ok($$ select public.get_feed() $$, '42501', null,
  'Someone without a session cannot read the feed');

reset role;
delete from auth.users where id = '33333333-3333-3333-3333-333333333333';

select results_eq(
  $$ select
       (select count(*)::int from public.follows where '33333333-3333-3333-3333-333333333333' in (follower_id, following_id)),
       (select count(*)::int from public.likes where user_id = '33333333-3333-3333-3333-333333333333'),
       (select count(*)::int from public.reports where reporter_id is null) $$,
  $$ values (0, 0, 1) $$,
  'Deleting an account deletes its follows and likes and keeps its reports, anonymous');

select * from finish();
rollback;
