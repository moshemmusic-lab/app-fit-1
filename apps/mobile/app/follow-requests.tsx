import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Screen } from '@/components/ui/Screen';
import { ErrorState, LoadingState } from '@/components/ui/StateViews';
import { useUserId } from '@/features/auth/session';
import { useFollowRequests, useRespondToRequest } from '@/features/social/api';
import { UserRow } from '@/features/social/components/UserRow';
import { useSocialErrorAlert, useTimeAgo } from '@/features/social/format';
import { openUser } from '@/features/social/navigation';
import { useErrorMessage } from '@/lib/use-error-message';
import { useTheme } from '@/theme/ThemeProvider';

/** People asking to follow your private profile: accept or reject each one. */
export default function FollowRequestsScreen() {
  const { t } = useTranslation();
  const { spacing } = useTheme();
  const getErrorMessage = useErrorMessage();
  const viewer = useUserId();
  const requests = useFollowRequests(viewer);
  const respond = useRespondToRequest(viewer);
  const showError = useSocialErrorAlert();
  const timeAgo = useTimeAgo();

  return (
    <Screen title={t('social.requestsTitle')} onBack={() => router.back()} withBottomInset>
      {requests.data ? (
        requests.data.length > 0 ? (
          requests.data.map((request) => (
            <View key={request.user.id} style={{ gap: spacing[2] }}>
              <UserRow
                user={request.user}
                detail={`@${request.user.username} · ${timeAgo(request.requestedAt)}`}
                onPress={() => openUser(request.user.id, viewer)}
              />
              <View style={{ flexDirection: 'row', gap: spacing[2] }}>
                <View style={{ flex: 1 }}>
                  <Button
                    label={t('social.accept')}
                    compact
                    disabled={respond.isPending}
                    onPress={() =>
                      respond.mutate(
                        { followerId: request.user.id, accept: true },
                        { onError: showError },
                      )
                    }
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Button
                    label={t('social.reject')}
                    variant="secondary"
                    compact
                    disabled={respond.isPending}
                    onPress={() =>
                      respond.mutate(
                        { followerId: request.user.id, accept: false },
                        { onError: showError },
                      )
                    }
                  />
                </View>
              </View>
            </View>
          ))
        ) : (
          <EmptyState title={t('social.requestsEmptyTitle')} body={t('social.requestsEmptyBody')} />
        )
      ) : requests.isError || requests.fetchStatus === 'paused' ? (
        <ErrorState
          message={getErrorMessage(requests.error)}
          onRetry={() => void requests.refetch()}
          retrying={requests.isFetching}
        />
      ) : (
        <LoadingState />
      )}
    </Screen>
  );
}
