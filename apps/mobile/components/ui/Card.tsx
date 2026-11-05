import type { ReactNode } from 'react';
import { View, type ViewProps } from 'react-native';

import { useTheme } from '@/theme/ThemeProvider';

interface CardProps extends Omit<ViewProps, 'style'> {
  children: ReactNode;
}

/** A surface block that groups related content (a chart, a calendar…). */
export function Card({ children, ...props }: CardProps) {
  const { colors, radius, spacing } = useTheme();

  return (
    <View
      {...props}
      style={{
        padding: spacing[4],
        gap: spacing[3],
        borderRadius: radius.md,
        backgroundColor: colors.surface,
      }}
    >
      {children}
    </View>
  );
}
