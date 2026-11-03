import type { Database } from '@app-fit/shared/database';
import type { WorkoutVisibility } from '@app-fit/shared/schemas';
import type { SetValues } from '@app-fit/shared/workouts';

export type WorkoutSetType = Database['public']['Enums']['workout_set_type'];

/** A set on the phone while training. Values are in kg, metres and seconds. */
export interface DraftSet extends SetValues {
  id: string;
  setType: WorkoutSetType;
  /** Set when the user marks it done; only completed sets are saved. */
  completedAt: string | null;
}

export interface DraftExercise {
  /** Id of this exercise inside the workout (workout_exercises.id). */
  id: string;
  /** Exercise from the library (exercises.id). */
  exerciseId: string;
  notes: string;
  sets: DraftSet[];
}

/** The workout in progress. Saved on the phone after every change. */
export interface ActiveWorkout {
  id: string;
  userId: string;
  title: string;
  notes: string;
  visibility: WorkoutVisibility;
  startedAt: string;
  exercises: DraftExercise[];
}

/** What save_workout() receives. A type (not an interface) so it is valid JSON for Supabase. */
export type WorkoutPayload = {
  id: string;
  title: string;
  notes: string;
  visibility: WorkoutVisibility;
  started_at: string;
  ended_at: string;
  exercises: {
    id: string;
    exercise_id: string;
    position: number;
    notes: string;
    sets: {
      id: string;
      position: number;
      set_type: WorkoutSetType;
      weight_kg: number | null;
      reps: number | null;
      duration_s: number | null;
      distance_m: number | null;
      calories: number | null;
      completed_at: string;
    }[];
  }[];
};

/** A finished workout waiting to be uploaded. It only leaves the phone once the server has it. */
export interface PendingWorkout {
  id: string;
  userId: string;
  payload: WorkoutPayload;
  queuedAt: string;
  attempts: number;
  /** Set when the server rejected it (not for connection problems). */
  lastError: string | null;
}

export interface WorkoutSummary {
  workoutId: string;
  durationS: number;
  volumeKg: number;
  setCount: number;
  exerciseCount: number;
}

/** Last completed sets per exercise, to prefill the next workout. */
export type LastSetsByExercise = Record<string, SetValues[]>;
