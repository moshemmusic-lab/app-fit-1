-- Accounts (MVP step 2): public profile, private settings, onboarding and avatars.
-- See docs/ARCHITECTURE.md §5.1.
--
-- profiles      → what other users can see (username, name, photo, bio, privacy, role).
-- user_settings → only the owner can see it (units, goal, level, notifications, consents).

-- ---------------------------------------------------------------------------
-- Shared helpers
-- ---------------------------------------------------------------------------

create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

revoke execute on function public.set_updated_at() from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  -- Null until onboarding is completed.
  username text unique check (username ~ '^[a-z0-9_]{3,24}$'),
  display_name text check (
    display_name = btrim(display_name) and char_length(display_name) between 1 and 50
  ),
  -- Path inside the "avatars" bucket. Always inside the owner's folder.
  avatar_path text check (
    avatar_path is null
    or (avatar_path like id::text || '/%' and char_length(avatar_path) <= 200)
  ),
  bio text check (char_length(bio) <= 160),
  is_private boolean not null default false,
  role text not null default 'user' check (role in ('user', 'creator', 'admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.profiles is 'Public identity of each user (1:1 with auth.users).';

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- user_settings
-- ---------------------------------------------------------------------------

create table public.user_settings (
  user_id uuid primary key references auth.users (id) on delete cascade,
  units text not null default 'kg' check (units in ('kg', 'lb')),
  locale text not null default 'es-ES' check (locale ~ '^[a-z]{2}-[A-Z]{2}$'),
  training_goal text check (training_goal in ('strength', 'cardio', 'both')),
  experience_level text check (experience_level in ('beginner', 'intermediate', 'advanced')),
  -- Privacy by default (GDPR art. 25): new workouts are not public unless the user says so.
  default_workout_visibility text not null default 'followers'
    check (default_workout_visibility in ('public', 'followers', 'private')),
  notify_social boolean not null default true,
  notify_reminders boolean not null default true,
  -- Explicit consent to process health data (GDPR art. 9). Set only by complete_onboarding().
  health_data_consent_at timestamptz,
  onboarding_completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.user_settings is 'Private preferences and consents of each user.';

create trigger user_settings_set_updated_at
before update on public.user_settings
for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Create both rows when someone signs up
-- ---------------------------------------------------------------------------

create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id) values (new.id);
  insert into public.user_settings (user_id) values (new.id);
  return new;
end;
$$;

revoke execute on function public.handle_new_user() from public, anon, authenticated;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Privileges and row level security
-- ---------------------------------------------------------------------------

-- Supabase grants every privilege on new tables to anon and authenticated.
-- Narrow them: rows are created by the trigger and deleted with the account,
-- and only these columns can be edited from the app.
revoke all on public.profiles from anon, authenticated;
grant select on public.profiles to authenticated;
grant update (username, display_name, avatar_path, bio, is_private)
  on public.profiles to authenticated;

revoke all on public.user_settings from anon, authenticated;
grant select on public.user_settings to authenticated;
grant update (
  units,
  locale,
  training_goal,
  experience_level,
  default_workout_visibility,
  notify_social,
  notify_reminders
) on public.user_settings to authenticated;

alter table public.profiles enable row level security;
alter table public.user_settings enable row level security;

create policy "Signed-in users can see profiles"
on public.profiles for select
to authenticated
using (true);

create policy "Users can update their own profile"
on public.profiles for update
to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

create policy "Users can see their own settings"
on public.user_settings for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "Users can update their own settings"
on public.user_settings for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

-- ---------------------------------------------------------------------------
-- Onboarding
-- ---------------------------------------------------------------------------

-- Saves the onboarding answers and records consent with the server clock.
-- security definer because consent and completion dates are not editable from the app.
create function public.complete_onboarding(
  p_username text,
  p_display_name text,
  p_training_goal text,
  p_experience_level text,
  p_units text,
  p_health_data_consent boolean
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null then
    raise exception 'Not authenticated' using errcode = '42501';
  end if;

  if p_health_data_consent is not true then
    raise exception 'Health data consent is required' using errcode = '22023';
  end if;

  if p_training_goal is null or p_experience_level is null then
    raise exception 'Training goal and experience level are required' using errcode = '22023';
  end if;

  update public.profiles
  set username = p_username,
      display_name = p_display_name
  where id = v_user_id;

  update public.user_settings
  set training_goal = p_training_goal,
      experience_level = p_experience_level,
      units = p_units,
      health_data_consent_at = coalesce(health_data_consent_at, now()),
      onboarding_completed_at = coalesce(onboarding_completed_at, now())
  where user_id = v_user_id;
end;
$$;

revoke execute on function public.complete_onboarding(text, text, text, text, text, boolean)
  from public, anon;
grant execute on function public.complete_onboarding(text, text, text, text, text, boolean)
  to authenticated;

-- ---------------------------------------------------------------------------
-- Avatars
-- ---------------------------------------------------------------------------

-- Public bucket: anyone with the link can see a profile photo, as in other social apps.
-- Each user can only write inside the folder named after their user id.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', true, 2097152, array['image/jpeg', 'image/png', 'image/webp']);

create policy "Users can upload their own avatar"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

create policy "Users can see their own avatar files"
on storage.objects for select
to authenticated
using (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

create policy "Users can replace their own avatar"
on storage.objects for update
to authenticated
using (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = (select auth.uid())::text
)
with check (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

create policy "Users can delete their own avatar"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);
