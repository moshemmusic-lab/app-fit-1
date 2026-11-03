import type { ReactNode } from 'react';
import { View } from 'react-native';

import { Text } from '@/components/ui/Text';
import { useTheme } from '@/theme/ThemeProvider';

interface SettingsSectionProps {
  title: string;
  hint?: string;
  children: ReactNode;
}

export function SettingsSection({ title, hint, children }: SettingsSectionProps) {
  const { colors, radius, spacing } = useTheme();

  return (
    <View style={{ gap: spacing[3] }}>
      <View style={{ gap: spacing[1] }}>
        <Text variant="heading" accessibilityRole="header">
          {title}
        </Text>
        {hint ? (
          <Text variant="caption" color="textMuted">
            {hint}
          </Text>
        ) : null}
      </View>
      <View
        style={{
          padding: spacing[4],
          gap: spacing[3],
          borderRadius: radius.lg,
          backgroundColor: colors.surface,
        }}
      >
        {children}
      </View>
    </View>
  );
}
