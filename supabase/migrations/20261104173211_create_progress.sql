-- Progress (MVP step 6). See docs/ARCHITECTURE.md §5.4.
--
-- personal_records  → every time a set beat the user's best for an exercise. Computed here
--                     (refresh_personal_records), never written by the app.
-- workout_stats     → one row per workout with its volume, sets and records: the history,
--                     the weekly chart and the consistency calendar read it.
-- delete_workout()  → soft-deletes a workout and recomputes its records.
-- body_measurements → body weight, one entry per day.

-- ---------------------------------------------------------------------------
-- personal_records
-- ---------------------------------------------------------------------------

create type public.personal_record_type as enum (
  -- Strength (weight_reps): estimated 1RM (Epley, sets of up to 12 reps), heaviest weight and
  -- best set (weight × reps).
  'est_1rm',
  'max_weight',
  'max_volume',
  -- Bodyweight (bodyweight_reps): most reps; max_weight is the heaviest extra load.
  'max_reps',
  -- Holds (duration) and cardio with distance (distance_duration).
  'max_duration',
  'max_distance'
);

create table public.personal_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  -- Derived data: it goes away with whatever it was computed from.
  exercise_id uuid not null references public.exercises (id) on delete cascade,
  workout_id uuid not null references public.workouts (id) on delete cascade,
  workout_set_id uuid not null references public.workout_sets (id) on delete cascade,
  record_type public.personal_record_type not null,
  value numeric(12, 3) not null check (value > 0),
  -- Best of the earlier workouts. Null the first time: a starting point, not a new record.
  previous_value numeric(12, 3) check (previous_value > 0 and value > previous_value),
  achieved_at timestamptz not null,
  created_at timestamptz not null default now(),
  constraint personal_records_set_type_unique unique (workout_set_id, record_type)
);

comment on table public.personal_records is
  'Each time a set beat the user''s best for an exercise. Computed by refresh_personal_records().';

create index personal_records_user_exercise_idx
  on public.personal_records (user_id, exercise_id, record_type, achieved_at);
create index personal_records_exercise_idx on public.personal_records (exercise_id);
create index personal_records_workout_idx on public.personal_records (workout_id);

revoke all on public.personal_records from anon, authenticated;
grant select on public.personal_records to authenticated;

alter table public.personal_records enable row level security;

create policy "Users read their own records"
on public.personal_records
for select
to authenticated
using (user_id = (select auth.uid()));

-- ---------------------------------------------------------------------------
-- refresh_personal_records(): recompute the records of some exercises of a user
-- ---------------------------------------------------------------------------
--
-- Rules (the phone applies the same ones for the summary: packages/shared/src/progress):
--   · Warm-ups and deleted workouts do not count.
--   · Each workout counts its best set for each kind of record (the first one on ties).
--   · That set is a record when it beats the best of the earlier workouts. Ties are not.
--   · The first workout with an exercise stores the starting point (previous_value null).
-- Recomputing from scratch keeps it right after a re-upload, an edit or a deletion.

