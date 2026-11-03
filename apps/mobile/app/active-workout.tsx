import type { TrackingType } from '@app-fit/shared/exercises';
import {
  canCompleteSet,
  fillFromPrevious,
  formatDuration,
  partOfDay,
  type SetValues,
} from '@app-fit/shared/workouts';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import {
  ArrowDown,
  ArrowLeftRight,
  ArrowUp,
  MoreHorizontal,
  NotebookPen,
  Plus,
  Trash2,
} from 'lucide-react-native';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, TextInput, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { IconButton } from '@/components/ui/IconButton';
import {
  OptionsSheet,
  type OptionsSheetConfig,
  type SheetOption,
} from '@/components/ui/OptionsSheet';
import { Screen } from '@/components/ui/Screen';
import { LoadingState } from '@/components/ui/StateViews';
import { TextField } from '@/components/ui/TextField';
import { useSettings } from '@/features/account/api';
import { useUserId } from '@/features/auth/session';
import { useExerciseLibrary } from '@/features/exercises/api';
import { ElapsedTime } from '@/features/workouts/components/ElapsedTime';
import { RestTimerBar } from '@/features/workouts/components/RestTimerBar';
import { WorkoutExerciseCard } from '@/features/workouts/components/WorkoutExerciseCard';
import { completedSetCount, hasIncompleteSets } from '@/features/workouts/finish';
import { restPresetsS } from '@/features/workouts/rest';
import { useRestTimerControls } from '@/features/workouts/rest-timer';
import { syncPendingWorkouts } from '@/features/workouts/sync';
import type { DraftExercise, DraftSet, WorkoutSetType } from '@/features/workouts/types';
import { useActiveWorkout, useLastSets, useWorkoutStore } from '@/features/workouts/workout-store';
import { fontNameForVariant } from '@/theme/font-names';
import { useTheme } from '@/theme/ThemeProvider';

const setTypes: readonly WorkoutSetType[] = ['warmup', 'normal', 'drop', 'failure'];

