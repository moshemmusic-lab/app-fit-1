import { router } from 'expo-router';
import { ChevronRight, Lock, Settings, UserPlus } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';

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
import { useTrainingLog } from '@/features/progress/api';
import { useProfileView } from '@/features/social/api';
import { useErrorMessage } from '@/lib/use-error-message';
import { useTheme } from '@/theme/ThemeProvider';

const AVATAR_SIZE = 88;

export default function ProfileScreen() {
  const { t } = useTranslation();
  const { colors, radius, sizes, spacing } = useTheme();
  const getErrorMessage = useErrorMessage();
  const userId = useUserId();
  const profile = useProfile(userId);
  const workouts = useTrainingLog(userId).entries;
  // Followers, following and requests come from the social side of the profile.
  const social = useProfileView(userId, userId).data;
  const pendingRequests = social?.pendingRequests ?? 0;

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

          <View style={{ flexDirection: 'row', gap: spacing[2] }}>
            <StatTile
              label={t('profile.stats.workouts')}
              value={workouts ? String(workouts.length) : '–'}
            />
            <StatTile
              label={t('profile.stats.followers')}
              value={social ? String(social.followerCount) : '–'}
            />
            <StatTile
              label={t('profile.stats.following')}
              value={social ? String(social.followingCount) : '–'}
            />
          </View>

          {pendingRequests > 0 ? (
            <Pressable
              accessibilityRole="button"
              onPress={() => router.push('/follow-requests')}
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
              <UserPlus size={sizes.icon} strokeWidth={1.8} color={colors.accentText} />
              <Text variant="bodyStrong" style={{ flex: 1 }}>
                {t('social.requestsRow', { count: pendingRequests })}
              </Text>
              <ChevronRight size={sizes.icon * 0.8} strokeWidth={1.8} color={colors.textMuted} />
            </Pressable>
          ) : null}

          <Button
            label={t('profile.editProfile')}
            variant="secondary"
            onPress={() => router.push('/edit-profile')}
          />

          {workouts?.length === 0 ? (
            <EmptyState title={t('profile.emptyTitle')} body={t('profile.emptyBody')} />
          ) : null}
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