create function public.refresh_personal_records(p_user_id uuid, p_exercise_ids uuid[])
returns void
language plpgsql
set search_path = ''
as $$
begin
  delete from public.personal_records
  where user_id = p_user_id and exercise_id = any (p_exercise_ids);

  insert into public.personal_records (
    user_id, exercise_id, workout_id, workout_set_id, record_type, value, previous_value, achieved_at
  )
  select
    ranked.user_id,
    ranked.exercise_id,
    ranked.workout_id,
    ranked.workout_set_id,
    ranked.record_type,
    ranked.value,
    ranked.previous_best,
    ranked.completed_at
  from (
    select
      best.*,
      max(best.value) over (
        partition by best.exercise_id, best.record_type
        order by best.started_at, best.workout_id
        rows between unbounded preceding and 1 preceding
      ) as previous_best
    from (
      select distinct on (candidate.exercise_id, candidate.record_type, candidate.workout_id)
        candidate.*
      from (
        select
          w.user_id,
          we.exercise_id,
          w.id as workout_id,
          w.started_at,
          s.id as workout_set_id,
          s.completed_at,
          we.position as exercise_position,
          s.position as set_position,
          v.record_type,
          v.value
        from public.workouts w
        join public.workout_exercises we on we.workout_id = w.id
        join public.workout_sets s on s.workout_exercise_id = we.id
        join public.exercises x on x.id = we.exercise_id
        cross join lateral (
          values
            (
              'est_1rm'::public.personal_record_type,
              case
                when x.tracking_type = 'weight_reps' and s.reps between 1 and 12 then
                  round(s.weight_kg * case when s.reps = 1 then 1 else 1 + s.reps / 30.0 end, 2)
              end
            ),
            (
              'max_weight',
              case when x.tracking_type in ('weight_reps', 'bodyweight_reps') and s.reps > 0
                then s.weight_kg end
            ),
            ('max_volume', case when x.tracking_type = 'weight_reps' then s.weight_kg * s.reps end),
            ('max_reps', case when x.tracking_type = 'bodyweight_reps' then s.reps::numeric end),
            ('max_duration', case when x.tracking_type = 'duration' then s.duration_s::numeric end),
            ('max_distance', case when x.tracking_type = 'distance_duration' then s.distance_m end)
        ) as v (record_type, value)
        where w.user_id = p_user_id
          and w.deleted_at is null
          and we.exercise_id = any (p_exercise_ids)
          and s.set_type <> 'warmup'
          and v.value > 0
      ) candidate
      order by
        candidate.exercise_id,
        candidate.record_type,
        candidate.workout_id,
        candidate.value desc,
        candidate.completed_at,
        candidate.exercise_position,
        candidate.set_position
    ) best
  ) ranked
  where ranked.previous_best is null or ranked.value > ranked.previous_best;
end;
$$;

comment on function public.refresh_personal_records(uuid, uuid[]) is
  'Recomputes the personal records of some exercises of a user. Internal: not callable from the app.';

revoke execute on function public.refresh_personal_records(uuid, uuid[])
  from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- save_workout(): same as before, and now it recomputes the records
-- ---------------------------------------------------------------------------

create or replace function public.save_workout(p_workout jsonb)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_workout_id uuid := (p_workout ->> 'id')::uuid;
  v_routine_id uuid := (p_workout ->> 'routine_id')::uuid;
  v_exercises jsonb := coalesce(p_workout -> 'exercises', '[]'::jsonb);
  v_exercise_ids uuid[];
