import { emptySetValues } from '@app-fit/shared/workouts';
import { describe, expect, it } from 'vitest';

import type { PendingWorkout } from '../workouts/types';

import {
  bestsFromPersonalBests,
  mergeExerciseSessions,
  mergeTrainingLog,
  pendingToDetail,
  pendingToEntry,
  recentExerciseIds,
  topSet,
} from './logic';
import type { HistorySet, TrainingEntry } from './types';

const set = (
  id: string,
  weight_kg: number | null,
  reps: number,
  set_type: 'warmup' | 'normal' = 'normal',
) => ({
  id,
  position: 0,
  set_type,
  weight_kg,
  reps,
  duration_s: null,
  distance_m: null,
  calories: null,
  completed_at: '2026-11-04T10:10:00Z',
});

const pending = (id: string, startedAt: string): PendingWorkout => ({
  id,
  userId: 'ana',
  queuedAt: startedAt,
  attempts: 0,
  lastError: null,
  payload: {
    id,
    routine_id: null,
    title: 'Pierna',
    notes: 'Buen día',
    visibility: 'followers',
    started_at: startedAt,
    ended_at: '2026-11-04T11:00:00Z',
    exercises: [
      {
        id: `${id}-squat`,
        exercise_id: 'squat',
        position: 0,
        notes: '',
        sets: [set('s1', 60, 10, 'warmup'), set('s2', 100, 5), set('s3', 100, 5)],
      },
      {
        id: `${id}-pullup`,
        exercise_id: 'pullup',
        position: 1,
        notes: '',
        sets: [set('s4', null, 10)],
      },
    ],
  },
});

const serverEntry = (id: string, startedAt: string): TrainingEntry => ({
  id,
  title: 'Torso',
  startedAt,
  endedAt: startedAt,
  volumeKg: 1000,
  setCount: 4,
  exerciseCount: 2,
  recordCount: 1,
  pending: false,
});

describe('history', () => {
  it('sums up a workout still on the phone like the server does', () => {
    expect(pendingToEntry(pending('p1', '2026-11-04T10:00:00Z'))).toEqual({
      id: 'p1',
      title: 'Pierna',
      startedAt: '2026-11-04T10:00:00Z',
      endedAt: '2026-11-04T11:00:00Z',
      volumeKg: 1000,
      setCount: 3,
      exerciseCount: 2,
      recordCount: 0,
      pending: true,
    });
  });

  it('shows the phone and server workouts together, newest first, without repeats', () => {
    const log = mergeTrainingLog(
      [serverEntry('s1', '2026-11-03T10:00:00Z'), serverEntry('p2', '2026-11-02T10:00:00Z')],
      [pending('p1', '2026-11-04T10:00:00Z'), pending('p2', '2026-11-02T10:00:00Z')],
    );
    expect(log.map((entry) => [entry.id, entry.pending])).toEqual([
      ['p1', true],
      ['s1', false],
      ['p2', false],
    ]);
  });

  it('opens a workout still on the phone', () => {
    const detail = pendingToDetail(pending('p1', '2026-11-04T10:00:00Z'));
    expect(detail.pending).toBe(true);
    expect(detail.notes).toBe('Buen día');
    expect(detail.exercises.map((exercise) => exercise.sets.length)).toEqual([3, 1]);
    expect(detail.exercises[0]?.sets[0]).toEqual({
      ...emptySetValues,
      id: 's1',
      setType: 'warmup',
      weightKg: 60,
      reps: 10,
    });
  });
});

describe('records and sessions', () => {
  it('turns personal bests into the values to beat', () => {
    expect(
      bestsFromPersonalBests([
        {
          exerciseId: 'squat',
          recordType: 'max_weight',
          value: 100,
          achievedAt: '',
          workoutId: 'w',
          set: emptySetValues,
        },
        {
          exerciseId: 'squat',
          recordType: 'est_1rm',
          value: 116.67,
          achievedAt: '',
          workoutId: 'w',
          set: emptySetValues,
        },
      ]),
    ).toEqual({ squat: { max_weight: 100, est_1rm: 116.67 } });
  });

  it('adds the sessions still on the phone to an exercise', () => {
    const sessions = mergeExerciseSessions(
      [{ workoutId: 'p2', startedAt: '2026-11-02T10:00:00Z', sets: [] }],
      [
        pending('p1', '2026-11-04T10:00:00Z'),
        pending('p2', '2026-11-02T10:00:00Z'),
        pending('p3', '2026-11-05T10:00:00Z'),
      ],
      'pullup',
    );
    expect(sessions.map((session) => [session.workoutId, session.sets.length])).toEqual([
      ['p2', 0],
      ['p1', 1],
      ['p3', 1],
    ]);
  });

  it('picks the set that sums up a session', () => {
    const sets: HistorySet[] = [
      { ...emptySetValues, id: 'w', setType: 'warmup', weightKg: 120, reps: 1 },
      { ...emptySetValues, id: 'a', setType: 'normal', weightKg: 100, reps: 5 },
      { ...emptySetValues, id: 'b', setType: 'normal', weightKg: 105, reps: 3 },
    ];
    // Best estimated 1RM: 100 × 5 (116.67) beats 105 × 3 (115.5).
    expect(topSet(sets, 'weight_reps')?.id).toBe('a');
    expect(topSet(sets, 'calories_duration')?.id).toBe('a');
    expect(topSet([], 'weight_reps')).toBeUndefined();
  });
});

describe('recent exercises', () => {
  it('lists the latest exercises first, without repeats, up to the limit', () => {
    const server = [
      { id: 'w1', startedAt: '2026-11-01T10:00:00Z', exerciseIds: ['bench', 'row', 'curl'] },
      { id: 'w2', startedAt: '2026-11-03T10:00:00Z', exerciseIds: ['row', 'press'] },
    ];
    // Still on the phone, and newer than both: its squat and pull-up go first.
    expect(recentExerciseIds(server, [pending('p1', '2026-11-04T10:00:00Z')], 10)).toEqual([
      'squat',
      'pullup',
      'row',
      'press',
      'bench',
      'curl',
    ]);
    expect(recentExerciseIds(server, [], 3)).toEqual(['row', 'press', 'bench']);
  });

  it('counts a workout once while it is both queued and on the server', () => {
    const server = [{ id: 'p1', startedAt: '2026-11-04T10:00:00Z', exerciseIds: ['squat'] }];
    expect(recentExerciseIds(server, [pending('p1', '2026-11-04T10:00:00Z')], 10)).toEqual([
      'squat',
    ]);
  });
});
