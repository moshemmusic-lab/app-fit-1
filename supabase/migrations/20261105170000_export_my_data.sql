-- "Export my data" (GDPR arts. 15 and 20): everything Movyn stores about the signed-in user,
-- as one JSON document the app saves to a file.
--
-- A plain function, not an Edge Function: it only reads the caller's own rows, so it needs no
-- service_role key. It is security definer so it can also add what RLS hides from the caller
-- but belongs to their data: their sign-in email and the usernames of the people they follow,
-- who follow them or whom they blocked. Every query is filtered by auth.uid().
--
-- Soft-deleted workouts, routines and custom exercises are included with their deleted_at:
-- Movyn still stores them, so the user has the right to see them.

create function public.export_my_data()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_me uuid := (select auth.uid());
  v_locale text;
begin
  if v_me is null then
    raise exception 'Not signed in' using errcode = '42501';
  end if;

  select coalesce(s.locale, 'es-ES') into v_locale
  from public.user_settings s
  where s.user_id = v_me;
  v_locale := coalesce(v_locale, 'es-ES');

  return jsonb_build_object(
    'format', 'movyn-export',
    'version', 1,
    'exported_at', now(),
    'weight_unit', 'kg',

    'account', (
      select jsonb_build_object('id', u.id, 'email', u.email, 'created_at', u.created_at)
      from auth.users u
      where u.id = v_me
    ),

    'profile', (
      select jsonb_build_object(
        'username', p.username,
        'display_name', p.display_name,
        'bio', p.bio,
        'avatar_path', p.avatar_path,
        'is_private', p.is_private,
        'created_at', p.created_at,
        'updated_at', p.updated_at
      )
      from public.profiles p
      where p.id = v_me
    ),

    'settings', (
      select jsonb_build_object(
        'units', s.units,
        'locale', s.locale,
        'training_goal', s.training_goal,
        'experience_level', s.experience_level,
        'default_workout_visibility', s.default_workout_visibility,
        'notify_social', s.notify_social,
        'notify_reminders', s.notify_reminders,
        'health_data_consent_at', s.health_data_consent_at,
        'onboarding_completed_at', s.onboarding_completed_at
      )
      from public.user_settings s
      where s.user_id = v_me
    ),

    'body_weight', coalesce((
      select jsonb_agg(
        jsonb_build_object('date', m.measured_on, 'weight_kg', m.weight_kg)
        order by m.measured_on
      )
      from public.body_measurements m
      where m.user_id = v_me
    ), '[]'::jsonb),

    'workouts', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'id', w.id,
          'title', w.title,
          'notes', w.notes,
          'visibility', w.visibility,
          'started_at', w.started_at,
          'ended_at', w.ended_at,
          'routine_id', w.routine_id,
          'deleted_at', w.deleted_at,
          'exercises', coalesce((
            select jsonb_agg(
              jsonb_build_object(
                'exercise_id', we.exercise_id,
                'exercise', public.exercise_name(we.exercise_id, v_locale),
                'superset_group', we.superset_group,
                'notes', we.notes,
                'sets', coalesce((
                  select jsonb_agg(
                    jsonb_build_object(
                      'set_type', ws.set_type,
                      'weight_kg', ws.weight_kg,
                      'reps', ws.reps,
                      'duration_s', ws.duration_s,
                      'distance_m', ws.distance_m,
                      'rpe', ws.rpe,
                      'completed_at', ws.completed_at
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
            where we.workout_id = w.id
          ), '[]'::jsonb)
        )
        order by w.started_at
      )
      from public.workouts w
      where w.user_id = v_me
    ), '[]'::jsonb),

    'personal_records', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'exercise', public.exercise_name(pr.exercise_id, v_locale),
          'record_type', pr.record_type,
          'value', pr.value,
          'previous_value', pr.previous_value,
          'workout_id', pr.workout_id,
          'achieved_at', pr.achieved_at
        )
        order by pr.achieved_at
      )
      from public.personal_records pr
      where pr.user_id = v_me
    ), '[]'::jsonb),

    'routine_folders', coalesce((
      select jsonb_agg(
        jsonb_build_object('id', f.id, 'name', f.name, 'created_at', f.created_at)
        order by f.position
      )
      from public.routine_folders f
      where f.owner_id = v_me
    ), '[]'::jsonb),

    'routines', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'id', r.id,
          'name', r.name,
          'notes', r.notes,
          'folder_id', r.folder_id,
          'visibility', r.visibility,
          'copied_from_routine_id', r.copied_from_routine_id,
          'created_at', r.created_at,
          'deleted_at', r.deleted_at,
          'exercises', coalesce((
            select jsonb_agg(
              jsonb_build_object(
                'exercise_id', re.exercise_id,
                'exercise', public.exercise_name(re.exercise_id, v_locale),
                'superset_group', re.superset_group,
                'rest_seconds', re.rest_seconds,
                'notes', re.notes,
                'sets', coalesce((
                  select jsonb_agg(
                    jsonb_build_object(
                      'set_type', rs.set_type,
                      'target_reps', rs.target_reps,
                      'target_weight_kg', rs.target_weight_kg,
                      'target_duration_s', rs.target_duration_s,
                      'target_distance_m', rs.target_distance_m
                    )
                    order by rs.position
                  )
                  from public.routine_sets rs
                  where rs.routine_exercise_id = re.id
                ), '[]'::jsonb)
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
      where r.owner_id = v_me
    ), '[]'::jsonb),

    'custom_exercises', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'id', e.id,
          'name', public.exercise_name(e.id, v_locale),
          'tracking_type', e.tracking_type,
          'primary_muscle', e.primary_muscle,
          'secondary_muscles', to_jsonb(e.secondary_muscles),
          'equipment', e.equipment,
          'created_at', e.created_at,
          'deleted_at', e.deleted_at
        )
        order by e.created_at
      )
      from public.exercises e
      where e.owner_id = v_me
    ), '[]'::jsonb),

    'following', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'username', p.username,
          'status', f.status,
          'since', f.created_at
        )
        order by f.created_at
      )
      from public.follows f
      join public.profiles p on p.id = f.following_id
      where f.follower_id = v_me
    ), '[]'::jsonb),

    'followers', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'username', p.username,
          'status', f.status,
          'since', f.created_at
        )
        order by f.created_at
      )
      from public.follows f
      join public.profiles p on p.id = f.follower_id
      where f.following_id = v_me
    ), '[]'::jsonb),

    'likes', coalesce((
      select jsonb_agg(
        jsonb_build_object('workout_id', l.workout_id, 'created_at', l.created_at)
        order by l.created_at
      )
      from public.likes l
      where l.user_id = v_me
    ), '[]'::jsonb),

    'comments', coalesce((
      select jsonb_agg(
        jsonb_build_object('workout_id', c.workout_id, 'body', c.body, 'created_at', c.created_at)
        order by c.created_at
      )
      from public.comments c
      where c.user_id = v_me
    ), '[]'::jsonb),

    'blocked_users', coalesce((
      select jsonb_agg(
        jsonb_build_object('username', p.username, 'since', b.created_at)
        order by b.created_at
      )
      from public.blocks b
      join public.profiles p on p.id = b.blocked_id
      where b.blocker_id = v_me
    ), '[]'::jsonb),

    'reports', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'target_type', rp.target_type,
          'reason', rp.reason,
          'details', rp.details,
          'status', rp.status,
          'created_at', rp.created_at
        )
        order by rp.created_at
      )
      from public.reports rp
      where rp.reporter_id = v_me
    ), '[]'::jsonb)
  );
end;
$$;

revoke execute on function public.export_my_data() from public, anon;
grant execute on function public.export_my_data() to authenticated;
