import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/Button';
import { Screen } from '@/components/ui/Screen';
import { ExerciseLibraryView } from '@/features/exercises/components/ExerciseLibraryView';
import { useWorkoutStore } from '@/features/workouts/workout-store';

/** Choose one or more exercises to add to the workout in progress, in the order tapped. */
export default function PickExercisesScreen() {
  const { t } = useTranslation();
  const addExercises = useWorkoutStore((state) => state.addExercises);
  const [selected, setSelected] = useState<string[]>([]);

  const toggle = (exerciseId: string) =>
    setSelected((current) =>
      current.includes(exerciseId)
        ? current.filter((id) => id !== exerciseId)
        : [...current, exerciseId],
    );

  return (
    <Screen
      title={t('exercises.pickTitle')}
      onBack={() => router.back()}
      withBottomInset
      scroll={false}
      footer={
        <Button
          label={
            selected.length > 0
              ? t('exercises.addSelected', { count: selected.length })
              : t('exercises.pickTitle')
          }
          disabled={selected.length === 0}
          onPress={() => {
            addExercises(selected);
            router.back();
          }}
        />
      }
    >
      <ExerciseLibraryView
        selectedIds={new Set(selected)}
        onPressExercise={(exercise) => toggle(exercise.id)}
      />
    </Screen>
  );
}
