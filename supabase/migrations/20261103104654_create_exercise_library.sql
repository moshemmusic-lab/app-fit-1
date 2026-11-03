-- Exercise library (MVP step 3). See docs/ARCHITECTURE.md §5.2.
--
-- exercises             → what an exercise is: how it is tracked, muscles, equipment.
-- exercise_translations → its name, search aliases and instructions per language and country.
--
-- Global exercises (owner_id is null) are read-only for everyone and arrive through migrations.
-- Custom exercises (owner_id = a user) come in step 5; only the read policy exists for now.

-- ---------------------------------------------------------------------------
-- Types
-- ---------------------------------------------------------------------------

-- Ready for other disciplines (yoga, pilates, running…); the MVP only uses "gym" (§5.7.5).
create type public.discipline as enum ('gym');

-- Decides which fields a set uses (weight, reps, duration, distance, calories).
create type public.exercise_tracking_type as enum (
  'weight_reps',
  'bodyweight_reps',
  'duration',
  'distance_duration',
  'calories_duration'
);

create type public.muscle_group as enum (
  'chest',
  'shoulders',
  'biceps',
  'triceps',
  'forearms',
  'upper_back',
  'lats',
  'traps',
  'lower_back',
  'abs',
  'obliques',
  'glutes',
  'quadriceps',
  'hamstrings',
  'adductors',
  'abductors',
  'calves',
  'full_body',
  'cardio'
);

create type public.equipment_type as enum (
  'barbell',
  'ez_bar',
  'dumbbell',
  'kettlebell',
  'machine',
  'cable',
  'smith_machine',
  'plate',
  'band',
  'bodyweight',
  'cardio_machine',
  'other'
);

-- ---------------------------------------------------------------------------
-- exercises
-- ---------------------------------------------------------------------------

create table public.exercises (
  id uuid primary key default gen_random_uuid(),
  -- Stable key of a global exercise, used by later migrations. Custom exercises have none.
  slug text unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  owner_id uuid references auth.users (id) on delete cascade,
  tracking_type public.exercise_tracking_type not null,
  disciplines public.discipline[] not null default '{gym}' check (cardinality(disciplines) > 0),
  primary_muscle public.muscle_group not null,
  secondary_muscles public.muscle_group[] not null default '{}' check (
    not (primary_muscle = any (secondary_muscles))
  ),
  equipment public.equipment_type not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- Global exercises are identified by slug; custom ones by their owner.
  constraint exercises_global_has_slug check ((owner_id is null) = (slug is not null))
);

comment on table public.exercises is
  'Exercise library: global (owner_id null) and, from step 5, custom exercises.';

create index exercises_owner_id_idx on public.exercises (owner_id) where owner_id is not null;

create trigger exercises_set_updated_at
before update on public.exercises
for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- exercise_translations
-- ---------------------------------------------------------------------------

create table public.exercise_translations (
  exercise_id uuid not null references public.exercises (id) on delete cascade,
  -- Language and country, e.g. "es-ES" or "es-MX" (names change between countries).
  locale text not null check (locale ~ '^[a-z]{2}-[A-Z]{2}$'),
  name text not null check (name = btrim(name) and char_length(name) between 1 and 80),
  -- Other names people search for (English gym names, other countries' names).
  aliases text[] not null default '{}',
  -- One string per step, shown as a numbered list.
  instructions text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (exercise_id, locale)
);

comment on table public.exercise_translations is
  'Name, search aliases and step-by-step instructions of an exercise per locale.';

create trigger exercise_translations_set_updated_at
before update on public.exercise_translations
for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Privileges and RLS: read-only from the app
-- ---------------------------------------------------------------------------

revoke all on public.exercises from anon, authenticated;
revoke all on public.exercise_translations from anon, authenticated;
grant select on public.exercises to authenticated;
grant select on public.exercise_translations to authenticated;

alter table public.exercises enable row level security;
alter table public.exercise_translations enable row level security;

create policy "Signed-in users read global exercises and their own"
on public.exercises
for select
to authenticated
using (owner_id is null or owner_id = (select auth.uid()));

create policy "Signed-in users read translations of the exercises they can see"
on public.exercise_translations
for select
to authenticated
using (
  exists (
    select 1
    from public.exercises e
    where e.id = exercise_id
      and (e.owner_id is null or e.owner_id = (select auth.uid()))
  )
);
