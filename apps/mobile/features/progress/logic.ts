import type { TrackingType } from '@app-fit/shared/exercises';
import {
  bestSets,
  recordTypesByTrackingType,
  type ExerciseSession,
  type RecordBests,
} from '@app-fit/shared/progress';
import { workoutVolumeKg } from '@app-fit/shared/workouts';

import type { PendingWorkout, WorkoutPayload } from '../workouts/types';

import type {
  HistoryExercise,
  HistorySet,
  PersonalBest,
  TrainingEntry,
  WorkoutDetail,
} from './types';

function payloadExercises(payload: WorkoutPayload): HistoryExercise[] {
  return payload.exercises.map((exercise) => ({
    id: exercise.id,
    exerciseId: exercise.exercise_id,
    notes: exercise.notes,
    sets: exercise.sets.map((set) => ({
      id: set.id,
      setType: set.set_type,
      weightKg: set.weight_kg,
      reps: set.reps,
      durationS: set.duration_s,
      distanceM: set.distance_m,
      calories: set.calories,
    })),
  }));
}

/** A workout waiting to be uploaded, as a history entry (same totals as the server). */
export function pendingToEntry(pending: PendingWorkout): TrainingEntry {
  const exercises = payloadExercises(pending.payload);
  const workingSets = exercises.map((exercise) => ({
    sets: exercise.sets.filter((set) => set.setType !== 'warmup'),
  }));
  return {
    id: pending.id,
    title: pending.payload.title,
    startedAt: pending.payload.started_at,
    endedAt: pending.payload.ended_at,
    volumeKg: workoutVolumeKg(workingSets),
    setCount: workingSets.reduce((total, exercise) => total + exercise.sets.length, 0),
    exerciseCount: exercises.length,
    recordCount: 0,
    pending: true,
  };
}

/**
 * The history: the server's workouts plus the ones still on the phone, newest first. A workout
 * already on the server is shown once, even if the queue has not let go of it yet.
 */
export function mergeTrainingLog(
  server: readonly TrainingEntry[],
  pending: readonly PendingWorkout[],
): TrainingEntry[] {
  const onServer = new Set(server.map((entry) => entry.id));
  return [
    ...server,
    ...pending.filter((entry) => !onServer.has(entry.id)).map(pendingToEntry),
  ].sort((a, b) => b.startedAt.localeCompare(a.startedAt));
}

/** A workout waiting to be uploaded, as a workout detail. Its records come once uploaded. */
export function pendingToDetail(pending: PendingWorkout): WorkoutDetail {
  return {
    id: pending.id,
    title: pending.payload.title,
    notes: pending.payload.notes,
    startedAt: pending.payload.started_at,
    endedAt: pending.payload.ended_at,
    pending: true,
    visibility: pending.payload.visibility,
    exercises: payloadExercises(pending.payload),
    records: [],
  };
}

/** The bests to compare a new workout with. */
export function bestsFromPersonalBests(rows: readonly PersonalBest[]): RecordBests {
  const bests: RecordBests = {};
  for (const row of rows) {
    bests[row.exerciseId] = { ...bests[row.exerciseId], [row.recordType]: row.value };
  }
  return bests;
}

/** The sessions of one exercise: the server's plus those still on the phone. */
export function mergeExerciseSessions(
  server: readonly ExerciseSession[],
  pending: readonly PendingWorkout[],
  exerciseId: string,
): ExerciseSession[] {
  const onServer = new Set(server.map((session) => session.workoutId));
  const local = pending
    .filter((entry) => !onServer.has(entry.id))
    .map((entry) => ({
      workoutId: entry.id,
      startedAt: entry.payload.started_at,
      sets: payloadExercises(entry.payload)
        .filter((exercise) => exercise.exerciseId === exerciseId)
        .flatMap((exercise) => exercise.sets),
    }))
    .filter((session) => session.sets.length > 0);
  return [...server, ...local];
}

/**
 * The set that best sums up a session, e.g. for "Últimas veces": the best one for the
 * exercise's main record (1RM, else weight…), or the first working set.
 */
export function topSet<T extends HistorySet>(
  sets: readonly T[],
  trackingType: TrackingType,
): T | undefined {
  const best = bestSets(sets, trackingType);
  for (const type of recordTypesByTrackingType[trackingType]) {
    const found = best[type];
    if (found) return sets[found.index];
  }
  return sets.find((set) => set.setType !== 'warmup') ?? sets[0];
}

/** A finished workout reduced to what "Recientes" needs: when, and its exercises in order. */
export interface RecentWorkout {
  id: string;
  startedAt: string;
  exerciseIds: string[];
}

/**
 * The exercises used most recently, newest first and without repeats: from the server's
 * latest workouts plus the ones still on the phone.
 */
export function recentExerciseIds(
  server: readonly RecentWorkout[],
  pending: readonly PendingWorkout[],
  limit: number,
): string[] {
  const onServer = new Set(server.map((workout) => workout.id));
  const local: RecentWorkout[] = pending
    .filter((entry) => !onServer.has(entry.id))
    .map((entry) => ({
      id: entry.id,
      startedAt: entry.payload.started_at,
      exerciseIds: [...entry.payload.exercises]
        .sort((a, b) => a.position - b.position)
        .map((exercise) => exercise.exercise_id),
    }));
  const ids = new Set<string>();
  for (const workout of [...server, ...local].sort((a, b) =>
    b.startedAt.localeCompare(a.startedAt),
  )) {
    for (const id of workout.exerciseIds) {
      if (ids.size >= limit) return [...ids];
      ids.add(id);
    }
  }
  return [...ids];
}
