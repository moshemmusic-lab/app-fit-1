import { useTranslation } from 'react-i18next';

import { EmptyState } from '@/components/ui/EmptyState';
import { Screen } from '@/components/ui/Screen';

export default function ProgressScreen() {
  const { t } = useTranslation();

  return (
    <Screen title={t('tabs.progress')}>
      <EmptyState title={t('progress.emptyTitle')} body={t('progress.emptyBody')} />
    </Screen>
  );
}
