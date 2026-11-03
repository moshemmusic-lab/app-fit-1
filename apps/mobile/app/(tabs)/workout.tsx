import { partOfDay } from '@app-fit/shared/workouts';
import { router } from 'expo-router';
import { BookOpen, CloudOff, Play } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { useSettings } from '@/features/account/api';
import { useUserId } from '@/features/auth/session';
import { ElapsedTime } from '@/features/workouts/components/ElapsedTime';
import { syncPendingWorkouts } from '@/features/workouts/sync';
import {
  useActiveWorkout,
  usePendingWorkouts,
  useWorkoutStore,
} from '@/features/workouts/workout-store';
import { useTheme } from '@/theme/ThemeProvider';

export default function WorkoutScreen() {
  const { t } = useTranslation();
  const { colors, radius, sizes, spacing } = useTheme();
  const userId = useUserId();
  const settings = useSettings(userId);
  const active = useActiveWorkout(userId);
  const pending = usePendingWorkouts(userId);
  const start = useWorkoutStore((state) => state.start);

  const failed = pending.filter((entry) => entry.lastError !== null);
  const waiting = pending.length - failed.length;

  const startWorkout = () => {
    start({
      userId,
      title: t(`workout.titles.${partOfDay(new Date())}`),
      visibility: settings.data?.defaultWorkoutVisibility ?? 'followers',
    });
    router.push('/active-workout');
  };

  return (
    <Screen title={t('tabs.workout')}>
      {active ? (
        <View
          style={{
            padding: spacing[4],
            gap: spacing[3],
            borderRadius: radius.lg,
            backgroundColor: colors.surface,
          }}
        >
          <View style={{ gap: spacing[1] }}>
            <Text variant="label" color="textMuted">
              {t('workout.inProgressTitle')}
            </Text>
            <Text variant="heading">{active.title}</Text>
            <ElapsedTime startedAt={active.startedAt} />
          </View>
          <Button
            label={t('workout.resume')}
            icon={Play}
            onPress={() => router.push('/active-workout')}
          />
        </View>
      ) : (
        <>
          <EmptyState title={t('workout.emptyTitle')} body={t('workout.emptyBody')} />
          <Button label={t('workout.start')} icon={Play} onPress={startWorkout} />
        </>
      )}

      {pending.length > 0 ? (
        <View
          style={{
            padding: spacing[4],
            gap: spacing[2],
            borderRadius: radius.lg,
            backgroundColor: colors.surface,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[2] }}>
            <CloudOff size={sizes.icon} strokeWidth={1.8} color={colors.textMuted} />
            <Text variant="bodyStrong" style={{ flex: 1 }}>
              {waiting > 0
                ? t('workout.pending', { count: waiting })
                : t('workout.failed', { count: failed.length })}
            </Text>
          </View>
          <Text variant="body" color="textMuted">
            {waiting > 0
              ? t('workout.pendingBody', { count: waiting })
              : t('workout.failedBody', { count: failed.length })}
          </Text>
          <Button
            label={t('workout.retryUpload')}
            variant="ghost"
            onPress={() => void syncPendingWorkouts(userId)}
          />
        </View>
      ) : null}

      <Button
        label={t('workout.openLibrary')}
        variant="secondary"
        icon={BookOpen}
        onPress={() => router.push('/exercises')}
      />
    </Screen>
  );
}
