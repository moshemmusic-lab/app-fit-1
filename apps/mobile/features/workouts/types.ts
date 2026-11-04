import type { Database } from '@app-fit/shared/database';
import type { NewRecord } from '@app-fit/shared/progress';
import type { WorkoutVisibility } from '@app-fit/shared/schemas';
import type { SetValues } from '@app-fit/shared/workouts';

export type WorkoutSetType = Database['public']['Enums']['workout_set_type'];

/** A set on the phone while training. Values are in kg, metres and seconds. */
export interface DraftSet extends SetValues {
  id: string;
  setType: WorkoutSetType;
  /** Set when the user marks it done; only completed sets are saved. */
  completedAt: string | null;
  /** The routine's target for this set, suggested when there is no last time. */
  target?: SetValues | null;
}

export interface DraftExercise {
  /** Id of this exercise inside the workout (workout_exercises.id). */
  id: string;
  /** Exercise from the library (exercises.id). */
  exerciseId: string;
  notes: string;
  /** Rest started after each completed set. Null = no rest timer for this exercise. */
  restSeconds: number | null;
  sets: DraftSet[];
}

/** The rest countdown. Stored as an end time, so it keeps running with the app closed. */
export interface RestTimer {
  endsAt: string;
  durationS: number;
  /** Local notification announcing the end, to cancel it if the rest changes. */
  notificationId: string | null;
}

/** The workout in progress. Saved on the phone after every change. */
export interface ActiveWorkout {
  id: string;
  userId: string;
  /** The routine it started from, if any. */
  routineId: string | null;
  title: string;
  notes: string;
  visibility: WorkoutVisibility;
  startedAt: string;
  exercises: DraftExercise[];
}

/** What save_workout() receives. A type (not an interface) so it is valid JSON for Supabase. */
export type WorkoutPayload = {
  id: string;
  routine_id: string | null;
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
  /** Records beaten in this workout. Missing in summaries saved before records existed. */
  records?: NewRecord[];
}

/** A completed set remembered to prefill the next workout. */
export interface LastSet extends SetValues {
  /** Missing in data saved before set types existed. */
  setType?: WorkoutSetType;
}

/** Last completed sets per exercise, to prefill the next workout. */
export type LastSetsByExercise = Record<string, LastSet[]>;

/** Rest chosen per exercise (null = no rest), remembered for next time. */
export type RestByExercise = Record<string, number | null>;
