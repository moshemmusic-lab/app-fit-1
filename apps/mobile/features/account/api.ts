import type { Database } from '@app-fit/shared/database';
import {
  experienceLevels,
  trainingGoals,
  weightUnits,
  workoutVisibilities,
  type ExperienceLevel,
  type OnboardingAnswers,
  type ProfileUpdate,
  type TrainingGoal,
  type WeightUnit,
  type WorkoutVisibility,
} from '@app-fit/shared/schemas';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { supabase } from '@/lib/supabase';

type ProfileRow = Database['public']['Tables']['profiles']['Row'];
type SettingsRow = Database['public']['Tables']['user_settings']['Row'];

export interface Profile {
  id: string;
  username: string | null;
  displayName: string | null;
  avatarPath: string | null;
  bio: string | null;
  isPrivate: boolean;
}

export interface AccountSettings {
  units: WeightUnit;
  defaultWorkoutVisibility: WorkoutVisibility;
  notifySocial: boolean;
  notifyReminders: boolean;
  trainingGoal: TrainingGoal | null;
  experienceLevel: ExperienceLevel | null;
  onboardingCompletedAt: string | null;
}

export type SettingsPatch = Partial<
  Pick<AccountSettings, 'units' | 'defaultWorkoutVisibility' | 'notifySocial' | 'notifyReminders'>
>;

export const accountKeys = {
  profile: (userId: string) => ['account', userId, 'profile'] as const,
  settings: (userId: string) => ['account', userId, 'settings'] as const,
};

/** Database text columns are checked by constraints; narrow them to the shared unions. */
function oneOf<T extends string>(value: string | null, allowed: readonly T[]): T | null {
  return allowed.find((option) => option === value) ?? null;
}

export function toProfile(row: ProfileRow): Profile {
  return {
    id: row.id,
    username: row.username,
    displayName: row.display_name,
    avatarPath: row.avatar_path,
    bio: row.bio,
    isPrivate: row.is_private,
  };
}

function toSettings(row: SettingsRow): AccountSettings {
  return {
    units: oneOf(row.units, weightUnits) ?? 'kg',
    defaultWorkoutVisibility:
      oneOf(row.default_workout_visibility, workoutVisibilities) ?? 'followers',
    notifySocial: row.notify_social,
    notifyReminders: row.notify_reminders,
    trainingGoal: oneOf(row.training_goal, trainingGoals),
    experienceLevel: oneOf(row.experience_level, experienceLevels),
    onboardingCompletedAt: row.onboarding_completed_at,
  };
}

async function fetchProfile(userId: string): Promise<Profile> {
  const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();
  if (error) throw error;
  return toProfile(data);
}

async function fetchSettings(userId: string): Promise<AccountSettings> {
  const { data, error } = await supabase
    .from('user_settings')
    .select('*')
    .eq('user_id', userId)
    .single();
  if (error) throw error;
  return toSettings(data);
}

export function useProfile(userId: string | undefined) {
  return useQuery({
    queryKey: accountKeys.profile(userId ?? ''),
    queryFn: () => fetchProfile(userId ?? ''),
    enabled: userId !== undefined,
  });
}

export function useSettings(userId: string | undefined) {
  return useQuery({
    queryKey: accountKeys.settings(userId ?? ''),
    queryFn: () => fetchSettings(userId ?? ''),
    enabled: userId !== undefined,
  });
}

export async function isUsernameAvailable(username: string, userId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id')
    .eq('username', username)
    .neq('id', userId)
    .maybeSingle();
  if (error) throw error;
  return data === null;
}

export function useCompleteOnboarding(userId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (answers: OnboardingAnswers) => {
      const { error } = await supabase.rpc('complete_onboarding', {
        p_username: answers.username,
        p_display_name: answers.displayName,
        p_training_goal: answers.trainingGoal,
        p_experience_level: answers.experienceLevel,
        p_units: answers.units,
        p_health_data_consent: answers.healthDataConsent,
      });
      if (error) throw error;
    },
    // Wait for fresh settings: the navigation guard switches to the tabs when they arrive.
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: accountKeys.profile(userId) }),
        queryClient.invalidateQueries({ queryKey: accountKeys.settings(userId) }),
      ]),
  });
}

export function useUpdateProfile(userId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (update: ProfileUpdate) => {
      const { data, error } = await supabase
        .from('profiles')
        .update({
          username: update.username,
          display_name: update.displayName,
          bio: update.bio === '' ? null : update.bio,
          is_private: update.isPrivate,
        })
        .eq('id', userId)
        .select('*')
        .single();
      if (error) throw error;
      return toProfile(data);
    },
    onSuccess: (profile) => {
      queryClient.setQueryData(accountKeys.profile(userId), profile);
    },
  });
}

/** Applies the change on screen right away and rolls it back if saving fails. */
export function useUpdateSettings(userId: string) {
  const queryClient = useQueryClient();
  const queryKey = accountKeys.settings(userId);

  return useMutation({
    mutationKey: queryKey,
    mutationFn: async (patch: SettingsPatch) => {
      const { data, error } = await supabase
        .from('user_settings')
        .update({
          units: patch.units,
          default_workout_visibility: patch.defaultWorkoutVisibility,
          notify_social: patch.notifySocial,
          notify_reminders: patch.notifyReminders,
        })
        .eq('user_id', userId)
        .select('*')
        .single();
      if (error) throw error;
      return toSettings(data);
    },
    onMutate: async (patch) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<AccountSettings>(queryKey);
      if (previous) {
        queryClient.setQueryData<AccountSettings>(queryKey, { ...previous, ...patch });
      }
      return { previous };
    },
    onError: (_error, _patch, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKey, context.previous);
      }
    },
    onSettled: () => {
      // With several quick changes, an older response could overwrite a newer optimistic value.
      // Only the last change still in flight reloads the settings from the server.
      if (queryClient.isMutating({ mutationKey: queryKey }) === 1) {
        void queryClient.invalidateQueries({ queryKey });
      }
    },
  });
}
