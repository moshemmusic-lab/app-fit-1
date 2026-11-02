import { useTranslation } from 'react-i18next';

import { Wordmark } from '@/components/Wordmark';
import { EmptyState } from '@/components/ui/EmptyState';
import { Screen } from '@/components/ui/Screen';

export default function HomeScreen() {
  const { t } = useTranslation();

  return (
    <Screen header={<Wordmark />}>
      <EmptyState title={t('home.emptyTitle')} body={t('home.emptyBody')} />
    </Screen>
  );
}
