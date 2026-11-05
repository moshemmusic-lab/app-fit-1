import type { WeightUnit } from '@app-fit/shared/schemas';
import { formatDuration } from '@app-fit/shared/workouts';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';

import { Avatar } from '@/components/ui/Avatar';
import { Text } from '@/components/ui/Text';
import { avatarUrl } from '@/features/account/avatar';
import { useProgressFormat } from '@/features/progress/format';
import { useTheme } from '@/theme/ThemeProvider';

import { useTimeAgo } from '../format';
import type { FeedItem } from '../types';
import { LikeCommentBar } from './LikeCommentBar';

const AVATAR_SIZE = 40;
const SHOWN_EXERCISES = 3;

interface FeedCardProps {
  item: FeedItem;
  unit: WeightUnit;
  /** False on someone's profile, where every card is theirs: only when it was is shown. */
  showUser?: boolean;
  onOpen: () => void;
  onOpenUser: () => void;
  onToggleLike: () => void;
  onOpenComments: () => void;
}

/** A workout in the feed: who and when, its totals and exercises, likes and comments. */
export function FeedCard({
  item,
  unit,
  showUser = true,
  onOpen,
  onOpenUser,
  onToggleLike,
  onOpenComments,
}: FeedCardProps) {
  const { t } = useTranslation();
  const { colors, radius, spacing } = useTheme();
  const format = useProgressFormat(unit);
  const timeAgo = useTimeAgo();
  const durationS = (new Date(item.endedAt).getTime() - new Date(item.startedAt).getTime()) / 1000;
  const hidden = item.exercises.length - SHOWN_EXERCISES;

  const stats = [
    { label: t('workoutSummary.duration'), value: formatDuration(durationS) },
    { label: t('workoutSummary.volume'), value: format.volume(item.volumeKg) },
    ...(item.recordCount > 0
      ? [{ label: t('feed.recordsLabel'), value: String(item.recordCount) }]
      : [{ label: t('workoutSummary.sets'), value: String(item.setCount) }]),
  ];

  return (
    <View
      style={{
        padding: spacing[4],
        gap: spacing[3],
        borderRadius: radius.md,
        backgroundColor: colors.surface,
      }}
    >
      {showUser ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('feed.openProfile', { name: item.user.displayName })}
          onPress={onOpenUser}
          style={({ pressed }) => ({
            flexDirection: 'row',
            alignItems: 'center',
            gap: spacing[3],
            opacity: pressed ? 0.6 : 1,
          })}
        >
          <Avatar
            uri={avatarUrl(item.user.avatarPath)}
            name={item.user.displayName}
            size={AVATAR_SIZE}
            accessibilityLabel={t('profile.avatarLabel', { name: item.user.displayName })}
          />
          <View style={{ flex: 1, gap: 2 }}>
            <Text variant="bodyStrong" numberOfLines={1}>
              {item.user.displayName}
            </Text>
            <Text variant="caption" color="textMuted" numberOfLines={1}>
              {`@${item.user.username} · ${timeAgo(item.startedAt)}`}
            </Text>
          </View>
        </Pressable>
      ) : null}

      <Pressable
        accessibilityRole="button"
        accessibilityHint={t('workoutDetail.title')}
        onPress={onOpen}
        style={({ pressed }) => ({ gap: spacing[3], opacity: pressed ? 0.7 : 1 })}
      >
        <View style={{ gap: 2 }}>
          {showUser ? null : (
            <Text variant="caption" color="textMuted">
              {timeAgo(item.startedAt)}
            </Text>
          )}
          <Text variant="heading">{item.title}</Text>
        </View>
        <View style={{ flexDirection: 'row', gap: spacing[4] }}>
          {stats.map((stat) => (
            <View key={stat.label} style={{ gap: 2 }}>
              <Text variant="caption" color="textMuted">
                {stat.label}
              </Text>
              <Text variant="bodyStrong">{stat.value}</Text>
            </View>
          ))}
        </View>
        <View style={{ gap: spacing[1] }}>
          {item.exercises.slice(0, SHOWN_EXERCISES).map((exercise, index) => (
            <Text key={`${index}-${exercise.name}`} variant="body" numberOfLines={1}>
              <Text variant="body" color="textMuted">
                {`${t('feed.sets', { count: exercise.setCount })} · `}
              </Text>
              {exercise.name}
            </Text>
          ))}
          {hidden > 0 ? (
            <Text variant="caption" color="textMuted">
              {t('feed.moreExercises', { count: hidden })}
            </Text>
          ) : null}
        </View>
      </Pressable>

      <View style={{ height: 1, backgroundColor: colors.line }} />
      <LikeCommentBar
        likeCount={item.likeCount}
        commentCount={item.commentCount}
        liked={item.liked}
        onToggleLike={onToggleLike}
        onOpenComments={onOpenComments}
      />
    </View>
  );
}
