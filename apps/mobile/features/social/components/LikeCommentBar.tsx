import { Heart, MessageCircle } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';

import { Text } from '@/components/ui/Text';
import { useTheme } from '@/theme/ThemeProvider';

interface LikeCommentBarProps {
  likeCount: number;
  commentCount: number;
  liked: boolean;
  onToggleLike: () => void;
  onOpenComments: () => void;
}

/** "♥ 3 me gusta · 2 comentarios": tap the heart to like, the bubble for the comments. */
export function LikeCommentBar({
  likeCount,
  commentCount,
  liked,
  onToggleLike,
  onOpenComments,
}: LikeCommentBarProps) {
  const { t } = useTranslation();
  const { colors, sizes, spacing } = useTheme();
  // Liked = filled heart in the accent **and** a different label (not color alone).
  const heartColor = liked ? colors.accentText : colors.text;

  const action = {
    minHeight: sizes.touchMin,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: spacing[2],
    paddingRight: spacing[3],
  };

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[2] }}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ selected: liked }}
        accessibilityLabel={`${liked ? t('feed.unlike') : t('feed.like')}. ${t('feed.likeCount', { count: likeCount })}`}
        onPress={onToggleLike}
        hitSlop={spacing[1]}
        style={({ pressed }) => ({ ...action, opacity: pressed ? 0.6 : 1 })}
      >
        <Heart
          size={sizes.icon}
          strokeWidth={1.8}
          color={heartColor}
          fill={liked ? heartColor : 'transparent'}
        />
        <Text variant="body">{t('feed.likeCount', { count: likeCount })}</Text>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${t('feed.comment')}. ${t('feed.commentCount', { count: commentCount })}`}
        onPress={onOpenComments}
        hitSlop={spacing[1]}
        style={({ pressed }) => ({ ...action, opacity: pressed ? 0.6 : 1 })}
      >
        <MessageCircle size={sizes.icon} strokeWidth={1.8} color={colors.text} />
        <Text variant="body">{t('feed.commentCount', { count: commentCount })}</Text>
      </Pressable>
    </View>
  );
}
