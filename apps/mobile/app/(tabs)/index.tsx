import { router } from 'expo-router';
import { UserSearch } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, FlatList, RefreshControl, View } from 'react-native';

import { Wordmark } from '@/components/Wordmark';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { IconButton } from '@/components/ui/IconButton';
import { Screen } from '@/components/ui/Screen';
import { ErrorState, LoadingState } from '@/components/ui/StateViews';
import { Text } from '@/components/ui/Text';
import { useSettings } from '@/features/account/api';
import { useUserId } from '@/features/auth/session';
import { useFeed, useSetLike } from '@/features/social/api';
import { FeedCard } from '@/features/social/components/FeedCard';
import { useSocialErrorAlert } from '@/features/social/format';
import { openComments, openUser, openWorkout } from '@/features/social/navigation';
import { useErrorMessage } from '@/lib/use-error-message';
import { useTheme } from '@/theme/ThemeProvider';

/** Inicio: your workouts and those of the people you follow, newest first. */
export default function HomeScreen() {
  const { t } = useTranslation();
  const { colors, spacing } = useTheme();
  const getErrorMessage = useErrorMessage();
  const viewer = useUserId();
  const unit = useSettings(viewer).data?.units ?? 'kg';
  const feed = useFeed(viewer);
  const setLike = useSetLike(viewer);
  const showError = useSocialErrorAlert();
  const items = feed.data?.pages.flat() ?? [];

  const findPeople = () => router.push('/search-users');

  return (
    <Screen
      scroll={false}
      header={
        <View
          style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
        >
          <Wordmark />
          <IconButton icon={UserSearch} label={t('home.findPeople')} onPress={findPeople} />
        </View>
      }
    >
      {feed.data ? (
        <FlatList
          style={{ flex: 1, marginHorizontal: -spacing[4] }}
          contentContainerStyle={{
            paddingHorizontal: spacing[4],
            paddingBottom: spacing[6],
            gap: spacing[3],
          }}
          data={items}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <FeedCard
              item={item}
              unit={unit}
              onOpen={() => openWorkout(item.id, item.user.id, viewer)}
              onOpenUser={() => openUser(item.user.id, viewer)}
              onToggleLike={() =>
                setLike.mutate({ workoutId: item.id, liked: !item.liked }, { onError: showError })
              }
              onOpenComments={() => openComments(item.id)}
            />
          )}
          refreshControl={
            <RefreshControl
              refreshing={feed.isRefetching && !feed.isFetchingNextPage}
              onRefresh={() => void feed.refetch()}
              tintColor={colors.textMuted}
            />
          }
          onEndReachedThreshold={0.5}
          onEndReached={() => {
            if (feed.hasNextPage && !feed.isFetchingNextPage) void feed.fetchNextPage();
          }}
          ListEmptyComponent={
            <View style={{ gap: spacing[3] }}>
              <EmptyState title={t('home.emptyTitle')} body={t('home.emptyBody')} />
              <Button
                label={t('home.findPeople')}
                variant="secondary"
                icon={UserSearch}
                onPress={findPeople}
              />
            </View>
          }
          ListFooterComponent={
            feed.isFetchingNextPage ? (
              <ActivityIndicator color={colors.textMuted} />
            ) : items.length > 0 && !feed.hasNextPage ? (
              <Text variant="caption" color="textMuted" style={{ textAlign: 'center' }}>
                {t('home.end')}
              </Text>
            ) : undefined
          }
        />
      ) : feed.isError || feed.fetchStatus === 'paused' ? (
        <ErrorState
          message={getErrorMessage(feed.error)}
          onRetry={() => void feed.refetch()}
          retrying={feed.isFetching}
        />
      ) : (
        <LoadingState />
      )}
    </Screen>
  );
}
