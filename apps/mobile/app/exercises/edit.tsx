import {
  equipmentTypes,
  muscleGroups,
  trackingTypes,
  type EquipmentType,
  type MuscleGroup,
  type TrackingType,
} from '@app-fit/shared/exercises';
import { accountLimits, exerciseNameSchema, validationErrorOf } from '@app-fit/shared/schemas';
import { onlineManager } from '@tanstack/react-query';
import * as Crypto from 'expo-crypto';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { ChipGroup } from '@/components/ui/ChipGroup';
import { EmptyState } from '@/components/ui/EmptyState';
import { FormMessage } from '@/components/ui/FormMessage';
import { Screen } from '@/components/ui/Screen';
import { ErrorState, LoadingState } from '@/components/ui/StateViews';
import { Text } from '@/components/ui/Text';
import { TextField } from '@/components/ui/TextField';
import { useExercise, useSaveCustomExercise } from '@/features/exercises/api';
import { classifyError } from '@/lib/errors';
import { useErrorMessage } from '@/lib/use-error-message';
import { useTheme } from '@/theme/ThemeProvider';

// No choice yet: the user picks the muscle and the equipment themselves.
const NONE = '';

interface FormValues {
  name: string;
  trackingType: TrackingType;
  primaryMuscle: MuscleGroup | typeof NONE;
  equipment: EquipmentType | typeof NONE;
}

/**
 * Create a custom exercise (optionally named with `?name=`, e.g. what was searched), or edit
 * one with `?id=<exercise id>`.
 */
export default function EditExerciseScreen() {
  const { t } = useTranslation();
  const getErrorMessage = useErrorMessage();
  const { id, name } = useLocalSearchParams<{ id?: string; name?: string }>();
  const exercise = useExercise(id ?? '');
  // Same id on every retry, so a save that reached the server is never created twice.
  const [newId] = useState(() => Crypto.randomUUID());

  if (!id) {
    return (
      <ExerciseForm
        exerciseId={newId}
        isNew
        initial={{
          name: name ?? '',
          trackingType: 'weight_reps',
          primaryMuscle: NONE,
          equipment: NONE,
        }}
      />
    );
  }

  if (exercise.data && exercise.data.isCustom) {
    return (
      <ExerciseForm
        exerciseId={id}
        isNew={false}
        initial={{
          name: exercise.data.name,
          trackingType: exercise.data.trackingType,
          primaryMuscle: exercise.data.primaryMuscle,
          equipment: exercise.data.equipment,
        }}
      />
    );
  }

  return (
    <Screen withBottomInset onBack={() => router.back()}>
      {exercise.data !== undefined ? (
        // Missing, or a library exercise (those cannot be edited).
        <EmptyState title={t('exercises.notFoundTitle')} body={t('exercises.notFoundBody')} />
      ) : exercise.isError || exercise.fetchStatus === 'paused' ? (
        <ErrorState
          message={getErrorMessage(exercise.error)}
          onRetry={() => void exercise.refetch()}
          retrying={exercise.isFetching}
        />
      ) : (
        <LoadingState />
      )}
    </Screen>
  );
}

