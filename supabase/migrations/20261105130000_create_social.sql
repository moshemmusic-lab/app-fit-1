-- Social (MVP step 7). See docs/ARCHITECTURE.md §5.1 and §6.7.
--
-- Follows (with requests for private profiles), blocks, likes, comments and reports, plus
-- sharing routines and copying other people's.
--
-- Who sees what is decided in one place, can_view_content(): a private workout or routine is
-- only its owner's; a "followers" one is also for accepted followers; a "public" one is for
-- anyone signed in, unless the owner's profile is private (then only followers). Blocking
-- hides both people from each other.
--
-- The tables of workouts and routines stay readable only by their owner (so the app's own
-- queries keep returning only the user's data). Other people's shared content is read through
-- the functions below (security definer), which apply that rule and also name the exercises
-- (including the owner's custom ones, which the reader's library does not have).
--
-- Everything is written through functions: the tables grant only what the app may read.

-- Names in search ignore accents: "jose" finds "José".
create extension if not exists unaccent with schema extensions;

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create type public.follow_status as enum ('pending', 'accepted');

create table public.follows (
  follower_id uuid not null references auth.users (id) on delete cascade,
  following_id uuid not null references auth.users (id) on delete cascade,
  -- Pending = a request to a private profile, waiting for an answer.
  status public.follow_status not null,
  created_at timestamptz not null default now(),
  accepted_at timestamptz,
  primary key (follower_id, following_id),
  constraint follows_not_self check (follower_id <> following_id),
  constraint follows_accepted_at check ((status = 'accepted') = (accepted_at is not null))
);

comment on table public.follows is 'Who follows whom. Pending rows are requests to private profiles.';

create index follows_following_idx on public.follows (following_id, status);

create table public.blocks (
  blocker_id uuid not null references auth.users (id) on delete cascade,
  blocked_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  constraint blocks_not_self check (blocker_id <> blocked_id)
);

comment on table public.blocks is 'Blocked users: neither sees the other (App Store guideline 1.2).';

create index blocks_blocked_idx on public.blocks (blocked_id);

create table public.likes (
  workout_id uuid not null references public.workouts (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (workout_id, user_id)
);

create index likes_user_idx on public.likes (user_id);

create table public.comments (
  id uuid primary key default gen_random_uuid(),
  workout_id uuid not null references public.workouts (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  body text not null check (body = btrim(body) and char_length(body) between 1 and 500),
  created_at timestamptz not null default now()
);

create index comments_workout_idx on public.comments (workout_id, created_at);
create index comments_user_idx on public.comments (user_id);

create type public.report_target as enum ('workout', 'comment', 'user');
create type public.report_reason as enum ('spam', 'harassment', 'inappropriate', 'other');

create table public.reports (
  id uuid primary key default gen_random_uuid(),
  -- Kept if the reporter deletes their account: the report is still worth reviewing.
  reporter_id uuid references auth.users (id) on delete set null,
  target_type public.report_target not null,
  target_id uuid not null,
  -- Whose content it is, so moderation can see everything reported about someone.
  target_user_id uuid not null references auth.users (id) on delete cascade,
  reason public.report_reason not null,
  details text not null default '' check (char_length(details) <= 1000),
  -- Reviewed from the Supabase dashboard until the moderation panel (step 16).
  status text not null default 'open' check (status in ('open', 'reviewed', 'dismissed')),
  created_at timestamptz not null default now()
);

comment on table public.reports is 'Reported workouts, comments and users, for moderation.';

-- Reporting the same thing twice while it is open does nothing.
create unique index reports_open_once_idx
on public.reports (reporter_id, target_type, target_id)
where status = 'open';

-- A routine copied from someone else's can use their custom exercises: the copier gets their
-- own copy of each (reused if they copy another routine with it).
alter table public.exercises
  add column copied_from_exercise_id uuid references public.exercises (id) on delete set null;

-- ---------------------------------------------------------------------------
-- Privileges and RLS: read your own rows; write only through the functions below
-- ---------------------------------------------------------------------------

revoke all on public.follows from anon, authenticated;
revoke all on public.blocks from anon, authenticated;
revoke all on public.likes from anon, authenticated;
revoke all on public.comments from anon, authenticated;
revoke all on public.reports from anon, authenticated;

grant select on public.follows to authenticated;
grant select on public.blocks to authenticated;
grant select on public.likes to authenticated;
grant select on public.comments to authenticated;
grant select on public.reports to authenticated;

alter table public.follows enable row level security;
alter table public.blocks enable row level security;
alter table public.likes enable row level security;
alter table public.comments enable row level security;
alter table public.reports enable row level security;

create policy "Users see the follows they are part of"
on public.follows for select to authenticated
using (follower_id = (select auth.uid()) or following_id = (select auth.uid()));

-- Nobody learns who blocked them.
create policy "Users see who they blocked"
on public.blocks for select to authenticated
using (blocker_id = (select auth.uid()));

create policy "Users see their own likes"
on public.likes for select to authenticated
using (user_id = (select auth.uid()));

create policy "Users see their own comments"
on public.comments for select to authenticated
using (user_id = (select auth.uid()));

create policy "Users see their own reports"
on public.reports for select to authenticated
using (reporter_id = (select auth.uid()));

-- ---------------------------------------------------------------------------
-- Rules (internal helpers: not callable from the app)
-- ---------------------------------------------------------------------------

create function public.is_blocked_between(p_a uuid, p_b uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.blocks
    where (blocker_id = p_a and blocked_id = p_b) or (blocker_id = p_b and blocked_id = p_a)
  );
$$;

create function public.is_accepted_follower(p_follower uuid, p_following uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.follows
    where follower_id = p_follower and following_id = p_following and status = 'accepted'
  );
$$;

-- Can p_viewer see a workout or routine of p_owner with this visibility?
create function public.can_view_content(p_viewer uuid, p_owner uuid, p_visibility text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select p_viewer = p_owner or (
    p_visibility in ('public', 'followers')
    and not public.is_blocked_between(p_viewer, p_owner)
    and (
      public.is_accepted_follower(p_viewer, p_owner)
      or (
        p_visibility = 'public'
        and exists (select 1 from public.profiles where id = p_owner and not is_private)
      )
    )
  );
$$;

-- An exercise's name in the reader's language (else Spain's, else any).
create function public.exercise_name(p_exercise_id uuid, p_locale text)
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select t.name
  from public.exercise_translations t
  where t.exercise_id = p_exercise_id
  order by t.locale = p_locale desc, t.locale = 'es-ES' desc, t.locale
  limit 1;
$$;

create function public.profile_card(p_user_id uuid)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'id', p.id,
    'username', p.username,
    'display_name', p.display_name,
    'avatar_path', p.avatar_path
  )
  from public.profiles p
  where p.id = p_user_id;
$$;

-- A workout as a feed card: who, totals, exercises with their working sets, likes, comments.
create function public.workout_card(p_workout_id uuid, p_viewer uuid, p_locale text)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'id', w.id,
    'user', public.profile_card(w.user_id),
    'title', w.title,
    'started_at', w.started_at,
    'ended_at', w.ended_at,
    'visibility', w.visibility,
    'volume_kg', coalesce(s.volume_kg, 0),
    'set_count', coalesce(s.set_count, 0),
    'exercise_count', coalesce(s.exercise_count, 0),
    'record_count', coalesce(s.record_count, 0),
    'like_count', (select count(*) from public.likes l where l.workout_id = w.id),
    'comment_count', (select count(*) from public.comments c where c.workout_id = w.id),
    'liked', exists (
      select 1 from public.likes l where l.workout_id = w.id and l.user_id = p_viewer
    ),
    'exercises', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'name', public.exercise_name(we.exercise_id, p_locale),
          'set_count', (
            select count(*) from public.workout_sets ws
            where ws.workout_exercise_id = we.id and ws.set_type <> 'warmup'
          )
        )
        order by we.position
      )
      from public.workout_exercises we
      where we.workout_id = w.id
    ), '[]'::jsonb)
  )
  from public.workouts w
  left join public.workout_stats s on s.id = w.id
  where w.id = p_workout_id;
