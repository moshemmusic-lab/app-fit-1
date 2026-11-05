import { describe, expect, it } from 'vitest';

import { csvColumns, exportWorkoutsSchema, workoutSetsCsv, type CsvLabels } from './index';

const labels: CsvLabels = {
  columns: Object.fromEntries(csvColumns.map((column) => [column, column])) as CsvLabels['columns'],
  setTypes: { warmup: 'Calentamiento', normal: 'Normal', drop: 'Drop set', failure: 'Al fallo' },
};

const set = (weight: number | null, reps: number | null, type = 'normal') => ({
  set_type: type,
  weight_kg: weight,
  reps,
  duration_s: null,
  distance_m: null,
  rpe: null,
});

function csv(workouts: unknown[]) {
  return workoutSetsCsv(exportWorkoutsSchema.parse({ workouts }), labels);
}

describe('workoutSetsCsv', () => {
  it('writes a header and one row per set, numbered per exercise', () => {
    const text = csv([
      {
        title: 'Torso',
        started_at: '2026-10-01T10:00:00+00:00',
        deleted_at: null,
        exercises: [
          {
            exercise: 'Press de banca con barra',
            sets: [set(40, 10, 'warmup'), set(62.5, 8)],
          },
        ],
      },
    ]);

    expect(text.startsWith('\uFEFF')).toBe(true);
    expect(text.slice(1).split('\r\n')).toEqual([
      'date,workout,exercise,set,setType,weightKg,reps,durationS,distanceM,rpe',
      '2026-10-01T10:00:00+00:00,Torso,Press de banca con barra,1,Calentamiento,40,10,,,',
      '2026-10-01T10:00:00+00:00,Torso,Press de banca con barra,2,Normal,62.5,8,,,',
      '',
    ]);
  });

  it('leaves out deleted workouts and puts the oldest first', () => {
    const workout = (title: string, day: string, deleted: string | null) => ({
      title,
      started_at: `2026-10-${day}T10:00:00+00:00`,
      deleted_at: deleted,
      exercises: [{ exercise: 'Sentadilla', sets: [set(100, 5)] }],
    });
    const rows = csv([
      workout('Segundo', '02', null),
      workout('Borrado', '03', '2026-10-04T00:00:00+00:00'),
      workout('Primero', '01', null),
    ])
      .split('\r\n')
      .slice(1, -1);

    expect(rows.map((row) => row.split(',')[1])).toEqual(['Primero', 'Segundo']);
  });

  it('quotes commas, quotes and line breaks, and keeps formulas as text', () => {
    const rows = csv([
      {
        title: 'Pierna, "dura"',
        started_at: '2026-10-01T10:00:00+00:00',
        deleted_at: null,
        exercises: [{ exercise: '=HYPERLINK("x")', sets: [set(null, 12)] }],
      },
    ]).split('\r\n');

    expect(rows[1]).toBe(
      '2026-10-01T10:00:00+00:00,"Pierna, ""dura""","\'=HYPERLINK(""x"")",1,Normal,,12,,,',
    );
  });

  it('writes only the header when there are no workouts', () => {
    expect(csv([]).slice(1).split('\r\n')).toHaveLength(2);
  });
});
