import type { WorkoutVisibility } from '@app-fit/shared/schemas';
import { contentVisibilities } from '@app-fit/shared/social';
import { formatDecimal, formatDuration, fromKg } from '@app-fit/shared/workouts';
import { Redirect, router } from 'expo-router';
import { ChevronRight, CloudCheck, CloudUpload, Eye, Share2 } from 'lucide-react-native';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { OptionsSheet, type OptionsSheetConfig } from '@/components/ui/OptionsSheet';
import { Screen } from '@/components/ui/Screen';
import { StatTile } from '@/components/ui/StatTile';
import { Text } from '@/components/ui/Text';
import { useSettings } from '@/features/account/api';
import { useUserId } from '@/features/auth/session';
import { NewRecordsCard } from '@/features/progress/components/NewRecordsCard';
import { useSetWorkoutVisibility } from '@/features/social/api';
import { usePendingWorkouts, useWorkoutStore } from '@/features/workouts/workout-store';
import { useTheme } from '@/theme/ThemeProvider';

export default function WorkoutSummaryScreen() {
  const { t } = useTranslation();
  const { colors, radius, sizes, spacing } = useTheme();
  const userId = useUserId();
  const summary = useWorkoutStore((state) => state.lastSummary);
  const setPendingVisibility = useWorkoutStore((state) => state.setPendingVisibility);
  const pending = usePendingWorkouts(userId);
  const settings = useSettings(userId).data;
  const unit = settings?.units ?? 'kg';
  const setServerVisibility = useSetWorkoutVisibility(userId);
  const queued = pending.find((entry) => entry.id === summary?.workoutId);
  const [visibility, setVisibility] = useState<WorkoutVisibility>(
    () => queued?.payload.visibility ?? settings?.defaultWorkoutVisibility ?? 'followers',
  );
  const [sheet, setSheet] = useState<OptionsSheetConfig | null>(null);

  if (!summary) return <Redirect href="/" />;

  // Still queued: it uploads with the new value. Already uploaded (or uploading): tell the
  // server too; if it is not there yet, the queued copy carries the change.
  const chooseVisibility = (next: WorkoutVisibility) => {
    setVisibility(next);
    setPendingVisibility(summary.workoutId, next);
    setServerVisibility.mutate({ workoutId: summary.workoutId, visibility: next });
  };

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

      {summary.records && summary.records.length > 0 ? (
        <NewRecordsCard records={summary.records} unit={unit} />
      ) : null}

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${t('visibility.title')}: ${t(`visibility.options.${visibility}`)}`}
        onPress={() =>
          setSheet({
            title: t('visibility.title'),
            options: contentVisibilities.map((option) => ({
              label: t(`visibility.options.${option}`),
              selected: option === visibility,
              onPress: () => chooseVisibility(option),
            })),
          })
        }
        style={({ pressed }) => ({
          minHeight: sizes.touchMin + spacing[2],
          paddingHorizontal: spacing[4],
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing[3],
          borderRadius: radius.md,
          backgroundColor: colors.surface,
          opacity: pressed ? 0.7 : 1,
        })}
      >
        <Eye size={sizes.icon} strokeWidth={1.8} color={colors.textMuted} />
        <Text variant="body" style={{ flex: 1 }}>
          {t('visibility.title')}
        </Text>
        <Text variant="bodyStrong">{t(`visibility.options.${visibility}`)}</Text>
        <ChevronRight size={sizes.icon * 0.8} strokeWidth={1.8} color={colors.textMuted} />
      </Pressable>

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[2] }}>
        <SyncIcon size={sizes.icon} strokeWidth={1.8} color={colors.textMuted} />
        <Text variant="body" color="textMuted" style={{ flex: 1 }}>
          {uploaded ? t('workoutSummary.savedOnline') : t('workoutSummary.savedOffline')}
        </Text>
      </View>

      <Button
        label={t('workoutSummary.share')}
        variant="secondary"
        icon={Share2}
        onPress={() =>
          router.push({ pathname: '/share/[workoutId]', params: { workoutId: summary.workoutId } })
        }
      />

      <Button
        label={t('workoutSummary.seeWorkout')}
        variant="ghost"
        onPress={() =>
          router.push({ pathname: '/workouts/[id]', params: { id: summary.workoutId } })
        }
      />
      <OptionsSheet config={sheet} onClose={() => setSheet(null)} />
    </Screen>
  );
}
