import { Image } from 'expo-image';
import { View } from 'react-native';

import { Text } from '@/components/ui/Text';
import { useTheme } from '@/theme/ThemeProvider';

interface AvatarProps {
  /** Public URL of the photo, or null to show the initial. */
  uri: string | null;
  name: string;
  size: number;
  accessibilityLabel: string;
}

export function Avatar({ uri, name, size, accessibilityLabel }: AvatarProps) {
  const { colors, radius, typography } = useTheme();
  const initial = name.trim().charAt(0).toLocaleUpperCase('es-ES') || '?';

  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel={accessibilityLabel}
      style={{
        width: size,
        height: size,
        borderRadius: radius.pill,
        overflow: 'hidden',
        backgroundColor: colors.surface2,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {uri ? (
        <Image
          source={{ uri }}
          style={{ width: size, height: size }}
          contentFit="cover"
          transition={150}
        />
      ) : (
        <Text
          variant="metric"
          color="textMuted"
          style={{
            fontSize: size * 0.4,
            lineHeight: size * 0.4 * (typography.metric.lineHeight / typography.metric.fontSize),
          }}
        >
          {initial}
        </Text>
      )}
    </View>
  );
}
