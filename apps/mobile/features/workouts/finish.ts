import { emptySetValues, workoutVolumeKg, type SetValues } from '@app-fit/shared/workouts';

import type {
  ActiveWorkout,
  DraftSet,
  LastSetsByExercise,
  WorkoutPayload,
  WorkoutSummary,
} from './types';

export function toSetValues(set: SetValues): SetValues {
  return {
    weightKg: set.weightKg,
    reps: set.reps,
    durationS: set.durationS,
    distanceM: set.distanceM,
    calories: set.calories,
  };
}

/** New sets for an exercise: as many as last time (at least one), empty but ready to prefill. */
export function newDraftSets(
  previous: readonly SetValues[] | undefined,
  newId: () => string,
): DraftSet[] {
  const count = Math.max(previous?.length ?? 0, 1);
  return Array.from({ length: count }, () => ({
    ...emptySetValues,
    id: newId(),
    setType: 'normal',
    completedAt: null,
  }));
}

export function completedSetCount(workout: ActiveWorkout): number {
  return workout.exercises.reduce(
    (total, exercise) => total + exercise.sets.filter((set) => set.completedAt !== null).length,
    0,
  );
}

export function hasIncompleteSets(workout: ActiveWorkout): boolean {
  return workout.exercises.some((exercise) =>
    exercise.sets.some((set) => set.completedAt === null),
  );
}

export interface FinishedWorkout {
  payload: WorkoutPayload;
  summary: WorkoutSummary;
  /** Last time values to prefill the next workout with these exercises. */
  lastSets: LastSetsByExercise;
}

/**
 * Turns the workout in progress into what gets uploaded. Only completed sets are kept, and
 * exercises without any are left out. Positions are renumbered from 0.
 */
export function finishWorkout(workout: ActiveWorkout, endedAt: Date): FinishedWorkout {
  const exercises = workout.exercises
    .map((exercise) => ({
      ...exercise,
      sets: exercise.sets.filter(
        (set): set is DraftSet & { completedAt: string } => set.completedAt !== null,
      ),
    }))
    .filter((exercise) => exercise.sets.length > 0);

  const startedAt = new Date(workout.startedAt);
  // A phone clock change could put the end before the start; the database would reject it.
  const end = endedAt < startedAt ? startedAt : endedAt;

  const payload: WorkoutPayload = {
    id: workout.id,
    title: workout.title,
    notes: workout.notes,
    visibility: workout.visibility,
    started_at: workout.startedAt,
    ended_at: end.toISOString(),
    exercises: exercises.map((exercise, position) => ({
      id: exercise.id,
      exercise_id: exercise.exerciseId,
      position,
      notes: exercise.notes,
      sets: exercise.sets.map((set, setPosition) => ({
        id: set.id,
        position: setPosition,
        set_type: set.setType,
        weight_kg: set.weightKg,
        reps: set.reps,
        duration_s: set.durationS,
        distance_m: set.distanceM,
        calories: set.calories,
        completed_at: set.completedAt,
      })),
    })),
  };

  const lastSets: LastSetsByExercise = {};
  for (const exercise of exercises) {
    lastSets[exercise.exerciseId] = exercise.sets.map(toSetValues);
  }

  return {
    payload,
    lastSets,
    summary: {
      workoutId: workout.id,
      durationS: Math.round((end.getTime() - startedAt.getTime()) / 1000),
      volumeKg: workoutVolumeKg(exercises),
      setCount: exercises.reduce((total, exercise) => total + exercise.sets.length, 0),
      exerciseCount: exercises.length,
    },
  };
}
