import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/Button';
import { Screen } from '@/components/ui/Screen';
import { useUserId } from '@/features/auth/session';
import { ExerciseLibraryView } from '@/features/exercises/components/ExerciseLibraryView';
import { useRecentExerciseIds } from '@/features/progress/api';

const createExercise = (name: string) =>
  router.push({ pathname: '/exercises/edit', params: { name } });

export default function ExerciseLibraryScreen() {
  const { t } = useTranslation();
  const userId = useUserId();
  const recentIds = useRecentExerciseIds(userId);

  return (
    <Screen
      title={t('exercises.title')}
      onBack={() => router.back()}
      headerRight={
        <Button
          label={t('exercises.createShort')}
          variant="ghost"
          compact
          onPress={() => createExercise('')}
        />
      }
      withBottomInset
      scroll={false}
    >
      <ExerciseLibraryView
        recentIds={recentIds}
        onPressExercise={(exercise) =>
          router.push({ pathname: '/exercises/[id]', params: { id: exercise.id } })
        }
        onCreateExercise={createExercise}
      />
    </Screen>
  );
}
