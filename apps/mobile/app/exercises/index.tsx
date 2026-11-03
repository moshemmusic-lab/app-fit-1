import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { Screen } from '@/components/ui/Screen';
import { ExerciseLibraryView } from '@/features/exercises/components/ExerciseLibraryView';

export default function ExerciseLibraryScreen() {
  const { t } = useTranslation();

  return (
    <Screen
      title={t('exercises.title')}
      onBack={() => router.back()}
      withBottomInset
      scroll={false}
    >
      <ExerciseLibraryView
        onPressExercise={(exercise) =>
          router.push({ pathname: '/exercises/[id]', params: { id: exercise.id } })
        }
      />
    </Screen>
  );
}
