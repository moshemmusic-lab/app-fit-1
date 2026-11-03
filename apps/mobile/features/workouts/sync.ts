import { onlineManager } from '@tanstack/react-query';
import { useEffect } from 'react';
import { AppState } from 'react-native';

import { classifyError } from '@/lib/errors';
import { supabase } from '@/lib/supabase';

import { useWorkoutStore } from './workout-store';

let running: Promise<void> | null = null;

async function uploadQueue(userId: string): Promise<void> {
  const queue = useWorkoutStore.getState().pending.filter((entry) => entry.userId === userId);

  for (const entry of queue) {
    const { error } = await supabase.rpc('save_workout', { p_workout: entry.payload });
    if (!error) {
      // Only now does the workout leave the phone's queue.
      useWorkoutStore.getState().markUploaded(entry.id);
      continue;
    }
    // No connection: stop and try again later. The workout stays on the phone.
    if (classifyError(error, onlineManager.isOnline()) === 'offline') return;
    useWorkoutStore.getState().markFailed(entry.id, error.message);
  }
}

/**
 * Uploads the user's finished workouts. Safe to call often: only one run at a time, and
 * re-uploading is harmless because save_workout() is idempotent.
 */
export function syncPendingWorkouts(userId: string): Promise<void> {
  running ??= uploadQueue(userId).finally(() => {
    running = null;
  });
  return running;
}

/** Keeps the queue moving: at start, when the app comes back and when the connection returns. */
export function useWorkoutSync(userId: string | undefined): void {
  useEffect(() => {
    if (!userId) return;
    void syncPendingWorkouts(userId);

    const appState = AppState.addEventListener('change', (status) => {
      if (status === 'active') void syncPendingWorkouts(userId);
    });
    const unsubscribeOnline = onlineManager.subscribe((isOnline) => {
      if (isOnline) void syncPendingWorkouts(userId);
    });

    return () => {
      appState.remove();
      unsubscribeOnline();
    };
  }, [userId]);
}
