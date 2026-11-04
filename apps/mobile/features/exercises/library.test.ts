import { describe, expect, it } from 'vitest';

import { pickTranslation, toLibraryExercises, type ExerciseRow } from './library';

const spain = { locale: 'es-ES', name: 'Press de banca', aliases: [], instructions: ['Empuja.'] };
const mexico = { locale: 'es-MX', name: 'Press de pecho', aliases: [], instructions: ['Empuja.'] };
const english = { locale: 'en-GB', name: 'Bench press', aliases: [], instructions: ['Push.'] };

function row(
  id: string,
  translations: ExerciseRow['exercise_translations'],
  custom: Partial<Pick<ExerciseRow, 'owner_id' | 'deleted_at'>> = {},
): ExerciseRow {
  return {
    id,
    owner_id: custom.owner_id ?? null,
    deleted_at: custom.deleted_at ?? null,
    tracking_type: 'weight_reps',
    primary_muscle: 'chest',
    secondary_muscles: ['triceps'],
    equipment: 'barbell',
    exercise_translations: translations,
  };
}

describe('pickTranslation', () => {
  it('prefers the user locale', () => {
    expect(pickTranslation([spain, mexico], 'es-MX')?.name).toBe('Press de pecho');
  });

  it('falls back to Spanish (Spain)', () => {
    expect(pickTranslation([english, spain], 'es-MX')?.name).toBe('Press de banca');
  });

  it('returns null when there is nothing usable', () => {
    expect(pickTranslation([english], 'es-ES')).toBeNull();
  });
});

describe('toLibraryExercises', () => {
  it('maps rows to camelCase exercises with their translation', () => {
    expect(toLibraryExercises([row('1', [spain])], 'es-ES')).toEqual([
      {
        id: '1',
        trackingType: 'weight_reps',
        primaryMuscle: 'chest',
        secondaryMuscles: ['triceps'],
        equipment: 'barbell',
        name: 'Press de banca',
        aliases: [],
        instructions: ['Empuja.'],
        isCustom: false,
        deleted: false,
      },
    ]);
  });

  it('leaves out exercises without a usable translation', () => {
    expect(toLibraryExercises([row('1', [english]), row('2', [spain])], 'es-ES')).toHaveLength(1);
  });

  it('always names a custom exercise, whatever language it was created in', () => {
    const [custom] = toLibraryExercises([row('1', [english], { owner_id: 'u1' })], 'es-ES');
    expect(custom).toMatchObject({ name: 'Bench press', isCustom: true, deleted: false });
  });

  it('marks deleted custom exercises', () => {
    const [custom] = toLibraryExercises(
      [row('1', [spain], { owner_id: 'u1', deleted_at: '2026-11-04T10:00:00Z' })],
      'es-ES',
    );
    expect(custom?.deleted).toBe(true);
  });
});
