import { describe, expect, it } from 'vitest';

import {
  canCompleteSet,
  emptySetValues,
  fillFromPrevious,
  formatDecimal,
  formatDuration,
  fromKg,
  parseDecimal,
  parseDuration,
  partOfDay,
  toKg,
  workoutVolumeKg,
} from './index';

describe('weights', () => {
  it('converts pounds to kilograms and back without drift', () => {
    expect(toKg(100, 'kg')).toBe(100);
    expect(toKg(225, 'lb')).toBeCloseTo(102.058, 3);
    expect(formatDecimal(fromKg(toKg(225, 'lb'), 'lb'), 1)).toBe('225');
  });

  it('parses decimal comma and dot', () => {
    expect(parseDecimal('102,5')).toBe(102.5);
    expect(parseDecimal('102.5')).toBe(102.5);
    expect(parseDecimal('80')).toBe(80);
    expect(parseDecimal('')).toBeNull();
    expect(parseDecimal('abc')).toBeNull();
    expect(parseDecimal('1,2,3')).toBeNull();
  });

  it('formats with a decimal comma and no trailing zeros', () => {
    expect(formatDecimal(102.5)).toBe('102,5');
    expect(formatDecimal(100)).toBe('100');
    expect(formatDecimal(2.456)).toBe('2,46');
  });
});

describe('durations', () => {
  it('parses minutes:seconds, plain seconds and hours', () => {
    expect(parseDuration('1:30')).toBe(90);
    expect(parseDuration('90')).toBe(90);
    expect(parseDuration('1:02:03')).toBe(3723);
    expect(parseDuration('')).toBeNull();
    expect(parseDuration('1:a')).toBeNull();
  });

  it('formats as m:ss or h:mm:ss', () => {
    expect(formatDuration(90)).toBe('1:30');
    expect(formatDuration(5)).toBe('0:05');
    expect(formatDuration(3723)).toBe('1:02:03');
  });
});

describe('sets', () => {
  const previous = { ...emptySetValues, weightKg: 80, reps: 8 };

  it('fills empty fields with last time values', () => {
    expect(fillFromPrevious(emptySetValues, previous, 'weight_reps')).toMatchObject({
      weightKg: 80,
      reps: 8,
    });
    expect(
      fillFromPrevious({ ...emptySetValues, weightKg: 85 }, previous, 'weight_reps'),
    ).toMatchObject({ weightKg: 85, reps: 8 });
  });

  it('only completes sets with the required values', () => {
    expect(canCompleteSet({ ...emptySetValues, weightKg: 80, reps: 8 }, 'weight_reps')).toBe(true);
    expect(canCompleteSet({ ...emptySetValues, weightKg: 0, reps: 8 }, 'weight_reps')).toBe(true);
    expect(canCompleteSet({ ...emptySetValues, reps: 8 }, 'weight_reps')).toBe(false);
    expect(canCompleteSet({ ...emptySetValues, reps: 0, weightKg: 80 }, 'weight_reps')).toBe(false);
    expect(canCompleteSet({ ...emptySetValues, reps: 10 }, 'bodyweight_reps')).toBe(true);
    expect(canCompleteSet({ ...emptySetValues, durationS: 60 }, 'duration')).toBe(true);
    expect(canCompleteSet({ ...emptySetValues, durationS: 600 }, 'distance_duration')).toBe(false);
  });

  it('adds up weight × reps as volume', () => {
    expect(
      workoutVolumeKg([
        {
          sets: [
            { ...emptySetValues, weightKg: 100, reps: 5 },
            { ...emptySetValues, weightKg: 100, reps: 5 },
          ],
        },
        { sets: [{ ...emptySetValues, reps: 10 }] },
      ]),
    ).toBe(1000);
  });
});

describe('partOfDay', () => {
  it('splits the day for default titles', () => {
    expect(partOfDay(new Date(2026, 10, 3, 9))).toBe('morning');
    expect(partOfDay(new Date(2026, 10, 3, 18))).toBe('afternoon');
    expect(partOfDay(new Date(2026, 10, 3, 23))).toBe('evening');
    expect(partOfDay(new Date(2026, 10, 3, 2))).toBe('evening');
  });
});
