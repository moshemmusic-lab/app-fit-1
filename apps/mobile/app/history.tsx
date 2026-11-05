import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { FlatList, View } from 'react-native';

import { EmptyState } from '@/components/ui/EmptyState';
import { Screen } from '@/components/ui/Screen';
import { ErrorState, LoadingState } from '@/components/ui/StateViews';
import { useSettings } from '@/features/account/api';
import { useUserId } from '@/features/auth/session';
import { useTrainingLog } from '@/features/progress/api';
import { WorkoutCard } from '@/features/progress/components/WorkoutCard';
import { useErrorMessage } from '@/lib/use-error-message';
import { useTheme } from '@/theme/ThemeProvider';

/** Every finished workout, newest first, including those not uploaded yet. */
export default function HistoryScreen() {
  const { t } = useTranslation();
  const { spacing } = useTheme();
  const getErrorMessage = useErrorMessage();
  const userId = useUserId();
  const unit = useSettings(userId).data?.units ?? 'kg';
  const { query, entries } = useTrainingLog(userId);

  return (
    <Screen
      withBottomInset
      scroll={!entries || entries.length === 0}
      onBack={() => router.back()}
      title={t('history.title')}
    >
      {entries ? (
        entries.length === 0 ? (
          <EmptyState title={t('history.title')} body={t('history.empty')} />
        ) : (
          <FlatList
            data={entries}
            keyExtractor={(entry) => entry.id}
            renderItem={({ item }) => <WorkoutCard entry={item} unit={unit} />}
            ItemSeparatorComponent={() => <View style={{ height: spacing[2] }} />}
            contentContainerStyle={{ paddingBottom: spacing[6] }}
          />
        )
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