begin
  if v_user_id is null then
    raise exception 'Not signed in' using errcode = '42501';
  end if;

  if v_workout_id is null or jsonb_typeof(v_exercises) <> 'array' then
    raise exception 'Malformed workout' using errcode = '22023';
  end if;

  -- Sanity limits so a broken client cannot write huge workouts.
  if jsonb_array_length(v_exercises) > 50
    or exists (
      select 1 from jsonb_array_elements(v_exercises) e
      where jsonb_array_length(coalesce(e -> 'sets', '[]'::jsonb)) > 50
    ) then
    raise exception 'Too many exercises or sets' using errcode = '22023';
  end if;

  if exists (select 1 from public.workouts where id = v_workout_id and user_id <> v_user_id) then
    raise exception 'This workout belongs to another user' using errcode = '42501';
  end if;

  -- A routine deleted meanwhile is fine (the link is just dropped); someone else's is not.
  if v_routine_id is not null
    and exists (select 1 from public.routines where id = v_routine_id and owner_id <> v_user_id) then
    raise exception 'Unknown routine' using errcode = '22023';
  end if;
  if v_routine_id is not null and not exists (select 1 from public.routines where id = v_routine_id) then
    v_routine_id := null;
  end if;

  -- Only exercises the user can see: global ones or their own custom ones.
  if exists (
    select 1
    from jsonb_array_elements(v_exercises) e
    left join public.exercises x on x.id = (e ->> 'exercise_id')::uuid
    where x.id is null or (x.owner_id is not null and x.owner_id <> v_user_id)
  ) then
    raise exception 'Unknown exercise' using errcode = '22023';
  end if;

  -- Exercises saved before for this workout: if one was removed, its records change too.
  select coalesce(array_agg(exercise_id), '{}')
  into v_exercise_ids
  from public.workout_exercises
  where workout_id = v_workout_id;

  insert into public.workouts (
    id, user_id, routine_id, title, notes, visibility, started_at, ended_at
  )
  values (
    v_workout_id,
    v_user_id,
    v_routine_id,
    p_workout ->> 'title',
    coalesce(p_workout ->> 'notes', ''),
    coalesce(p_workout ->> 'visibility', 'followers'),
    (p_workout ->> 'started_at')::timestamptz,
    (p_workout ->> 'ended_at')::timestamptz
  )
  on conflict (id) do update
  set
    routine_id = excluded.routine_id,
    title = excluded.title,
    notes = excluded.notes,
    visibility = excluded.visibility,
    started_at = excluded.started_at,
    ended_at = excluded.ended_at
  where public.workouts.user_id = v_user_id;

  -- The phone always sends the whole workout: replace what was saved before.
  delete from public.workout_exercises where workout_id = v_workout_id;

  insert into public.workout_exercises (id, workout_id, exercise_id, position, superset_group, notes)
  select
    (e ->> 'id')::uuid,
    v_workout_id,
    (e ->> 'exercise_id')::uuid,
    (e ->> 'position')::integer,
    (e ->> 'superset_group')::integer,
    coalesce(e ->> 'notes', '')
  from jsonb_array_elements(v_exercises) e;

  insert into public.workout_sets (
    id, workout_exercise_id, position, set_type,
    weight_kg, reps, duration_s, distance_m, calories, rpe, completed_at
  )
  select
    (s ->> 'id')::uuid,
    (e ->> 'id')::uuid,
    (s ->> 'position')::integer,
    coalesce(s ->> 'set_type', 'normal')::public.workout_set_type,
    (s ->> 'weight_kg')::numeric,
    (s ->> 'reps')::integer,
    (s ->> 'duration_s')::integer,
    (s ->> 'distance_m')::numeric,
    (s ->> 'calories')::integer,
    (s ->> 'rpe')::numeric,
    (s ->> 'completed_at')::timestamptz
  from jsonb_array_elements(v_exercises) e
  cross join jsonb_array_elements(coalesce(e -> 'sets', '[]'::jsonb)) s;

  perform public.refresh_personal_records(
    v_user_id,
    v_exercise_ids || array(
      select (e ->> 'exercise_id')::uuid from jsonb_array_elements(v_exercises) e
    )
  );
end;
$$;

-- ---------------------------------------------------------------------------
-- delete_workout(): soft delete from the history
-- ---------------------------------------------------------------------------

