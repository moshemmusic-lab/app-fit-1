import { describe, expect, it } from 'vitest';

import { adjustRestEnd, defaultRestSeconds, restRemainingS } from './rest';

const now = Date.parse('2026-11-03T12:00:00.000Z');

describe('defaultRestSeconds', () => {
  it('rests after strength sets and holds, not after cardio machines', () => {
    expect(defaultRestSeconds('weight_reps')).toBe(90);
    expect(defaultRestSeconds('bodyweight_reps')).toBe(90);
    expect(defaultRestSeconds('duration')).toBe(60);
    expect(defaultRestSeconds('distance_duration')).toBeNull();
  });
});

describe('restRemainingS', () => {
  it('rounds up and never goes below zero', () => {
    expect(restRemainingS('2026-11-03T12:01:30.000Z', now)).toBe(90);
    expect(restRemainingS('2026-11-03T12:00:00.400Z', now)).toBe(1);
    expect(restRemainingS('2026-11-03T11:59:00.000Z', now)).toBe(0);
  });
});

describe('adjustRestEnd', () => {
  it('adds or removes seconds', () => {
    expect(adjustRestEnd('2026-11-03T12:01:00.000Z', 15, now)).toBe('2026-11-03T12:01:15.000Z');
    expect(adjustRestEnd('2026-11-03T12:01:00.000Z', -15, now)).toBe('2026-11-03T12:00:45.000Z');
  });

  it('ends the rest when there is no time left', () => {
    expect(adjustRestEnd('2026-11-03T12:00:10.000Z', -15, now)).toBeNull();
  });
});
