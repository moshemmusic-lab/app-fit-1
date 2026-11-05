import { describe, expect, it } from 'vitest';

import { formatCompact, indexAt, nearestIndex, niceScale, valueToY } from './scale';

describe('chart scales', () => {
  it('rounds bar axes from zero', () => {
    expect(niceScale([0, 3450, 1200], { fromZero: true })).toEqual({
      min: 0,
      max: 4000,
      ticks: [0, 2000, 4000],
    });
    expect(niceScale([0, 0], { fromZero: true }).max).toBe(1);
  });

  it('lets line axes start near their lowest value', () => {
    expect(niceScale([80.2, 79.1, 81.4], { fromZero: false })).toEqual({
      min: 78,
      max: 82,
      ticks: [78, 80, 82],
    });
  });

  it('gives room to a single value', () => {
    const scale = niceScale([100], { fromZero: false });
    expect(scale.min).toBeLessThan(100);
    expect(scale.max).toBeGreaterThan(100);
  });

  it('places values and finds touches', () => {
    const scale = { min: 0, max: 100, ticks: [] };
    expect(valueToY(0, scale, 200)).toBe(200);
    expect(valueToY(100, scale, 200)).toBe(0);
    expect(valueToY(25, scale, 200)).toBe(150);
    expect(indexAt(0, 300, 12)).toBe(0);
    expect(indexAt(299, 300, 12)).toBe(11);
    expect(indexAt(400, 300, 12)).toBe(11);
    expect(nearestIndex(48, [0, 50, 100])).toBe(1);
    expect(nearestIndex(10, [])).toBe(-1);
  });

  it('shortens big numbers', () => {
    expect(formatCompact(950)).toBe('950');
    expect(formatCompact(2500)).toBe('2500');
    expect(formatCompact(12_500)).toBe('12,5 mil');
    expect(formatCompact(1_250_000)).toBe('1,3 M');
  });
});
