import type { TrackingType } from '@app-fit/shared/exercises';
import { withWorkoutBests, type ExerciseSession, type RecordBests } from '@app-fit/shared/progress';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';

import { useExerciseLibrary } from '@/features/exercises/api';
import { usePendingWorkouts } from '@/features/workouts/workout-store';
import { supabase } from '@/lib/supabase';

import { progressKeys } from './keys';
import {
  bestsFromPersonalBests,
  mergeExerciseSessions,
  mergeTrainingLog,
  pendingToDetail,
  recentExerciseIds,
  type RecentWorkout,
} from './logic';
import type { BodyWeightEntry, PersonalBest, TrainingEntry, WorkoutDetail } from './types';

// Supabase returns at most 1,000 rows per request: years of training at 4 workouts a week.
const MAX_ROWS = 1000;

const SET_COLUMNS = 'id, position, set_type, weight_kg, reps, duration_s, distance_m, calories';

const byPosition = <T extends { position: number }>(a: T, b: T) => a.position - b.position;

// ---------------------------------------------------------------------------
// History, weekly chart and calendar
// ---------------------------------------------------------------------------

async function fetchWorkoutStats(): Promise<TrainingEntry[]> {
  // RLS (security invoker view) returns only the signed-in user's workouts.
  const { data, error } = await supabase
    .from('workout_stats')
    .select('id, title, started_at, ended_at, volume_kg, set_count, exercise_count, record_count')
    .order('started_at', { ascending: false })
    .limit(MAX_ROWS);
  if (error) throw error;
  return data.map((row) => ({
    id: row.id,
    title: row.title,
    startedAt: row.started_at,
    endedAt: row.ended_at,
    volumeKg: Number(row.volume_kg ?? 0),
    setCount: row.set_count ?? 0,
    exerciseCount: row.exercise_count ?? 0,
    recordCount: row.record_count ?? 0,
    pending: false,
  }));
}

/**
 * Every finished workout, newest first: the server's (cached on the phone) plus those not
 * uploaded yet, so the history is complete offline too.
 */
export function useTrainingLog(userId: string) {
  const query = useQuery({ queryKey: progressKeys.stats(userId), queryFn: fetchWorkoutStats });
  const pending = usePendingWorkouts(userId);
  const entries = useMemo(
    () => (query.data ? mergeTrainingLog(query.data, pending) : undefined),
    [query.data, pending],
  );
  return { query, entries };
}

// ---------------------------------------------------------------------------
// One workout
// ---------------------------------------------------------------------------

async function fetchWorkout(workoutId: string): Promise<WorkoutDetail | null> {
  const { data, error } = await supabase
    .from('workouts')
    .select(
      `id, title, notes, started_at, ended_at, deleted_at, workout_exercises (id, exercise_id, position, notes, workout_sets (${SET_COLUMNS})), personal_records (workout_set_id, record_type, previous_value)`,
    )
    .eq('id', workoutId)
    .maybeSingle();
  if (error) throw error;
  if (!data || data.deleted_at) return null;
  return {
    id: data.id,
    title: data.title,
    notes: data.notes,
    startedAt: data.started_at,
    endedAt: data.ended_at,
    pending: false,
    exercises: [...data.workout_exercises].sort(byPosition).map((exercise) => ({
      id: exercise.id,
      exerciseId: exercise.exercise_id,
      notes: exercise.notes,
      sets: [...exercise.workout_sets].sort(byPosition).map((set) => ({
        id: set.id,
        setType: set.set_type,
        weightKg: set.weight_kg,
        reps: set.reps,
        durationS: set.duration_s,
        distanceM: set.distance_m,
        calories: set.calories,
      })),
    })),
    // First times are starting points, not records.
    records: data.personal_records
      .filter((record) => record.previous_value !== null)
      .map((record) => ({ setId: record.workout_set_id, recordType: record.record_type })),
  };
}

