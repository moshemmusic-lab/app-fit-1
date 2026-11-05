import type { WorkoutSetType } from '@/features/workouts/types';

/** A planned set: every target is optional ("8 reps", "60 kg × 8" or nothing). */
export interface RoutineSet {
  id: string;
  setType: WorkoutSetType;
  targetReps: number | null;
  targetWeightKg: number | null;
  targetDurationS: number | null;
  targetDistanceM: number | null;
}

export interface RoutineExercise {
  /** routine_exercises.id */
  id: string;
  /** exercises.id */
  exerciseId: string;
  /** Null = no rest timer. */
  restSeconds: number | null;
  notes: string;
  sets: RoutineSet[];
}

export interface Routine {
  id: string;
  folderId: string | null;
  name: string;
  notes: string;
  exercises: RoutineExercise[];
  /** Shown on the owner's profile, where others can copy it. Missing = not shared. */
  shared?: boolean;
}

export interface RoutineFolder {
  id: string;
  name: string;
  position: number;
}

/** What save_routine() receives. A type (not an interface) so it is valid JSON for Supabase. */
export type RoutinePayload = {
  id: string;
  folder_id: string | null;
  name: string;
  notes: string;
  exercises: {
    id: string;
    exercise_id: string;
    position: number;
    rest_seconds: number | null;
    notes: string;
    sets: {
      id: string;
      position: number;
      set_type: WorkoutSetType;
      target_reps: number | null;
      target_weight_kg: number | null;
      target_duration_s: number | null;
      target_distance_m: number | null;
    }[];
  }[];
};
