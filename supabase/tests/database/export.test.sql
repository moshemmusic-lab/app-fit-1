-- Export my data: everything of the signed-in user, nothing of anyone else.
begin;
create extension if not exists pgtap with schema extensions;
select plan(18);

-- Ana (1111…) exports; Luis (2222…) and Marta (3333…) are other people.
insert into auth.users (id, email) values
  ('11111111-1111-1111-1111-111111111111', 'ana@example.com'),
  ('22222222-2222-2222-2222-222222222222', 'luis@example.com'),
  ('33333333-3333-3333-3333-333333333333', 'marta@example.com');

update public.profiles set username = 'ana', display_name = 'Ana'
where id = '11111111-1111-1111-1111-111111111111';
update public.profiles set username = 'luis', display_name = 'Luis'
where id = '22222222-2222-2222-2222-222222222222';
update public.profiles set username = 'marta', display_name = 'Marta'
where id = '33333333-3333-3333-3333-333333333333';

-- Social rows and body weight, written directly (their own functions have their own tests).
insert into public.body_measurements (user_id, measured_on, weight_kg) values
  ('11111111-1111-1111-1111-111111111111', '2026-10-01', 70.5),
  ('22222222-2222-2222-2222-222222222222', '2026-10-01', 90);
insert into public.follows (follower_id, following_id, status, accepted_at) values
  ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 'accepted', now()),
  ('33333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', 'accepted', now()),
  ('33333333-3333-3333-3333-333333333333', '22222222-2222-2222-2222-222222222222', 'accepted', now());
insert into public.blocks (blocker_id, blocked_id) values
  ('22222222-2222-2222-2222-222222222222', '33333333-3333-3333-3333-333333333333');

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

-- A one-exercise bench press workout, like the phone sends it.
create function public.test_workout(p_id uuid, p_title text, p_weight numeric)
returns jsonb
language sql
as $$
  select jsonb_build_object(
    'id', p_id,
    'title', p_title,
    'visibility', 'public',
    'started_at', timestamptz '2026-10-01 10:00:00Z',
    'ended_at', timestamptz '2026-10-01 11:00:00Z',
    'exercises', jsonb_build_array(jsonb_build_object(
      'id', md5(p_id::text || 'exercise')::uuid,
      'exercise_id', (select id from public.exercises where slug = 'barbell-bench-press'),
      'position', 0,
      'sets', jsonb_build_array(jsonb_build_object(
        'id', md5(p_id::text || 'set')::uuid,
        'position', 0,
        'weight_kg', p_weight,
        'reps', 8,
        'completed_at', timestamptz '2026-10-01 10:10:00Z'
      ))
    ))
  );
$$;

grant execute on function public.test_login(uuid) to authenticated;
grant execute on function public.test_workout(uuid, text, numeric) to authenticated;

set local role authenticated;

select public.test_login('22222222-2222-2222-2222-222222222222');
select public.save_workout(public.test_workout('b1000000-0000-0000-0000-000000000000', 'Luis', 100));
select public.add_comment('b1000000-0000-0000-0000-000000000000', 'Comentario de Luis');

select public.test_login('11111111-1111-1111-1111-111111111111');
select public.save_workout(public.test_workout('a1000000-0000-0000-0000-000000000000', 'Torso Ana', 60));
select public.add_comment('b1000000-0000-0000-0000-000000000000', 'Buen entreno');
select public.set_workout_like('b1000000-0000-0000-0000-000000000000', true);

create temporary table export on commit drop as select public.export_my_data() as data;

select is(
  (select data ->> 'format' from export), 'movyn-export',
  'The file says what it is'
);
select is(
  (select data -> 'account' ->> 'email' from export), 'ana@example.com',
  'It includes the sign-in email'
);
select is(
  (select data -> 'profile' ->> 'username' from export), 'ana',
  'It includes the profile'
);
select ok(
  (select data -> 'settings' ? 'default_workout_visibility' from export),
  'It includes the settings'
);
select is(
  (select jsonb_array_length(data -> 'body_weight') from export), 1,
  'Only her own body weight'
);
select is(
  (select (data -> 'body_weight' -> 0 ->> 'weight_kg')::numeric from export), 70.5,
  'Body weight in kg'
);
select is(
  (select jsonb_array_length(data -> 'workouts') from export), 1,
  'Only her own workouts'
);
select is(
  (select data -> 'workouts' -> 0 ->> 'title' from export), 'Torso Ana',
  'Her workout'
);
select is(
  (select data -> 'workouts' -> 0 -> 'exercises' -> 0 ->> 'exercise' from export),
  'Press de banca con barra',
  'Exercises carry their name'
);
select is(
  (select (data -> 'workouts' -> 0 -> 'exercises' -> 0 -> 'sets' -> 0 ->> 'weight_kg')::numeric
   from export),
  60::numeric,
  'Sets carry their weight in kg'
);
select is(
  (select array_agg(distinct r ->> 'workout_id')
   from export, jsonb_array_elements(data -> 'personal_records') r),
  array['a1000000-0000-0000-0000-000000000000'],
  'Her records, not Luis''s'
);
select is(
  (select data -> 'following' -> 0 ->> 'username' from export), 'luis',
  'Whom she follows, by username'
);
select is(
  (select data -> 'followers' -> 0 ->> 'username' from export), 'marta',
  'Who follows her, by username (Marta following Luis is not hers)'
);
select is(
  (select data -> 'comments' from export),
  (select jsonb_build_array(jsonb_build_object(
    'workout_id', 'b1000000-0000-0000-0000-000000000000',
    'body', 'Buen entreno',
    'created_at', created_at
  )) from public.comments where body = 'Buen entreno'),
  'Only the comments she wrote'
);
select is(
  (select jsonb_array_length(data -> 'likes') from export), 1,
  'The likes she gave'
);
select is(
  (select jsonb_array_length(data -> 'blocked_users') from export), 0,
  'Luis blocking Marta is not hers'
);

reset role;
set local role anon;
select throws_ok(
  $$ select public.export_my_data() $$,
  '42501',
  null,
  'Visitors without a session cannot export'
);

reset role;
set local role authenticated;
select set_config('request.jwt.claims', '', true);
select throws_ok(
  $$ select public.export_my_data() $$,
  '42501',
  'Not signed in',
  'Without a user there is nothing to export'
);

select * from finish();
rollback;