function ExerciseForm({
  exerciseId,
  isNew,
  initial,
}: {
  exerciseId: string;
  isNew: boolean;
  initial: FormValues;
}) {
  const { t } = useTranslation();
  const { spacing } = useTheme();
  const getErrorMessage = useErrorMessage();
  const saveExercise = useSaveCustomExercise();
  const [values, setValues] = useState<FormValues>(initial);
  const [showErrors, setShowErrors] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const update = (patch: Partial<FormValues>) => setValues((current) => ({ ...current, ...patch }));
  const nameError = validationErrorOf(exerciseNameSchema, values.name);
  const dirty =
    values.name !== initial.name ||
    values.trackingType !== initial.trackingType ||
    values.primaryMuscle !== initial.primaryMuscle ||
    values.equipment !== initial.equipment;

  const close = () => {
    if (!dirty) {
      router.back();
      return;
    }
    Alert.alert(t('exercises.editor.discardTitle'), t('exercises.editor.discardBody'), [
      { text: t('exercises.editor.keepEditing'), style: 'cancel' },
      { text: t('exercises.editor.discard'), style: 'destructive', onPress: () => router.back() },
    ]);
  };

  const save = () => {
    setShowErrors(true);
    setFormError(null);
    const { primaryMuscle, equipment } = values;
    if (nameError || primaryMuscle === NONE || equipment === NONE) return;
    saveExercise.mutate(
      {
        id: exerciseId,
        name: values.name,
        trackingType: values.trackingType,
        primaryMuscle,
        equipment,
      },
      {
        onSuccess: () => router.back(),
        onError: (error) =>
          setFormError(
            classifyError(error, onlineManager.isOnline()) === 'offline'
              ? t('exercises.offlineEdit')
              : `${t('exercises.saveFailed')} ${getErrorMessage(error)}`,
          ),
      },
    );
  };

  return (
    <Screen
      withBottomInset
      onBack={close}
      title={isNew ? t('exercises.editor.newTitle') : t('exercises.editor.editTitle')}
      footer={
        <View style={{ gap: spacing[2] }}>
          {formError ? <FormMessage message={formError} /> : null}
          <Button
            label={t('exercises.editor.save')}
            loading={saveExercise.isPending}
            onPress={save}
          />
        </View>
      }
    >
      <TextField
        label={t('exercises.editor.nameLabel')}
        placeholder={t('exercises.editor.namePlaceholder')}
        value={values.name}
        onChangeText={(name) => update({ name })}
        error={showErrors && nameError ? t(`validation.${nameError}`) : null}
        maxLength={accountLimits.exerciseNameMax}
        autoFocus={isNew && initial.name === ''}
      />

      <View style={{ gap: spacing[2] }}>
        <Text variant="label" color="textMuted">
          {t('exercises.editor.trackingLabel')}
        </Text>
        {isNew ? (
          <ChipGroup
            accessibilityLabel={t('exercises.editor.trackingLabel')}
            options={trackingTypes.map((value) => ({ value, label: t(`trackingTypes.${value}`) }))}
            value={values.trackingType}
            onChange={(trackingType) => update({ trackingType })}
          />
        ) : (
          // Past sets were logged with these fields (the database refuses the change too).
          <>
            <Text variant="bodyStrong">{t(`trackingTypes.${values.trackingType}`)}</Text>
            <Text variant="caption" color="textMuted">
              {t('exercises.editor.trackingLocked')}
            </Text>
          </>
        )}
      </View>

      <View style={{ gap: spacing[2] }}>
        <Text variant="label" color="textMuted">
          {t('exercises.editor.muscleLabel')}
        </Text>
        <ChipGroup
          accessibilityLabel={t('exercises.editor.muscleLabel')}
          options={muscleGroups.map((value) => ({ value, label: t(`muscles.${value}`) }))}
          value={values.primaryMuscle}
          onChange={(primaryMuscle) => update({ primaryMuscle })}
        />
        {showErrors && values.primaryMuscle === NONE ? (
          <FormMessage message={t('validation.muscleRequired')} />
        ) : null}
      </View>

      <View style={{ gap: spacing[2] }}>
        <Text variant="label" color="textMuted">
          {t('exercises.editor.equipmentLabel')}
        </Text>
        <ChipGroup
          accessibilityLabel={t('exercises.editor.equipmentLabel')}
          options={equipmentTypes.map((value) => ({ value, label: t(`equipment.${value}`) }))}
          value={values.equipment}
          onChange={(equipment) => update({ equipment })}
        />
        {showErrors && values.equipment === NONE ? (
          <FormMessage message={t('validation.equipmentRequired')} />
        ) : null}
      </View>
    </Screen>
  );
}
