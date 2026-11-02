import type { ReactNode } from 'react';
import { ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Text } from '@/components/ui/Text';
import { useTheme } from '@/theme/ThemeProvider';

interface ScreenProps {
  title?: string;
  header?: ReactNode;
  children?: ReactNode;
}

/** Base layout for every tab: theme background, safe area and the screen title. */
export function Screen({ title, header, children }: ScreenProps) {
  const { colors, spacing } = useTheme();

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView contentContainerStyle={{ padding: spacing[4], gap: spacing[6] }}>
        {header}
        {title ? (
          <Text variant="screenTitle" accessibilityRole="header">
            {title}
          </Text>
        ) : null}
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}
