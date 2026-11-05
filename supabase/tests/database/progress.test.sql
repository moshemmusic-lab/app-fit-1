-- Progress: personal records, workout stats, deleting workouts and body weight.
begin;
create extension if not exists pgtap with schema extensions;
select plan(33);

-- Two users: Ana (1111…) and Luis (2222…).
insert into auth.users (id, email) values
  ('11111111-1111-1111-1111-111111111111', 'ana@example.com'),
  ('22222222-2222-2222-2222-222222222222', 'luis@example.com');

-- A workout with one exercise, like the phone sends it. Day 0 is 1 October 2026; each set
-- is [weight, reps, duration, type]. Ids derive from the workout id, so the same call twice
-- sends exactly the same payload.
create function public.test_workout(p_id uuid, p_day integer, p_slug text, p_sets jsonb)
returns jsonb
language sql
as $$
  select jsonb_build_object(
    'id', p_id,
    'title', 'Test',
    'started_at', timestamptz '2026-10-01 10:00:00Z' + make_interval(days => p_day),
    'ended_at', timestamptz '2026-10-01 11:00:00Z' + make_interval(days => p_day),
    'exercises', jsonb_build_array(jsonb_build_object(
      'id', md5(p_id::text || 'exercise')::uuid,
      'exercise_id', (select id from public.exercises where slug = p_slug),
      'position', 0,
      'sets', (
        select jsonb_agg(jsonb_build_object(
          'id', md5(p_id::text || i)::uuid,
          'position', i - 1,
          'set_type', coalesce(s ->> 3, 'normal'),
          'weight_kg', s -> 0,
          'reps', s -> 1,
          'duration_s', s -> 2,
          'completed_at',
            timestamptz '2026-10-01 10:00:00Z' + make_interval(days => p_day, mins => i::integer)
        ) order by i)
        from jsonb_array_elements(p_sets) with ordinality as t (s, i)
      )
    ))
  );
$$;

grant execute on function public.test_workout(uuid, integer, text, jsonb) to authenticated;

-- Ana's records for an exercise, as "type value previous" lines (previous '-' = first time).
create function public.test_records(p_slug text)
returns setof text
language sql
as $$
  select pr.record_type || ' ' || pr.value::float8 || ' ' || coalesce(pr.previous_value::float8::text, '-')
  from public.personal_records pr
  join public.exercises x on x.id = pr.exercise_id
  where x.slug = p_slug
  order by pr.achieved_at, pr.record_type;
$$;

grant execute on function public.test_records(text) to authenticated;

-- ---------------------------------------------------------------------------
-- As Ana: records
-- ---------------------------------------------------------------------------

set local role authenticated;
set local request.jwt.claims to '{"sub": "11111111-1111-1111-1111-111111111111", "role": "authenticated"}';

-- Day 0: a heavy warm-up single (does not count), then 100 × 5 and 90 × 8.
select lives_ok(
  $$ select public.save_workout(public.test_workout(
       'a0000000-0000-0000-0000-000000000000', 0, 'barbell-bench-press',
       '[[120, 1, null, "warmup"], [100, 5], [90, 8]]'
     )) $$,
  'A workout saves'
);

select results_eq(
  $$ select * from public.test_records('barbell-bench-press') $$,
  $$ values ('est_1rm 116.67 -'), ('max_weight 100 -'), ('max_volume 720 -') $$,
  'The first workout with an exercise stores the starting point: 1RM (Epley), weight and best set'
);

-- Day 1: 105 × 5 twice. Heavier, and a better 1RM, but not a better set (525 < 720).
select lives_ok(
  $$ select public.save_workout(public.test_workout(
       'a1000000-0000-0000-0000-000000000000', 1, 'barbell-bench-press',
       '[[105, 5], [105, 5]]'
     )) $$,
  'A second workout saves'
);

select results_eq(
  $$ select pr.record_type::text, pr.value::float8, pr.previous_value::float8, s.position
     from public.personal_records pr
     join public.workout_sets s on s.id = pr.workout_set_id
     where pr.workout_id = 'a1000000-0000-0000-0000-000000000000'
     order by pr.record_type $$,
  $$ values ('est_1rm', 122.5::float8, 116.67::float8, 0), ('max_weight', 105, 100, 0) $$,
  'Beating a best is a new record, with the previous best, on the first set that did it'
);

-- Day 2: 105 × 5 again: equal is not a record.
select lives_ok(
  $$ select public.save_workout(public.test_workout(
       'a2000000-0000-0000-0000-000000000000', 2, 'barbell-bench-press', '[[105, 5]]'
     )) $$,
  'A third workout saves'
);

