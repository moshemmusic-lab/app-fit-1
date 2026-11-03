import {
  equipmentTypes,
  filterExercises,
  muscleGroups,
  type EquipmentType,
  type MuscleGroup,
} from '@app-fit/shared/exercises';
import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { FilterChipRow } from '@/components/ui/FilterChipRow';
import { Screen } from '@/components/ui/Screen';
import { SearchField } from '@/components/ui/SearchField';
import { ErrorState, LoadingState } from '@/components/ui/StateViews';
import { Text } from '@/components/ui/Text';
import { useExerciseLibrary, type LibraryExercise } from '@/features/exercises/api';
import { ExerciseRow } from '@/features/exercises/components/ExerciseRow';
import { useErrorMessage } from '@/lib/use-error-message';
import { useTheme } from '@/theme/ThemeProvider';

function Separator() {
  const { colors } = useTheme();
  return <View style={{ height: 1, backgroundColor: colors.line }} />;
}

export default function ExerciseLibraryScreen() {
  const { t } = useTranslation();
  const getErrorMessage = useErrorMessage();
  const library = useExerciseLibrary();

  return (
    <Screen
      title={t('exercises.title')}
      onBack={() => router.back()}
      withBottomInset
      scroll={false}
    >
      {library.data ? (
        <ExerciseBrowser exercises={library.data} />
      ) : library.isError || library.fetchStatus === 'paused' ? (
        <ErrorState
          message={getErrorMessage(library.error)}
          onRetry={() => void library.refetch()}
          retrying={library.isFetching}
        />
      ) : (
        <LoadingState />
      )}
    </Screen>
  );
}

function ExerciseBrowser({ exercises }: { exercises: LibraryExercise[] }) {
  const { t } = useTranslation();
  const { spacing } = useTheme();
  const [query, setQuery] = useState('');
  const [muscle, setMuscle] = useState<MuscleGroup | null>(null);
  const [equipment, setEquipment] = useState<EquipmentType | null>(null);

  const details = (exercise: LibraryExercise) =>
    `${t(`muscles.${exercise.primaryMuscle}`)} · ${t(`equipment.${exercise.equipment}`)}`;

  // Typing a muscle or equipment name ("pecho", "polea") also finds the exercise.
  const searchable = exercises.map((exercise) => ({
    ...exercise,
    keywords: [
      ...exercise.aliases,
      t(`muscles.${exercise.primaryMuscle}`),
      t(`equipment.${exercise.equipment}`),
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
        keyExtractor={(exercise) => exercise.id}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        ListHeaderComponent={
          results.length > 0 ? (
            <Text variant="caption" color="textMuted">
              {t('exercises.count', { count: results.length })}
            </Text>
          ) : undefined
        }
        ItemSeparatorComponent={Separator}
        renderItem={({ item }) => (
          <ExerciseRow
            name={item.name}
            details={details(item)}
            onPress={() => router.push({ pathname: '/exercises/[id]', params: { id: item.id } })}
          />
        )}
        ListEmptyComponent={
          <View style={{ gap: spacing[3] }}>
            <EmptyState title={t('exercises.noResultsTitle')} body={t('exercises.noResultsBody')} />
            {hasFilters ? (
              <Button label={t('exercises.clearFilters')} variant="ghost" onPress={clearFilters} />
            ) : null}
          </View>
        }
      />
    </>
  );
}
