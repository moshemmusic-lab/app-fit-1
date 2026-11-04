import {
  defaultExerciseLocale,
  type EquipmentType,
  type MuscleGroup,
  type TrackingType,
} from '@app-fit/shared/exercises';
import { queryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { supabase } from '@/lib/supabase';

import { toLibraryExercises, type LibraryExercise } from './library';

const ONE_DAY_MS = 1000 * 60 * 60 * 24;

// Only Spanish (Spain) exists for now; the user's locale will come from their settings.
const locale = defaultExerciseLocale;

export const exerciseKeys = {
  library: (exerciseLocale: string) => ['exercises', 'library', exerciseLocale] as const,
};

async function fetchLibrary(exerciseLocale: string): Promise<LibraryExercise[]> {
  // The whole library (~150 exercises) is small: one request, then search on the phone.
  const { data, error } = await supabase
    .from('exercises')
    .select(
      'id, owner_id, deleted_at, tracking_type, primary_muscle, secondary_muscles, equipment, exercise_translations (locale, name, aliases, instructions)',
    );
  if (error) throw error;
  return toLibraryExercises(data, exerciseLocale);
}

// The library rarely changes and is saved on the phone, so it also works offline.
const libraryOptions = queryOptions({
  queryKey: exerciseKeys.library(locale),
  queryFn: () => fetchLibrary(locale),
  staleTime: ONE_DAY_MS,
});

export function useExerciseLibrary() {
  return useQuery(libraryOptions);
}

/** One exercise from the library. `null` when it does not exist (or is not visible). */
export function useExercise(id: string) {
  return useQuery({
    ...libraryOptions,
    select: (exercises) => exercises.find((exercise) => exercise.id === id) ?? null,
  });
}

/** What the user fills in to create or edit one of their own exercises. */
export interface CustomExerciseInput {
  id: string;
  name: string;
  trackingType: TrackingType;
  primaryMuscle: MuscleGroup;
  equipment: EquipmentType;
}

/**
 * Changes to custom exercises need a connection: fail right away when offline (like routines),
 * and only finish once the library shows the change, so the next screen already has it.
 */
function useExerciseMutation<TVariables>(mutationFn: (variables: TVariables) => Promise<void>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    networkMode: 'always',
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['exercises'] }),
  });
}

export function useSaveCustomExercise() {
  return useExerciseMutation(async (exercise: CustomExerciseInput) => {
    const { error } = await supabase.rpc('save_custom_exercise', {
      p_exercise: {
        id: exercise.id,
        locale,
        name: exercise.name.trim(),
        tracking_type: exercise.trackingType,
        primary_muscle: exercise.primaryMuscle,
        equipment: exercise.equipment,
      },
    });
    if (error) throw error;
  });
}

/** Hides it from the library; workouts and routines that use it keep it. */
export function useDeleteCustomExercise() {
  return useExerciseMutation(async (exerciseId: string) => {
    const { error } = await supabase
      .from('exercises')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', exerciseId);
    if (error) throw error;
  });
}

export type { LibraryExercise };
