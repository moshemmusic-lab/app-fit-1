// Installs `localStorage` backed by SQLite: every change below is written to the phone at once,
// so a workout survives the app closing, a crash or a dead battery (CLAUDE.md, data rule 7).
import 'expo-sqlite/localStorage/install';

import type { TrackingType } from '@app-fit/shared/exercises';
import type { WorkoutVisibility } from '@app-fit/shared/schemas';
import type { SetValues } from '@app-fit/shared/workouts';
import * as Crypto from 'expo-crypto';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { useShallow } from 'zustand/react/shallow';

import { finishWorkout, newDraftSets } from './finish';
import { defaultRestSeconds } from './rest';
import type {
  ActiveWorkout,
  DraftExercise,
  LastSetsByExercise,
  PendingWorkout,
  RestByExercise,
  RestTimer,
  WorkoutSetType,
  WorkoutSummary,
} from './types';

/** An exercise picked from the library. */
export interface PickedExercise {
  exerciseId: string;
  trackingType: TrackingType;
}

interface PersistedWorkoutState {
  /** The workout in progress (at most one per phone). */
  active: ActiveWorkout | null;
  /** Finished workouts not yet confirmed by the server. */
  pending: PendingWorkout[];
  /** Per user, the last completed sets of each exercise. */
  lastSetsByUser: Record<string, LastSetsByExercise>;
  /** Per user, the rest chosen for each exercise. */
  restByUser: Record<string, RestByExercise>;
  /** The rest countdown in progress. */
  restTimer: RestTimer | null;
  /** Summary of the last finished workout, for the summary screen. */
  lastSummary: WorkoutSummary | null;
}

