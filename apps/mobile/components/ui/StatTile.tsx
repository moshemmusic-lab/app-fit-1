import { View } from 'react-native';

import { Text } from '@/components/ui/Text';
import { useTheme } from '@/theme/ThemeProvider';

interface StatTileProps {
  label: string;
  value: string;
}

/** Summary figure: uppercase label over a Barlow Condensed number (docs/DESIGN.md). */
export function StatTile({ label, value }: StatTileProps) {
  const { colors, radius, spacing } = useTheme();

  return (
    <View
      accessible
      accessibilityLabel={`${label}: ${value}`}
      style={{
        flex: 1,
        padding: spacing[3],
        gap: spacing[1],
        borderRadius: radius.md,
        backgroundColor: colors.surface,
      }}
    >
      <Text variant="label" color="textMuted">
        {label}
      </Text>
      <Text variant="metric">{value}</Text>
    </View>
  );
}
