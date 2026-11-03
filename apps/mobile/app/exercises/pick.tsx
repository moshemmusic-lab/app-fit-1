import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/Button';
import { Screen } from '@/components/ui/Screen';
import type { LibraryExercise } from '@/features/exercises/api';
import { ExerciseLibraryView } from '@/features/exercises/components/ExerciseLibraryView';
import { useWorkoutStore, type PickedExercise } from '@/features/workouts/workout-store';

const toPicked = ({ id, trackingType }: LibraryExercise): PickedExercise => ({
  exerciseId: id,
  trackingType,
});

/**
 * Choose exercises for the workout in progress: several to add (in the order tapped), or
 * one to replace an exercise when opened with `?replace=<exercise row id>`.
 */
export default function PickExercisesScreen() {
  const { t } = useTranslation();
  const { replace } = useLocalSearchParams<{ replace?: string }>();
  const addExercises = useWorkoutStore((state) => state.addExercises);
  const replaceExercise = useWorkoutStore((state) => state.replaceExercise);
  const [selected, setSelected] = useState<PickedExercise[]>([]);

  if (replace) {
    return (
      <Screen
        title={t('exercises.replaceTitle')}
        onBack={() => router.back()}
        withBottomInset
        scroll={false}
      >
        <ExerciseLibraryView
          onPressExercise={(exercise) => {
            replaceExercise(replace, toPicked(exercise));
            router.back();
          }}
        />
      </Screen>
    );
  }

  const toggle = (exercise: LibraryExercise) =>
    setSelected((current) =>
      current.some((picked) => picked.exerciseId === exercise.id)
        ? current.filter((picked) => picked.exerciseId !== exercise.id)
        : [...current, toPicked(exercise)],
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
        selectedIds={new Set(selected.map((picked) => picked.exerciseId))}
        onPressExercise={toggle}
      />
    </Screen>
  );
}
