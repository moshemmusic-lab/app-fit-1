import { View } from 'react-native';

import { Text } from '@/components/ui/Text';
import { useTheme } from '@/theme/ThemeProvider';

interface EmptyStateProps {
  title: string;
  body: string;
}

export function EmptyState({ title, body }: EmptyStateProps) {
  const { colors, radius, spacing } = useTheme();

  return (
    <View
      style={{
        backgroundColor: colors.surface,
        borderRadius: radius.md,
        padding: spacing[4],
        gap: spacing[1],
      }}
    >
      <Text variant="heading">{title}</Text>
      <Text color="textMuted">{body}</Text>
    </View>
  );
}
