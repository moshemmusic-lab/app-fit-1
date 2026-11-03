import type { SetValues } from '@app-fit/shared/workouts';
import * as Crypto from 'expo-crypto';
import { create } from 'zustand';

import type { PickedExercise } from '@/features/workouts/workout-store';
import type { WorkoutSetType } from '@/features/workouts/types';

import { emptyRoutineSet, newRoutineExercise, targetPatch } from './routine-logic';
import type { Routine, RoutineExercise } from './types';

interface RoutineDraftState {
  /** The routine being created or edited (only while the editor is open). */
  draft: Routine | null;
  /** True once something changed, to ask before leaving without saving. */
  dirty: boolean;

  begin: (routine: Routine) => void;
  clear: () => void;
  update: (patch: Partial<Pick<Routine, 'name' | 'notes' | 'folderId'>>) => void;
  addExercises: (exercises: readonly PickedExercise[]) => void;
  replaceExercise: (exerciseRowId: string, exercise: PickedExercise) => void;
  moveExercise: (exerciseRowId: string, direction: -1 | 1) => void;
  removeExercise: (exerciseRowId: string) => void;
  setRestSeconds: (exerciseRowId: string, seconds: number | null) => void;
  setExerciseNotes: (exerciseRowId: string, notes: string) => void;
  addSet: (exerciseRowId: string) => void;
  removeSet: (exerciseRowId: string, setId: string) => void;
  setSetType: (exerciseRowId: string, setId: string, setType: WorkoutSetType) => void;
  updateSet: (exerciseRowId: string, setId: string, patch: Partial<SetValues>) => void;
}

function withExercise(
  draft: Routine | null,
  exerciseRowId: string,
  update: (exercise: RoutineExercise) => RoutineExercise,
): Routine | null {
  if (!draft) return draft;
  return {
    ...draft,
    exercises: draft.exercises.map((exercise) =>
      exercise.id === exerciseRowId ? update(exercise) : exercise,
    ),
  };
}

/**
 * Editor state, in memory only: shared with the exercise picker while the editor is open.
 * Routines are saved to the server (they are not workouts, so nothing is lost if the app closes).
 */
export const useRoutineDraftStore = create<RoutineDraftState>()((set) => {
  const edit = (change: (state: RoutineDraftState) => Routine | null) =>
    set((state) => ({ draft: change(state), dirty: true }));

  return {
    draft: null,
    dirty: false,

    begin: (routine) => set({ draft: routine, dirty: false }),
    clear: () => set({ draft: null, dirty: false }),

    update: (patch) => edit(({ draft }) => (draft ? { ...draft, ...patch } : draft)),

    addExercises: (exercises) =>
      edit(({ draft }) =>
        draft
          ? {
              ...draft,
              exercises: [
                ...draft.exercises,
                ...exercises.map(({ exerciseId, trackingType }) =>
                  newRoutineExercise(exerciseId, trackingType, Crypto.randomUUID),
                ),
              ],
            }
          : draft,
      ),

    replaceExercise: (exerciseRowId, { exerciseId, trackingType }) =>
      edit(({ draft }) =>
        withExercise(draft, exerciseRowId, (exercise) => ({
          ...newRoutineExercise(exerciseId, trackingType, Crypto.randomUUID),
          id: exercise.id,
        })),
      ),

    moveExercise: (exerciseRowId, direction) =>
      edit(({ draft }) => {
        if (!draft) return draft;
        const exercises = [...draft.exercises];
        const from = exercises.findIndex((exercise) => exercise.id === exerciseRowId);
        const to = from + direction;
        const moved = exercises[from];
        if (from < 0 || to < 0 || to >= exercises.length || !moved) return draft;
        exercises.splice(from, 1);
        exercises.splice(to, 0, moved);
        return { ...draft, exercises };
      }),

    removeExercise: (exerciseRowId) =>
      edit(({ draft }) =>
        draft
          ? {
              ...draft,
              exercises: draft.exercises.filter((exercise) => exercise.id !== exerciseRowId),
            }
          : draft,
      ),

    setRestSeconds: (exerciseRowId, seconds) =>
      edit(({ draft }) =>
        withExercise(draft, exerciseRowId, (exercise) => ({ ...exercise, restSeconds: seconds })),
      ),

    setExerciseNotes: (exerciseRowId, notes) =>
      edit(({ draft }) =>
        withExercise(draft, exerciseRowId, (exercise) => ({ ...exercise, notes })),
      ),

    // A new set copies the targets of the last one: routines usually repeat the same target.
    addSet: (exerciseRowId) =>
      edit(({ draft }) =>
        withExercise(draft, exerciseRowId, (exercise) => {
          const last = exercise.sets[exercise.sets.length - 1];
          const added = last
            ? { ...last, id: Crypto.randomUUID(), setType: 'normal' as const }
            : emptyRoutineSet(Crypto.randomUUID());
          return { ...exercise, sets: [...exercise.sets, added] };
        }),
      ),

    removeSet: (exerciseRowId, setId) =>
      edit(({ draft }) =>
        withExercise(draft, exerciseRowId, (exercise) => ({
          ...exercise,
          sets: exercise.sets.filter((routineSet) => routineSet.id !== setId),
        })),
      ),

    setSetType: (exerciseRowId, setId, setType) =>
      edit(({ draft }) =>
        withExercise(draft, exerciseRowId, (exercise) => ({
          ...exercise,
          sets: exercise.sets.map((routineSet) =>
            routineSet.id === setId ? { ...routineSet, setType } : routineSet,
          ),
        })),
      ),

    updateSet: (exerciseRowId, setId, patch) =>
      edit(({ draft }) =>
        withExercise(draft, exerciseRowId, (exercise) => ({
          ...exercise,
          sets: exercise.sets.map((routineSet) =>
            routineSet.id === setId ? { ...routineSet, ...targetPatch(patch) } : routineSet,
          ),
        })),
      ),
  };
});
