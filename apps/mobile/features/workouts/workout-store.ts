// Installs `localStorage` backed by SQLite: every change below is written to the phone at once,
// so a workout survives the app closing, a crash or a dead battery (CLAUDE.md, data rule 7).
import 'expo-sqlite/localStorage/install';

import type { WorkoutVisibility } from '@app-fit/shared/schemas';
import type { SetValues } from '@app-fit/shared/workouts';
import * as Crypto from 'expo-crypto';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { useShallow } from 'zustand/react/shallow';

import { finishWorkout, newDraftSets } from './finish';
import type {
  ActiveWorkout,
  DraftExercise,
  LastSetsByExercise,
  PendingWorkout,
  WorkoutSummary,
} from './types';

interface WorkoutState {
  /** The workout in progress (at most one per phone). */
  active: ActiveWorkout | null;
  /** Finished workouts not yet confirmed by the server. */
  pending: PendingWorkout[];
  /** Per user, the last completed sets of each exercise. */
  lastSetsByUser: Record<string, LastSetsByExercise>;
  /** Summary of the last finished workout, for the summary screen. */
  lastSummary: WorkoutSummary | null;

  start: (input: { userId: string; title: string; visibility: WorkoutVisibility }) => void;
  addExercises: (exerciseIds: readonly string[]) => void;
  removeExercise: (exerciseRowId: string) => void;
  addSet: (exerciseRowId: string) => void;
  removeSet: (exerciseRowId: string, setId: string) => void;
  updateSet: (exerciseRowId: string, setId: string, patch: Partial<SetValues>) => void;
  completeSet: (exerciseRowId: string, setId: string, values: SetValues) => void;
  uncompleteSet: (exerciseRowId: string, setId: string) => void;
  discard: () => void;
  /** Moves the workout to the upload queue. Returns its summary. */
  finish: (endedAt: Date) => WorkoutSummary | null;
  markUploaded: (workoutId: string) => void;
  markFailed: (workoutId: string, message: string) => void;
  /** Forgets everything of a user on this phone (after deleting the account). */
  clearUser: (userId: string) => void;
}

function updateExercise(
  active: ActiveWorkout | null,
  exerciseRowId: string,
  update: (exercise: DraftExercise) => DraftExercise,
): ActiveWorkout | null {
  if (!active) return active;
  return {
    ...active,
    exercises: active.exercises.map((exercise) =>
      exercise.id === exerciseRowId ? update(exercise) : exercise,
    ),
  };
}

export const useWorkoutStore = create<WorkoutState>()(
  persist(
    (set, get) => ({
      active: null,
      pending: [],
      lastSetsByUser: {},
      lastSummary: null,

      start: ({ userId, title, visibility }) => {
        if (get().active) return;
        set({
          active: {
            id: Crypto.randomUUID(),
            userId,
            title,
            notes: '',
            visibility,
            startedAt: new Date().toISOString(),
            exercises: [],
          },
        });
      },

      addExercises: (exerciseIds) =>
        set((state) => {
          if (!state.active) return {};
          const lastSets = state.lastSetsByUser[state.active.userId] ?? {};
          const added = exerciseIds.map((exerciseId) => ({
            id: Crypto.randomUUID(),
            exerciseId,
            notes: '',
            sets: newDraftSets(lastSets[exerciseId], Crypto.randomUUID),
          }));
          return { active: { ...state.active, exercises: [...state.active.exercises, ...added] } };
        }),

      removeExercise: (exerciseRowId) =>
        set((state) =>
          state.active
            ? {
                active: {
                  ...state.active,
                  exercises: state.active.exercises.filter(
                    (exercise) => exercise.id !== exerciseRowId,
                  ),
                },
              }
            : {},
        ),

      addSet: (exerciseRowId) =>
        set((state) => ({
          active: updateExercise(state.active, exerciseRowId, (exercise) => ({
            ...exercise,
            sets: [...exercise.sets, ...newDraftSets(undefined, Crypto.randomUUID)],
          })),
        })),

      removeSet: (exerciseRowId, setId) =>
        set((state) => ({
          active: updateExercise(state.active, exerciseRowId, (exercise) => ({
            ...exercise,
            sets: exercise.sets.filter((draft) => draft.id !== setId),
          })),
        })),

      updateSet: (exerciseRowId, setId, patch) =>
        set((state) => ({
          active: updateExercise(state.active, exerciseRowId, (exercise) => ({
            ...exercise,
            sets: exercise.sets.map((draft) =>
              draft.id === setId ? { ...draft, ...patch } : draft,
            ),
          })),
        })),

      completeSet: (exerciseRowId, setId, values) =>
        set((state) => ({
          active: updateExercise(state.active, exerciseRowId, (exercise) => ({
            ...exercise,
            sets: exercise.sets.map((draft) =>
              draft.id === setId
                ? { ...draft, ...values, completedAt: new Date().toISOString() }
                : draft,
            ),
          })),
        })),

      uncompleteSet: (exerciseRowId, setId) =>
        set((state) => ({
          active: updateExercise(state.active, exerciseRowId, (exercise) => ({
            ...exercise,
            sets: exercise.sets.map((draft) =>
              draft.id === setId ? { ...draft, completedAt: null } : draft,
            ),
          })),
        })),

      discard: () => set({ active: null }),

      finish: (endedAt) => {
        const { active, pending, lastSetsByUser } = get();
        if (!active) return null;
        const finished = finishWorkout(active, endedAt);
        // One write: the workout is never both gone from "active" and missing from the queue.
        set({
          active: null,
          pending: [
            ...pending.filter((entry) => entry.id !== active.id),
            {
              id: active.id,
              userId: active.userId,
              payload: finished.payload,
              queuedAt: endedAt.toISOString(),
              attempts: 0,
              lastError: null,
            },
          ],
          lastSetsByUser: {
            ...lastSetsByUser,
            [active.userId]: { ...lastSetsByUser[active.userId], ...finished.lastSets },
          },
          lastSummary: finished.summary,
        });
        return finished.summary;
      },

      markUploaded: (workoutId) =>
        set((state) => ({ pending: state.pending.filter((entry) => entry.id !== workoutId) })),

      markFailed: (workoutId, message) =>
        set((state) => ({
          pending: state.pending.map((entry) =>
            entry.id === workoutId
              ? { ...entry, attempts: entry.attempts + 1, lastError: message }
              : entry,
          ),
        })),

      clearUser: (userId) =>
        set((state) => {
          const { [userId]: _forgotten, ...lastSetsByUser } = state.lastSetsByUser;
          return {
            active: state.active?.userId === userId ? null : state.active,
            pending: state.pending.filter((entry) => entry.userId !== userId),
            lastSetsByUser,
          };
        }),
    }),
    {
      name: 'movyn-workouts',
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        active: state.active,
        pending: state.pending,
        lastSetsByUser: state.lastSetsByUser,
        lastSummary: state.lastSummary,
      }),
    },
  ),
);

// Everything is scoped to the signed-in user: another account on the same phone sees nothing.

export function useActiveWorkout(userId: string): ActiveWorkout | null {
  return useWorkoutStore((state) => (state.active?.userId === userId ? state.active : null));
}

export function usePendingWorkouts(userId: string): PendingWorkout[] {
  return useWorkoutStore(
    useShallow((state) => state.pending.filter((entry) => entry.userId === userId)),
  );
}

export function useLastSets(userId: string): LastSetsByExercise {
  return useWorkoutStore((state) => state.lastSetsByUser[userId]) ?? {};
}
