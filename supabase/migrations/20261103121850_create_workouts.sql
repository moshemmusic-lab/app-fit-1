-- Workouts (MVP step 4). See docs/ARCHITECTURE.md §5.4 and §6.1.
--
-- workouts          → one session (ids are generated on the phone, so it works offline).
-- workout_exercises → the exercises done in it, in order.
-- workout_sets      → every completed set.
--
-- The app never writes these tables directly: it sends the finished workout to
-- save_workout(), which replaces whatever was saved before for that id. Sending the same
-- workout twice (a retried upload) leaves exactly one copy.
-- routine_id, enrollment_id, program_session_id and prescription_id arrive with their tables.

create type public.workout_source as enum ('app', 'imported');
create type public.workout_set_type as enum ('warmup', 'normal', 'drop', 'failure');

-- ---------------------------------------------------------------------------
-- workouts
-- ---------------------------------------------------------------------------

create table public.workouts (
  id uuid primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  discipline public.discipline not null default 'gym',
  source public.workout_source not null default 'app',
  -- Id in Apple Health, Health Connect or Strava for imported activities (§5.7.6).
  external_id text,
  title text not null check (title = btrim(title) and char_length(title) between 1 and 80),
  notes text not null default '' check (char_length(notes) <= 2000),
  visibility text not null default 'followers' check (
    visibility in ('public', 'followers', 'private')
  ),
  started_at timestamptz not null,
  ended_at timestamptz not null,
  -- Soft delete (user content): the row stays so nothing is lost by mistake.
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint workouts_ends_after_start check (ended_at >= started_at),
  constraint workouts_external_id_unique unique (user_id, external_id)
);

comment on table public.workouts is 'One training session. Ids are generated on the phone.';

create index workouts_user_started_idx on public.workouts (user_id, started_at desc);

create trigger workouts_set_updated_at
before update on public.workouts
for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- workout_exercises
-- ---------------------------------------------------------------------------

create table public.workout_exercises (
  id uuid primary key,
  workout_id uuid not null references public.workouts (id) on delete cascade,
  -- Restrict: an exercise used in a workout cannot disappear from under it.
  exercise_id uuid not null references public.exercises (id),
  position integer not null check (position >= 0),
  superset_group integer check (superset_group >= 0),
  notes text not null default '' check (char_length(notes) <= 1000),
  created_at timestamptz not null default now(),
  constraint workout_exercises_position_unique unique (workout_id, position)
);

create index workout_exercises_exercise_idx on public.workout_exercises (exercise_id);

-- ---------------------------------------------------------------------------
-- workout_sets
-- ---------------------------------------------------------------------------

create table public.workout_sets (
  id uuid primary key,
  workout_exercise_id uuid not null references public.workout_exercises (id) on delete cascade,
  position integer not null check (position >= 0),
  set_type public.workout_set_type not null default 'normal',
  -- Always kilograms; the app converts to pounds for display (CLAUDE.md, data rule 4).
  weight_kg numeric(7, 3) check (weight_kg >= 0 and weight_kg < 2000),
  reps integer check (reps between 0 and 1000),
  duration_s integer check (duration_s between 0 and 86400),
  distance_m numeric(9, 2) check (distance_m >= 0 and distance_m <= 1000000),
  calories integer check (calories between 0 and 100000),
  rpe numeric(3, 1) check (rpe between 1 and 10),
  completed_at timestamptz not null,
  created_at timestamptz not null default now(),
  constraint workout_sets_position_unique unique (workout_exercise_id, position)
);

-- ---------------------------------------------------------------------------
-- Privileges and RLS: each user reads only their own workouts (step 7 opens what
-- they share). Writes only through save_workout().
-- ---------------------------------------------------------------------------

revoke all on public.workouts from anon, authenticated;
revoke all on public.workout_exercises from anon, authenticated;
revoke all on public.workout_sets from anon, authenticated;
grant select on public.workouts to authenticated;
grant select on public.workout_exercises to authenticated;
grant select on public.workout_sets to authenticated;

alter table public.workouts enable row level security;
alter table public.workout_exercises enable row level security;
alter table public.workout_sets enable row level security;

create policy "Users read their own workouts"
on public.workouts
for select
to authenticated
using (user_id = (select auth.uid()));

create policy "Users read the exercises of their own workouts"
on public.workout_exercises
for select
to authenticated
using (
  exists (
    select 1 from public.workouts w
    where w.id = workout_id and w.user_id = (select auth.uid())
  )
);

create policy "Users read the sets of their own workouts"
on public.workout_sets
for select
to authenticated
using (
  exists (
    select 1
    from public.workout_exercises we
    join public.workouts w on w.id = we.workout_id
    where we.id = workout_exercise_id and w.user_id = (select auth.uid())
  )
);

-- ---------------------------------------------------------------------------
-- save_workout(): idempotent upload of a finished workout
-- ---------------------------------------------------------------------------

create function public.save_workout(p_workout jsonb)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_workout_id uuid := (p_workout ->> 'id')::uuid;
  v_exercises jsonb := coalesce(p_workout -> 'exercises', '[]'::jsonb);
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

  -- Only exercises the user can see: global ones or their own custom ones.
  if exists (
    select 1
    from jsonb_array_elements(v_exercises) e
    left join public.exercises x on x.id = (e ->> 'exercise_id')::uuid
    where x.id is null or (x.owner_id is not null and x.owner_id <> v_user_id)
  ) then
    raise exception 'Unknown exercise' using errcode = '22023';
  end if;

  insert into public.workouts (id, user_id, title, notes, visibility, started_at, ended_at)
  values (
    v_workout_id,
    v_user_id,
    p_workout ->> 'title',
    coalesce(p_workout ->> 'notes', ''),
    coalesce(p_workout ->> 'visibility', 'followers'),
    (p_workout ->> 'started_at')::timestamptz,
    (p_workout ->> 'ended_at')::timestamptz
  )
  on conflict (id) do update
  set
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
end;
$$;

comment on function public.save_workout(jsonb) is
  'Saves a finished workout sent by the phone. Idempotent: the same payload twice leaves one copy.';

revoke execute on function public.save_workout(jsonb) from public, anon;
grant execute on function public.save_workout(jsonb) to authenticated;