interface WorkoutState extends PersistedWorkoutState {
  start: (input: { userId: string; title: string; visibility: WorkoutVisibility }) => void;
  setTitle: (title: string) => void;
  setNotes: (notes: string) => void;
  addExercises: (exercises: readonly PickedExercise[]) => void;
  replaceExercise: (exerciseRowId: string, exercise: PickedExercise) => void;
  moveExercise: (exerciseRowId: string, direction: -1 | 1) => void;
  removeExercise: (exerciseRowId: string) => void;
  setExerciseNotes: (exerciseRowId: string, notes: string) => void;
  setRestSeconds: (exerciseRowId: string, seconds: number | null) => void;
  addSet: (exerciseRowId: string) => void;
  removeSet: (exerciseRowId: string, setId: string) => void;
  setSetType: (exerciseRowId: string, setId: string, setType: WorkoutSetType) => void;
  updateSet: (exerciseRowId: string, setId: string, patch: Partial<SetValues>) => void;
  completeSet: (exerciseRowId: string, setId: string, values: SetValues) => void;
  uncompleteSet: (exerciseRowId: string, setId: string) => void;
  setRestTimer: (timer: RestTimer | null) => void;
  setRestNotificationId: (notificationId: string | null) => void;
  discard: () => void;
  /** Moves the workout to the upload queue. Returns its summary. */
  finish: (endedAt: Date, fallbackTitle: string) => WorkoutSummary | null;
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
    (set, get) => {
      /** A new exercise row: last time's sets and the rest this user chose for it. */
      const newExerciseRow = (
        state: PersistedWorkoutState,
        userId: string,
        { exerciseId, trackingType }: PickedExercise,
      ): DraftExercise => {
        const rememberedRest = state.restByUser[userId]?.[exerciseId];
        return {
          id: Crypto.randomUUID(),
          exerciseId,
          notes: '',
          restSeconds:
            rememberedRest === undefined ? defaultRestSeconds(trackingType) : rememberedRest,
          sets: newDraftSets(state.lastSetsByUser[userId]?.[exerciseId], Crypto.randomUUID),
        };
      };

      return {
        active: null,
        pending: [],
        lastSetsByUser: {},
        restByUser: {},
        restTimer: null,
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

        setTitle: (title) =>
          set((state) => (state.active ? { active: { ...state.active, title } } : {})),

        setNotes: (notes) =>
          set((state) => (state.active ? { active: { ...state.active, notes } } : {})),

        addExercises: (exercises) =>
          set((state) => {
            const { active } = state;
            if (!active) return {};
            const added = exercises.map((exercise) =>
              newExerciseRow(state, active.userId, exercise),
            );
            return { active: { ...active, exercises: [...active.exercises, ...added] } };
          }),

        // A different exercise starts with its own last time sets (the old sets do not apply).
        replaceExercise: (exerciseRowId, exercise) =>
          set((state) => {
            const { active } = state;
            if (!active) return {};
            return {
              active: {
                ...active,
                exercises: active.exercises.map((row) =>
                  row.id === exerciseRowId
                    ? { ...newExerciseRow(state, active.userId, exercise), id: row.id }
                    : row,
                ),
              },
            };
          }),

        moveExercise: (exerciseRowId, direction) =>
          set((state) => {
            if (!state.active) return {};
            const exercises = [...state.active.exercises];
            const from = exercises.findIndex((exercise) => exercise.id === exerciseRowId);
            const to = from + direction;
            const moved = exercises[from];
            if (from < 0 || to < 0 || to >= exercises.length || !moved) return {};
            exercises.splice(from, 1);
            exercises.splice(to, 0, moved);
            return { active: { ...state.active, exercises } };
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

        setExerciseNotes: (exerciseRowId, notes) =>
          set((state) => ({
            active: updateExercise(state.active, exerciseRowId, (exercise) => ({
              ...exercise,
              notes,
            })),
          })),

        // Also remembered for the next time this user does the exercise.
        setRestSeconds: (exerciseRowId, seconds) =>
          set((state) => {
            const { active } = state;
            const row = active?.exercises.find((exercise) => exercise.id === exerciseRowId);
            if (!active || !row) return {};
            return {
              active: updateExercise(active, exerciseRowId, (exercise) => ({
                ...exercise,
                restSeconds: seconds,
              })),
              restByUser: {
                ...state.restByUser,
                [active.userId]: { ...state.restByUser[active.userId], [row.exerciseId]: seconds },
              },
            };
          }),

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

        setSetType: (exerciseRowId, setId, setType) =>
          set((state) => ({
            active: updateExercise(state.active, exerciseRowId, (exercise) => ({
              ...exercise,
              sets: exercise.sets.map((draft) =>
                draft.id === setId ? { ...draft, setType } : draft,
              ),
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

        setRestTimer: (restTimer) => set({ restTimer }),

        setRestNotificationId: (notificationId) =>
          set((state) =>
            state.restTimer ? { restTimer: { ...state.restTimer, notificationId } } : {},
          ),

        discard: () => set({ active: null, restTimer: null }),

        finish: (endedAt, fallbackTitle) => {
          const { active, pending, lastSetsByUser } = get();
          if (!active) return null;
          const finished = finishWorkout(active, endedAt, fallbackTitle);
          // One write: the workout is never both gone from "active" and missing from the queue.
          set({
            active: null,
            restTimer: null,
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
            const { [userId]: _forgottenSets, ...lastSetsByUser } = state.lastSetsByUser;
            const { [userId]: _forgottenRests, ...restByUser } = state.restByUser;
            const isActiveUser = state.active?.userId === userId;
            return {
              active: isActiveUser ? null : state.active,
              restTimer: isActiveUser ? null : state.restTimer,
              pending: state.pending.filter((entry) => entry.userId !== userId),
              lastSetsByUser,
              restByUser,
            };
          }),
      };
    },
    {
      name: 'movyn-workouts',
      version: 2,
      storage: createJSONStorage(() => localStorage),
      partialize: (state): PersistedWorkoutState => ({
        active: state.active,
        pending: state.pending,
        lastSetsByUser: state.lastSetsByUser,
        restByUser: state.restByUser,
        restTimer: state.restTimer,
        lastSummary: state.lastSummary,
      }),
      // Version 1 (step 4, part 1) had no rests: a workout in progress keeps working.
      migrate: (persisted, version) => {
        const state = persisted as Partial<PersistedWorkoutState>;
        if (version >= 2) return state;
        return {
          ...state,
          restByUser: {},
          restTimer: null,
          active: state.active
            ? {
                ...state.active,
                exercises: state.active.exercises.map((exercise) => ({
                  ...exercise,
                  restSeconds: exercise.restSeconds ?? 90,
                })),
              }
            : null,
        };
      },
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
