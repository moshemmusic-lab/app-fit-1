import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';

import { Avatar } from '@/components/ui/Avatar';
import { Text } from '@/components/ui/Text';
import { avatarUrl } from '@/features/account/avatar';
import { useTheme } from '@/theme/ThemeProvider';

import type { UserCard } from '../types';

const AVATAR_SIZE = 44;

interface UserRowProps {
  user: UserCard;
  /** Under the name instead of "@username", e.g. "Te sigue". */
  detail?: string;
  onPress: () => void;
  /** Buttons on the right (follow, accept…). */
  right?: ReactNode;
}

/** A person in a list: photo, name and @username; tap to open their profile. */
export function UserRow({ user, detail, onPress, right }: UserRowProps) {
  const { t } = useTranslation();
  const { sizes, spacing } = useTheme();

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[3] }}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('feed.openProfile', { name: user.displayName })}
        onPress={onPress}
        style={({ pressed }) => ({
          flex: 1,
          minHeight: sizes.touchMin + spacing[2],
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing[3],
          opacity: pressed ? 0.6 : 1,
        })}
      >
        <Avatar
          uri={avatarUrl(user.avatarPath)}
          name={user.displayName}
          size={AVATAR_SIZE}
          accessibilityLabel={t('profile.avatarLabel', { name: user.displayName })}
        />
        <View style={{ flex: 1, gap: 2 }}>
          <Text variant="bodyStrong" numberOfLines={1}>
            {user.displayName}
          </Text>
          <Text variant="caption" color="textMuted" numberOfLines={1}>
            {detail ?? `@${user.username}`}
          </Text>
        </View>
      </Pressable>
      {right}
    </View>
  );
}
