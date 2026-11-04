-- Routines and folders (MVP step 5). See docs/ARCHITECTURE.md §5.3.
--
-- routine_folders   → how a user organises their routines.
-- routines          → a workout template (own, or copied from someone else in step 7).
-- routine_exercises → its exercises, in order, with their rest.
-- routine_sets      → the target sets: what is planned, never what was done (CLAUDE.md, rule 5).
--
-- Like workouts, the exercises and sets of a routine are written only through save_routine(),
-- which replaces the whole routine at once. Folders and the routine's place (folder, order,
-- deletion) are updated directly, limited by column privileges and RLS.

-- ---------------------------------------------------------------------------
-- routine_folders
-- ---------------------------------------------------------------------------

create table public.routine_folders (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null check (name = btrim(name) and char_length(name) between 1 and 50),
  position integer not null default 0 check (position >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- Lets routines reference (folder, owner) so a routine can only go into its owner's folder.
  constraint routine_folders_id_owner_unique unique (id, owner_id)
);

create index routine_folders_owner_idx on public.routine_folders (owner_id, position);

create trigger routine_folders_set_updated_at
before update on public.routine_folders
for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- routines
-- ---------------------------------------------------------------------------

create table public.routines (
  id uuid primary key,
  owner_id uuid not null references auth.users (id) on delete cascade,
  folder_id uuid,
  name text not null check (name = btrim(name) and char_length(name) between 1 and 80),
  discipline public.discipline not null default 'gym',
  notes text not null default '' check (char_length(notes) <= 2000),
  -- Private by default (GDPR art. 25). Sharing and copying arrive in step 7.
  visibility text not null default 'private' check (visibility in ('public', 'followers', 'private')),
  copied_from_routine_id uuid references public.routines (id) on delete set null,
  position integer not null default 0 check (position >= 0),
  -- Soft delete (user content).
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- Deleting a folder leaves its routines without folder (only folder_id is cleared).
  constraint routines_folder_same_owner foreign key (folder_id, owner_id)
    references public.routine_folders (id, owner_id) on delete set null (folder_id)
);

comment on table public.routines is 'Workout templates. Planned sets only, never done sets.';

create index routines_owner_idx on public.routines (owner_id) where deleted_at is null;

create trigger routines_set_updated_at
before update on public.routines
for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- routine_exercises and routine_sets
-- ---------------------------------------------------------------------------

create table public.routine_exercises (
  id uuid primary key,
  routine_id uuid not null references public.routines (id) on delete cascade,
  exercise_id uuid not null references public.exercises (id),
  position integer not null check (position >= 0),
  superset_group integer check (superset_group >= 0),
  -- Null = no rest timer after this exercise's sets.
  rest_seconds integer check (rest_seconds between 0 and 1800),
  notes text not null default '' check (char_length(notes) <= 1000),
  created_at timestamptz not null default now(),
  constraint routine_exercises_position_unique unique (routine_id, position)
);

create index routine_exercises_exercise_idx on public.routine_exercises (exercise_id);

create table public.routine_sets (
  id uuid primary key,
  routine_exercise_id uuid not null references public.routine_exercises (id) on delete cascade,
  position integer not null check (position >= 0),
  set_type public.workout_set_type not null default 'normal',
  -- All optional: a target can be just "8 reps" or nothing at all.
  target_reps integer check (target_reps between 1 and 1000),
  target_weight_kg numeric(7, 3) check (target_weight_kg >= 0 and target_weight_kg < 2000),
  target_duration_s integer check (target_duration_s between 1 and 86400),
  target_distance_m numeric(9, 2) check (target_distance_m > 0 and target_distance_m <= 1000000),
  created_at timestamptz not null default now(),
  constraint routine_sets_position_unique unique (routine_exercise_id, position)
);

-- ---------------------------------------------------------------------------
-- Privileges and RLS
-- ---------------------------------------------------------------------------

revoke all on public.routine_folders from anon, authenticated;
revoke all on public.routines from anon, authenticated;
revoke all on public.routine_exercises from anon, authenticated;
revoke all on public.routine_sets from anon, authenticated;

-- Folders: the owner manages them freely (owner_id is filled in by default; the id may come
-- from the phone, so a new folder can be used right away).
grant select, delete on public.routine_folders to authenticated;
grant insert (id, name, position) on public.routine_folders to authenticated;
grant update (name, position) on public.routine_folders to authenticated;

-- Routines: read, plus moving, reordering and (soft) deleting. Content via save_routine().
grant select on public.routines to authenticated;
grant update (folder_id, position, deleted_at) on public.routines to authenticated;
grant select on public.routine_exercises to authenticated;
grant select on public.routine_sets to authenticated;

alter table public.routine_folders enable row level security;
alter table public.routines enable row level security;
alter table public.routine_exercises enable row level security;
alter table public.routine_sets enable row level security;

create policy "Users manage their own folders"
on public.routine_folders
for all
to authenticated
using (owner_id = (select auth.uid()))
with check (owner_id = (select auth.uid()));

create policy "Users read their own routines"
on public.routines
for select
to authenticated
using (owner_id = (select auth.uid()));

create policy "Users move and delete their own routines"
on public.routines
for update
to authenticated
using (owner_id = (select auth.uid()))
with check (owner_id = (select auth.uid()));

create policy "Users read the exercises of their own routines"
on public.routine_exercises
for select
to authenticated
using (
  exists (
    select 1 from public.routines r
    where r.id = routine_id and r.owner_id = (select auth.uid())
  )
);

create policy "Users read the sets of their own routines"
on public.routine_sets
for select
to authenticated
using (
  exists (
    select 1
    from public.routine_exercises re
    join public.routines r on r.id = re.routine_id
    where re.id = routine_exercise_id and r.owner_id = (select auth.uid())
  )
);

-- ---------------------------------------------------------------------------
-- save_routine(): create or replace a whole routine
-- ---------------------------------------------------------------------------

create function public.save_routine(p_routine jsonb)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_routine_id uuid := (p_routine ->> 'id')::uuid;
  v_folder_id uuid := (p_routine ->> 'folder_id')::uuid;
  v_exercises jsonb := coalesce(p_routine -> 'exercises', '[]'::jsonb);
begin
  if v_user_id is null then
    raise exception 'Not signed in' using errcode = '42501';
  end if;

  if v_routine_id is null or jsonb_typeof(v_exercises) <> 'array' then
    raise exception 'Malformed routine' using errcode = '22023';
  end if;

  if jsonb_array_length(v_exercises) > 50
    or exists (
      select 1 from jsonb_array_elements(v_exercises) e
      where jsonb_array_length(coalesce(e -> 'sets', '[]'::jsonb)) > 50
    ) then
    raise exception 'Too many exercises or sets' using errcode = '22023';
  end if;

  if exists (select 1 from public.routines where id = v_routine_id and owner_id <> v_user_id) then
    raise exception 'This routine belongs to another user' using errcode = '42501';
  end if;

  if v_folder_id is not null
    and not exists (
      select 1 from public.routine_folders where id = v_folder_id and owner_id = v_user_id
    ) then
    raise exception 'Unknown folder' using errcode = '22023';
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

  insert into public.routines (id, owner_id, folder_id, name, notes)
  values (
    v_routine_id,
    v_user_id,
    v_folder_id,
    p_routine ->> 'name',
    coalesce(p_routine ->> 'notes', '')
  )
  on conflict (id) do update
  set
    folder_id = excluded.folder_id,
    name = excluded.name,
    notes = excluded.notes,
    -- Saving a routine that was deleted on another phone brings it back rather than losing it.
    deleted_at = null
  where public.routines.owner_id = v_user_id;

  delete from public.routine_exercises where routine_id = v_routine_id;

  insert into public.routine_exercises (id, routine_id, exercise_id, position, rest_seconds, notes)
  select
    (e ->> 'id')::uuid,
    v_routine_id,
    (e ->> 'exercise_id')::uuid,
    (e ->> 'position')::integer,
    (e ->> 'rest_seconds')::integer,
    coalesce(e ->> 'notes', '')
  from jsonb_array_elements(v_exercises) e;

  insert into public.routine_sets (
    id, routine_exercise_id, position, set_type,
    target_reps, target_weight_kg, target_duration_s, target_distance_m
  )
  select
    (s ->> 'id')::uuid,
    (e ->> 'id')::uuid,
    (s ->> 'position')::integer,
    coalesce(s ->> 'set_type', 'normal')::public.workout_set_type,
    (s ->> 'target_reps')::integer,
    (s ->> 'target_weight_kg')::numeric,
    (s ->> 'target_duration_s')::integer,
    (s ->> 'target_distance_m')::numeric
  from jsonb_array_elements(v_exercises) e
  cross join jsonb_array_elements(coalesce(e -> 'sets', '[]'::jsonb)) s;
end;
$$;

comment on function public.save_routine(jsonb) is
  'Creates or replaces a whole routine sent by the phone. Idempotent.';

revoke execute on function public.save_routine(jsonb) from public, anon;
grant execute on function public.save_routine(jsonb) to authenticated;

-- ---------------------------------------------------------------------------
-- Workouts remember the routine they started from
-- ---------------------------------------------------------------------------

alter table public.workouts
  add column routine_id uuid references public.routines (id) on delete set null;

create index workouts_routine_idx on public.workouts (routine_id) where routine_id is not null;

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
end;
$$;
