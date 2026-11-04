import { describe, expect, it } from 'vitest';

import { emptySetValues } from '../workouts/sets';

import {
  addDays,
  bestSets,
  dayKey,
  estimateOneRepMaxKg,
  findNewRecords,
  isValidBodyWeightKg,
  monthWeeks,
  parseDayKey,
  progressSeries,
  sessionMetric,
  startOfWeek,
  trainedDays,
  weeklyTotals,
  weekStreak,
  withWorkoutBests,
  type RecordSet,
} from './index';

const strength = (
  weightKg: number | null,
  reps: number,
  setType: RecordSet['setType'] = 'normal',
) => ({ ...emptySetValues, weightKg, reps, setType }) satisfies RecordSet;

const hold = (durationS: number) =>
  ({ ...emptySetValues, durationS, setType: 'normal' }) satisfies RecordSet;

const trackingTypes = {
  bench: 'weight_reps',
  pullUp: 'bodyweight_reps',
  plank: 'duration',
} as const;
const trackingTypeOf = (id: string) => trackingTypes[id as keyof typeof trackingTypes];

describe('estimated one-rep max', () => {
  // Same values as supabase/tests/database/progress.test.sql.
  it('uses Epley, rounded to 2 decimals, like the database', () => {
    expect(estimateOneRepMaxKg(100, 5)).toBe(116.67);
    expect(estimateOneRepMaxKg(105, 5)).toBe(122.5);
    expect(estimateOneRepMaxKg(90, 8)).toBe(114);
  });

  it('is the weight itself for a single', () => {
    expect(estimateOneRepMaxKg(140, 1)).toBe(140);
  });

  it('is not estimated above 12 reps or without weight', () => {
    expect(estimateOneRepMaxKg(70, 13)).toBeNull();
    expect(estimateOneRepMaxKg(70, 12)).toBe(98);
    expect(estimateOneRepMaxKg(0, 5)).toBeNull();
    expect(estimateOneRepMaxKg(null, 5)).toBeNull();
    expect(estimateOneRepMaxKg(50, 0)).toBeNull();
  });
});

describe('personal records', () => {
  it('takes the best working set of each kind, the first one on ties', () => {
    const sets = [strength(120, 1, 'warmup'), strength(105, 5), strength(105, 5), strength(90, 8)];
    expect(bestSets(sets, 'weight_reps')).toEqual({
      est_1rm: { value: 122.5, index: 1 },
      max_weight: { value: 105, index: 1 },
      max_volume: { value: 720, index: 3 },
    });
  });

  it('records reps and extra load for bodyweight exercises, and time for holds', () => {
    expect(bestSets([strength(null, 12), strength(10, 6)], 'bodyweight_reps')).toEqual({
      max_reps: { value: 12, index: 0 },
      max_weight: { value: 10, index: 1 },
    });
    expect(bestSets([hold(60), hold(90)], 'duration')).toEqual({
      max_duration: { value: 90, index: 1 },
    });
    expect(bestSets([strength(null, 10)], 'calories_duration')).toEqual({});
  });

  it('finds the records a workout beats, with the previous best and the set', () => {
    const records = findNewRecords(
      [{ exerciseId: 'bench', sets: [strength(105, 5), strength(105, 5)] }],
      { bench: { est_1rm: 116.67, max_weight: 100, max_volume: 720 } },
      trackingTypeOf,
    );
    expect(records).toEqual([
      {
        exerciseId: 'bench',
        recordType: 'est_1rm',
        value: 122.5,
        previousValue: 116.67,
        set: { ...emptySetValues, weightKg: 105, reps: 5 },
      },
      {
        exerciseId: 'bench',
        recordType: 'max_weight',
        value: 105,
        previousValue: 100,
        set: { ...emptySetValues, weightKg: 105, reps: 5 },
      },
    ]);
  });

  it('does not celebrate the first time, ties or warm-ups', () => {
    expect(
      findNewRecords([{ exerciseId: 'bench', sets: [strength(100, 5)] }], {}, trackingTypeOf),
    ).toEqual([]);
    expect(
      findNewRecords(
        [{ exerciseId: 'bench', sets: [strength(105, 5), strength(110, 1, 'warmup')] }],
        { bench: { est_1rm: 122.5, max_weight: 105, max_volume: 525 } },
        trackingTypeOf,
      ),
    ).toEqual([]);
  });

  it('joins the sets of an exercise that appears twice in a workout', () => {
    const records = findNewRecords(
      [
        { exerciseId: 'plank', sets: [hold(50)] },
        { exerciseId: 'plank', sets: [hold(70)] },
      ],
      { plank: { max_duration: 60 } },
      trackingTypeOf,
    );
    expect(records.map((record) => [record.value, record.previousValue])).toEqual([[70, 60]]);
  });

  it('adds a workout not uploaded yet to the bests', () => {
    const bests = withWorkoutBests(
      { bench: { max_weight: 100 } },
      [
        { exerciseId: 'bench', sets: [strength(95, 10)] },
        { exerciseId: 'plank', sets: [hold(45)] },
      ],
      trackingTypeOf,
    );
    expect(bests).toEqual({
      bench: { max_weight: 100, est_1rm: 126.67, max_volume: 950 },
      plank: { max_duration: 45 },
    });
  });

  it('ignores exercises it does not know', () => {
    expect(
      findNewRecords([{ exerciseId: 'unknown', sets: [hold(99)] }], {}, trackingTypeOf),
    ).toEqual([]);
  });
});

