import { formatDuration } from '@app-fit/shared/workouts';
import * as Haptics from 'expo-haptics';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';

import { Text } from '@/components/ui/Text';
import { useTheme } from '@/theme/ThemeProvider';

import { REST_STEP_S, restRemainingS } from '../rest';
import { useRestTimerControls } from '../rest-timer';
import { useWorkoutStore } from '../workout-store';

function TimerButton({
  label,
  accessibilityLabel,
  onPress,
}: {
  label: string;
  accessibilityLabel?: string;
  onPress: () => void;
}) {
  const { colors, radius, sizes, spacing } = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      onPress={onPress}
      style={({ pressed }) => ({
        minWidth: sizes.touchMin,
        minHeight: sizes.touchMin,
        paddingHorizontal: spacing[3],
        borderRadius: radius.md,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.surface,
        opacity: pressed ? 0.6 : 1,
      })}
    >
      <Text variant="bodyStrong">{label}</Text>
    </Pressable>
  );
}

/** Rest countdown above the workout actions, within thumb reach (docs/DESIGN.md). */
export function RestTimerBar() {
  const { t } = useTranslation();
  const { colors, radius, spacing } = useTheme();
  const timer = useWorkoutStore((state) => state.restTimer);
  const controls = useRestTimerControls();
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!timer) return;
    // Tick right away (the clock may be stale since the last rest), then four times a second.
    const firstTick = setTimeout(() => setNow(Date.now()), 0);
    const interval = setInterval(() => setNow(Date.now()), 250);
    return () => {
      clearTimeout(firstTick);
      clearInterval(interval);
    };
  }, [timer]);

  const remaining = timer ? restRemainingS(timer.endsAt, now) : 0;

  // Rest over with the app open: a vibration instead of the notification banner. A rest that
  // ended while the app was closed (the notification already told the user) ends silently.
  useEffect(() => {
    if (timer && remaining === 0) {
      if (Date.now() - Date.parse(timer.endsAt) < 3000) {
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      controls.stop();
    }
  }, [timer, remaining, controls]);

  if (!timer) return null;
  const progress = Math.min(1, remaining / timer.durationS);

  return (
    <View
      accessibilityLiveRegion="polite"
      style={{
        padding: spacing[3],
        gap: spacing[2],
        borderRadius: radius.lg,
        backgroundColor: colors.surface2,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[2] }}>
        <View style={{ flex: 1 }}>
          <Text variant="label" color="textMuted">
            {t('activeWorkout.restTimer.title')}
          </Text>
          <Text variant="metric">{formatDuration(remaining)}</Text>
        </View>
        <TimerButton
          label={t('activeWorkout.restTimer.minus')}
          accessibilityLabel={t('activeWorkout.restTimer.minusLabel')}
          onPress={() => controls.adjust(-REST_STEP_S)}
        />
        <TimerButton
          label={t('activeWorkout.restTimer.plus')}
          accessibilityLabel={t('activeWorkout.restTimer.plusLabel')}
          onPress={() => controls.adjust(REST_STEP_S)}
        />
        <TimerButton label={t('activeWorkout.restTimer.skip')} onPress={controls.stop} />
      </View>
      {/* Lime as fill only (docs/DESIGN.md). */}
      <View style={{ height: 4, borderRadius: radius.pill, backgroundColor: colors.surface }}>
        <View
          style={{
            width: `${progress * 100}%`,
            height: '100%',
            borderRadius: radius.pill,
            backgroundColor: colors.lime,
          }}
        />
      </View>
    </View>
  );
}
