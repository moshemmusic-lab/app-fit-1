import { accountLimits, folderNameSchema, validationErrorOf } from '@app-fit/shared/schemas';
import { onlineManager } from '@tanstack/react-query';
import * as Crypto from 'expo-crypto';
import { router } from 'expo-router';
import {
  Copy,
  Folder,
  FolderInput,
  FolderPlus,
  MoreHorizontal,
  Pencil,
  Plus,
  Trash2,
} from 'lucide-react-native';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { IconButton } from '@/components/ui/IconButton';
import { NamePromptModal } from '@/components/ui/NamePromptModal';
import { OptionsSheet, type OptionsSheetConfig } from '@/components/ui/OptionsSheet';
import { ErrorState, LoadingState } from '@/components/ui/StateViews';
import { Text } from '@/components/ui/Text';
import { useSettings } from '@/features/account/api';
import { useExerciseLibrary } from '@/features/exercises/api';
import { useActiveWorkout, useWorkoutStore } from '@/features/workouts/workout-store';
import { classifyError } from '@/lib/errors';
import { useErrorMessage } from '@/lib/use-error-message';
import { useTheme } from '@/theme/ThemeProvider';

import {
  useCreateFolder,
  useDeleteFolder,
  useDeleteRoutine,
  useMoveRoutine,
  useRenameFolder,
  useRoutineLibrary,
  useSaveRoutine,
} from '../api';
import { duplicateRoutine, routineToPlannedWorkout } from '../routine-logic';
import type { Routine, RoutineFolder } from '../types';
import { RoutineCard } from './RoutineCard';

type FolderPrompt = { mode: 'create' } | { mode: 'rename'; folder: RoutineFolder };

