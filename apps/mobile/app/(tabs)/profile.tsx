import { useTranslation } from 'react-i18next';

import { Screen } from '@/components/ui/Screen';
import { ThemePreferencePicker } from '@/features/settings/components/ThemePreferencePicker';

export default function ProfileScreen() {
  const { t } = useTranslation();

  return (
    <Screen title={t('tabs.profile')}>
      <ThemePreferencePicker />
    </Screen>
  );
}
