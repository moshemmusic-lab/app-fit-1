import { formatDecimal, formatDuration, fromKg } from '@app-fit/shared/workouts';
import { Redirect, router } from 'expo-router';
import { CloudCheck, CloudUpload } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Screen } from '@/components/ui/Screen';
import { StatTile } from '@/components/ui/StatTile';
import { Text } from '@/components/ui/Text';
import { useSettings } from '@/features/account/api';
import { useUserId } from '@/features/auth/session';
import { usePendingWorkouts, useWorkoutStore } from '@/features/workouts/workout-store';
import { useTheme } from '@/theme/ThemeProvider';

export default function WorkoutSummaryScreen() {
  const { t } = useTranslation();
  const { colors, sizes, spacing } = useTheme();
  const userId = useUserId();
  const summary = useWorkoutStore((state) => state.lastSummary);
  const pending = usePendingWorkouts(userId);
  const unit = useSettings(userId).data?.units ?? 'kg';

  if (!summary) return <Redirect href="/" />;

  const done = () => (router.canGoBack() ? router.back() : router.replace('/'));

  // Updates by itself when the upload finishes.
  const uploaded = !pending.some((entry) => entry.id === summary.workoutId);
  const SyncIcon = uploaded ? CloudCheck : CloudUpload;

  return (
    <Screen
      withBottomInset
      title={t('workoutSummary.title')}
      footer={<Button label={t('workoutSummary.done')} onPress={done} />}
    >
      <View style={{ gap: spacing[2] }}>
        <View style={{ flexDirection: 'row', gap: spacing[2] }}>
          <StatTile
            label={t('workoutSummary.duration')}
            value={formatDuration(summary.durationS)}
          />
          <StatTile
            label={t('workoutSummary.volume')}
            value={`${formatDecimal(fromKg(summary.volumeKg, unit), 0)} ${unit}`}
          />
        </View>
        <View style={{ flexDirection: 'row', gap: spacing[2] }}>
          <StatTile label={t('workoutSummary.sets')} value={String(summary.setCount)} />
          <StatTile label={t('workoutSummary.exercises')} value={String(summary.exerciseCount)} />
        </View>
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[2] }}>
        <SyncIcon size={sizes.icon} strokeWidth={1.8} color={colors.textMuted} />
        <Text variant="body" color="textMuted" style={{ flex: 1 }}>
          {uploaded ? t('workoutSummary.savedOnline') : t('workoutSummary.savedOffline')}
        </Text>
      </View>
    </Screen>
  );
}
