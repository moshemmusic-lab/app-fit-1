import type { TrackingType } from '@app-fit/shared/exercises';
import { canCompleteSet, fillFromPrevious, type SetValues } from '@app-fit/shared/workouts';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { MoreHorizontal, Plus } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { Alert, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { IconButton } from '@/components/ui/IconButton';
import { Screen } from '@/components/ui/Screen';
import { LoadingState } from '@/components/ui/StateViews';
import { Text } from '@/components/ui/Text';
import { useSettings } from '@/features/account/api';
import { useUserId } from '@/features/auth/session';
import { useExerciseLibrary } from '@/features/exercises/api';
import { ElapsedTime } from '@/features/workouts/components/ElapsedTime';
import { WorkoutExerciseCard } from '@/features/workouts/components/WorkoutExerciseCard';
import { completedSetCount, hasIncompleteSets } from '@/features/workouts/finish';
import { syncPendingWorkouts } from '@/features/workouts/sync';
import type { DraftExercise, DraftSet } from '@/features/workouts/types';
import { useActiveWorkout, useLastSets, useWorkoutStore } from '@/features/workouts/workout-store';
import { useTheme } from '@/theme/ThemeProvider';

export default function ActiveWorkoutScreen() {
  const { t } = useTranslation();
  const { spacing } = useTheme();
  const userId = useUserId();
  const workout = useActiveWorkout(userId);
  const library = useExerciseLibrary();
  const unit = useSettings(userId).data?.units ?? 'kg';
  const lastSets = useLastSets(userId);
  const store = useWorkoutStore.getState;

  if (!workout) {
    return (
      <Screen withBottomInset onBack={() => router.back()}>
        <EmptyState title={t('workout.emptyTitle')} body={t('workout.emptyBody')} />
      </Screen>
    );
  }

  const exercisesById = new Map((library.data ?? []).map((exercise) => [exercise.id, exercise]));

  const toggleSet = (
    exercise: DraftExercise,
    trackingType: TrackingType,
    set: DraftSet,
    suggestion: SetValues | undefined,
  ) => {
    if (set.completedAt) {
      store().uncompleteSet(exercise.id, set.id);
      return;
    }
    // Empty fields take the suggested values: one tap when nothing changed.
    const values = fillFromPrevious(set, suggestion, trackingType);
    if (!canCompleteSet(values, trackingType)) {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }
    store().completeSet(exercise.id, set.id, values);
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const confirmDiscard = () =>
    Alert.alert(t('activeWorkout.discardConfirmTitle'), t('activeWorkout.discardConfirmBody'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('activeWorkout.discard'),
        style: 'destructive',
        onPress: () => {
          store().discard();
          router.back();
        },
      },
    ]);

  const finish = () => {
    if (completedSetCount(workout) === 0) {
      Alert.alert(t('activeWorkout.finishEmptyTitle'), t('activeWorkout.finishEmptyBody'), [
        { text: t('activeWorkout.keepTraining'), style: 'cancel' },
        { text: t('activeWorkout.discard'), style: 'destructive', onPress: confirmDiscard },
      ]);
      return;
    }
    const save = () => {
      store().finish(new Date());
      void syncPendingWorkouts(userId);
      router.replace('/workout-summary');
    };
    if (hasIncompleteSets(workout)) {
      Alert.alert(
        t('activeWorkout.finishIncompleteTitle'),
        t('activeWorkout.finishIncompleteBody'),
        [
          { text: t('activeWorkout.keepTraining'), style: 'cancel' },
          { text: t('activeWorkout.finish'), onPress: save },
        ],
      );
      return;
    }
    save();
  };

  return (
    <Screen
      withBottomInset
      onBack={() => router.back()}
      headerRight={
        <IconButton
          icon={MoreHorizontal}
          label={t('activeWorkout.workoutOptions')}
          onPress={() =>
            Alert.alert(t('activeWorkout.workoutOptions'), undefined, [
              { text: t('activeWorkout.discard'), style: 'destructive', onPress: confirmDiscard },
              { text: t('common.cancel'), style: 'cancel' },
            ])
          }
        />
      }
      header={
        <View style={{ gap: spacing[1] }}>
          <Text variant="screenTitle" accessibilityRole="header">
            {workout.title}
          </Text>
          <ElapsedTime startedAt={workout.startedAt} />
        </View>
      }
      footer={
        <View style={{ flexDirection: 'row', gap: spacing[2] }}>
          <View style={{ flex: 1 }}>
            <Button
              label={t('activeWorkout.addExercise')}
              variant="secondary"
              tall
              icon={Plus}
              onPress={() => router.push('/exercises/pick')}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Button label={t('activeWorkout.finish')} onPress={finish} />
          </View>
        </View>
      }
    >
      {workout.exercises.length === 0 ? (
        <EmptyState title={t('activeWorkout.emptyTitle')} body={t('activeWorkout.emptyBody')} />
      ) : !library.data ? (
        <LoadingState />
      ) : (
        workout.exercises.map((exercise) => {
          const libraryExercise = exercisesById.get(exercise.exerciseId);
          if (!libraryExercise) return null;
          const { trackingType } = libraryExercise;
          return (
            <WorkoutExerciseCard
              key={exercise.id}
              exercise={exercise}
              name={libraryExercise.name}
              trackingType={trackingType}
              unit={unit}
              previousSets={lastSets[exercise.exerciseId]}
              onChangeSet={(set, patch) => store().updateSet(exercise.id, set.id, patch)}
              onToggleSet={(set, suggestion) => toggleSet(exercise, trackingType, set, suggestion)}
              onAddSet={() => store().addSet(exercise.id)}
              onSetOptions={(set) =>
                Alert.alert(
                  t('activeWorkout.setOptions', { number: exercise.sets.indexOf(set) + 1 }),
                  undefined,
                  [
                    {
                      text: t('activeWorkout.removeSet'),
                      style: 'destructive',
                      onPress: () => store().removeSet(exercise.id, set.id),
                    },
                    { text: t('common.cancel'), style: 'cancel' },
                  ],
                )
              }
              onOptions={() =>
                Alert.alert(libraryExercise.name, undefined, [
                  {
                    text: t('activeWorkout.removeExercise'),
                    style: 'destructive',
                    onPress: () => store().removeExercise(exercise.id),
                  },
                  { text: t('common.cancel'), style: 'cancel' },
                ])
              }
            />
          );
        })
      )}
    </Screen>
  );
}
