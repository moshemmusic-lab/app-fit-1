import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Text } from '@/components/ui/Text';
import { useTheme } from '@/theme/ThemeProvider';

interface OnboardingProgressProps {
  current: number;
  total: number;
}

export function OnboardingProgress({ current, total }: OnboardingProgressProps) {
  const { t } = useTranslation();
  const { colors, radius, spacing } = useTheme();

  return (
    <View
      accessible
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 1, max: total, now: current }}
      style={{ gap: spacing[2] }}
    >
      <View style={{ flexDirection: 'row', gap: spacing[1] }}>
        {Array.from({ length: total }, (_, index) => (
          <View
            key={index}
            style={{
              flex: 1,
              height: spacing[1],
              borderRadius: radius.pill,
              backgroundColor: index < current ? colors.lime : colors.surface2,
            }}
          />
        ))}
      </View>
      <Text variant="label" color="textMuted">
        {t('onboarding.progress', { current, total })}
      </Text>
    </View>
  );
}
