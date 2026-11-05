import { describe, expect, it } from 'vitest';

import { cardExercises, pickHighlight, type RecordHighlight } from './card';

describe('cardExercises', () => {
  it('shows the first exercises with sets and counts the rest', () => {
    const exercises = [
      { name: 'Banca', setCount: 3 },
      { name: 'Vacío', setCount: 0 },
      { name: 'Remo', setCount: 3 },
      { name: 'Press', setCount: 2 },
    ];
    expect(cardExercises(exercises, 2)).toEqual({
      shown: [
        { name: 'Banca', setCount: 3 },
        { name: 'Remo', setCount: 3 },
      ],
      more: 1,
    });
    expect(cardExercises([], 5)).toEqual({ shown: [], more: 0 });
  });
});

describe('pickHighlight', () => {
  const record = (
    recordType: RecordHighlight['recordType'],
    value: number,
    previousValue: number | null,
  ): RecordHighlight => ({ exerciseId: 'x', recordType, value, previousValue });

  it('picks the biggest improvement', () => {
    expect(
      pickHighlight([record('max_volume', 600, 500), record('est_1rm', 88.7, 80)])?.recordType,
    ).toBe('max_volume');
  });

  it('on a tie, prefers the best-known kind of record', () => {
    expect(
      pickHighlight([record('max_volume', 110, 100), record('est_1rm', 110, 100)])?.recordType,
    ).toBe('est_1rm');
  });

  it('works without earlier values and with nothing to pick', () => {
    expect(pickHighlight([record('max_weight', 70, null)])?.value).toBe(70);
    expect(pickHighlight([])).toBeUndefined();
  });
});
