import * as Notifications from 'expo-notifications';
import { useTranslation } from 'react-i18next';
import { AppState } from 'react-native';

import { adjustRestEnd } from './rest';
import { useWorkoutStore } from './workout-store';

// With the app open, the timer bar and a vibration announce the end of the rest; the
// notification banner and sound are for when the phone is in the pocket.
Notifications.setNotificationHandler({
  handleNotification: async () => {
    const inBackground = AppState.currentState !== 'active';
    return {
      shouldShowBanner: inBackground,
      shouldShowList: inBackground,
      shouldPlaySound: inBackground,
      shouldSetBadge: false,
    };
  },
});

/** Asks for permission the first time a rest starts. Declining only loses the banner. */
async function canNotify(): Promise<boolean> {
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  if (!current.canAskAgain) return false;
  return (await Notifications.requestPermissionsAsync()).granted;
}

async function cancelNotification(notificationId: string | null): Promise<void> {
  if (!notificationId) return;
  try {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  } catch {
    // Already shown or gone: nothing to cancel.
  }
}

async function scheduleEnd(endsAt: string, content: { title: string; body: string }) {
  let notificationId: string | null = null;
  try {
    if (await canNotify()) {
      notificationId = await Notifications.scheduleNotificationAsync({
        content: { ...content, sound: true },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: new Date(endsAt) },
      });
    }
  } catch {
    // Without a notification the timer still works in the app.
  }
  const store = useWorkoutStore.getState();
  // The rest may have been skipped or changed while asking for permission.
  if (store.restTimer?.endsAt === endsAt) {
    store.setRestNotificationId(notificationId);
  } else {
    await cancelNotification(notificationId);
  }
}

/** Start, adjust and skip the rest countdown, keeping its notification in step. */
export function useRestTimerControls() {
  const { t } = useTranslation();
  const content = {
    title: t('activeWorkout.restTimer.notificationTitle'),
    body: t('activeWorkout.restTimer.notificationBody'),
  };

  const replace = (endsAt: string | null, durationS: number) => {
    const store = useWorkoutStore.getState();
    void cancelNotification(store.restTimer?.notificationId ?? null);
    if (!endsAt) {
      store.setRestTimer(null);
      return;
    }
    store.setRestTimer({ endsAt, durationS, notificationId: null });
    void scheduleEnd(endsAt, content);
  };

  return {
    start: (seconds: number) =>
      replace(new Date(Date.now() + seconds * 1000).toISOString(), seconds),
    adjust: (deltaS: number) => {
      const timer = useWorkoutStore.getState().restTimer;
      if (!timer) return;
      replace(
        adjustRestEnd(timer.endsAt, deltaS, Date.now()),
        Math.max(timer.durationS + deltaS, 1),
      );
    },
    stop: () => replace(null, 0),
  };
}
