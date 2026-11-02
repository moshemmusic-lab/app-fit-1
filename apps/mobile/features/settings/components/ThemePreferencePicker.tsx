import { useTranslation } from 'react-i18next';

import { ChipGroup } from '@/components/ui/ChipGroup';

import { useThemePreferenceStore } from '../theme-preference-store';

export function ThemePreferencePicker() {
  const { t } = useTranslation();
  const preference = useThemePreferenceStore((state) => state.preference);
  const setPreference = useThemePreferenceStore((state) => state.setPreference);

  return (
    <ChipGroup
      accessibilityLabel={t('settings.appearanceTitle')}
      options={[
        { value: 'dark', label: t('settings.themeDark') },
        { value: 'light', label: t('settings.themeLight') },
        { value: 'system', label: t('settings.themeSystem') },
      ]}
      value={preference}
      onChange={setPreference}
    />
  );
}
