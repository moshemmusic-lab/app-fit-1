import { emptySetValues, workoutVolumeKg, type SetValues } from '@app-fit/shared/workouts';

import type {
  ActiveWorkout,
  DraftSet,
  LastSet,
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

/**
 * New sets for an exercise: as many as last time (at least one) and of the same types
 * (warm-ups first, as before), empty but ready to prefill.
 */
export function newDraftSets(
  previous: readonly LastSet[] | undefined,
  newId: () => string,
): DraftSet[] {
  const count = Math.max(previous?.length ?? 0, 1);
  return Array.from({ length: count }, (_, index) => ({
    ...emptySetValues,
    id: newId(),
    // Saved before set types existed: those count as normal sets.
    setType: previous?.[index]?.setType ?? 'normal',
    completedAt: null,
  }));
}

/** Working sets are numbered 1, 2, 3…; warm-ups get no number. */
export function numberSets(sets: readonly Pick<DraftSet, 'setType'>[]): (number | null)[] {
  let count = 0;
  return sets.map((set) => (set.setType === 'warmup' ? null : ++count));
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
 * exercises without any are left out. Positions are renumbered from 0. An empty title takes
 * `fallbackTitle`, because the server rejects it and the workout would never upload.
 */
export function finishWorkout(
  workout: ActiveWorkout,
  endedAt: Date,
  fallbackTitle: string,
): FinishedWorkout {
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
    title: workout.title.trim().slice(0, 80) || fallbackTitle,
    notes: workout.notes.trim().slice(0, 2000),
    visibility: workout.visibility,
    started_at: workout.startedAt,
    ended_at: end.toISOString(),
    exercises: exercises.map((exercise, position) => ({
      id: exercise.id,
      exercise_id: exercise.exerciseId,
      position,
      notes: exercise.notes.trim().slice(0, 1000),
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
    lastSets[exercise.exerciseId] = exercise.sets.map((set) => ({
      ...toSetValues(set),
      setType: set.setType,
    }));
  }

  // Warm-ups are not counted in the summary: volume and sets are the working sets.
  const workingSets = exercises.map((exercise) => ({
    sets: exercise.sets.filter((set) => set.setType !== 'warmup'),
  }));

  return {
    payload,
    lastSets,
    summary: {
      workoutId: workout.id,
      durationS: Math.round((end.getTime() - startedAt.getTime()) / 1000),
      volumeKg: workoutVolumeKg(workingSets),
      setCount: workingSets.reduce((total, exercise) => total + exercise.sets.length, 0),
      exerciseCount: exercises.length,
    },
  };
}
