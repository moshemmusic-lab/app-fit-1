import {
  progressMetricsByTrackingType,
  progressSeries,
  recordTypesByTrackingType,
  type ProgressMetric,
} from '@app-fit/shared/progress';
import { router } from 'expo-router';
import { ChevronRight } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';

import { LineChart } from '@/components/charts/LineChart';
import { Card } from '@/components/ui/Card';
import { ChipGroup } from '@/components/ui/ChipGroup';
import { ErrorState, LoadingState } from '@/components/ui/StateViews';
import { Text } from '@/components/ui/Text';
import { useSettings } from '@/features/account/api';
import { useUserId } from '@/features/auth/session';
import type { LibraryExercise } from '@/features/exercises/api';
import { usePreviousFormatter } from '@/features/workouts/fields';
import { formatDayMonth, formatLongDate, formatShortDate } from '@/lib/dates';
import { useErrorMessage } from '@/lib/use-error-message';
import { useTheme } from '@/theme/ThemeProvider';

import { useExerciseSessions, usePersonalBests } from '../api';
import { useProgressFormat } from '../format';
import { topSet } from '../logic';

/** Sessions listed under "Últimas veces". */
const RECENT_SESSIONS = 5;

/** The user's progress with an exercise: a chart, the records and the last sessions. */
export function ExerciseProgress({ exercise }: { exercise: LibraryExercise }) {
  const { t } = useTranslation();
  const { colors, radius, sizes, spacing } = useTheme();
  const getErrorMessage = useErrorMessage();
  const userId = useUserId();
  const unit = useSettings(userId).data?.units ?? 'kg';
  const format = useProgressFormat(unit);
  const formatSet = usePreviousFormatter(unit);
  const { query, sessions } = useExerciseSessions(userId, exercise.id);
  const allBests = usePersonalBests(userId).data;
  const metrics = progressMetricsByTrackingType[exercise.trackingType];
  const [metric, setMetric] = useState<ProgressMetric>(metrics[0] ?? 'max_reps');
  const [selectedKey, setSelectedKey] = useState<string | null>(null);

  const points = useMemo(
    () =>
      progressSeries(sessions ?? [], metric).map((point) => ({
        key: point.workoutId,
        date: point.date,
        value: point.value,
      })),
    [sessions, metric],
  );
  const recent = useMemo(
    () =>
      [...(sessions ?? [])]
        .sort((a, b) => b.startedAt.localeCompare(a.startedAt))
        .slice(0, RECENT_SESSIONS),
    [sessions],
  );
  const bests = recordTypesByTrackingType[exercise.trackingType].flatMap((type) => {
    const best = allBests?.find(
      (item) => item.exerciseId === exercise.id && item.recordType === type,
    );
    return best ? [best] : [];
  });

  const tapped = points.findIndex((point) => point.key === selectedKey);
  const selected = tapped >= 0 ? tapped : points.length - 1;
  const point = points[selected];

  return (
    <View style={{ gap: spacing[3] }}>
      <Text variant="heading" accessibilityRole="header">
        {t('exerciseProgress.title')}
      </Text>

      {!sessions ? (
        query.isError || query.fetchStatus === 'paused' ? (
          <ErrorState
            message={getErrorMessage(query.error)}
            onRetry={() => void query.refetch()}
            retrying={query.isFetching}
          />
        ) : (
          <LoadingState />
        )
      ) : sessions.length === 0 ? (
        <Text variant="body" color="textMuted">
          {t('exerciseProgress.empty')}
        </Text>
      ) : (
        <>
          <Card>
            {metrics.length > 1 ? (
              <ChipGroup
                accessibilityLabel={t('exerciseProgress.metricLabel')}
                options={metrics.map((value) => ({
                  value,
                  label: t(`exerciseProgress.metrics.${value}`),
                }))}
                value={metric}
                onChange={(value) => {
                  setMetric(value);
                  setSelectedKey(null);
                }}
              />
            ) : null}
            {point ? (
              <>
                <View style={{ gap: spacing[1] }}>
                  <Text variant="label" color="textMuted">
                    {formatLongDate(point.date)}
                  </Text>
                  <Text variant="metric">{format.metricValue(metric, point.value)}</Text>
                </View>
                <LineChart
                  points={points}
                  selectedIndex={selected}
                  onSelect={(index) => setSelectedKey(points[index]?.key ?? null)}
                  formatTick={(value) => format.metricTick(metric, value)}
                  formatDate={(date) => formatShortDate(date)}
                  accessibilityLabel={t('exerciseProgress.chartLabel', {
                    metric: t(`exerciseProgress.metrics.${metric}`),
                    count: points.length,
                    date: formatDayMonth(point.date),
                    value: format.metricValue(metric, point.value),
                  })}
                />
                {points.length === 1 ? (
                  <Text variant="caption" color="textMuted">
                    {t('exerciseProgress.onePoint')}
                  </Text>
                ) : null}
              </>
            ) : null}
            {metric === 'est_1rm' ? (
              <Text variant="caption" color="textMuted">
                {t('exerciseProgress.oneRepMaxHint')}
              </Text>
            ) : null}
          </Card>

          {bests.length > 0 ? (
            <Card>
              <Text variant="bodyStrong" accessibilityRole="header">
                {t('exerciseProgress.records')}
              </Text>
              {bests.map((best) => (
                <View
                  key={best.recordType}
                  accessible
                  style={{ flexDirection: 'row', alignItems: 'flex-start', gap: spacing[3] }}
                >
                  <Text variant="body" color="textMuted" style={{ flex: 1 }}>
                    {format.recordLabel(best.recordType, exercise.trackingType)}
                  </Text>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text variant="bodyStrong">
                      {best.recordType === 'max_volume'
                        ? (formatSet(best.set, exercise.trackingType) ??
                          format.recordValue(best.recordType, best.value))
                        : format.recordValue(best.recordType, best.value)}
                    </Text>
                    <Text variant="caption" color="textMuted">
                      {formatShortDate(new Date(best.achievedAt))}
                    </Text>
                  </View>
                </View>
              ))}
            </Card>
          ) : null}

          <View style={{ gap: spacing[2] }}>
            <Text variant="bodyStrong" accessibilityRole="header">
              {t('exerciseProgress.recentSessions')}
            </Text>
            {recent.map((session) => {
              const working = session.sets.filter((set) => set.setType !== 'warmup');
              const best = topSet(
                session.sets.map((set, index) => ({ ...set, id: String(index) })),
                exercise.trackingType,
              );
              const bestText = best ? formatSet(best, exercise.trackingType) : null;
              return (
                <Pressable
                  key={session.workoutId}
                  accessibilityRole="button"
                  onPress={() =>
                    router.push({ pathname: '/workouts/[id]', params: { id: session.workoutId } })
                  }
                  style={({ pressed }) => ({
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: spacing[3],
                    padding: spacing[3],
                    borderRadius: radius.md,
                    backgroundColor: pressed ? colors.surface2 : colors.surface,
                  })}
                >
                  <View style={{ flex: 1, gap: spacing[1] }}>
                    <Text variant="body">{formatLongDate(new Date(session.startedAt))}</Text>
                    <Text variant="caption" color="textMuted">
                      {[t('history.sets', { count: working.length }), bestText]
                        .filter(Boolean)
                        .join(' · ')}
                    </Text>
                  </View>
                  <ChevronRight size={sizes.icon} strokeWidth={1.8} color={colors.textSubtle} />
                </Pressable>
              );
            })}
          </View>
        </>
      )}
    </View>
  );
}
