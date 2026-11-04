import { Constants, type Database } from '../database.types';
import type { TrackingType } from '../exercises/taxonomy';
import type { SetValues } from '../workouts/sets';

// Same rules as refresh_personal_records() in the database (migration 20261104173211):
// the phone uses them for the summary, which must work offline. Keep both in step.

export type PersonalRecordType = Database['public']['Enums']['personal_record_type'];
export type WorkoutSetType = Database['public']['Enums']['workout_set_type'];

export const personalRecordTypes: readonly PersonalRecordType[] =
  Constants.public.Enums.personal_record_type;

/** The records each kind of exercise has, in the order they are shown. */
export const recordTypesByTrackingType: Record<TrackingType, readonly PersonalRecordType[]> = {
  weight_reps: ['est_1rm', 'max_weight', 'max_volume'],
  // max_weight is the heaviest extra load (a weighted pull-up).
  bodyweight_reps: ['max_reps', 'max_weight'],
  duration: ['max_duration'],
  distance_duration: ['max_distance'],
  calories_duration: [],
};

/** Above this many reps the estimate is not reliable. */
export const oneRepMaxRepLimit = 12;

const round2 = (value: number) => Math.round(value * 100) / 100;

/** Estimated one-rep max (Epley), rounded to 2 decimals. Null when it cannot be estimated. */
export function estimateOneRepMaxKg(weightKg: number | null, reps: number | null): number | null {
  if (weightKg === null || reps === null || weightKg <= 0) return null;
  if (reps < 1 || reps > oneRepMaxRepLimit) return null;
  return round2(reps === 1 ? weightKg : weightKg * (1 + reps / 30));
}

/** The value a set reaches for a kind of record. Null (or 0) = does not count. */
export function recordValue(type: PersonalRecordType, set: SetValues): number | null {
  switch (type) {
    case 'est_1rm':
      return estimateOneRepMaxKg(set.weightKg, set.reps);
    case 'max_weight':
      return set.reps !== null && set.reps > 0 ? set.weightKg : null;
    case 'max_volume':
      return set.weightKg !== null && set.reps !== null ? set.weightKg * set.reps : null;
    case 'max_reps':
      return set.reps;
    case 'max_duration':
      return set.durationS;
    case 'max_distance':
      return set.distanceM;
  }
}

export interface RecordSet extends SetValues {
  setType: WorkoutSetType;
}

export interface BestSet {
  value: number;
  /** Position of the set in the list it came from. */
  index: number;
}

/**
 * The best set of a list for each kind of record of the exercise: warm-ups do not count and
 * the first set wins on ties.
 */
export function bestSets(
  sets: readonly RecordSet[],
  trackingType: TrackingType,
): Partial<Record<PersonalRecordType, BestSet>> {
  const best: Partial<Record<PersonalRecordType, BestSet>> = {};
  for (const type of recordTypesByTrackingType[trackingType]) {
    sets.forEach((set, index) => {
      if (set.setType === 'warmup') return;
      const value = recordValue(type, set);
      if (value === null || value <= 0) return;
      const current = best[type];
      if (!current || value > current.value) best[type] = { value, index };
    });
  }
  return best;
}

/** The user's best value per exercise and kind of record. */
export type RecordBests = Record<string, Partial<Record<PersonalRecordType, number>>>;

export interface ExerciseSets {
  exerciseId: string;
  sets: readonly RecordSet[];
}

/** Sets of the same exercise together (an exercise can appear twice in a workout). */
function groupByExercise(exercises: readonly ExerciseSets[]): Map<string, RecordSet[]> {
  const grouped = new Map<string, RecordSet[]>();
  for (const exercise of exercises) {
    grouped.set(exercise.exerciseId, [
      ...(grouped.get(exercise.exerciseId) ?? []),
      ...exercise.sets,
    ]);
  }
  return grouped;
}

/** Bests after adding a workout (e.g. one finished offline and not uploaded yet). */
export function withWorkoutBests(
  bests: RecordBests,
  exercises: readonly ExerciseSets[],
  trackingTypeOf: (exerciseId: string) => TrackingType | undefined,
): RecordBests {
  const next: RecordBests = { ...bests };
  for (const [exerciseId, sets] of groupByExercise(exercises)) {
    const trackingType = trackingTypeOf(exerciseId);
    if (!trackingType) continue;
    const updated = { ...next[exerciseId] };
    for (const [type, best] of Object.entries(bestSets(sets, trackingType)) as [
      PersonalRecordType,
      BestSet,
    ][]) {
      updated[type] = Math.max(updated[type] ?? 0, best.value);
    }
    next[exerciseId] = updated;
  }
  return next;
}

export interface NewRecord {
  exerciseId: string;
  recordType: PersonalRecordType;
  value: number;
  previousValue: number;
  /** The set that did it. */
  set: SetValues;
}

/**
 * Records a workout beats, compared with the earlier bests. The first time with an exercise
 * (no earlier best) is a starting point, not a record. Ties are not records.
 */
export function findNewRecords(
  exercises: readonly ExerciseSets[],
  bests: RecordBests,
  trackingTypeOf: (exerciseId: string) => TrackingType | undefined,
): NewRecord[] {
  const records: NewRecord[] = [];
  for (const [exerciseId, sets] of groupByExercise(exercises)) {
    const trackingType = trackingTypeOf(exerciseId);
    if (!trackingType) continue;
    const best = bestSets(sets, trackingType);
    for (const type of recordTypesByTrackingType[trackingType]) {
      const candidate = best[type];
      const previous = bests[exerciseId]?.[type];
      const set = candidate ? sets[candidate.index] : undefined;
      if (!candidate || !set || previous === undefined || candidate.value <= previous) continue;
      records.push({
        exerciseId,
        recordType: type,
        value: candidate.value,
        previousValue: previous,
        set: {
          weightKg: set.weightKg,
          reps: set.reps,
          durationS: set.durationS,
          distanceM: set.distanceM,
          calories: set.calories,
        },
      });
    }
  }
  return records;
}
