-- Custom exercises (MVP step 5). See docs/ARCHITECTURE.md §5.2.
--
-- A custom exercise is a row of public.exercises with owner_id = its creator and no slug, plus
-- one translation with its name. Only its owner sees it (the read policies already exist).
--
-- It is written only through save_custom_exercise(). Deleting it is a soft delete (deleted_at):
-- it disappears from the library, but workouts and routines that use it keep it (rule 7).

alter table public.exercises
  add column deleted_at timestamptz,
  -- Global exercises are never deleted from the app.
  add constraint exercises_only_custom_deleted check (owner_id is not null or deleted_at is null);

-- Only the owner can (soft) delete their custom exercise; everything else goes through the RPC.
grant update (deleted_at) on public.exercises to authenticated;

create policy "Users delete their own custom exercises"
on public.exercises
for update
to authenticated
using (owner_id = (select auth.uid()))
with check (owner_id = (select auth.uid()));

-- Deleting an account deletes its custom exercises and its workouts and routines in the same
-- transaction, in no guaranteed order. Checking these references at the end of the transaction
-- lets that work, while still refusing to delete an exercise that a workout or routine keeps
-- using (so a workout can never lose its exercises).
alter table public.workout_exercises
  drop constraint workout_exercises_exercise_id_fkey,
  add constraint workout_exercises_exercise_id_fkey
    foreign key (exercise_id) references public.exercises (id) deferrable initially deferred;

alter table public.routine_exercises
  drop constraint routine_exercises_exercise_id_fkey,
  add constraint routine_exercises_exercise_id_fkey
    foreign key (exercise_id) references public.exercises (id) deferrable initially deferred;

-- ---------------------------------------------------------------------------
-- save_custom_exercise(): create or edit a custom exercise
-- ---------------------------------------------------------------------------

create function public.save_custom_exercise(p_exercise jsonb)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_exercise_id uuid := (p_exercise ->> 'id')::uuid;
  v_locale text := coalesce(p_exercise ->> 'locale', 'es-ES');
  v_tracking_type public.exercise_tracking_type :=
    (p_exercise ->> 'tracking_type')::public.exercise_tracking_type;
  v_existing public.exercises%rowtype;
begin
  if v_user_id is null then
    raise exception 'Not signed in' using errcode = '42501';
  end if;

  if v_exercise_id is null or v_tracking_type is null then
    raise exception 'Malformed exercise' using errcode = '22023';
  end if;

  select * into v_existing from public.exercises where id = v_exercise_id;

  if found then
    -- Global exercises and other users' exercises cannot be overwritten.
    if v_existing.owner_id is distinct from v_user_id then
      raise exception 'This exercise belongs to someone else' using errcode = '42501';
    end if;
    -- Past sets were logged with the old fields: changing how it is tracked would break them.
    if v_existing.tracking_type <> v_tracking_type then
      raise exception 'The tracking type of an exercise cannot change' using errcode = '22023';
    end if;
  elsif (select count(*) from public.exercises where owner_id = v_user_id) >= 500 then
    -- Sanity limit against a broken client (free plan limits arrive with Pro, step 14).
    raise exception 'Too many custom exercises' using errcode = '22023';
  end if;

  insert into public.exercises (id, owner_id, tracking_type, primary_muscle, equipment)
  values (
    v_exercise_id,
    v_user_id,
    v_tracking_type,
    (p_exercise ->> 'primary_muscle')::public.muscle_group,
    (p_exercise ->> 'equipment')::public.equipment_type
  )
  on conflict (id) do update
  set
    primary_muscle = excluded.primary_muscle,
    equipment = excluded.equipment,
    -- Editing an exercise deleted on another phone brings it back rather than losing the edit.
    deleted_at = null
  where public.exercises.owner_id = v_user_id;

  -- A custom exercise has one name, in the language the user uses.
  delete from public.exercise_translations
  where exercise_id = v_exercise_id and locale <> v_locale;

  insert into public.exercise_translations (exercise_id, locale, name)
  values (v_exercise_id, v_locale, p_exercise ->> 'name')
  on conflict (exercise_id, locale) do update
  set name = excluded.name;
end;
$$;

comment on function public.save_custom_exercise(jsonb) is
  'Creates or edits a custom exercise of the signed-in user. Idempotent.';

revoke execute on function public.save_custom_exercise(jsonb) from public, anon;
grant execute on function public.save_custom_exercise(jsonb) to authenticated;