/** A finished workout: from the phone while it waits to upload, else from the server. */
export function useWorkoutDetail(userId: string, workoutId: string) {
  const pendingEntry = usePendingWorkouts(userId).find((entry) => entry.id === workoutId);
  const query = useQuery({
    queryKey: progressKeys.workout(userId, workoutId),
    queryFn: () => fetchWorkout(workoutId),
    enabled: !pendingEntry,
  });
  const local = useMemo(
    () => (pendingEntry ? pendingToDetail(pendingEntry) : null),
    [pendingEntry],
  );
  return { query, detail: local ?? query.data };
}

// ---------------------------------------------------------------------------
// Records
// ---------------------------------------------------------------------------

async function fetchPersonalBests(): Promise<PersonalBest[]> {
  const { data, error } = await supabase
    .from('personal_bests')
    .select(
      'exercise_id, record_type, value, achieved_at, workout_id, weight_kg, reps, duration_s, distance_m',
    )
    .limit(MAX_ROWS);
  if (error) throw error;
  return data.flatMap((row) =>
    row.exercise_id && row.record_type && row.value !== null && row.achieved_at && row.workout_id
      ? [
          {
            exerciseId: row.exercise_id,
            recordType: row.record_type,
            value: Number(row.value),
            achievedAt: row.achieved_at,
            workoutId: row.workout_id,
            set: {
              weightKg: row.weight_kg,
              reps: row.reps,
              durationS: row.duration_s,
              distanceM: row.distance_m,
              calories: null,
            },
          },
        ]
      : [],
  );
}

/** The current best of each exercise and kind of record. Cached, so it works offline. */
export function usePersonalBests(userId: string) {
  return useQuery({ queryKey: progressKeys.bests(userId), queryFn: fetchPersonalBests });
}

/**
 * The values a new workout has to beat: the server's bests plus the workouts not uploaded yet
 * (two workouts in a row without connection).
 */
export function useRecordBests(userId: string): {
  bests: RecordBests;
  trackingTypeOf: (exerciseId: string) => TrackingType | undefined;
} {
  const personalBests = usePersonalBests(userId).data;
  const pending = usePendingWorkouts(userId);
  const library = useExerciseLibrary().data;

  return useMemo(() => {
    const trackingTypeOf = trackingTypeLookup(library);
    let bests = bestsFromPersonalBests(personalBests ?? []);
    for (const entry of pending) {
      bests = withWorkoutBests(
        bests,
        entry.payload.exercises.map((exercise) => ({
          exerciseId: exercise.exercise_id,
          sets: exercise.sets.map((set) => ({
            setType: set.set_type,
            weightKg: set.weight_kg,
            reps: set.reps,
            durationS: set.duration_s,
            distanceM: set.distance_m,
            calories: set.calories,
          })),
        })),
        trackingTypeOf,
      );
    }
    return { bests, trackingTypeOf };
  }, [personalBests, pending, library]);
}

function trackingTypeLookup(library: ReturnType<typeof useExerciseLibrary>['data']) {
  const byId = new Map(library?.map((exercise) => [exercise.id, exercise.trackingType]));
  return (exerciseId: string) => byId.get(exerciseId);
}

// ---------------------------------------------------------------------------
// Progress of one exercise
// ---------------------------------------------------------------------------

async function fetchExerciseSessions(exerciseId: string): Promise<ExerciseSession[]> {
  const { data, error } = await supabase
    .from('workout_exercises')
    .select(`workout_id, workouts!inner (started_at, deleted_at), workout_sets (${SET_COLUMNS})`)
    .eq('exercise_id', exerciseId)
    .is('workouts.deleted_at', null)
    .limit(MAX_ROWS);
  if (error) throw error;

  // An exercise can appear twice in a workout: one session per workout.
  const sessions = new Map<string, ExerciseSession & { sets: ExerciseSession['sets'][number][] }>();
  for (const row of data) {
    const session = sessions.get(row.workout_id) ?? {
      workoutId: row.workout_id,
      startedAt: row.workouts.started_at,
      sets: [],
    };
    session.sets.push(
      ...[...row.workout_sets].sort(byPosition).map((set) => ({
        setType: set.set_type,
        weightKg: set.weight_kg,
        reps: set.reps,
        durationS: set.duration_s,
        distanceM: set.distance_m,
        calories: set.calories,
      })),
    );
    sessions.set(row.workout_id, session);
  }
  return [...sessions.values()];
}

