import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/Button';
import { ModalHeader } from '@/components/ui/ModalHeader';
import { Screen } from '@/components/ui/Screen';
import { useUserId } from '@/features/auth/session';
import type { LibraryExercise } from '@/features/exercises/api';
import { ExerciseLibraryView } from '@/features/exercises/components/ExerciseLibraryView';
import { useRecentExerciseIds } from '@/features/progress/api';
import { useRoutineDraftStore } from '@/features/routines/routine-draft-store';
import { useWorkoutStore, type PickedExercise } from '@/features/workouts/workout-store';

const toPicked = ({ id, trackingType }: LibraryExercise): PickedExercise => ({
  exerciseId: id,
  trackingType,
});

// Back here, the new exercise shows up under the same search, ready to tap.
const createExercise = (name: string) =>
  router.push({ pathname: '/exercises/edit', params: { name } });

const openExercise = ({ id }: LibraryExercise) =>
  router.push({ pathname: '/exercises/[id]', params: { id } });

/**
 * Choose exercises for the workout in progress, or for the routine being edited with
 * `?for=routine`: several to add (in the order tapped), or one to replace an exercise when
 * opened with `?replace=<exercise row id>`.
 */
export default function PickExercisesScreen() {
  const { t } = useTranslation();
  const { replace, for: target } = useLocalSearchParams<{ replace?: string; for?: string }>();
  const forRoutine = target === 'routine';
  const workoutAdd = useWorkoutStore((state) => state.addExercises);
  const workoutReplace = useWorkoutStore((state) => state.replaceExercise);
  const routineAdd = useRoutineDraftStore((state) => state.addExercises);
  const routineReplace = useRoutineDraftStore((state) => state.replaceExercise);
  const addExercises = forRoutine ? routineAdd : workoutAdd;
  const replaceExercise = forRoutine ? routineReplace : workoutReplace;
  const [selected, setSelected] = useState<PickedExercise[]>([]);
  const userId = useUserId();
  const recentIds = useRecentExerciseIds(userId);

  const header = (title: string) => (
    <ModalHeader
      title={title}
      cancelLabel={t('common.cancel')}
      onCancel={() => router.back()}
      action={{
        label: t('exercises.createShort'),
        variant: 'ghost',
        onPress: () => createExercise(''),
      }}
    />
  );

  if (replace) {
    return (
      <Screen topBar={header(t('exercises.replaceTitle'))} withBottomInset scroll={false}>
        <ExerciseLibraryView
          recentIds={recentIds}
          onPressExercise={(exercise) => {
            replaceExercise(replace, toPicked(exercise));
            router.back();
          }}
          onInfoExercise={openExercise}
          onCreateExercise={createExercise}
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
      topBar={header(t('exercises.pickTitle'))}
      withBottomInset
      scroll={false}
      footer={
        // Shows up once something is selected, with how many will be added.
        selected.length > 0 ? (
          <Button
            label={t('exercises.addSelected', { count: selected.length })}
            onPress={() => {
              addExercises(selected);
              router.back();
            }}
          />
        ) : undefined
      }
    >
      <ExerciseLibraryView
        recentIds={recentIds}
        selectedIds={new Set(selected.map((picked) => picked.exerciseId))}
        onPressExercise={toggle}
        onInfoExercise={openExercise}
        onCreateExercise={createExercise}
      />
    </Screen>
  );
}