describe('weeks and calendar', () => {
  it('starts weeks on Monday', () => {
    // Wednesday 4 November 2026 → Monday 2 November.
    expect(dayKey(startOfWeek(new Date(2026, 10, 4, 18, 30)))).toBe('2026-11-02');
    // Sunday 8 November belongs to the same week.
    expect(dayKey(startOfWeek(new Date(2026, 10, 8, 23, 30)))).toBe('2026-11-02');
    expect(dayKey(startOfWeek(new Date(2026, 10, 9, 0, 5)))).toBe('2026-11-09');
  });

  it('adds days across the change of time', () => {
    expect(dayKey(addDays(new Date(2026, 9, 24), 1))).toBe('2026-10-25');
    expect(dayKey(addDays(new Date(2026, 9, 25), 1))).toBe('2026-10-26');
    expect(dayKey(parseDayKey('2026-03-29'))).toBe('2026-03-29');
  });

  it('adds up the last weeks, oldest first', () => {
    const at = (day: number, hour: number) => new Date(2026, 10, day, hour).toISOString();
    const totals = weeklyTotals(
      [
        { startedAt: at(3, 10), endedAt: at(3, 11), volumeKg: 1000 },
        { startedAt: at(5, 18), endedAt: at(5, 19), volumeKg: 500 },
        { startedAt: at(1, 10), endedAt: at(1, 10), volumeKg: 200 },
        // Too old for 3 weeks: left out.
        { startedAt: at(1, 10).replace('2026-11', '2026-09'), endedAt: at(1, 10), volumeKg: 9 },
      ],
      3,
      new Date(2026, 10, 6),
    );
    expect(totals.map((week) => [dayKey(week.weekStart), week.workouts, week.volumeKg])).toEqual([
      ['2026-10-19', 0, 0],
      ['2026-10-26', 1, 200],
      ['2026-11-02', 2, 1500],
    ]);
    expect(totals[2]?.durationS).toBe(7200);
  });

  it('counts the weeks in a row, without breaking it during the current week', () => {
    const at = (month: number, day: number) => new Date(2026, month, day, 10).toISOString();
    const workouts = [at(9, 20), at(9, 28), at(9, 29), at(10, 3)];
    // Weeks of 19 Oct, 26 Oct and 2 Nov.
    expect(weekStreak(workouts, new Date(2026, 10, 6))).toBe(3);
    // The week of 9 Nov has no workout yet: the streak still stands.
    expect(weekStreak(workouts, new Date(2026, 10, 10))).toBe(3);
    // The week of 9 Nov ended without a workout: the streak is broken.
    expect(weekStreak(workouts, new Date(2026, 10, 17))).toBe(0);
    expect(weekStreak([], new Date(2026, 10, 17))).toBe(0);
  });

  it('marks the days with a workout', () => {
    const days = trainedDays([new Date(2026, 10, 4, 23, 30).toISOString()]);
    expect(days.has('2026-11-04')).toBe(true);
    expect(days.size).toBe(1);
  });

  it('lays out a month in weeks starting on Monday', () => {
    // November 2026 starts on a Sunday and ends on a Monday.
    const weeks = monthWeeks(2026, 10);
    expect(weeks).toHaveLength(6);
    expect(weeks[0]?.map((day) => day?.getDate() ?? null)).toEqual([
      null,
      null,
      null,
      null,
      null,
      null,
      1,
    ]);
    expect(weeks[5]?.map((day) => day?.getDate() ?? null)).toEqual([
      30,
      null,
      null,
      null,
      null,
      null,
      null,
    ]);
    // February 2027 starts on a Monday and ends on a Sunday: exactly 4 weeks.
    expect(monthWeeks(2027, 1)).toHaveLength(4);
  });
});

describe('exercise progress', () => {
  const sessions = [
    {
      workoutId: 'b',
      startedAt: '2026-10-02T10:00:00Z',
      sets: [strength(105, 5), strength(105, 5)],
    },
    {
      workoutId: 'a',
      startedAt: '2026-10-01T10:00:00Z',
      sets: [strength(120, 1, 'warmup'), strength(100, 5), strength(90, 8)],
    },
  ];

  it('gives one point per workout, oldest first, without warm-ups', () => {
    expect(
      progressSeries(sessions, 'est_1rm').map((point) => [point.workoutId, point.value]),
    ).toEqual([
      ['a', 116.67],
      ['b', 122.5],
    ]);
    expect(progressSeries(sessions, 'session_volume').map((point) => point.value)).toEqual([
      1220, 1050,
    ]);
    expect(progressSeries(sessions, 'max_weight').map((point) => point.value)).toEqual([100, 105]);
  });

  it('leaves out workouts with nothing to show', () => {
    expect(progressSeries(sessions, 'max_duration')).toEqual([]);
    expect(sessionMetric([hold(30), hold(45)], 'session_duration')).toBe(75);
    expect(sessionMetric([strength(null, 8), strength(null, 6)], 'session_reps')).toBe(14);
  });
});

describe('body weight', () => {
  it('accepts the same range as the database', () => {
    expect(isValidBodyWeightKg(20)).toBe(true);
    expect(isValidBodyWeightKg(500)).toBe(true);
    expect(isValidBodyWeightKg(19.9)).toBe(false);
    expect(isValidBodyWeightKg(500.1)).toBe(false);
  });
});
