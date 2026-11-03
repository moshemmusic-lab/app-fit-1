import { accountLimits, routineNameSchema, validationErrorOf } from '@app-fit/shared/schemas';
import { formatDuration } from '@app-fit/shared/workouts';
import { onlineManager } from '@tanstack/react-query';
import * as Crypto from 'expo-crypto';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowDown, ArrowLeftRight, ArrowUp, NotebookPen, Plus, Trash2 } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { ChipGroup } from '@/components/ui/ChipGroup';
import { EmptyState } from '@/components/ui/EmptyState';
import { FormMessage } from '@/components/ui/FormMessage';
import { OptionsSheet, type OptionsSheetConfig } from '@/components/ui/OptionsSheet';
import { Screen } from '@/components/ui/Screen';
import { LoadingState } from '@/components/ui/StateViews';
import { Text } from '@/components/ui/Text';
import { TextField } from '@/components/ui/TextField';
import { useSettings } from '@/features/account/api';
import { useUserId } from '@/features/auth/session';
import { useExerciseLibrary } from '@/features/exercises/api';
import { useRoutineLibrary, useSaveRoutine } from '@/features/routines/api';
import { RoutineExerciseEditor } from '@/features/routines/components/RoutineExerciseEditor';
import { useRoutineDraftStore } from '@/features/routines/routine-draft-store';
import type { RoutineExercise } from '@/features/routines/types';
import { restPresetsS } from '@/features/workouts/rest';
import type { WorkoutSetType } from '@/features/workouts/types';
import { classifyError } from '@/lib/errors';
import { useErrorMessage } from '@/lib/use-error-message';
import { useTheme } from '@/theme/ThemeProvider';

const setTypes: readonly WorkoutSetType[] = ['warmup', 'normal', 'drop', 'failure'];
// ChipGroup needs a string value: '' stands for "no folder".
const NO_FOLDER = '';

/** Create a routine, or edit one with `?id=<routine id>`. */
export default function RoutineEditorScreen() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const userId = useUserId();
  const library = useRoutineLibrary(userId);
  const draft = useRoutineDraftStore((state) => state.draft);
  const begin = useRoutineDraftStore((state) => state.begin);
  const editing = id ? library.data?.routines.find((routine) => routine.id === id) : undefined;

  // Start from the saved routine (or an empty one) once, when the editor opens: a background
  // refresh of the routine list must not wipe the changes being made.
  const started = useRef(false);
  useEffect(() => {
    if (started.current || (id && !editing)) return;
    started.current = true;
    begin(
      editing ?? { id: Crypto.randomUUID(), folderId: null, name: '', notes: '', exercises: [] },
    );
  }, [id, editing, begin]);

  // Deleted on another phone (or a stale link): nothing to edit.
  if (id && library.data && !editing) {
    return (
      <Screen withBottomInset onBack={() => router.back()}>
        <EmptyState
          title={t('routines.editor.notFoundTitle')}
          body={t('routines.editor.notFoundBody')}
        />
      </Screen>
    );
  }

  if (!draft || (id && draft.id !== id)) {
    return (
      <Screen withBottomInset onBack={() => router.back()}>
        <LoadingState />
      </Screen>
    );
  }

  return <RoutineEditor isNew={!id} />;
}