export default function ActiveWorkoutScreen() {
  const { t } = useTranslation();
  const { colors, spacing, typography } = useTheme();
  const userId = useUserId();
  const workout = useActiveWorkout(userId);
  const library = useExerciseLibrary();
  const unit = useSettings(userId).data?.units ?? 'kg';
  const lastSets = useLastSets(userId);
  const rest = useRestTimerControls();
  const [sheet, setSheet] = useState<OptionsSheetConfig | null>(null);
  // Exercises whose note field was opened with "Añadir nota" (the rest show it when it has text).
  const [openNotes, setOpenNotes] = useState<ReadonlySet<string>>(new Set());
  const store = useWorkoutStore.getState;

  if (!workout) {
    return (
      <Screen withBottomInset onBack={() => router.back()}>
        <EmptyState title={t('workout.emptyTitle')} body={t('workout.emptyBody')} />
      </Screen>
    );
  }

  const exercisesById = new Map((library.data ?? []).map((exercise) => [exercise.id, exercise]));
  const defaultTitle = t(`workout.titles.${partOfDay(new Date(workout.startedAt))}`);
  const hasCompletedSets = (exercise: DraftExercise) =>
    exercise.sets.some((set) => set.completedAt !== null);

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
    // Marking the set starts the rest (docs/PRODUCT.md: two taps per set).
    if (exercise.restSeconds !== null) rest.start(exercise.restSeconds);
  };

  const confirm = (title: string, body: string, action: string, onConfirm: () => void) =>
    Alert.alert(title, body, [
      { text: t('common.cancel'), style: 'cancel' },
      { text: action, style: 'destructive', onPress: onConfirm },
    ]);

  const confirmDiscard = () =>
    confirm(
      t('activeWorkout.discardConfirmTitle'),
      t('activeWorkout.discardConfirmBody'),
      t('activeWorkout.discard'),
      () => {
        rest.stop();
        store().discard();
        router.back();
      },
    );

  const finish = () => {
    if (completedSetCount(workout) === 0) {
      Alert.alert(t('activeWorkout.finishEmptyTitle'), t('activeWorkout.finishEmptyBody'), [
        { text: t('activeWorkout.keepTraining'), style: 'cancel' },
        { text: t('activeWorkout.discard'), style: 'destructive', onPress: confirmDiscard },
      ]);
      return;
    }
    const save = () => {
      rest.stop();
      store().finish(new Date(), defaultTitle);
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

  const openExerciseOptions = (exercise: DraftExercise, name: string, index: number) => {
    const replace = () =>
      router.push({ pathname: '/exercises/pick', params: { replace: exercise.id } });
    const remove = () => store().removeExercise(exercise.id);
    const noteOpen = openNotes.has(exercise.id) || exercise.notes !== '';

    const options: SheetOption[] = [
      {
        label: t('activeWorkout.replaceExercise'),
        icon: ArrowLeftRight,
        onPress: () =>
          hasCompletedSets(exercise)
            ? confirm(
                t('activeWorkout.replaceConfirmTitle'),
                t('activeWorkout.replaceConfirmBody'),
                t('activeWorkout.replaceExercise'),
                replace,
              )
            : replace(),
      },
    ];
    if (index > 0) {
      options.push({
        label: t('activeWorkout.moveUp'),
        icon: ArrowUp,
        onPress: () => store().moveExercise(exercise.id, -1),
      });
    }
    if (index < workout.exercises.length - 1) {
      options.push({
        label: t('activeWorkout.moveDown'),
        icon: ArrowDown,
        onPress: () => store().moveExercise(exercise.id, 1),
      });
    }
    if (!noteOpen) {
      options.push({
        label: t('activeWorkout.addNote'),
        icon: NotebookPen,
        onPress: () => setOpenNotes((current) => new Set(current).add(exercise.id)),
      });
    }
    options.push({
      label: t('activeWorkout.removeExercise'),
      icon: Trash2,
      onPress: () =>
        hasCompletedSets(exercise)
          ? confirm(
              t('activeWorkout.removeConfirmTitle'),
              t('activeWorkout.removeConfirmBody'),
              t('activeWorkout.removeExercise'),
              remove,
            )
          : remove(),
    });
    setSheet({ title: name, options });
  };

  const openSetOptions = (exercise: DraftExercise, set: DraftSet, setName: string) =>
    setSheet({
      title: setName,
      options: [
        ...setTypes.map((setType) => ({
          label: t(`activeWorkout.setTypes.${setType}`),
          selected: set.setType === setType,
          onPress: () => store().setSetType(exercise.id, set.id, setType),
        })),
        {
          label: t('activeWorkout.removeSet'),
          icon: Trash2,
          onPress: () => store().removeSet(exercise.id, set.id),
        },
      ],
    });

  const openRestOptions = (exercise: DraftExercise) =>
    setSheet({
      title: t('activeWorkout.restTitle'),
      options: [
        {
          label: t('activeWorkout.restNone'),
          selected: exercise.restSeconds === null,
          onPress: () => store().setRestSeconds(exercise.id, null),
        },
        ...restPresetsS.map((seconds) => ({
          label: formatDuration(seconds),
          selected: exercise.restSeconds === seconds,
          onPress: () => store().setRestSeconds(exercise.id, seconds),
        })),
      ],
    });

  return (
    <Screen
      withBottomInset
      onBack={() => router.back()}
      headerRight={
        <IconButton
          icon={MoreHorizontal}
          label={t('activeWorkout.workoutOptions')}
          onPress={() =>
            setSheet({
              title: t('activeWorkout.workoutOptions'),
              options: [
                { label: t('activeWorkout.discard'), icon: Trash2, onPress: confirmDiscard },
              ],
            })
          }
        />
      }
      header={
        <View style={{ gap: spacing[1] }}>
          <TextInput
            accessibilityLabel={t('activeWorkout.titleLabel')}
            accessibilityRole="header"
            value={workout.title}
            onChangeText={(title) => store().setTitle(title)}
            onBlur={() => store().setTitle(workout.title.trim() || defaultTitle)}
            maxLength={80}
            returnKeyType="done"
            selectionColor={colors.accentText}
            cursorColor={colors.accentText}
            style={{
              padding: 0,
              color: colors.text,
              fontFamily: fontNameForVariant('screenTitle'),
              fontSize: typography.screenTitle.fontSize,
            }}
          />
          <ElapsedTime startedAt={workout.startedAt} />
        </View>
      }
      footer={
        <View style={{ gap: spacing[2] }}>
          <RestTimerBar />
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
        </View>
      }
    >
      {workout.exercises.length === 0 ? (
        <EmptyState title={t('activeWorkout.emptyTitle')} body={t('activeWorkout.emptyBody')} />
      ) : !library.data ? (
        <LoadingState />
      ) : (
        workout.exercises.map((exercise, index) => {
          const libraryExercise = exercisesById.get(exercise.exerciseId);
          if (!libraryExercise) return null;
          const { trackingType, name } = libraryExercise;
          return (
            <WorkoutExerciseCard
              key={exercise.id}
              exercise={exercise}
              name={name}
              trackingType={trackingType}
              unit={unit}
              previousSets={lastSets[exercise.exerciseId]}
              noteOpen={openNotes.has(exercise.id) || exercise.notes !== ''}
              onChangeNotes={(notes) => store().setExerciseNotes(exercise.id, notes)}
              onChangeSet={(set, patch) => store().updateSet(exercise.id, set.id, patch)}
              onToggleSet={(set, suggestion) => toggleSet(exercise, trackingType, set, suggestion)}
              onSetOptions={(set, setName) => openSetOptions(exercise, set, setName)}
              onAddSet={() => store().addSet(exercise.id)}
              onRestPress={() => openRestOptions(exercise)}
              onOptions={() => openExerciseOptions(exercise, name, index)}
            />
          );
        })
      )}

      <TextField
        label={t('activeWorkout.notesLabel')}
        placeholder={t('activeWorkout.notesPlaceholder')}
        value={workout.notes}
        onChangeText={(notes) => store().setNotes(notes)}
        multiline
        maxLength={2000}
      />

      <OptionsSheet config={sheet} onClose={() => setSheet(null)} />
    </Screen>
  );
}
