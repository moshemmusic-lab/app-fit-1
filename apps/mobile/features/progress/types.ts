import type { PersonalRecordType, RecordSet } from '@app-fit/shared/progress';
import type { SetValues } from '@app-fit/shared/workouts';

/** A finished workout in the history, with the same totals as the summary. */
export interface TrainingEntry {
  id: string;
  title: string;
  startedAt: string;
  endedAt: string;
  volumeKg: number;
  setCount: number;
  exerciseCount: number;
  /** New records (not counting first times). */
  recordCount: number;
  /** Finished on this phone and not uploaded yet. */
  pending: boolean;
}

export interface HistorySet extends RecordSet {
  id: string;
}

export interface HistoryExercise {
  id: string;
  exerciseId: string;
  notes: string;
  sets: HistorySet[];
}

/** A record a set of the workout beat. */
export interface SetRecord {
  setId: string;
  recordType: PersonalRecordType;
}

export interface WorkoutDetail {
  id: string;
  title: string;
  notes: string;
  startedAt: string;
  endedAt: string;
  pending: boolean;
  exercises: HistoryExercise[];
  records: SetRecord[];
}

/** The user's current best for an exercise and kind of record, with the set that did it. */
export interface PersonalBest {
  exerciseId: string;
  recordType: PersonalRecordType;
  value: number;
  achievedAt: string;
  workoutId: string;
  set: SetValues;
}

export interface BodyWeightEntry {
  id: string;
  /** "2026-11-04" */
  day: string;
  weightKg: number;
}
