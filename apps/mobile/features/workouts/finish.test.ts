import { emptySetValues } from '@app-fit/shared/workouts';
import { describe, expect, it } from 'vitest';

import { finishWorkout, hasIncompleteSets, newDraftSets } from './finish';
import type { ActiveWorkout } from './types';

const workout: ActiveWorkout = {
  id: 'w1',
  userId: 'u1',
  title: 'Entreno de tarde',
  notes: '',
  visibility: 'followers',
  startedAt: '2026-11-03T17:00:00.000Z',
  exercises: [
    {
      id: 'we1',
      exerciseId: 'squat',
      notes: '',
      sets: [
        {
          ...emptySetValues,
          id: 's1',
          setType: 'normal',
          weightKg: 100,
          reps: 5,
          completedAt: '2026-11-03T17:10:00.000Z',
        },
        {
          ...emptySetValues,
          id: 's2',
          setType: 'normal',
          weightKg: 100,
          reps: 5,
          completedAt: null,
        },
        {
          ...emptySetValues,
          id: 's3',
          setType: 'normal',
          weightKg: 100,
          reps: 4,
          completedAt: '2026-11-03T17:20:00.000Z',
        },
      ],
    },
    {
      id: 'we2',
      exerciseId: 'plank',
      notes: '',
      sets: [{ ...emptySetValues, id: 's4', setType: 'normal', durationS: 60, completedAt: null }],
    },
  ],
};

describe('finishWorkout', () => {
  const finished = finishWorkout(workout, new Date('2026-11-03T18:00:00.000Z'));

  it('keeps only completed sets and exercises that have some', () => {
    expect(finished.payload.exercises).toHaveLength(1);
    expect(finished.payload.exercises[0]?.sets.map((set) => set.id)).toEqual(['s1', 's3']);
  });

  it('renumbers positions from 0', () => {
    expect(finished.payload.exercises[0]?.position).toBe(0);
    expect(finished.payload.exercises[0]?.sets.map((set) => set.position)).toEqual([0, 1]);
  });

  it('summarises duration, volume and sets', () => {
    expect(finished.summary).toEqual({
      workoutId: 'w1',
      durationS: 3600,
      volumeKg: 900,
      setCount: 2,
      exerciseCount: 1,
    });
  });

  it('remembers the completed sets as last time values', () => {
    expect(finished.lastSets).toEqual({
      squat: [
        { ...emptySetValues, weightKg: 100, reps: 5 },
        { ...emptySetValues, weightKg: 100, reps: 4 },
      ],
    });
  });

  it('never ends before it started, even if the phone clock changed', () => {
    const early = finishWorkout(workout, new Date('2026-11-03T16:00:00.000Z'));
    expect(early.payload.ended_at).toBe(workout.startedAt);
    expect(early.summary.durationS).toBe(0);
  });
});

describe('newDraftSets', () => {
  let counter = 0;
  const newId = () => `id${++counter}`;

  it('creates as many sets as last time', () => {
    expect(newDraftSets([emptySetValues, emptySetValues, emptySetValues], newId)).toHaveLength(3);
  });

  it('creates one set for a new exercise', () => {
    const sets = newDraftSets(undefined, newId);
    expect(sets).toHaveLength(1);
    expect(sets[0]).toMatchObject({ setType: 'normal', completedAt: null, weightKg: null });
  });
});

describe('hasIncompleteSets', () => {
  it('detects sets that were not marked done', () => {
    expect(hasIncompleteSets(workout)).toBe(true);
  });
});
