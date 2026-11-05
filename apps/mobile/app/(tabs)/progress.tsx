import type { WeightUnit } from '@app-fit/shared/schemas';
import { router } from 'expo-router';
import { History, Weight } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Screen } from '@/components/ui/Screen';
import { ErrorState, LoadingState } from '@/components/ui/StateViews';
import { Text } from '@/components/ui/Text';
import { useSettings } from '@/features/account/api';
import { useUserId } from '@/features/auth/session';
import { useBodyWeights, useTrainingLog } from '@/features/progress/api';
import { BodyWeightChart } from '@/features/progress/components/BodyWeightChart';
import { ConsistencyCard } from '@/features/progress/components/ConsistencyCard';
import { WeeklyVolumeCard } from '@/features/progress/components/WeeklyVolumeCard';
import { WorkoutCard } from '@/features/progress/components/WorkoutCard';
import { useErrorMessage } from '@/lib/use-error-message';
import { useTheme } from '@/theme/ThemeProvider';

/** Workouts shown here; the rest are in the history screen. */
const RECENT_WORKOUTS = 3;

export default function ProgressScreen() {
  const { t } = useTranslation();
  const { spacing } = useTheme();
  const getErrorMessage = useErrorMessage();
  const userId = useUserId();
  const unit = useSettings(userId).data?.units ?? 'kg';
  const { query, entries } = useTrainingLog(userId);

  return (
    <Screen title={t('tabs.progress')}>
      {entries ? (
        <>
          {entries.length === 0 ? (
            <EmptyState title={t('progress.emptyTitle')} body={t('progress.emptyBody')} />
          ) : (
            <>
              <WeeklyVolumeCard entries={entries} unit={unit} />
              <ConsistencyCard entries={entries} />
              <View style={{ gap: spacing[2] }}>
                <Text variant="heading" accessibilityRole="header">
                  {t('progress.history')}
                </Text>
                {entries.slice(0, RECENT_WORKOUTS).map((entry) => (
                  <WorkoutCard key={entry.id} entry={entry} unit={unit} />
                ))}
                {entries.length > RECENT_WORKOUTS ? (
                  <Button
                    label={t('progress.seeAllHistory')}
                    variant="ghost"
                    icon={History}
                    onPress={() => router.push('/history')}
                  />
                ) : null}
              </View>
            </>
          )}
          <BodyWeightCard userId={userId} unit={unit} />
        </>
      ) : query.isError || query.fetchStatus === 'paused' ? (
        <ErrorState
          message={getErrorMessage(query.error)}
          onRetry={() => void query.refetch()}
          retrying={query.isFetching}
        />
      ) : (
        <LoadingState />
      )}
    </Screen>
  );
}

function BodyWeightCard({ userId, unit }: { userId: string; unit: WeightUnit }) {
  const { t } = useTranslation();
  const entries = useBodyWeights(userId).data;
  const hasEntries = entries !== undefined && entries.length > 0;

  return (
    <Card>
      <Text variant="heading" accessibilityRole="header">
        {t('progress.bodyWeight')}
      </Text>
      {hasEntries ? (
        <BodyWeightChart entries={entries} unit={unit} />
      ) : (
        <Text variant="body" color="textMuted">
          {t('progress.bodyWeightEmpty')}
        </Text>
      )}
      <Button
        label={hasEntries ? t('progress.seeBodyWeight') : t('progress.logWeight')}
        variant="secondary"
        icon={Weight}
        onPress={() => router.push('/body-weight')}
      />
    </Card>
  );
}
