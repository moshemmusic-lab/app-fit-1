import type { FollowStatus } from '@app-fit/shared/social';
import { useTranslation } from 'react-i18next';
import { Alert } from 'react-native';

import { Button } from '@/components/ui/Button';
import { useUserId } from '@/features/auth/session';

import { useFollow, useUnfollow } from '../api';
import { useSocialErrorAlert } from '../format';

interface FollowButtonProps {
  user: { id: string; displayName: string };
  status: FollowStatus | null;
  /** They already follow the signed-in user: "Seguir también". */
  followsMe?: boolean;
  /** Small, for a row; full size on a profile. */
  compact?: boolean;
}

/**
 * Seguir → (Solicitado if their profile is private) → Siguiendo. Tapping "Siguiendo" or
 * "Solicitado" asks before unfollowing or cancelling the request.
 */
export function FollowButton({
  user,
  status,
  followsMe = false,
  compact = false,
}: FollowButtonProps) {
  const { t } = useTranslation();
  const viewer = useUserId();
  const follow = useFollow(viewer);
  const unfollow = useUnfollow(viewer);
  const showError = useSocialErrorAlert();
  const busy = follow.isPending || unfollow.isPending;

  if (status === null) {
    return (
      <Button
        label={followsMe ? t('social.followBack') : t('social.follow')}
        compact={compact}
        loading={busy}
        onPress={() => follow.mutate(user.id, { onError: showError })}
      />
    );
  }

  const confirmUnfollow = () =>
    Alert.alert(
      status === 'pending'
        ? t('social.cancelRequestTitle', { name: user.displayName })
        : t('social.unfollowTitle', { name: user.displayName }),
      status === 'pending' ? undefined : t('social.unfollowBody'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: status === 'pending' ? t('social.cancelRequest') : t('social.unfollow'),
          style: 'destructive',
          onPress: () => unfollow.mutate(user.id, { onError: showError }),
        },
      ],
    );

  return (
    <Button
      label={status === 'pending' ? t('social.requested') : t('social.following')}
      variant="secondary"
      compact={compact}
      tall={!compact}
      loading={busy}
      onPress={confirmUnfollow}
    />
  );
}
