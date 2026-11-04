import {
  equipmentTypes,
  filterExercises,
  muscleGroups,
  type EquipmentType,
  type MuscleGroup,
} from '@app-fit/shared/exercises';
import { Plus } from 'lucide-react-native';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { FilterChipRow } from '@/components/ui/FilterChipRow';
import { SearchField } from '@/components/ui/SearchField';
import { ErrorState, LoadingState } from '@/components/ui/StateViews';
import { Text } from '@/components/ui/Text';
import { useErrorMessage } from '@/lib/use-error-message';
import { useTheme } from '@/theme/ThemeProvider';

import { useExerciseLibrary, type LibraryExercise } from '../api';
import { ExerciseRow } from './ExerciseRow';

interface ExerciseLibraryViewProps {
  /** Selection mode (adding exercises to a workout) when given. */
  selectedIds?: ReadonlySet<string>;
  onPressExercise: (exercise: LibraryExercise) => void;
  /** Offers to create a custom exercise, named with what was searched. */
  onCreateExercise?: (name: string) => void;
}

/** The library with its search and filters, plus loading and offline states. */
export function ExerciseLibraryView({
  selectedIds,
  onPressExercise,
  onCreateExercise,
}: ExerciseLibraryViewProps) {
  const getErrorMessage = useErrorMessage();
  const library = useExerciseLibrary();

  if (library.data) {
    return (
      <ExerciseBrowser
        // Deleted custom exercises only live on in the workouts and routines that use them.
        exercises={library.data.filter((exercise) => !exercise.deleted)}
        selectedIds={selectedIds}
        onPressExercise={onPressExercise}
        onCreateExercise={onCreateExercise}
      />
    );
  }
  if (library.isError || library.fetchStatus === 'paused') {
    return (
      <ErrorState
        message={getErrorMessage(library.error)}
        onRetry={() => void library.refetch()}
        retrying={library.isFetching}
      />
    );
  }
  return <LoadingState />;
}

function Separator() {
  const { colors } = useTheme();
  return <View style={{ height: 1, backgroundColor: colors.line }} />;
}

function ExerciseBrowser({
  exercises,
  selectedIds,
  onPressExercise,
  onCreateExercise,
}: ExerciseLibraryViewProps & { exercises: LibraryExercise[] }) {
  const { t } = useTranslation();
  const { spacing } = useTheme();
  const [query, setQuery] = useState('');
  const [muscle, setMuscle] = useState<MuscleGroup | null>(null);
  const [equipment, setEquipment] = useState<EquipmentType | null>(null);

  const details = (exercise: LibraryExercise) =>
    [
      ...(exercise.isCustom ? [t('exercises.custom')] : []),
      t(`muscles.${exercise.primaryMuscle}`),
      t(`equipment.${exercise.equipment}`),
    ].join(' · ');

  // Typing a muscle or equipment name ("pecho", "polea") also finds the exercise.
  const searchable = exercises.map((exercise) => ({
    ...exercise,
    keywords: [
      ...exercise.aliases,
      t(`muscles.${exercise.primaryMuscle}`),
      t(`equipment.${exercise.equipment}`),
      // "personalizado" lists the user's own exercises.
      ...(exercise.isCustom ? [t('exercises.custom')] : []),
    ],
  }));
  const results = filterExercises(searchable, { query, muscle, equipment });
  const hasFilters = query !== '' || muscle !== null || equipment !== null;

  // Only offer filters that return something.
  const muscleOptions = muscleGroups
    .filter((option) => exercises.some((exercise) => exercise.primaryMuscle === option))
    .map((option) => ({ value: option, label: t(`muscles.${option}`) }));
  const equipmentOptions = equipmentTypes
    .filter((option) => exercises.some((exercise) => exercise.equipment === option))
    .map((option) => ({ value: option, label: t(`equipment.${option}`) }));

  const clearFilters = () => {
    setQuery('');
    setMuscle(null);
    setEquipment(null);
  };

  return (
    <>
      <SearchField
        label={t('exercises.searchLabel')}
        clearLabel={t('exercises.clearSearch')}
        placeholder={t('exercises.searchPlaceholder')}
        value={query}
        onChangeText={setQuery}
      />
      <View style={{ gap: spacing[2] }}>
        <FilterChipRow
          accessibilityLabel={t('exercises.muscleFilter')}
          allLabel={t('exercises.allMuscles')}
          options={muscleOptions}
          value={muscle}
          onChange={setMuscle}
        />
        <FilterChipRow
          accessibilityLabel={t('exercises.equipmentFilter')}
          allLabel={t('exercises.allEquipment')}
          options={equipmentOptions}
          value={equipment}
          onChange={setEquipment}
        />
      </View>
      <FlatList
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: spacing[6] }}
        data={results}
        extraData={selectedIds}
        keyExtractor={(exercise) => exercise.id}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        ListHeaderComponent={
          results.length > 0 ? (
            <View style={{ gap: spacing[2] }}>
              {onCreateExercise ? (
                <Button
                  label={t('exercises.create')}
                  variant="ghost"
                  icon={Plus}
                  onPress={() => onCreateExercise(query.trim())}
                />
              ) : null}
              <Text variant="caption" color="textMuted">
                {t('exercises.count', { count: results.length })}
              </Text>
            </View>
          ) : undefined
        }
        ItemSeparatorComponent={Separator}
        renderItem={({ item }) => (
          <ExerciseRow
            name={item.name}
            details={details(item)}
            selected={selectedIds ? selectedIds.has(item.id) : undefined}
            onPress={() => onPressExercise(item)}
          />
        )}
        ListEmptyComponent={
          <View style={{ gap: spacing[3] }}>
            <EmptyState
              title={t('exercises.noResultsTitle')}
              body={onCreateExercise ? t('exercises.createHint') : t('exercises.noResultsBody')}
            />
            {onCreateExercise ? (
              <Button
                label={
                  query.trim() === ''
                    ? t('exercises.create')
                    : t('exercises.createNamed', { name: query.trim() })
                }
                variant="secondary"
                icon={Plus}
                onPress={() => onCreateExercise(query.trim())}
              />
            ) : null}
            {hasFilters ? (
              <Button label={t('exercises.clearFilters')} variant="ghost" onPress={clearFilters} />
            ) : null}
          </View>
        }
      />
    </>
  );
}