create function public.delete_workout(p_workout_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
begin
  if v_user_id is null then
    raise exception 'Not signed in' using errcode = '42501';
  end if;

  -- Someone else's workout looks the same as a missing one.
  if not exists (
    select 1 from public.workouts where id = p_workout_id and user_id = v_user_id
  ) then
    raise exception 'Unknown workout' using errcode = 'P0002';
  end if;

  -- The rows stay (soft delete). Deleting twice is harmless.
  update public.workouts
  set deleted_at = now()
  where id = p_workout_id and deleted_at is null;

  perform public.refresh_personal_records(
    v_user_id,
    array(select exercise_id from public.workout_exercises where workout_id = p_workout_id)
  );
end;
$$;

comment on function public.delete_workout(uuid) is
  'Soft-deletes a workout of the signed-in user and recomputes its personal records.';

revoke execute on function public.delete_workout(uuid) from public, anon;
grant execute on function public.delete_workout(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- workout_stats: one row per workout, with the same totals as the summary screen
-- ---------------------------------------------------------------------------
--
-- Volume is weight × reps of the working sets (warm-ups excluded); bodyweight exercises only
-- count their extra load. security_invoker: each user still only sees their own workouts.

create view public.workout_stats
with (security_invoker = true)
as
select
  w.id,
  w.user_id,
  w.title,
  w.started_at,
  w.ended_at,
  coalesce(sum(s.weight_kg * s.reps) filter (where s.set_type <> 'warmup'), 0)::numeric(14, 3)
    as volume_kg,
  (count(s.id) filter (where s.set_type <> 'warmup'))::integer as set_count,
  (count(distinct we.id))::integer as exercise_count,
  (
    select count(*)::integer
    from public.personal_records pr
    where pr.workout_id = w.id and pr.previous_value is not null
  ) as record_count
from public.workouts w
left join public.workout_exercises we on we.workout_id = w.id
left join public.workout_sets s on s.workout_exercise_id = we.id
where w.deleted_at is null
group by w.id;

comment on view public.workout_stats is
  'One row per workout (not deleted) with its volume, sets, exercises and new records.';

revoke all on public.workout_stats from anon, authenticated;
grant select on public.workout_stats to authenticated;

-- ---------------------------------------------------------------------------
-- personal_bests: the current best of each exercise and kind of record
-- ---------------------------------------------------------------------------
--
-- Small (exercises × kinds), so the phone keeps it and finds the summary's records offline.

create view public.personal_bests
with (security_invoker = true)
as
select distinct on (pr.user_id, pr.exercise_id, pr.record_type)
  pr.user_id,
  pr.exercise_id,
  pr.record_type,
  pr.value,
  pr.achieved_at,
  pr.workout_id,
  s.weight_kg,
  s.reps,
  s.duration_s,
  s.distance_m
from public.personal_records pr
join public.workout_sets s on s.id = pr.workout_set_id
order by pr.user_id, pr.exercise_id, pr.record_type, pr.value desc, pr.achieved_at;

comment on view public.personal_bests is
  'The best value of each exercise and kind of record, with the set that did it.';

revoke all on public.personal_bests from anon, authenticated;
grant select on public.personal_bests to authenticated;

-- ---------------------------------------------------------------------------
-- body_measurements: body weight, one entry per day
-- ---------------------------------------------------------------------------

create table public.body_measurements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  measured_on date not null check (measured_on >= date '2000-01-01'),
  -- Always kilograms (CLAUDE.md, data rule 4).
  weight_kg numeric(5, 2) not null check (weight_kg between 20 and 500),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint body_measurements_one_per_day unique (user_id, measured_on)
);

comment on table public.body_measurements is
  'Body weight, one entry per day. Entries are deleted for real: nothing else uses them.';

create trigger body_measurements_set_updated_at
before update on public.body_measurements
for each row execute function public.set_updated_at();

revoke all on public.body_measurements from anon, authenticated;
grant select, delete on public.body_measurements to authenticated;
-- Saving a day again replaces its weight (upsert on user_id + measured_on).
grant insert (measured_on, weight_kg) on public.body_measurements to authenticated;
grant update (measured_on, weight_kg) on public.body_measurements to authenticated;

alter table public.body_measurements enable row level security;

create policy "Users read their own body measurements"
on public.body_measurements
for select
to authenticated
using (user_id = (select auth.uid()));

create policy "Users add their own body measurements"
on public.body_measurements
for insert
to authenticated
with check (user_id = (select auth.uid()));

create policy "Users change their own body measurements"
on public.body_measurements
for update
to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

create policy "Users delete their own body measurements"
on public.body_measurements
for delete
to authenticated
using (user_id = (select auth.uid()));

-- ---------------------------------------------------------------------------
-- Records of the workouts saved before this migration
-- ---------------------------------------------------------------------------

select public.refresh_personal_records(w.user_id, array_agg(distinct we.exercise_id))
from public.workouts w
join public.workout_exercises we on we.workout_id = w.id
group by w.user_id;