$$;

revoke execute on function public.is_blocked_between(uuid, uuid) from public, anon, authenticated;
revoke execute on function public.is_accepted_follower(uuid, uuid) from public, anon, authenticated;
revoke execute on function public.can_view_content(uuid, uuid, text) from public, anon, authenticated;
revoke execute on function public.exercise_name(uuid, text) from public, anon, authenticated;
revoke execute on function public.profile_card(uuid) from public, anon, authenticated;
revoke execute on function public.workout_card(uuid, uuid, text) from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- People: search, profiles, following and blocking
-- ---------------------------------------------------------------------------

create function public.search_users(p_query text, p_limit integer default 20)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_me uuid := (select auth.uid());
  v_query text := lower(extensions.unaccent(btrim(ltrim(btrim(coalesce(p_query, '')), '@'))));
  v_pattern text;
begin
  if v_me is null then
    raise exception 'Not signed in' using errcode = '42501';
  end if;
  if v_query = '' then
    return '[]'::jsonb;
  end if;
  -- Typed text is matched literally (% and _ are not wildcards).
  v_pattern := '%' || replace(replace(replace(v_query, '\', '\\'), '%', '\%'), '_', '\_') || '%';

  return coalesce((
    select jsonb_agg(card order by rank, username)
    from (
      select
        jsonb_build_object(
          'id', p.id,
          'username', p.username,
          'display_name', p.display_name,
          'avatar_path', p.avatar_path,
          'is_private', p.is_private,
          'follow_status', f.status
        ) as card,
        case
          when p.username = v_query then 0
          when p.username like v_query || '%' then 1
          else 2
        end as rank,
        p.username
      from public.profiles p
      left join public.follows f on f.follower_id = v_me and f.following_id = p.id
      where p.username is not null
        and p.id <> v_me
        and (
          p.username like v_pattern escape '\'
          or lower(extensions.unaccent(coalesce(p.display_name, ''))) like v_pattern escape '\'
        )
        and not public.is_blocked_between(v_me, p.id)
      order by rank, p.username
      limit least(greatest(coalesce(p_limit, 20), 1), 50)
    ) results
  ), '[]'::jsonb);
end;
$$;

-- A profile as the viewer sees it. Null if it does not exist or its owner blocked the viewer.
create function public.get_profile(p_user_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_me uuid := (select auth.uid());
  v_profile public.profiles;
  v_blocked boolean;
  v_follow public.follow_status;
begin
  if v_me is null then
    raise exception 'Not signed in' using errcode = '42501';
  end if;

  select * into v_profile from public.profiles where id = p_user_id and username is not null;
  if not found
    or exists (select 1 from public.blocks where blocker_id = p_user_id and blocked_id = v_me)
  then
    return null;
  end if;

  v_blocked := exists (select 1 from public.blocks where blocker_id = v_me and blocked_id = p_user_id);
  select status into v_follow from public.follows
  where follower_id = v_me and following_id = p_user_id;

  return jsonb_build_object(
    'id', v_profile.id,
    'username', v_profile.username,
    'display_name', v_profile.display_name,
    'avatar_path', v_profile.avatar_path,
    'bio', v_profile.bio,
    'is_private', v_profile.is_private,
    -- Others count only what is shared (not private workouts).
    'workout_count', (
      select count(*) from public.workouts w
      where w.user_id = p_user_id
        and w.deleted_at is null
        and (p_user_id = v_me or w.visibility <> 'private')
    ),
    'follower_count', (
      select count(*) from public.follows where following_id = p_user_id and status = 'accepted'
    ),
    'following_count', (
      select count(*) from public.follows where follower_id = p_user_id and status = 'accepted'
    ),
    'follow_status', v_follow,
    'follows_me', public.is_accepted_follower(p_user_id, v_me),
    'blocked', v_blocked,
    'can_see', p_user_id = v_me or (
      not v_blocked and (not v_profile.is_private or v_follow = 'accepted')
    ),
    'pending_requests', case
      when p_user_id = v_me then (
        select count(*) from public.follows where following_id = v_me and status = 'pending'
      )
    end
  );
end;
$$;

-- Follows someone, or asks to if their profile is private. Returns the resulting status.
create function public.follow_user(p_user_id uuid)
returns public.follow_status
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_me uuid := (select auth.uid());
  v_private boolean;
  v_status public.follow_status;
begin
  if v_me is null then
    raise exception 'Not signed in' using errcode = '42501';
  end if;
  if p_user_id = v_me then
    raise exception 'You cannot follow yourself' using errcode = '22023';
  end if;

  select is_private into v_private from public.profiles where id = p_user_id and username is not null;
  -- Blocked either way behaves like a user that does not exist.
  if not found or public.is_blocked_between(v_me, p_user_id) then
    raise exception 'User not found' using errcode = 'P0002';
  end if;

  insert into public.follows (follower_id, following_id, status, accepted_at)
  values (
    v_me,
    p_user_id,
    case when v_private then 'pending' else 'accepted' end::public.follow_status,
    case when v_private then null else now() end
  )
  on conflict (follower_id, following_id) do nothing;

  select status into v_status from public.follows
  where follower_id = v_me and following_id = p_user_id;
  return v_status;
end;
$$;

-- Stops following someone, or cancels a request. Doing it twice is harmless.
create function public.unfollow_user(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (select auth.uid()) is null then
    raise exception 'Not signed in' using errcode = '42501';
  end if;
  delete from public.follows where follower_id = (select auth.uid()) and following_id = p_user_id;
end;
$$;

create function public.respond_to_follow_request(p_follower_id uuid, p_accept boolean)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_me uuid := (select auth.uid());
begin
  if v_me is null then
    raise exception 'Not signed in' using errcode = '42501';
  end if;

  if p_accept then
    update public.follows
    set status = 'accepted', accepted_at = now()
    where follower_id = p_follower_id and following_id = v_me and status = 'pending';
  else
    delete from public.follows
    where follower_id = p_follower_id and following_id = v_me and status = 'pending';
  end if;

  if not found then
    raise exception 'No such request' using errcode = 'P0002';
  end if;
end;
$$;

-- Removes someone from your followers.
create function public.remove_follower(p_follower_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (select auth.uid()) is null then
    raise exception 'Not signed in' using errcode = '42501';
  end if;
  delete from public.follows where follower_id = p_follower_id and following_id = (select auth.uid());
end;
$$;

-- Pending requests to the signed-in user, newest first.
create function public.get_follow_requests()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_me uuid := (select auth.uid());
begin
  if v_me is null then
    raise exception 'Not signed in' using errcode = '42501';
  end if;
  return coalesce((
    select jsonb_agg(
      jsonb_build_object('user', public.profile_card(f.follower_id), 'requested_at', f.created_at)
      order by f.created_at desc
    )
    from public.follows f
    where f.following_id = v_me and f.status = 'pending'
  ), '[]'::jsonb);
end;
$$;

-- Blocking also ends any follow between the two, both ways.
create function public.block_user(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_me uuid := (select auth.uid());
begin
  if v_me is null then
    raise exception 'Not signed in' using errcode = '42501';
  end if;
  if p_user_id = v_me then
    raise exception 'You cannot block yourself' using errcode = '22023';
  end if;
  if not exists (select 1 from public.profiles where id = p_user_id) then
    raise exception 'User not found' using errcode = 'P0002';
  end if;

  insert into public.blocks (blocker_id, blocked_id) values (v_me, p_user_id)
  on conflict do nothing;

  delete from public.follows
  where (follower_id = v_me and following_id = p_user_id)
     or (follower_id = p_user_id and following_id = v_me);
end;
$$;

create function public.unblock_user(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (select auth.uid()) is null then
    raise exception 'Not signed in' using errcode = '42501';
  end if;
  delete from public.blocks where blocker_id = (select auth.uid()) and blocked_id = p_user_id;
end;
$$;

create function public.get_blocked_users()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_me uuid := (select auth.uid());
begin
  if v_me is null then
    raise exception 'Not signed in' using errcode = '42501';
  end if;
  return coalesce((
    select jsonb_agg(public.profile_card(b.blocked_id) order by b.created_at desc)
    from public.blocks b
    where b.blocker_id = v_me
  ), '[]'::jsonb);
end;
$$;

-- Making a private profile public accepts the requests that were waiting.
create function public.accept_requests_when_public()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.follows
  set status = 'accepted', accepted_at = now()
  where following_id = new.id and status = 'pending';
  return new;
end;
$$;

revoke execute on function public.accept_requests_when_public() from public, anon, authenticated;

create trigger profiles_accept_requests_when_public
after update of is_private on public.profiles
for each row
when (old.is_private and not new.is_private)
execute function public.accept_requests_when_public();

-- ---------------------------------------------------------------------------
-- Workouts: feed, detail, visibility, likes and comments
-- ---------------------------------------------------------------------------

-- The home feed (your workouts and those of people you follow), or one person's workouts
-- with p_user_id. Newest first, p_limit at a time; p_before continues after the last one.
create function public.get_feed(
  p_user_id uuid default null,
  p_before timestamptz default null,
  p_limit integer default 20,
  p_locale text default 'es-ES'
)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_me uuid := (select auth.uid());
begin
  if v_me is null then
    raise exception 'Not signed in' using errcode = '42501';
  end if;

  return coalesce((
    select jsonb_agg(public.workout_card(page.id, v_me, p_locale) order by page.started_at desc, page.id desc)
    from (
      select w.id, w.started_at
      from public.workouts w
      where w.deleted_at is null
        and (p_before is null or w.started_at < p_before)
        and case
          when p_user_id is null then
            w.user_id = v_me or public.is_accepted_follower(v_me, w.user_id)
          else
            w.user_id = p_user_id
        end
        and public.can_view_content(v_me, w.user_id, w.visibility)
      order by w.started_at desc, w.id desc
      limit least(greatest(coalesce(p_limit, 20), 1), 50)
    ) page
  ), '[]'::jsonb);
end;
$$;

-- A whole workout as the viewer may see it (null if they may not), with exercise names.
create function public.get_workout_detail(p_workout_id uuid, p_locale text default 'es-ES')
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_me uuid := (select auth.uid());
begin
  if v_me is null then
    raise exception 'Not signed in' using errcode = '42501';
  end if;

  return (
    select jsonb_build_object(
      'id', w.id,
      'user', public.profile_card(w.user_id),
      'title', w.title,
      'notes', w.notes,
      'started_at', w.started_at,
      'ended_at', w.ended_at,
      'visibility', w.visibility,
      'exercises', coalesce((
        select jsonb_agg(
          jsonb_build_object(
            'id', we.id,
            'exercise_id', we.exercise_id,
            'name', public.exercise_name(we.exercise_id, p_locale),
            'tracking_type', x.tracking_type,
            'notes', we.notes,
            'sets', coalesce((
              select jsonb_agg(
                jsonb_build_object(
                  'id', ws.id,
                  'set_type', ws.set_type,
                  'weight_kg', ws.weight_kg,
                  'reps', ws.reps,
                  'duration_s', ws.duration_s,
                  'distance_m', ws.distance_m,
                  'calories', ws.calories
                )
                order by ws.position
              )
              from public.workout_sets ws
              where ws.workout_exercise_id = we.id
            ), '[]'::jsonb)
          )
          order by we.position
        )
        from public.workout_exercises we
        join public.exercises x on x.id = we.exercise_id
        where we.workout_id = w.id
      ), '[]'::jsonb),
      'records', coalesce((
        select jsonb_agg(jsonb_build_object('set_id', pr.workout_set_id, 'record_type', pr.record_type))
        from public.personal_records pr
        where pr.workout_id = w.id and pr.previous_value is not null
      ), '[]'::jsonb)
    )
    from public.workouts w
    where w.id = p_workout_id
      and w.deleted_at is null
      and public.can_view_content(v_me, w.user_id, w.visibility)
  );
end;
$$;

-- Likes and comments of a workout the viewer may see (null otherwise).
create function public.get_workout_social(p_workout_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_me uuid := (select auth.uid());
begin
  if v_me is null then
    raise exception 'Not signed in' using errcode = '42501';
  end if;

  return (
    select jsonb_build_object(
      'like_count', (select count(*) from public.likes l where l.workout_id = w.id),
      'comment_count', (select count(*) from public.comments c where c.workout_id = w.id),
      'liked', exists (select 1 from public.likes l where l.workout_id = w.id and l.user_id = v_me)
    )
    from public.workouts w
    where w.id = p_workout_id
      and w.deleted_at is null
      and public.can_view_content(v_me, w.user_id, w.visibility)
  );
end;
$$;

create function public.set_workout_visibility(p_workout_id uuid, p_visibility text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (select auth.uid()) is null then
    raise exception 'Not signed in' using errcode = '42501';
  end if;

  update public.workouts
  set visibility = p_visibility
  where id = p_workout_id and user_id = (select auth.uid()) and deleted_at is null;

  if not found then
    raise exception 'Workout not found' using errcode = 'P0002';
  end if;
end;
$$;

create function public.set_workout_like(p_workout_id uuid, p_liked boolean)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_me uuid := (select auth.uid());
begin
  if v_me is null then
    raise exception 'Not signed in' using errcode = '42501';
  end if;
  if not exists (
    select 1 from public.workouts w
    where w.id = p_workout_id
      and w.deleted_at is null
      and public.can_view_content(v_me, w.user_id, w.visibility)
  ) then
    raise exception 'Workout not found' using errcode = 'P0002';
  end if;

  if p_liked then
    insert into public.likes (workout_id, user_id) values (p_workout_id, v_me)
    on conflict do nothing;
  else
    delete from public.likes where workout_id = p_workout_id and user_id = v_me;
  end if;
end;
$$;

-- Comments of a workout, oldest first, without those of people blocked either way.
create function public.get_comments(p_workout_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_me uuid := (select auth.uid());
  v_owner uuid;
begin
  if v_me is null then
    raise exception 'Not signed in' using errcode = '42501';
  end if;

  select w.user_id into v_owner
  from public.workouts w
  where w.id = p_workout_id
    and w.deleted_at is null
    and public.can_view_content(v_me, w.user_id, w.visibility);
  if not found then
    return null;
  end if;

  return coalesce((
    select jsonb_agg(
      jsonb_build_object(
        'id', c.id,
        'body', c.body,
        'created_at', c.created_at,
        'user', public.profile_card(c.user_id),
        -- Its author and the workout's owner can delete it.
        'can_delete', c.user_id = v_me or v_owner = v_me
      )
      order by c.created_at, c.id
    )
    from public.comments c
    where c.workout_id = p_workout_id
      and not public.is_blocked_between(v_me, c.user_id)
  ), '[]'::jsonb);
end;
$$;

create function public.add_comment(p_workout_id uuid, p_body text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_me uuid := (select auth.uid());
  v_id uuid;
begin
  if v_me is null then
    raise exception 'Not signed in' using errcode = '42501';
  end if;
  if not exists (
    select 1 from public.workouts w
    where w.id = p_workout_id
      and w.deleted_at is null
      and public.can_view_content(v_me, w.user_id, w.visibility)
  ) then
    raise exception 'Workout not found' using errcode = 'P0002';
  end if;

  insert into public.comments (workout_id, user_id, body)
  values (p_workout_id, v_me, btrim(coalesce(p_body, '')))
  returning id into v_id;
  return v_id;
end;
$$;

create function public.delete_comment(p_comment_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_me uuid := (select auth.uid());
begin
  if v_me is null then
    raise exception 'Not signed in' using errcode = '42501';
  end if;

  delete from public.comments c
  using public.workouts w
  where c.id = p_comment_id
    and w.id = c.workout_id
    and (c.user_id = v_me or w.user_id = v_me);

  if not found then
    raise exception 'Comment not found' using errcode = 'P0002';
  end if;
end;
$$;

-- ---------------------------------------------------------------------------
-- Reports
-- ---------------------------------------------------------------------------

create function public.report_content(
  p_target_type public.report_target,
  p_target_id uuid,
  p_reason public.report_reason,
  p_details text default ''
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_me uuid := (select auth.uid());
  v_target_user uuid;
begin
  if v_me is null then
    raise exception 'Not signed in' using errcode = '42501';
  end if;

  -- Only what the reporter can see can be reported.
  if p_target_type = 'workout' then
    select w.user_id into v_target_user
    from public.workouts w
    where w.id = p_target_id
      and w.deleted_at is null
      and public.can_view_content(v_me, w.user_id, w.visibility);
  elsif p_target_type = 'comment' then
    select c.user_id into v_target_user
    from public.comments c
    join public.workouts w on w.id = c.workout_id
    where c.id = p_target_id
      and w.deleted_at is null
      and public.can_view_content(v_me, w.user_id, w.visibility);
  else
    select p.id into v_target_user
    from public.profiles p
    where p.id = p_target_id and p.username is not null;
  end if;

  if v_target_user is null then
    raise exception 'Nothing to report' using errcode = 'P0002';
  end if;
  if v_target_user = v_me then
    raise exception 'You cannot report yourself' using errcode = '22023';
  end if;

  insert into public.reports (reporter_id, target_type, target_id, target_user_id, reason, details)
  values (v_me, p_target_type, p_target_id, v_target_user, p_reason, btrim(coalesce(p_details, '')))
  on conflict (reporter_id, target_type, target_id) where status = 'open' do nothing;
end;
$$;

-- ---------------------------------------------------------------------------
-- Routines: share on your profile and copy other people's
-- ---------------------------------------------------------------------------

create function public.set_routine_visibility(p_routine_id uuid, p_visibility text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (select auth.uid()) is null then
    raise exception 'Not signed in' using errcode = '42501';
  end if;

  update public.routines
  set visibility = p_visibility
  where id = p_routine_id and owner_id = (select auth.uid()) and deleted_at is null;

  if not found then
    raise exception 'Routine not found' using errcode = 'P0002';
  end if;
end;
$$;

-- The routines someone shares on their profile, as the viewer may see them.
create function public.get_user_routines(p_user_id uuid, p_locale text default 'es-ES')
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_me uuid := (select auth.uid());
begin
  if v_me is null then
    raise exception 'Not signed in' using errcode = '42501';
  end if;

  return coalesce((
    select jsonb_agg(
      jsonb_build_object(
        'id', r.id,
        'name', r.name,
        'notes', r.notes,
        'exercises', coalesce((
          select jsonb_agg(
            jsonb_build_object(
              'name', public.exercise_name(re.exercise_id, p_locale),
              'set_count', (
                select count(*) from public.routine_sets rs where rs.routine_exercise_id = re.id
              )
            )
            order by re.position
          )
          from public.routine_exercises re
          where re.routine_id = r.id
        ), '[]'::jsonb)
      )
      order by r.position, r.created_at
    )
    from public.routines r
    where r.owner_id = p_user_id
      and r.deleted_at is null
      and r.visibility <> 'private'
      and public.can_view_content(v_me, r.owner_id, r.visibility)
  ), '[]'::jsonb);
end;
$$;

-- Copies someone's shared routine into the signed-in user's routines. Returns the new id.
create function public.copy_routine(p_routine_id uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_me uuid := (select auth.uid());
  v_source public.routines;
  v_new_id uuid := gen_random_uuid();
  v_map jsonb := '{}'::jsonb;
  v_exercise public.exercises;
  v_copy_id uuid;
begin
  if v_me is null then
    raise exception 'Not signed in' using errcode = '42501';
  end if;

  select * into v_source from public.routines where id = p_routine_id and deleted_at is null;
  -- Your own routines are duplicated from the routine menu instead.
  if not found
    or v_source.owner_id = v_me
    or v_source.visibility = 'private'
    or not public.can_view_content(v_me, v_source.owner_id, v_source.visibility)
  then
    raise exception 'Routine not found' using errcode = 'P0002';
  end if;

  -- Someone else's custom exercises: the copier gets their own copy (reused when possible).
  for v_exercise in
    select distinct x.*
    from public.routine_exercises re
    join public.exercises x on x.id = re.exercise_id
    where re.routine_id = p_routine_id and x.owner_id is not null and x.owner_id <> v_me
  loop
    select id into v_copy_id
    from public.exercises
    where owner_id = v_me and copied_from_exercise_id = v_exercise.id and deleted_at is null
    limit 1;

    if not found then
      insert into public.exercises (
        owner_id, tracking_type, disciplines, primary_muscle, secondary_muscles, equipment,
        copied_from_exercise_id
      )
      values (
        v_me, v_exercise.tracking_type, v_exercise.disciplines, v_exercise.primary_muscle,
        v_exercise.secondary_muscles, v_exercise.equipment, v_exercise.id
      )
      returning id into v_copy_id;

      insert into public.exercise_translations (exercise_id, locale, name, aliases, instructions)
      select v_copy_id, t.locale, t.name, t.aliases, t.instructions
      from public.exercise_translations t
      where t.exercise_id = v_exercise.id;
    end if;

    v_map := v_map || jsonb_build_object(v_exercise.id::text, v_copy_id);
  end loop;

  insert into public.routines (id, owner_id, name, notes, copied_from_routine_id)
  values (v_new_id, v_me, v_source.name, v_source.notes, v_source.id);

  -- New ids derive from the new routine's id, so exercises and sets keep pointing to each other.
  insert into public.routine_exercises (
    id, routine_id, exercise_id, position, superset_group, rest_seconds, notes
  )
  select
    md5(v_new_id::text || re.id::text)::uuid,
    v_new_id,
    coalesce((v_map ->> re.exercise_id::text)::uuid, re.exercise_id),
    re.position,
    re.superset_group,
    re.rest_seconds,
    re.notes
  from public.routine_exercises re
  where re.routine_id = p_routine_id;

  insert into public.routine_sets (
    id, routine_exercise_id, position, set_type,
    target_reps, target_weight_kg, target_duration_s, target_distance_m
  )
  select
    md5(v_new_id::text || rs.id::text)::uuid,
    md5(v_new_id::text || re.id::text)::uuid,
    rs.position,
    rs.set_type,
    rs.target_reps,
    rs.target_weight_kg,
    rs.target_duration_s,
    rs.target_distance_m
  from public.routine_sets rs
  join public.routine_exercises re on re.id = rs.routine_exercise_id
  where re.routine_id = p_routine_id;

  return v_new_id;
end;
$$;

-- ---------------------------------------------------------------------------
-- Grants: the app calls these; anonymous visitors call none
-- ---------------------------------------------------------------------------

revoke execute on function public.search_users(text, integer) from public, anon;
revoke execute on function public.get_profile(uuid) from public, anon;
revoke execute on function public.follow_user(uuid) from public, anon;
revoke execute on function public.unfollow_user(uuid) from public, anon;
revoke execute on function public.respond_to_follow_request(uuid, boolean) from public, anon;
revoke execute on function public.remove_follower(uuid) from public, anon;
revoke execute on function public.get_follow_requests() from public, anon;
revoke execute on function public.block_user(uuid) from public, anon;
revoke execute on function public.unblock_user(uuid) from public, anon;
revoke execute on function public.get_blocked_users() from public, anon;
revoke execute on function public.get_feed(uuid, timestamptz, integer, text) from public, anon;
revoke execute on function public.get_workout_detail(uuid, text) from public, anon;
revoke execute on function public.get_workout_social(uuid) from public, anon;
revoke execute on function public.set_workout_visibility(uuid, text) from public, anon;
revoke execute on function public.set_workout_like(uuid, boolean) from public, anon;
revoke execute on function public.get_comments(uuid) from public, anon;
revoke execute on function public.add_comment(uuid, text) from public, anon;
revoke execute on function public.delete_comment(uuid) from public, anon;
revoke execute on function public.report_content(public.report_target, uuid, public.report_reason, text) from public, anon;
revoke execute on function public.set_routine_visibility(uuid, text) from public, anon;
revoke execute on function public.get_user_routines(uuid, text) from public, anon;
revoke execute on function public.copy_routine(uuid) from public, anon;

grant execute on function public.search_users(text, integer) to authenticated;
grant execute on function public.get_profile(uuid) to authenticated;
grant execute on function public.follow_user(uuid) to authenticated;
grant execute on function public.unfollow_user(uuid) to authenticated;
grant execute on function public.respond_to_follow_request(uuid, boolean) to authenticated;
grant execute on function public.remove_follower(uuid) to authenticated;
grant execute on function public.get_follow_requests() to authenticated;
grant execute on function public.block_user(uuid) to authenticated;
grant execute on function public.unblock_user(uuid) to authenticated;
grant execute on function public.get_blocked_users() to authenticated;
grant execute on function public.get_feed(uuid, timestamptz, integer, text) to authenticated;
grant execute on function public.get_workout_detail(uuid, text) to authenticated;
grant execute on function public.get_workout_social(uuid) to authenticated;
grant execute on function public.set_workout_visibility(uuid, text) to authenticated;
grant execute on function public.set_workout_like(uuid, boolean) to authenticated;
grant execute on function public.get_comments(uuid) to authenticated;
grant execute on function public.add_comment(uuid, text) to authenticated;
grant execute on function public.delete_comment(uuid) to authenticated;
grant execute on function public.report_content(public.report_target, uuid, public.report_reason, text) to authenticated;
grant execute on function public.set_routine_visibility(uuid, text) to authenticated;
grant execute on function public.get_user_routines(uuid, text) to authenticated;
grant execute on function public.copy_routine(uuid) to authenticated;
