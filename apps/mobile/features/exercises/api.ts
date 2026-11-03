import { defaultExerciseLocale } from '@app-fit/shared/exercises';
import { queryOptions, useQuery } from '@tanstack/react-query';

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
      'id, tracking_type, primary_muscle, secondary_muscles, equipment, exercise_translations (locale, name, aliases, instructions)',
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

export type { LibraryExercise };