select is_empty(
  $$ select 1 from public.personal_records
     where workout_id = 'a2000000-0000-0000-0000-000000000000' $$,
  'Equalling a best is not a record'
);

select lives_ok(
  $$ select public.save_workout(public.test_workout(
       'a1000000-0000-0000-0000-000000000000', 1, 'barbell-bench-press',
       '[[105, 5], [105, 5]]'
     )) $$,
  'Uploading the same workout again works'
);

select results_eq(
  $$ select count(*)::int from public.personal_records $$,
  $$ values (5) $$,
  '…and leaves the same records'
);

select results_eq(
  $$ select * from public.test_records('barbell-bench-press') $$,
  $$ values ('est_1rm 116.67 -'), ('max_weight 100 -'), ('max_volume 720 -'),
            ('est_1rm 122.5 116.67'), ('max_weight 105 100') $$,
  '…in the same order'
);

-- 13 reps: too many for a reliable 1RM; the other records still count.
select lives_ok(
  $$ select public.save_workout(public.test_workout(
       'a3000000-0000-0000-0000-000000000000', 3, 'barbell-bench-press', '[[70, 13]]'
     )) $$,
  'A high-rep workout saves'
);

select results_eq(
  $$ select record_type::text, value::float8 from public.personal_records
     where workout_id = 'a3000000-0000-0000-0000-000000000000' $$,
  $$ values ('max_volume', 910::float8) $$,
  'Sets of more than 12 reps give no 1RM, but can be the best set'
);

-- Bodyweight and holds.
select lives_ok(
  $$ select public.save_workout(public.test_workout(
       'b0000000-0000-0000-0000-000000000000', 0, 'pull-up', '[[null, 8], [null, 10]]'
     ));
     select public.save_workout(public.test_workout(
       'b1000000-0000-0000-0000-000000000000', 1, 'pull-up', '[[null, 12], [10, 6]]'
     ));
     select public.save_workout(public.test_workout(
       'c0000000-0000-0000-0000-000000000000', 0, 'plank', '[[null, null, 60]]'
     ));
     select public.save_workout(public.test_workout(
       'c1000000-0000-0000-0000-000000000000', 1, 'plank', '[[null, null, 90]]'
     )) $$,
  'Bodyweight and hold workouts save'
);

select results_eq(
  $$ select * from public.test_records('pull-up') $$,
  $$ values ('max_reps 10 -'), ('max_reps 12 10'), ('max_weight 10 -') $$,
  'Bodyweight exercises record reps, and the heaviest extra load'
);

select results_eq(
  $$ select * from public.test_records('plank') $$,
  $$ values ('max_duration 60 -'), ('max_duration 90 60') $$,
  'Holds record the longest time'
);

-- ---------------------------------------------------------------------------
-- As Ana: workout stats and deleting a workout
-- ---------------------------------------------------------------------------

select results_eq(
  $$ select volume_kg::float8, set_count, exercise_count, record_count
     from public.workout_stats where id in (
       'a0000000-0000-0000-0000-000000000000', 'a1000000-0000-0000-0000-000000000000'
     ) order by started_at $$,
  $$ values (1220::float8, 2, 1, 0), (1050, 2, 1, 2) $$,
  'Workout stats: volume and sets without warm-ups, and the new records'
);

select lives_ok(
  $$ select public.delete_workout('a1000000-0000-0000-0000-000000000000') $$,
  'A user can delete their workout'
);

select results_eq(
  $$ select
       (select deleted_at is not null from public.workouts
        where id = 'a1000000-0000-0000-0000-000000000000'),
       (select count(*)::int from public.workout_sets s
        join public.workout_exercises we on we.id = s.workout_exercise_id
        where we.workout_id = 'a1000000-0000-0000-0000-000000000000'),
       (select count(*)::int from public.workout_stats
        where id = 'a1000000-0000-0000-0000-000000000000') $$,
  $$ values (true, 2, 0) $$,
  '…it is a soft delete, and it leaves the stats'
);

select results_eq(
  $$ select record_type::text, value::float8, previous_value::float8
     from public.personal_records
     where workout_id = 'a2000000-0000-0000-0000-000000000000'
     order by record_type $$,
  $$ values ('est_1rm', 122.5::float8, 116.67::float8), ('max_weight', 105, 100) $$,
  '…and the records are recomputed: the next 105 × 5 becomes the record'
);

select lives_ok(
  $$ select public.delete_workout('a1000000-0000-0000-0000-000000000000') $$,
  'Deleting a workout twice is harmless'
);