/** The user's routines on the Entrenar tab, grouped by folder. */
export function RoutinesSection({ userId }: { userId: string }) {
  const { t } = useTranslation();
  const { colors, sizes, spacing } = useTheme();
  const getErrorMessage = useErrorMessage();
  const library = useRoutineLibrary(userId);
  const exercises = useExerciseLibrary();
  const settings = useSettings(userId);
  const activeWorkout = useActiveWorkout(userId);
  const startFromRoutine = useWorkoutStore((state) => state.startFromRoutine);

  const saveRoutine = useSaveRoutine();
  const deleteRoutine = useDeleteRoutine();
  const moveRoutine = useMoveRoutine();
  const createFolder = useCreateFolder();
  const renameFolder = useRenameFolder();
  const deleteFolder = useDeleteFolder();

  const [sheet, setSheet] = useState<OptionsSheetConfig | null>(null);
  const [folderPrompt, setFolderPrompt] = useState<FolderPrompt | null>(null);

  // Changing routines needs a connection; say so clearly instead of a generic error.
  const showError = (error: unknown) =>
    Alert.alert(
      t('routines.saveFailed'),
      classifyError(error, onlineManager.isOnline()) === 'offline'
        ? t('routines.offlineEdit')
        : getErrorMessage(error),
    );

  const confirm = (title: string, body: string, action: string, onConfirm: () => void) =>
    Alert.alert(title, body, [
      { text: t('common.cancel'), style: 'cancel' },
      { text: action, style: 'destructive', onPress: onConfirm },
    ]);

  if (!library.data) {
    return library.isError || library.fetchStatus === 'paused' ? (
      <ErrorState
        message={getErrorMessage(library.error)}
        onRetry={() => void library.refetch()}
        retrying={library.isFetching}
      />
    ) : (
      <LoadingState />
    );
  }

  const { folders, routines } = library.data;
  const exerciseNames = new Map(
    (exercises.data ?? []).map((exercise) => [exercise.id, exercise.name]),
  );
  const namesOf = (routine: Routine) =>
    routine.exercises.flatMap((exercise) => exerciseNames.get(exercise.exerciseId) ?? []);

  const start = (routine: Routine) => {
    if (activeWorkout) {
      Alert.alert(t('routines.workoutInProgressTitle'), t('routines.workoutInProgressBody'));
      return;
    }
    startFromRoutine({
      userId,
      visibility: settings.data?.defaultWorkoutVisibility ?? 'followers',
      ...routineToPlannedWorkout(routine),
    });
    router.push('/active-workout');
  };

  const openRoutineOptions = (routine: Routine) =>
    setSheet({
      title: routine.name,
      options: [
        {
          label: t('routines.edit'),
          icon: Pencil,
          onPress: () => router.push({ pathname: '/routine-editor', params: { id: routine.id } }),
        },
        {
          label: t('routines.duplicate'),
          icon: Copy,
          onPress: () =>
            saveRoutine.mutate(
              duplicateRoutine(
                routine,
                t('routines.copySuffix', { name: routine.name }).slice(
                  0,
                  accountLimits.routineNameMax,
                ),
                Crypto.randomUUID,
              ),
              { onError: showError },
            ),
        },
        ...(folders.length > 0
          ? [
              {
                label: t('routines.move'),
                icon: FolderInput,
                onPress: () =>
                  setSheet({
                    title: t('routines.move'),
                    options: [
                      { label: t('routines.noFolderOption'), id: null },
                      ...folders.map((folder) => ({ label: folder.name, id: folder.id })),
                    ].map(({ label, id }) => ({
                      label,
                      selected: routine.folderId === id,
                      onPress: () =>
                        moveRoutine.mutate(
                          { routineId: routine.id, folderId: id },
                          { onError: showError },
                        ),
                    })),
                  }),
              },
            ]
          : []),
        {
          label: t('routines.delete'),
          icon: Trash2,
          onPress: () =>
            confirm(
              t('routines.deleteConfirmTitle'),
              t('routines.deleteConfirmBody'),
              t('routines.delete'),
              () => deleteRoutine.mutate(routine.id, { onError: showError }),
            ),
        },
      ],
    });

  const openFolderOptions = (folder: RoutineFolder) =>
    setSheet({
      title: folder.name,
      options: [
        {
          label: t('routines.renameFolder'),
          icon: Pencil,
          onPress: () => setFolderPrompt({ mode: 'rename', folder }),
        },
        {
          label: t('routines.deleteFolder'),
          icon: Trash2,
          onPress: () =>
            confirm(
              t('routines.deleteFolderConfirmTitle'),
              t('routines.deleteFolderConfirmBody'),
              t('routines.deleteFolder'),
              () => deleteFolder.mutate(folder.id, { onError: showError }),
            ),
        },
      ],
    });

  const submitFolderName = (name: string) => {
    const onSuccess = () => setFolderPrompt(null);
    if (folderPrompt?.mode === 'rename') {
      renameFolder.mutate(
        { folderId: folderPrompt.folder.id, name },
        { onSuccess, onError: showError },
      );
    } else {
      createFolder.mutate({ name, position: folders.length }, { onSuccess, onError: showError });
    }
  };

  const renderRoutines = (list: Routine[]) =>
    list.map((routine) => (
      <RoutineCard
        key={routine.id}
        name={routine.name}
        exerciseNames={namesOf(routine)}
        onStart={() => start(routine)}
        onOptions={() => openRoutineOptions(routine)}
      />
    ));

  const unfiled = routines.filter(
    (routine) => !folders.some((folder) => folder.id === routine.folderId),
  );

  return (
    <View style={{ gap: spacing[4] }}>
      <Text variant="heading" accessibilityRole="header">
        {t('routines.sectionTitle')}
      </Text>
      <View style={{ flexDirection: 'row', gap: spacing[2] }}>
        <View style={{ flex: 1 }}>
          <Button
            label={t('routines.newRoutine')}
            variant="secondary"
            icon={Plus}
            onPress={() => router.push('/routine-editor')}
          />
        </View>
        <View style={{ flex: 1 }}>
          <Button
            label={t('routines.newFolder')}
            variant="secondary"
            icon={FolderPlus}
            onPress={() => setFolderPrompt({ mode: 'create' })}
          />
        </View>
      </View>

      {routines.length === 0 && folders.length === 0 ? (
        <EmptyState title={t('routines.emptyTitle')} body={t('routines.emptyBody')} />
      ) : null}

      {unfiled.length > 0 ? (
        <View style={{ gap: spacing[2] }}>
          {folders.length > 0 ? (
            <Text variant="label" color="textMuted">
              {t('routines.noFolder')}
            </Text>
          ) : null}
          {renderRoutines(unfiled)}
        </View>
      ) : null}

      {folders.map((folder) => {
        const inFolder = routines.filter((routine) => routine.folderId === folder.id);
        return (
          <View key={folder.id} style={{ gap: spacing[2] }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[2] }}>
              <Folder size={sizes.icon * 0.75} strokeWidth={1.8} color={colors.textMuted} />
              <Text variant="label" color="textMuted" style={{ flex: 1 }}>
                {folder.name}
              </Text>
              <IconButton
                icon={MoreHorizontal}
                label={t('routines.folderOptions')}
                onPress={() => openFolderOptions(folder)}
              />
            </View>
            {inFolder.length > 0 ? (
              renderRoutines(inFolder)
            ) : (
              <Text variant="caption" color="textMuted">
                {t('routines.emptyFolder')}
              </Text>
            )}
          </View>
        );
      })}

      <OptionsSheet config={sheet} onClose={() => setSheet(null)} />
      <NamePromptModal
        visible={folderPrompt !== null}
        title={
          folderPrompt?.mode === 'rename' ? t('routines.renameFolder') : t('routines.newFolder')
        }
        label={t('routines.folderNameLabel')}
        placeholder={t('routines.folderNamePlaceholder')}
        initialValue={folderPrompt?.mode === 'rename' ? folderPrompt.folder.name : ''}
        maxLength={accountLimits.folderNameMax}
        validate={(name) => {
          const error = validationErrorOf(folderNameSchema, name);
          return error ? t(`validation.${error}`) : null;
        }}
        submitting={createFolder.isPending || renameFolder.isPending}
        onSubmit={submitFolderName}
        onClose={() => setFolderPrompt(null)}
      />
    </View>
  );
}
