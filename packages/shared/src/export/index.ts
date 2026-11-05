import { z } from 'zod';

import { Constants, type Database } from '../database.types';

type SetType = Database['public']['Enums']['workout_set_type'];

/**
 * "Export my data": `export_my_data()` returns the whole file as JSON. The app saves it as is
 * and, for spreadsheets, turns its workouts into a CSV with one row per set.
 */

const nullableNumber = z.number().nullable();

/** The part of the export the CSV needs; the rest of the file is saved without changes. */
export const exportWorkoutsSchema = z.object({
  workouts: z.array(
    z.object({
      title: z.string(),
      started_at: z.string(),
      deleted_at: z.string().nullable(),
      exercises: z.array(
        z.object({
          exercise: z.string().nullable(),
          sets: z.array(
            z.object({
              set_type: z.enum(Constants.public.Enums.workout_set_type),
              weight_kg: nullableNumber,
              reps: nullableNumber,
              duration_s: nullableNumber,
              distance_m: nullableNumber,
              rpe: nullableNumber,
            }),
          ),
        }),
      ),
    }),
  ),
});

export type ExportWorkouts = z.infer<typeof exportWorkoutsSchema>;

/** The CSV columns, in order. Their names come from the translations. */
export const csvColumns = [
  'date',
  'workout',
  'exercise',
  'set',
  'setType',
  'weightKg',
  'reps',
  'durationS',
  'distanceM',
  'rpe',
] as const;

export type CsvColumn = (typeof csvColumns)[number];

export interface CsvLabels {
  columns: Record<CsvColumn, string>;
  setTypes: Record<SetType, string>;
}

type Cell = string | number | null;

/** One CSV field (RFC 4180): quoted when needed, and text that a spreadsheet would run as a formula is kept as text. */
function cell(value: Cell): string {
  if (value === null) return '';
  if (typeof value === 'number') return String(value);
  const text = /^[=+\-@]/.test(value) ? `'${value}` : value;
  return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

/**
 * Every set of every workout (deleted ones left out), oldest first, as CSV text. Weights stay
 * in kg, as stored. It starts with a byte-order mark so spreadsheets read the accents right.
 */
export function workoutSetsCsv(data: ExportWorkouts, labels: CsvLabels): string {
  const rows: Cell[][] = [csvColumns.map((column) => labels.columns[column])];

  const workouts = data.workouts
    .filter((workout) => workout.deleted_at === null)
    .sort((a, b) => a.started_at.localeCompare(b.started_at));

  for (const workout of workouts) {
    for (const exercise of workout.exercises) {
      exercise.sets.forEach((set, index) => {
        rows.push([
          workout.started_at,
          workout.title,
          exercise.exercise,
          index + 1,
          labels.setTypes[set.set_type],
          set.weight_kg,
          set.reps,
          set.duration_s,
          set.distance_m,
          set.rpe,
        ]);
      });
    }
  }

  return `\uFEFF${rows.map((row) => row.map(cell).join(',')).join('\r\n')}\r\n`;
}
