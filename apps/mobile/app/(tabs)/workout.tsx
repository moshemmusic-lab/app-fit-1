import { useTranslation } from 'react-i18next';

import { EmptyState } from '@/components/ui/EmptyState';
import { Screen } from '@/components/ui/Screen';

export default function WorkoutScreen() {
  const { t } = useTranslation();

  return (
    <Screen title={t('tabs.workout')}>
      <EmptyState title={t('workout.emptyTitle')} body={t('workout.emptyBody')} />
    </Screen>
  );
}