select lives_ok(
  $$ select public.save_workout(public.test_workout(
       'a1000000-0000-0000-0000-000000000000', 1, 'barbell-bench-press',
       '[[105, 5], [105, 5]]'
     )) $$,
  'A late re-upload of a deleted workout is accepted'
);

select results_eq(
  $$ select
       (select deleted_at is not null from public.workouts
        where id = 'a1000000-0000-0000-0000-000000000000'),
       (select count(*)::int from public.personal_records
        where workout_id = 'a1000000-0000-0000-0000-000000000000') $$,
  $$ values (true, 0) $$,
  '…but the workout stays deleted, without records'
);

select results_eq(
  $$ select b.record_type::text, b.value::float8, b.weight_kg::float8, b.reps
     from public.personal_bests b
     join public.exercises x on x.id = b.exercise_id
     where x.slug = 'barbell-bench-press'
     order by b.record_type $$,
  $$ values ('est_1rm', 122.5::float8, 105::float8, 5),
            ('max_weight', 105, 105, 5),
            ('max_volume', 910, 70, 13) $$,
  'Personal bests: the best of each kind, with the set that did it'
);

select throws_ok(
  $$ insert into public.personal_records (
       user_id, exercise_id, workout_id, workout_set_id, record_type, value, achieved_at
     )
     select '11111111-1111-1111-1111-111111111111', exercise_id, workout_id, workout_set_id,
            'max_reps', 999, now()
     from public.personal_records limit 1 $$,
  '42501',
  null,
  'Records cannot be written directly'
);

select throws_ok(
  $$ select public.refresh_personal_records(
       '11111111-1111-1111-1111-111111111111', array[]::uuid[]
     ) $$,
  '42501',
  null,
  'The app cannot run the internal records function'
);

-- ---------------------------------------------------------------------------
-- As Ana: body weight
-- ---------------------------------------------------------------------------

select lives_ok(
  $$ insert into public.body_measurements (measured_on, weight_kg) values ('2026-11-01', 80.5);
     insert into public.body_measurements (measured_on, weight_kg) values ('2026-11-02', 80.1)
     on conflict (user_id, measured_on) do update set weight_kg = excluded.weight_kg;
     insert into public.body_measurements (measured_on, weight_kg) values ('2026-11-02', 79.9)
     on conflict (user_id, measured_on) do update set weight_kg = excluded.weight_kg $$,
  'A user can log their weight, and saving a day again replaces it'
);

select results_eq(
  $$ select user_id, measured_on, weight_kg::float8 from public.body_measurements
     order by measured_on $$,
  $$ values ('11111111-1111-1111-1111-111111111111'::uuid, '2026-11-01'::date, 80.5::float8),
            ('11111111-1111-1111-1111-111111111111', '2026-11-02', 79.9) $$,
  '…one entry per day, in their name'
);

select throws_ok(
  $$ insert into public.body_measurements (measured_on, weight_kg) values ('2026-11-03', 5) $$,
  '23514',
  null,
  'An impossible weight is refused'
);

-- ---------------------------------------------------------------------------
-- As Luis
-- ---------------------------------------------------------------------------

set local request.jwt.claims to '{"sub": "22222222-2222-2222-2222-222222222222", "role": "authenticated"}';

select is_empty(
  $$ select 1 from public.personal_records
     union all select 1 from public.personal_bests
     union all select 1 from public.workout_stats
     union all select 1 from public.body_measurements $$,
  'A user cannot see someone else''s records, bests, workout stats or weight'
);

select throws_ok(
  $$ select public.delete_workout('a0000000-0000-0000-0000-000000000000') $$,
  'P0002',
  null,
  'A user cannot delete someone else''s workout'
);

select is_empty(
  $$ update public.body_measurements set weight_kg = 50 returning 1 $$,
  'A user cannot change someone else''s weight'
);

-- ---------------------------------------------------------------------------
-- Without a session, and account deletion
-- ---------------------------------------------------------------------------

reset role;
set local role anon;

select throws_ok(
  $$ select 1 from public.body_measurements $$,
  '42501',
  null,
  'Someone without a session cannot read body weight'
);

reset role;

select lives_ok(
  $$ delete from auth.users where id = '11111111-1111-1111-1111-111111111111' $$,
  'Deleting an account works'
);

select results_eq(
  $$ select
       (select count(*)::int from public.personal_records
        where user_id = '11111111-1111-1111-1111-111111111111'),
       (select count(*)::int from public.body_measurements
        where user_id = '11111111-1111-1111-1111-111111111111') $$,
  $$ values (0, 0) $$,
  '…and deletes their records and body weight'
);

select * from finish();
rollback;
