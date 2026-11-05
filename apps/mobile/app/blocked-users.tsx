import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Screen } from '@/components/ui/Screen';
import { ErrorState, LoadingState } from '@/components/ui/StateViews';
import { useUserId } from '@/features/auth/session';
import { useBlockedUsers, useUnblock } from '@/features/social/api';
import { UserRow } from '@/features/social/components/UserRow';
import { useSocialErrorAlert } from '@/features/social/format';
import { openUser } from '@/features/social/navigation';
import { useErrorMessage } from '@/lib/use-error-message';

/** The people you blocked, to unblock them. */
export default function BlockedUsersScreen() {
  const { t } = useTranslation();
  const getErrorMessage = useErrorMessage();
  const viewer = useUserId();
  const blocked = useBlockedUsers(viewer);
  const unblock = useUnblock(viewer);
  const showError = useSocialErrorAlert();

  return (
    <Screen title={t('social.blockedUsersTitle')} onBack={() => router.back()} withBottomInset>
      {blocked.data ? (
        blocked.data.length > 0 ? (
          blocked.data.map((user) => (
            <UserRow
              key={user.id}
              user={user}
              onPress={() => openUser(user.id, viewer)}
              right={
                <Button
                  label={t('social.unblock')}
                  variant="secondary"
                  compact
                  disabled={unblock.isPending}
                  onPress={() => unblock.mutate(user.id, { onError: showError })}
                />
              }
            />
          ))
        ) : (
          <EmptyState
            title={t('social.blockedUsersEmptyTitle')}
            body={t('social.blockedUsersEmptyBody')}
          />
        )
      ) : blocked.isError || blocked.fetchStatus === 'paused' ? (
        <ErrorState
          message={getErrorMessage(blocked.error)}
          onRetry={() => void blocked.refetch()}
          retrying={blocked.isFetching}
        />
      ) : (
        <LoadingState />
      )}
    </Screen>
  );
}
