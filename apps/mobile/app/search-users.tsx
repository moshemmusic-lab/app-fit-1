import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, View } from 'react-native';

import { EmptyState } from '@/components/ui/EmptyState';
import { Screen } from '@/components/ui/Screen';
import { SearchField } from '@/components/ui/SearchField';
import { ErrorState, LoadingState } from '@/components/ui/StateViews';
import { Text } from '@/components/ui/Text';
import { useUserId } from '@/features/auth/session';
import { useSearchUsers } from '@/features/social/api';
import { FollowButton } from '@/features/social/components/FollowButton';
import { UserRow } from '@/features/social/components/UserRow';
import { openUser } from '@/features/social/navigation';
import { useErrorMessage } from '@/lib/use-error-message';
import { useTheme } from '@/theme/ThemeProvider';

// Waits for a pause in typing before asking the server.
const SEARCH_DELAY_MS = 300;

/** Find people by name or @username, and follow them from the list. */
export default function SearchUsersScreen() {
  const { t } = useTranslation();
  const { colors, spacing } = useTheme();
  const getErrorMessage = useErrorMessage();
  const viewer = useUserId();
  const [query, setQuery] = useState('');
  const [debounced, setDebounced] = useState('');
  const results = useSearchUsers(viewer, debounced);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(query), SEARCH_DELAY_MS);
    return () => clearTimeout(timer);
  }, [query]);

  const searching = debounced.trim() !== '';

  return (
    <Screen
      title={t('social.searchTitle')}
      onBack={() => router.back()}
      withBottomInset
      scroll={false}
    >
      <SearchField
        label={t('social.searchLabel')}
        clearLabel={t('exercises.clearSearch')}
        placeholder={t('social.searchPlaceholder')}
        value={query}
        onChangeText={setQuery}
        autoFocus
      />
      {!searching ? (
        <Text variant="body" color="textMuted">
          {t('social.searchHint')}
        </Text>
      ) : results.data ? (
        <FlatList
          style={{ flex: 1 }}
          data={results.data}
          keyExtractor={(user) => user.id}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          ItemSeparatorComponent={() => (
            <View style={{ height: 1, backgroundColor: colors.line }} />
          )}
          renderItem={({ item }) => (
            <UserRow
              user={item}
              onPress={() => openUser(item.id, viewer)}
              right={<FollowButton user={item} status={item.followStatus} compact />}
            />
          )}
          contentContainerStyle={{ paddingBottom: spacing[6] }}
          ListEmptyComponent={
            <EmptyState title={t('social.searchEmptyTitle')} body={t('social.searchEmptyBody')} />
          }
        />
      ) : results.isError ? (
        <ErrorState
          message={getErrorMessage(results.error)}
          onRetry={() => void results.refetch()}
          retrying={results.isFetching}
        />
      ) : (
        <LoadingState />
      )}
    </Screen>
  );
}