function RoutineEditor({ isNew }: { isNew: boolean }) {
  const { t } = useTranslation();
  const { spacing } = useTheme();
  const getErrorMessage = useErrorMessage();
  const userId = useUserId();
  const unit = useSettings(userId).data?.units ?? 'kg';
  const exercises = useExerciseLibrary();
  const folders = useRoutineLibrary(userId).data?.folders ?? [];
  const store = useRoutineDraftStore.getState;
  const draft = useRoutineDraftStore((state) => state.draft);
  const dirty = useRoutineDraftStore((state) => state.dirty);
  const saveRoutine = useSaveRoutine();
  const [sheet, setSheet] = useState<OptionsSheetConfig | null>(null);
  const [openNotes, setOpenNotes] = useState<ReadonlySet<string>>(new Set());
  const [showErrors, setShowErrors] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  if (!draft) return null;

  const exercisesById = new Map((exercises.data ?? []).map((exercise) => [exercise.id, exercise]));
  const nameError = validationErrorOf(routineNameSchema, draft.name);

  const leave = () => {
    store().clear();
    router.back();
  };

  const close = () => {
    if (!dirty) {
      leave();
      return;
    }
    Alert.alert(t('routines.editor.discardTitle'), t('routines.editor.discardBody'), [
      { text: t('routines.editor.keepEditing'), style: 'cancel' },
      { text: t('routines.editor.discard'), style: 'destructive', onPress: leave },
    ]);
  };

  const save = () => {
    setShowErrors(true);
    setFormError(null);
    if (nameError) return;
    if (draft.exercises.length === 0) {
      setFormError(t('routines.editor.needsExercise'));
      return;
    }
    saveRoutine.mutate(draft, {
      onSuccess: leave,
      onError: (error) =>
        setFormError(
          classifyError(error, onlineManager.isOnline()) === 'offline'
            ? t('routines.offlineEdit')
            : `${t('routines.saveFailed')} ${getErrorMessage(error)}`,
        ),
    });
  };

  const openExerciseOptions = (exercise: RoutineExercise, name: string, index: number) => {
    const noteOpen = openNotes.has(exercise.id) || exercise.notes !== '';
    setSheet({
      title: name,
      options: [
        {
          label: t('activeWorkout.replaceExercise'),
          icon: ArrowLeftRight,
          onPress: () =>
            router.push({
              pathname: '/exercises/pick',
              params: { for: 'routine', replace: exercise.id },
            }),
        },
        ...(index > 0
          ? [
              {
                label: t('activeWorkout.moveUp'),
                icon: ArrowUp,
                onPress: () => store().moveExercise(exercise.id, -1),
              },
            ]
          : []),
        ...(index < draft.exercises.length - 1
          ? [
              {
                label: t('activeWorkout.moveDown'),
                icon: ArrowDown,
                onPress: () => store().moveExercise(exercise.id, 1),
              },
            ]
          : []),
        ...(noteOpen
          ? []
          : [
              {
                label: t('activeWorkout.addNote'),
                icon: NotebookPen,
                onPress: () => setOpenNotes((current) => new Set(current).add(exercise.id)),
              },
            ]),
        {
          label: t('activeWorkout.removeExercise'),
          icon: Trash2,
          onPress: () => store().removeExercise(exercise.id),
        },
      ],
    });
  };

  return (
    <Screen
      withBottomInset
      onBack={close}
      title={isNew ? t('routines.editor.newTitle') : t('routines.editor.editTitle')}
      footer={
        <View style={{ gap: spacing[2] }}>
          {formError ? <FormMessage message={formError} /> : null}
          <View style={{ flexDirection: 'row', gap: spacing[2] }}>
            <View style={{ flex: 1 }}>
              <Button
                label={t('routines.editor.addExercise')}
                variant="secondary"
                tall
                icon={Plus}
                onPress={() =>
                  router.push({ pathname: '/exercises/pick', params: { for: 'routine' } })
                }
              />
            </View>
            <View style={{ flex: 1 }}>
              <Button
                label={t('routines.editor.save')}
                loading={saveRoutine.isPending}
                onPress={save}
              />
            </View>
          </View>
        </View>
      }
    >
      <TextField
        label={t('routines.editor.nameLabel')}
        placeholder={t('routines.editor.namePlaceholder')}
        value={draft.name}
        onChangeText={(name) => store().update({ name })}
        error={showErrors && nameError ? t(`validation.${nameError}`) : null}
        maxLength={accountLimits.routineNameMax}
      />

      {folders.length > 0 ? (
        <View style={{ gap: spacing[2] }}>
          <Text variant="label" color="textMuted">
            {t('routines.editor.folderLabel')}
          </Text>
          <ChipGroup
            accessibilityLabel={t('routines.editor.folderLabel')}
            options={[
              { value: NO_FOLDER, label: t('routines.noFolderOption') },
              ...folders.map((folder) => ({ value: folder.id, label: folder.name })),
            ]}
            value={draft.folderId ?? NO_FOLDER}
            onChange={(value) => store().update({ folderId: value === NO_FOLDER ? null : value })}
          />
        </View>
      ) : null}

      {draft.exercises.length === 0 ? (
        <EmptyState
          title={t('routines.editor.noExercisesTitle')}
          body={t('routines.editor.noExercisesBody')}
        />
      ) : !exercises.data ? (
        <LoadingState />
      ) : (
        draft.exercises.map((exercise, index) => {
          const libraryExercise = exercisesById.get(exercise.exerciseId);
          if (!libraryExercise) return null;
          return (
            <RoutineExerciseEditor
              key={exercise.id}
              exercise={exercise}
              name={libraryExercise.name}
              trackingType={libraryExercise.trackingType}
              unit={unit}
              noteOpen={openNotes.has(exercise.id) || exercise.notes !== ''}
              onChangeNotes={(notes) => store().setExerciseNotes(exercise.id, notes)}
              onChangeSet={(set, patch) => store().updateSet(exercise.id, set.id, patch)}
              onAddSet={() => store().addSet(exercise.id)}
              onSetOptions={(set, setName) =>
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
                })
              }
              onRestPress={() =>
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
                })
              }
              onOptions={() => openExerciseOptions(exercise, libraryExercise.name, index)}
            />
          );
        })
      )}

      <TextField
        label={t('routines.editor.notesLabel')}
        placeholder={t('routines.editor.notesPlaceholder')}
        value={draft.notes}
        onChangeText={(notes) => store().update({ notes })}
        multiline
        maxLength={accountLimits.notesMax}
      />

      <OptionsSheet config={sheet} onClose={() => setSheet(null)} />
    </Screen>
  );
}
