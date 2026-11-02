import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Chip } from '@/components/ui/Chip';
import { Text } from '@/components/ui/Text';
import { useTheme } from '@/theme/ThemeProvider';

import { useThemePreferenceStore, type ThemePreference } from '../theme-preference-store';

const options = [
  { value: 'dark', labelKey: 'profile.themeDark' },
  { value: 'light', labelKey: 'profile.themeLight' },
  { value: 'system', labelKey: 'profile.themeSystem' },
] as const satisfies readonly { value: ThemePreference; labelKey: string }[];

export function ThemePreferencePicker() {
  const { t } = useTranslation();
  const { spacing } = useTheme();
  const preference = useThemePreferenceStore((state) => state.preference);
  const setPreference = useThemePreferenceStore((state) => state.setPreference);

  return (
    <View style={{ gap: spacing[3] }}>
      <View style={{ gap: spacing[1] }}>
        <Text variant="heading">{t('profile.appearance')}</Text>
        <Text variant="caption" color="textMuted">
          {t('profile.appearanceHint')}
        </Text>
      </View>
      <View
        accessibilityRole="radiogroup"
        style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing[2] }}
      >
        {options.map((option) => (
          <Chip
            key={option.value}
            label={t(option.labelKey)}
            selected={preference === option.value}
            onPress={() => setPreference(option.value)}
          />
        ))}
      </View>
    </View>
  );
}
