import { onlineManager } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import { Pencil, Trash2 } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { Alert, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Screen } from '@/components/ui/Screen';
import { ErrorState, LoadingState } from '@/components/ui/StateViews';
import { Text } from '@/components/ui/Text';
import {
  useDeleteCustomExercise,
  useExercise,
  type LibraryExercise,
} from '@/features/exercises/api';
import { ExerciseProgress } from '@/features/progress/components/ExerciseProgress';
import { classifyError } from '@/lib/errors';
import { useErrorMessage } from '@/lib/use-error-message';
import { useTheme } from '@/theme/ThemeProvider';

export default function ExerciseDetailScreen() {
  const { t } = useTranslation();
  const getErrorMessage = useErrorMessage();
  const { id } = useLocalSearchParams<{ id: string }>();
  const exercise = useExercise(id);

  return (
    <Screen withBottomInset onBack={() => router.back()} title={exercise.data?.name}>
      {exercise.data ? (
        <ExerciseDetails exercise={exercise.data} />
      ) : exercise.data === null ? (
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

function Fact({ label, value }: { label: string; value: string }) {
  const { spacing } = useTheme();

  return (
    <View style={{ gap: spacing[1] }}>
      <Text variant="label" color="textMuted">
        {label}
      </Text>
      <Text variant="body">{value}</Text>
    </View>
  );
}

function ExerciseDetails({ exercise }: { exercise: LibraryExercise }) {
  const { t } = useTranslation();
  const { colors, radius, sizes, spacing } = useTheme();
  const getErrorMessage = useErrorMessage();
  const deleteExercise = useDeleteCustomExercise();

  const confirmDelete = () =>
    Alert.alert(t('exercises.deleteConfirmTitle'), t('exercises.deleteConfirmBody'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('exercises.delete'),
        style: 'destructive',
        onPress: () =>
          deleteExercise.mutate(exercise.id, {
            onSuccess: () => router.back(),
            onError: (error) =>
              Alert.alert(
                t('exercises.saveFailed'),
                classifyError(error, onlineManager.isOnline()) === 'offline'
                  ? t('exercises.offlineEdit')
                  : getErrorMessage(error),
              ),
          }),
      },
    ]);

  return (
    <>
      {exercise.isCustom ? (
        <Text variant="caption" color="textMuted">
          {exercise.deleted ? t('exercises.deletedNote') : t('exercises.custom')}
        </Text>
      ) : null}
      <View
        style={{
          padding: spacing[4],
          gap: spacing[4],
          borderRadius: radius.md,
          backgroundColor: colors.surface,
        }}
      >
        <Fact label={t('exercises.primaryMuscle')} value={t(`muscles.${exercise.primaryMuscle}`)} />
        {exercise.secondaryMuscles.length > 0 ? (
          <Fact
            label={t('exercises.secondaryMuscles')}
            value={exercise.secondaryMuscles.map((muscle) => t(`muscles.${muscle}`)).join(', ')}
          />
        ) : null}
        <Fact label={t('exercises.equipment')} value={t(`equipment.${exercise.equipment}`)} />
        <Fact
          label={t('exercises.trackedWith')}
          value={t(`trackingTypes.${exercise.trackingType}`)}
        />
      </View>

      <ExerciseProgress exercise={exercise} />

      {exercise.instructions.length > 0 ? (
        <View style={{ gap: spacing[3] }}>
          <Text variant="heading" accessibilityRole="header">
            {t('exercises.howTo')}
          </Text>
          {exercise.instructions.map((step, index) => (
            <View key={`${index}-${step}`} style={{ flexDirection: 'row', gap: spacing[3] }}>
              <View
                style={{
                  width: sizes.icon + spacing[1],
                  height: sizes.icon + spacing[1],
                  borderRadius: radius.pill,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: colors.surface2,
                }}
              >
                <Text variant="caption">{index + 1}</Text>
              </View>
              <Text variant="body" style={{ flex: 1 }}>
                {step}
              </Text>
            </View>
          ))}
        </View>
      ) : null}

      {exercise.isCustom && !exercise.deleted ? (
        <View style={{ gap: spacing[2] }}>
          <Button
            label={t('exercises.edit')}
            variant="secondary"
            icon={Pencil}
            onPress={() =>
              router.push({ pathname: '/exercises/edit', params: { id: exercise.id } })
            }
          />
          <Button
            label={t('exercises.delete')}
            variant="ghost"
            icon={Trash2}
            loading={deleteExercise.isPending}
            onPress={confirmDelete}
          />
        </View>
      ) : null}
    </>
  );
}
