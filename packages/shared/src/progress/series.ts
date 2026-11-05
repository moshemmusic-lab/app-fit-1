import type { TrackingType } from '../exercises/taxonomy';
import { setVolumeKg } from '../workouts/sets';

import { estimateOneRepMaxKg, type RecordSet } from './records';

/** What the progress chart of an exercise can show, per workout. */
export type ProgressMetric =
  | 'est_1rm'
  | 'max_weight'
  | 'session_volume'
  | 'max_reps'
  | 'session_reps'
  | 'max_duration'
  | 'session_distance'
  | 'session_duration'
  | 'session_calories';

/** The metrics each kind of exercise offers; the first one is shown by default. */
export const progressMetricsByTrackingType: Record<TrackingType, readonly ProgressMetric[]> = {
  weight_reps: ['est_1rm', 'max_weight', 'session_volume'],
  bodyweight_reps: ['max_reps', 'session_reps'],
  duration: ['max_duration'],
  distance_duration: ['session_distance', 'session_duration'],
  calories_duration: ['session_calories', 'session_duration'],
};

const sum = (values: readonly number[]) => values.reduce((total, value) => total + value, 0);

const maxOf = (values: readonly (number | null)[]): number | null => {
  const present = values.filter((value): value is number => value !== null && value > 0);
  return present.length > 0 ? Math.max(...present) : null;
};

const totalOf = (values: readonly (number | null)[]): number | null => {
  const total = sum(values.map((value) => value ?? 0));
  return total > 0 ? total : null;
};

/** The value of a metric for the sets of one workout (warm-ups excluded). Null = nothing to show. */
export function sessionMetric(sets: readonly RecordSet[], metric: ProgressMetric): number | null {
  const working = sets.filter((set) => set.setType !== 'warmup');
  switch (metric) {
    case 'est_1rm':
      return maxOf(working.map((set) => estimateOneRepMaxKg(set.weightKg, set.reps)));
    case 'max_weight':
      return maxOf(working.map((set) => (set.reps !== null && set.reps > 0 ? set.weightKg : null)));
    case 'session_volume':
      return totalOf(working.map(setVolumeKg));
    case 'max_reps':
      return maxOf(working.map((set) => set.reps));
    case 'session_reps':
      return totalOf(working.map((set) => set.reps));
    case 'max_duration':
      return maxOf(working.map((set) => set.durationS));
    case 'session_distance':
      return totalOf(working.map((set) => set.distanceM));
    case 'session_duration':
      return totalOf(working.map((set) => set.durationS));
    case 'session_calories':
      return totalOf(working.map((set) => set.calories));
  }
}

export interface ExerciseSession {
  workoutId: string;
  startedAt: string;
  sets: readonly RecordSet[];
}

export interface ProgressPoint {
  workoutId: string;
  date: Date;
  value: number;
}

/** One point per workout, oldest first. Workouts without a value are left out. */
export function progressSeries(
  sessions: readonly ExerciseSession[],
  metric: ProgressMetric,
): ProgressPoint[] {
  return sessions
    .map((session) => ({
      workoutId: session.workoutId,
      date: new Date(session.startedAt),
      value: sessionMetric(session.sets, metric),
    }))
    .filter((point): point is ProgressPoint => point.value !== null)
    .sort((a, b) => a.date.getTime() - b.date.getTime());
}
