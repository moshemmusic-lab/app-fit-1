import { router } from 'expo-router';
import { BookOpen } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Screen } from '@/components/ui/Screen';

export default function WorkoutScreen() {
  const { t } = useTranslation();

  return (
    <Screen title={t('tabs.workout')}>
      <EmptyState title={t('workout.emptyTitle')} body={t('workout.emptyBody')} />
      <Button
        label={t('workout.openLibrary')}
        variant="secondary"
        icon={BookOpen}
        onPress={() => router.push('/exercises')}
      />
    </Screen>
  );
}
