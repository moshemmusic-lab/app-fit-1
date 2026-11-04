import type { TrackingType } from '@app-fit/shared/exercises';
import { emptySetValues, type SetValues } from '@app-fit/shared/workouts';

import { defaultRestSeconds } from '../workouts/rest';

import type { Routine, RoutineExercise, RoutinePayload, RoutineSet } from './types';

/** Strength exercises usually have several sets; holds and cardio, one. */
function defaultSetCount(trackingType: TrackingType): number {
  return trackingType === 'weight_reps' || trackingType === 'bodyweight_reps' ? 3 : 1;
}

export function emptyRoutineSet(id: string): RoutineSet {
  return {
    id,
    setType: 'normal',
    targetReps: null,
    targetWeightKg: null,
    targetDurationS: null,
    targetDistanceM: null,
  };
}

/** A new exercise in a routine: default rest and a sensible number of empty target sets. */
export function newRoutineExercise(
  exerciseId: string,
  trackingType: TrackingType,
  newId: () => string,
): RoutineExercise {
  return {
    id: newId(),
    exerciseId,
    restSeconds: defaultRestSeconds(trackingType),
    notes: '',
    sets: Array.from({ length: defaultSetCount(trackingType) }, () => emptyRoutineSet(newId())),
  };
}

/** Targets as set values, to suggest them when the routine is trained. Null when there are none. */
export function targetValues(set: RoutineSet): SetValues | null {
  const values: SetValues = {
    ...emptySetValues,
    reps: set.targetReps,
    weightKg: set.targetWeightKg,
    durationS: set.targetDurationS,
    distanceM: set.targetDistanceM,
  };
  return Object.values(values).some((value) => value !== null) ? values : null;
}

/** Target fields that a set value maps to (calories are never a target). */
export function targetPatch(patch: Partial<SetValues>): Partial<RoutineSet> {
  const result: Partial<RoutineSet> = {};
  if ('reps' in patch) result.targetReps = patch.reps ?? null;
  if ('weightKg' in patch) result.targetWeightKg = patch.weightKg ?? null;
  if ('durationS' in patch) result.targetDurationS = patch.durationS ?? null;
  if ('distanceM' in patch) result.targetDistanceM = patch.distanceM ?? null;
  return result;
}

/** What gets saved. Positions are renumbered from 0 and the name is trimmed. */
export function toRoutinePayload(routine: Routine): RoutinePayload {
  return {
    id: routine.id,
    folder_id: routine.folderId,
    name: routine.name.trim(),
    notes: routine.notes.trim(),
    exercises: routine.exercises.map((exercise, position) => ({
      id: exercise.id,
      exercise_id: exercise.exerciseId,
      position,
      rest_seconds: exercise.restSeconds,
      notes: exercise.notes.trim(),
      sets: exercise.sets.map((set, setPosition) => ({
        id: set.id,
        position: setPosition,
        set_type: set.setType,
        target_reps: set.targetReps,
        target_weight_kg: set.targetWeightKg,
        target_duration_s: set.targetDurationS,
        target_distance_m: set.targetDistanceM,
      })),
    })),
  };
}

/** A copy with new ids everywhere, so saving it creates a separate routine. */
export function duplicateRoutine(routine: Routine, name: string, newId: () => string): Routine {
  return {
    ...routine,
    id: newId(),
    name,
    exercises: routine.exercises.map((exercise) => ({
      ...exercise,
      id: newId(),
      sets: exercise.sets.map((set) => ({ ...set, id: newId() })),
    })),
  };
}

/** The routine as a plan for a new workout: its sets, targets, rests and notes. */
export function routineToPlannedWorkout(routine: Routine): {
  routineId: string;
  title: string;
  exercises: {
    exerciseId: string;
    restSeconds: number | null;
    notes: string;
    sets: { setType: RoutineSet['setType']; target: SetValues | null }[];
  }[];
} {
  return {
    routineId: routine.id,
    title: routine.name,
    exercises: routine.exercises.map((exercise) => ({
      exerciseId: exercise.exerciseId,
      restSeconds: exercise.restSeconds,
      notes: exercise.notes,
      sets: exercise.sets.map((set) => ({ setType: set.setType, target: targetValues(set) })),
    })),
  };
}

/** Spanish alphabetical order, ignoring case and accents. */
export function byName<T extends { name: string }>(a: T, b: T): number {
  return a.name.localeCompare(b.name, 'es', { sensitivity: 'base' });
}