/** The workouts with this exercise (server and phone), in no particular order. */
export function useExerciseSessions(userId: string, exerciseId: string) {
  const query = useQuery({
    queryKey: progressKeys.exercise(userId, exerciseId),
    queryFn: () => fetchExerciseSessions(exerciseId),
  });
  const pending = usePendingWorkouts(userId);
  const sessions = useMemo(
    () => (query.data ? mergeExerciseSessions(query.data, pending, exerciseId) : undefined),
    [query.data, pending, exerciseId],
  );
  return { query, sessions };
}

// ---------------------------------------------------------------------------
// Recent exercises (top of the exercise picker)
// ---------------------------------------------------------------------------

// Enough workouts to fill "Recientes" with a typical week of training.
const RECENT_WORKOUTS = 10;
const RECENT_EXERCISES = 8;

async function fetchRecentWorkouts(userId: string): Promise<RecentWorkout[]> {
  const { data, error } = await supabase
    .from('workouts')
    .select('id, started_at, workout_exercises (exercise_id, position)')
    // Only the user's own workouts, also once others' shared workouts become readable.
    .eq('user_id', userId)
    .is('deleted_at', null)
    .order('started_at', { ascending: false })
    .limit(RECENT_WORKOUTS);
  if (error) throw error;
  return data.map((row) => ({
    id: row.id,
    startedAt: row.started_at,
    exerciseIds: [...row.workout_exercises].sort(byPosition).map((entry) => entry.exercise_id),
  }));
}

/** The exercises used lately, newest first (also offline, from the cache and the queue). */
export function useRecentExerciseIds(userId: string): string[] {
  const query = useQuery({
    queryKey: progressKeys.recentExercises(userId),
    queryFn: () => fetchRecentWorkouts(userId),
  });
  const pending = usePendingWorkouts(userId);
  return useMemo(
    () => recentExerciseIds(query.data ?? [], pending, RECENT_EXERCISES),
    [query.data, pending],
  );
}

// ---------------------------------------------------------------------------
// Changes (need a connection, like routines)
// ---------------------------------------------------------------------------

function useProgressMutation<TVariables>(
  userId: string,
  mutationFn: (variables: TVariables) => Promise<void>,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    // Fail right away when offline instead of waiting, so the screen can say so.
    networkMode: 'always',
    onSuccess: () => queryClient.invalidateQueries({ queryKey: progressKeys.all(userId) }),
  });
}

/** Deletes a workout from the history (soft delete); its records are recomputed. */
export function useDeleteWorkout(userId: string) {
  return useProgressMutation(userId, async (workoutId: string) => {
    const { error } = await supabase.rpc('delete_workout', { p_workout_id: workoutId });
    if (error) throw error;
  });
}

// ---------------------------------------------------------------------------
// Body weight
// ---------------------------------------------------------------------------

async function fetchBodyWeights(): Promise<BodyWeightEntry[]> {
  const { data, error } = await supabase
    .from('body_measurements')
    .select('id, measured_on, weight_kg')
    .order('measured_on', { ascending: false })
    .limit(MAX_ROWS);
  if (error) throw error;
  return data.map((row) => ({ id: row.id, day: row.measured_on, weightKg: Number(row.weight_kg) }));
}

/** Body weight entries, newest first. Cached, so they show offline. */
export function useBodyWeights(userId: string) {
  return useQuery({ queryKey: progressKeys.bodyWeight(userId), queryFn: fetchBodyWeights });
}

/** Saves the weight of a day; saving a day again replaces it. */
export function useSaveBodyWeight(userId: string) {
  return useProgressMutation(userId, async ({ day, weightKg }: Omit<BodyWeightEntry, 'id'>) => {
    const { error } = await supabase
      .from('body_measurements')
      .upsert(
        { measured_on: day, weight_kg: Math.round(weightKg * 100) / 100 },
        { onConflict: 'user_id,measured_on' },
      );
    if (error) throw error;
  });
}

export function useDeleteBodyWeight(userId: string) {
  return useProgressMutation(userId, async (entryId: string) => {
    const { error } = await supabase.from('body_measurements').delete().eq('id', entryId);
    if (error) throw error;
  });
}
