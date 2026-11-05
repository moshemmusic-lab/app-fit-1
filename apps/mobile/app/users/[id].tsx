import { router, useLocalSearchParams } from 'expo-router';
import { Ban, Ellipsis, Flag, Lock, UserMinus } from 'lucide-react-native';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, View } from 'react-native';

import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { IconButton } from '@/components/ui/IconButton';
import { OptionsSheet, type OptionsSheetConfig } from '@/components/ui/OptionsSheet';
import { Screen } from '@/components/ui/Screen';
import { ErrorState, LoadingState } from '@/components/ui/StateViews';
import { StatTile } from '@/components/ui/StatTile';
import { Text } from '@/components/ui/Text';
import { useSettings } from '@/features/account/api';
import { avatarUrl } from '@/features/account/avatar';
import { useUserId } from '@/features/auth/session';
import {
  useCopyRoutine,
  useFeed,
  useProfileView,
  useRemoveFollower,
  useSetLike,
  useUnblock,
  useUserRoutines,
} from '@/features/social/api';
import { FeedCard } from '@/features/social/components/FeedCard';
import { FollowButton } from '@/features/social/components/FollowButton';
import { useSocialErrorAlert } from '@/features/social/format';
import { openComments, openUser, openWorkout } from '@/features/social/navigation';
import { useConfirmBlock, useReportSheet } from '@/features/social/report';
import type { ProfileView, SharedRoutine } from '@/features/social/types';
import { useErrorMessage } from '@/lib/use-error-message';
import { useTheme } from '@/theme/ThemeProvider';

const AVATAR_SIZE = 88;

/** Someone's profile: who they are, follow them, and what they share. */
export default function UserProfileScreen() {
  const { t } = useTranslation();
  const getErrorMessage = useErrorMessage();
  const { id } = useLocalSearchParams<{ id: string }>();
  const viewer = useUserId();
  const profile = useProfileView(viewer, id);
  const removeFollower = useRemoveFollower(viewer);
  const confirmBlock = useConfirmBlock();
  const reportSheet = useReportSheet();
  const showError = useSocialErrorAlert();
  const [sheet, setSheet] = useState<OptionsSheetConfig | null>(null);
  const view = profile.data;

  const openOptions = (person: ProfileView) =>
    setSheet({
      title: `@${person.username}`,
      options: [
        ...(person.followsMe
          ? [
              {
                label: t('social.removeFollower'),
                icon: UserMinus,
                onPress: () => removeFollower.mutate(person.id, { onError: showError }),
              },
            ]
          : []),
        ...(person.blocked
          ? []
          : [{ label: t('social.block'), icon: Ban, onPress: () => confirmBlock(person) }]),
        {
          label: t('social.report'),
          icon: Flag,
          onPress: () => setSheet(reportSheet('user', person.id, person)),
        },
      ],
    });

  return (
    <Screen
      withBottomInset
      onBack={() => router.back()}
      headerRight={
        view ? (
          <IconButton
            icon={Ellipsis}
            label={t('social.profileOptions')}
            onPress={() => openOptions(view)}
          />
        ) : undefined
      }
    >
      {view ? (
        <ProfileContent view={view} viewer={viewer} />
      ) : view === null ? (
        <EmptyState title={t('social.notFoundTitle')} body={t('social.notFoundBody')} />
      ) : profile.isError || profile.fetchStatus === 'paused' ? (
        <ErrorState
          message={getErrorMessage(profile.error)}
          onRetry={() => void profile.refetch()}
          retrying={profile.isFetching}
        />
      ) : (
        <LoadingState />
      )}
      <OptionsSheet config={sheet} onClose={() => setSheet(null)} />
    </Screen>
  );
}

