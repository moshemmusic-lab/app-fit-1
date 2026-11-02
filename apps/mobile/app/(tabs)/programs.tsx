import { useTranslation } from 'react-i18next';

import { EmptyState } from '@/components/ui/EmptyState';
import { Screen } from '@/components/ui/Screen';

export default function ProgramsScreen() {
  const { t } = useTranslation();

  return (
    <Screen title={t('tabs.programs')}>
      <EmptyState title={t('programs.emptyTitle')} body={t('programs.emptyBody')} />
    </Screen>
  );
}
