import { describe, expect, it } from 'vitest';

import {
  byName,
  duplicateRoutine,
  newRoutineExercise,
  routineToPlannedWorkout,
  targetPatch,
  targetValues,
  toRoutinePayload,
} from './routine-logic';
import type { Routine } from './types';

let counter = 0;
const newId = () => `id${++counter}`;

const routine: Routine = {
  id: 'r1',
  folderId: 'f1',
  name: '  Torso A ',
  notes: ' Subir peso cada semana ',
  exercises: [
    {
      id: 're1',
      exerciseId: 'bench',
      restSeconds: 120,
      notes: '',
      sets: [
        {
          id: 's1',
          setType: 'warmup',
          targetReps: 10,
          targetWeightKg: 40,
          targetDurationS: null,
          targetDistanceM: null,
        },
        {
          id: 's2',
          setType: 'normal',
          targetReps: 8,
          targetWeightKg: null,
          targetDurationS: null,
          targetDistanceM: null,
        },
      ],
    },
  ],
};

describe('newRoutineExercise', () => {
  it('gives strength exercises three sets and their default rest', () => {
    const exercise = newRoutineExercise('bench', 'weight_reps', newId);
    expect(exercise.sets).toHaveLength(3);
    expect(exercise.restSeconds).toBe(90);
  });

  it('gives cardio one set and no rest', () => {
    const exercise = newRoutineExercise('treadmill', 'distance_duration', newId);
    expect(exercise.sets).toHaveLength(1);
    expect(exercise.restSeconds).toBeNull();
  });
});

describe('targets', () => {
  it('turns targets into suggested set values', () => {
    expect(targetValues(routine.exercises[0]!.sets[1]!)).toMatchObject({
      reps: 8,
      weightKg: null,
    });
  });

  it('returns null when a set has no target', () => {
    expect(
      targetValues({
        id: 'x',
        setType: 'normal',
        targetReps: null,
        targetWeightKg: null,
        targetDurationS: null,
        targetDistanceM: null,
      }),
    ).toBeNull();
  });

  it('maps edited set values to target fields', () => {
    expect(targetPatch({ weightKg: 60 })).toEqual({ targetWeightKg: 60 });
    expect(targetPatch({ reps: null })).toEqual({ targetReps: null });
  });
});

describe('toRoutinePayload', () => {
  it('trims texts and numbers positions', () => {
    const payload = toRoutinePayload(routine);
    expect(payload.name).toBe('Torso A');
    expect(payload.notes).toBe('Subir peso cada semana');
    expect(payload.folder_id).toBe('f1');
    expect(payload.exercises[0]).toMatchObject({ position: 0, rest_seconds: 120 });
    expect(payload.exercises[0]?.sets.map((set) => [set.position, set.set_type])).toEqual([
      [0, 'warmup'],
      [1, 'normal'],
    ]);
  });
});

describe('duplicateRoutine', () => {
  it('creates new ids everywhere and keeps the content', () => {
    const copy = duplicateRoutine(routine, 'Torso A (copia)', newId);
    expect(copy.id).not.toBe(routine.id);
    expect(copy.exercises[0]?.id).not.toBe('re1');
    expect(copy.exercises[0]?.sets.map((set) => set.id)).not.toContain('s1');
    expect(copy.exercises[0]?.sets[0]?.targetWeightKg).toBe(40);
    expect(copy.name).toBe('Torso A (copia)');
  });
});

describe('byName', () => {
  it('sorts in Spanish order ignoring accents and case', () => {
    expect([{ name: 'pierna' }, { name: 'Ábdominales' }, { name: 'Brazos' }].sort(byName)).toEqual([
      { name: 'Ábdominales' },
      { name: 'Brazos' },
      { name: 'pierna' },
    ]);
  });
});

describe('routineToPlannedWorkout', () => {
  it('keeps set types, targets, rests and the routine link', () => {
    const plan = routineToPlannedWorkout(routine);
    expect(plan.routineId).toBe('r1');
    expect(plan.title).toBe('  Torso A ');
    expect(plan.exercises[0]?.restSeconds).toBe(120);
    expect(plan.exercises[0]?.sets.map((set) => set.setType)).toEqual(['warmup', 'normal']);
    expect(plan.exercises[0]?.sets[0]?.target).toMatchObject({ weightKg: 40, reps: 10 });
  });
});