function ProfileContent({ view, viewer }: { view: ProfileView; viewer: string }) {
  const { t } = useTranslation();
  const { colors, sizes, spacing } = useTheme();
  const unblock = useUnblock(viewer);
  const showError = useSocialErrorAlert();

  return (
    <>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[4] }}>
        <Avatar
          uri={avatarUrl(view.avatarPath)}
          name={view.displayName}
          size={AVATAR_SIZE}
          accessibilityLabel={t('profile.avatarLabel', { name: view.displayName })}
        />
        <View style={{ flex: 1, gap: spacing[1] }}>
          <Text variant="heading" accessibilityRole="header">
            {view.displayName}
          </Text>
          <Text variant="body" color="textMuted">
            @{view.username}
          </Text>
          {view.isPrivate || view.followsMe ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[2] }}>
              {view.isPrivate ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[1] }}>
                  <Lock size={sizes.icon * 0.6} strokeWidth={1.8} color={colors.textMuted} />
                  <Text variant="caption" color="textMuted">
                    {t('profile.privateBadge')}
                  </Text>
                </View>
              ) : null}
              {view.followsMe ? (
                <Text variant="caption" color="textMuted">
                  {t('social.followsYou')}
                </Text>
              ) : null}
            </View>
          ) : null}
        </View>
      </View>

      {view.bio ? <Text variant="body">{view.bio}</Text> : null}

      <View style={{ flexDirection: 'row', gap: spacing[2] }}>
        <StatTile label={t('profile.stats.workouts')} value={String(view.workoutCount)} />
        <StatTile label={t('profile.stats.followers')} value={String(view.followerCount)} />
        <StatTile label={t('profile.stats.following')} value={String(view.followingCount)} />
      </View>

      {view.blocked ? (
        <>
          <EmptyState title={t('social.blockedTitle')} body={t('social.blockedBody')} />
          <Button
            label={t('social.unblock')}
            variant="secondary"
            loading={unblock.isPending}
            onPress={() => unblock.mutate(view.id, { onError: showError })}
          />
        </>
      ) : (
        <>
          <FollowButton user={view} status={view.followStatus} followsMe={view.followsMe} />
          {view.canSee ? (
            <SharedContent userId={view.id} viewer={viewer} />
          ) : (
            <EmptyState title={t('social.privateTitle')} body={t('social.privateBody')} />
          )}
        </>
      )}
    </>
  );
}

function SharedContent({ userId, viewer }: { userId: string; viewer: string }) {
  const { t } = useTranslation();
  const { spacing } = useTheme();
  const unit = useSettings(viewer).data?.units ?? 'kg';
  const feed = useFeed(viewer, userId);
  const routines = useUserRoutines(viewer, userId);
  const setLike = useSetLike(viewer);
  const showError = useSocialErrorAlert();
  const items = feed.data?.pages.flat() ?? [];

  return (
    <>
      {routines.data && routines.data.length > 0 ? (
        <View style={{ gap: spacing[3] }}>
          <Text variant="heading" accessibilityRole="header">
            {t('social.routinesTitle')}
          </Text>
          {routines.data.map((routine) => (
            <SharedRoutineCard key={routine.id} routine={routine} viewer={viewer} />
          ))}
        </View>
      ) : null}

      <View style={{ gap: spacing[3] }}>
        <Text variant="heading" accessibilityRole="header">
          {t('social.workoutsTitle')}
        </Text>
        {feed.data ? (
          items.length > 0 ? (
            <>
              {items.map((item) => (
                <FeedCard
                  key={item.id}
                  item={item}
                  unit={unit}
                  showUser={false}
                  onOpen={() => openWorkout(item.id, item.user.id, viewer)}
                  onOpenUser={() => openUser(item.user.id, viewer)}
                  onToggleLike={() =>
                    setLike.mutate(
                      { workoutId: item.id, liked: !item.liked },
                      { onError: showError },
                    )
                  }
                  onOpenComments={() => openComments(item.id)}
                />
              ))}
              {feed.hasNextPage ? (
                <Button
                  label={t('social.loadMore')}
                  variant="ghost"
                  loading={feed.isFetchingNextPage}
                  onPress={() => void feed.fetchNextPage()}
                />
              ) : null}
            </>
          ) : (
            <EmptyState title={t('social.noWorkoutsTitle')} body={t('social.noWorkoutsBody')} />
          )
        ) : (
          <LoadingState />
        )}
      </View>
    </>
  );
}

function SharedRoutineCard({ routine, viewer }: { routine: SharedRoutine; viewer: string }) {
  const { t } = useTranslation();
  const { spacing } = useTheme();
  const copyRoutine = useCopyRoutine(viewer);
  const showError = useSocialErrorAlert();
  const summary = routine.exercises
    .map((exercise) => `${t('feed.sets', { count: exercise.setCount })} · ${exercise.name}`)
    .join('\n');

  return (
    <Card>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[3] }}>
        <View style={{ flex: 1, gap: spacing[1] }}>
          <Text variant="bodyStrong">{routine.name}</Text>
          <Text variant="caption" color="textMuted">
            {t('routines.exerciseCount', { count: routine.exercises.length })}
          </Text>
        </View>
        <Button
          label={t('social.copyRoutine')}
          accessibilityLabel={t('social.copyRoutineLabel', { name: routine.name })}
          variant="secondary"
          compact
          loading={copyRoutine.isPending}
          onPress={() =>
            copyRoutine.mutate(routine.id, {
              onError: showError,
              onSuccess: () => Alert.alert(t('social.copiedTitle'), t('social.copiedBody')),
            })
          }
        />
      </View>
      {summary ? (
        <Text variant="body" color="textMuted">
          {summary}
        </Text>
      ) : null}
    </Card>
  );
}
