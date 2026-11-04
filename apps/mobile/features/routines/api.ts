import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as Crypto from 'expo-crypto';

import { supabase } from '@/lib/supabase';

import { byName, toRoutinePayload } from './routine-logic';
import type { Routine, RoutineFolder } from './types';

export const routineKeys = {
  library: (userId: string) => ['routines', userId] as const,
};

export interface RoutineLibrary {
  folders: RoutineFolder[];
  routines: Routine[];
}

const byPosition = <T extends { position: number }>(a: T, b: T) => a.position - b.position;

async function fetchRoutineLibrary(): Promise<RoutineLibrary> {
  // RLS returns only the signed-in user's folders and routines.
  const [folders, routines] = await Promise.all([
    supabase.from('routine_folders').select('id, name, position'),
    supabase
      .from('routines')
      .select(
        'id, folder_id, name, notes, routine_exercises (id, exercise_id, position, rest_seconds, notes, routine_sets (id, position, set_type, target_reps, target_weight_kg, target_duration_s, target_distance_m))',
      )
      .is('deleted_at', null),
  ]);
  if (folders.error) throw folders.error;
  if (routines.error) throw routines.error;

  return {
    folders: [...folders.data].sort((a, b) => byPosition(a, b) || byName(a, b)),
    routines: routines.data
      .map((row) => ({
        id: row.id,
        folderId: row.folder_id,
        name: row.name,
        notes: row.notes,
        exercises: [...row.routine_exercises].sort(byPosition).map((exercise) => ({
          id: exercise.id,
          exerciseId: exercise.exercise_id,
          restSeconds: exercise.rest_seconds,
          notes: exercise.notes,
          sets: [...exercise.routine_sets].sort(byPosition).map((set) => ({
            id: set.id,
            setType: set.set_type,
            targetReps: set.target_reps,
            targetWeightKg: set.target_weight_kg,
            targetDurationS: set.target_duration_s,
            targetDistanceM: set.target_distance_m,
          })),
        })),
      }))
      .sort(byName),
  };
}

/** Folders and routines. Cached on the phone, so routines can be started offline. */
export function useRoutineLibrary(userId: string) {
  return useQuery({
    queryKey: routineKeys.library(userId),
    queryFn: fetchRoutineLibrary,
  });
}

/**
 * Changes to routines need a connection: fail right away when offline instead of waiting
 * (TanStack would pause them), so the screen can say so.
 */
function useRoutineMutation<TVariables>(mutationFn: (variables: TVariables) => Promise<void>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    networkMode: 'always',
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['routines'] }),
  });
}

export function useSaveRoutine() {
  return useRoutineMutation(async (routine: Routine) => {
    const { error } = await supabase.rpc('save_routine', { p_routine: toRoutinePayload(routine) });
    if (error) throw error;
  });
}

export function useDeleteRoutine() {
  return useRoutineMutation(async (routineId: string) => {
    const { error } = await supabase
      .from('routines')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', routineId);
    if (error) throw error;
  });
}

export function useMoveRoutine() {
  return useRoutineMutation(
    async ({ routineId, folderId }: { routineId: string; folderId: string | null }) => {
      const { error } = await supabase
        .from('routines')
        .update({ folder_id: folderId })
        .eq('id', routineId);
      if (error) throw error;
    },
  );
}

export function useCreateFolder() {
  return useRoutineMutation(async ({ name, position }: { name: string; position: number }) => {
    const { error } = await supabase
      .from('routine_folders')
      .insert({ id: Crypto.randomUUID(), name: name.trim(), position });
    if (error) throw error;
  });
}

export function useRenameFolder() {
  return useRoutineMutation(async ({ folderId, name }: { folderId: string; name: string }) => {
    const { error } = await supabase
      .from('routine_folders')
      .update({ name: name.trim() })
      .eq('id', folderId);
    if (error) throw error;
  });
}

export function useDeleteFolder() {
  return useRoutineMutation(async (folderId: string) => {
    const { error } = await supabase.from('routine_folders').delete().eq('id', folderId);
    if (error) throw error;
  });
}
