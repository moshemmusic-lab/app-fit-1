import { router } from 'expo-router';
import { Lock, Settings } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { EmptyState } from '@/components/ui/EmptyState';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { IconButton } from '@/components/ui/IconButton';
import { Screen } from '@/components/ui/Screen';
import { ErrorState, LoadingState } from '@/components/ui/StateViews';
import { StatTile } from '@/components/ui/StatTile';
import { Text } from '@/components/ui/Text';
import { useProfile } from '@/features/account/api';
import { avatarUrl } from '@/features/account/avatar';
import { useUserId } from '@/features/auth/session';
import { useErrorMessage } from '@/lib/use-error-message';
import { useTheme } from '@/theme/ThemeProvider';

const AVATAR_SIZE = 88;

export default function ProfileScreen() {
  const { t } = useTranslation();
  const { colors, sizes, spacing } = useTheme();
  const getErrorMessage = useErrorMessage();
  const profile = useProfile(useUserId());

  return (
    <Screen
      title={t('tabs.profile')}
      headerRight={
        <IconButton
          icon={Settings}
          label={t('profile.openSettings')}
          onPress={() => router.push('/settings')}
        />
      }
    >
      {profile.data ? (
        <>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[4] }}>
            <Avatar
              uri={avatarUrl(profile.data.avatarPath)}
              name={profile.data.displayName ?? ''}
              size={AVATAR_SIZE}
              accessibilityLabel={t('profile.avatarLabel', {
                name: profile.data.displayName ?? '',
              })}
            />
            <View style={{ flex: 1, gap: spacing[1] }}>
              <Text variant="heading">{profile.data.displayName}</Text>
              <Text variant="body" color="textMuted">
                @{profile.data.username}
              </Text>
              {profile.data.isPrivate ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[1] }}>
                  <Lock size={sizes.icon * 0.6} strokeWidth={1.8} color={colors.textMuted} />
                  <Text variant="caption" color="textMuted">
                    {t('profile.privateBadge')}
                  </Text>
                </View>
              ) : null}
            </View>
          </View>

          {profile.data.bio ? <Text variant="body">{profile.data.bio}</Text> : null}

          {/* Real counts arrive with workouts (step 4) and follows (step 7). */}
          <View style={{ flexDirection: 'row', gap: spacing[2] }}>
            <StatTile label={t('profile.stats.workouts')} value="0" />
            <StatTile label={t('profile.stats.followers')} value="0" />
            <StatTile label={t('profile.stats.following')} value="0" />
          </View>

          <Button
            label={t('profile.editProfile')}
            variant="secondary"
            onPress={() => router.push('/edit-profile')}
          />

          <EmptyState title={t('profile.emptyTitle')} body={t('profile.emptyBody')} />
        </>
      ) : profile.isError || profile.fetchStatus === 'paused' ? (
        // Paused = offline with nothing saved on the phone yet: say so instead of loading forever.
        <ErrorState
          message={getErrorMessage(profile.error)}
          onRetry={() => void profile.refetch()}
          retrying={profile.isFetching}
        />
      ) : (
        <LoadingState />
      )}
    </Screen>
  );
}
