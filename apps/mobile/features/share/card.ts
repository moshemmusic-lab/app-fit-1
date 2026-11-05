import type { PersonalRecordType } from '@app-fit/shared/progress';

/** One exercise as the image lists it: its name and its working sets. */
export interface CardExercise {
  name: string;
  setCount: number;
}

/** A record the workout beat, ready to be the big number of the image. */
export interface RecordHighlight {
  exerciseId: string;
  recordType: PersonalRecordType;
  value: number;
  /** Null when the earlier best is unknown. */
  previousValue: number | null;
}

/** The exercises shown on the image, and how many more there were. */
export function cardExercises(
  exercises: readonly CardExercise[],
  max = 5,
): { shown: CardExercise[]; more: number } {
  const done = exercises.filter((exercise) => exercise.setCount > 0);
  return { shown: done.slice(0, max), more: Math.max(done.length - max, 0) };
}

// When two records improve as much, the one people know best goes first.
const recordOrder: readonly PersonalRecordType[] = [
  'est_1rm',
  'max_weight',
  'max_reps',
  'max_duration',
  'max_distance',
  'max_volume',
];

const improvement = (record: RecordHighlight) =>
  record.previousValue && record.previousValue > 0 ? record.value / record.previousValue : 1;

/** The record to put on the image: the biggest improvement, then the best-known kind. */
export function pickHighlight(records: readonly RecordHighlight[]): RecordHighlight | undefined {
  return [...records].sort(
    (a, b) =>
      improvement(b) - improvement(a) ||
      recordOrder.indexOf(a.recordType) - recordOrder.indexOf(b.recordType),
  )[0];
}
