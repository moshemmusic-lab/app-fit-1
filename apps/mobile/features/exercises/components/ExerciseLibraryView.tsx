import {
  equipmentTypes,
  filterExercises,
  muscleRegionOrder,
  muscleRegions,
  type EquipmentType,
  type MuscleGroup,
} from '@app-fit/shared/exercises';
import { Plus } from 'lucide-react-native';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { SectionList, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { FilterButton } from '@/components/ui/FilterButton';
import { FilterSheet, type FilterGroup } from '@/components/ui/FilterSheet';
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
  /** Shows an (i) button on each row to open its page. */
  onInfoExercise?: (exercise: LibraryExercise) => void;
  /** Offers to create a custom exercise, named with what was searched. */
  onCreateExercise?: (name: string) => void;
  /** Exercises used lately, listed first under "Recientes" while not searching. */
  recentIds?: readonly string[];
}

/** The library with its search and filters, plus loading and offline states. */
export function ExerciseLibraryView(props: ExerciseLibraryViewProps) {
  const getErrorMessage = useErrorMessage();
  const library = useExerciseLibrary();

  if (library.data) {
    return (
      <ExerciseBrowser
        {...props}
        // Deleted custom exercises only live on in the workouts and routines that use them.
        exercises={library.data.filter((exercise) => !exercise.deleted)}
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

type OpenSheet = 'muscle' | 'equipment' | null;

interface Section {
  key: 'recent' | 'all';
  title: string;
  data: LibraryExercise[];
}

function ExerciseBrowser({
  exercises,
  selectedIds,
  onPressExercise,
  onInfoExercise,
  onCreateExercise,
  recentIds = [],
}: ExerciseLibraryViewProps & { exercises: LibraryExercise[] }) {
  const { t } = useTranslation();
  const { colors, spacing } = useTheme();
  const [query, setQuery] = useState('');
  const [muscle, setMuscle] = useState<MuscleGroup | null>(null);
  const [equipment, setEquipment] = useState<EquipmentType | null>(null);
  const [openSheet, setOpenSheet] = useState<OpenSheet>(null);

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
  const muscleSheetGroups: FilterGroup<MuscleGroup>[] = muscleRegionOrder
    .map((region) => ({
      title: t(`muscleRegions.${region}`),
      options: muscleRegions[region]
        .filter((option) => exercises.some((exercise) => exercise.primaryMuscle === option))
        .map((option) => ({ value: option, label: t(`muscles.${option}`) })),
    }))
    .filter((group) => group.options.length > 0);
  const equipmentSheetGroups: FilterGroup<EquipmentType>[] = [
    {
      options: equipmentTypes
        .filter((option) => exercises.some((exercise) => exercise.equipment === option))
        .map((option) => ({ value: option, label: t(`equipment.${option}`) })),
    },
  ];

  const clearFilters = () => {
    setQuery('');
    setMuscle(null);
    setEquipment(null);
  };

  const byId = new Map(exercises.map((exercise) => [exercise.id, exercise]));
  const recent = hasFilters
    ? []
    : recentIds.flatMap((id) => {
        const exercise = byId.get(id);
        return exercise ? [exercise] : [];
      });
  const sections: Section[] = [
    ...(recent.length > 0
      ? [{ key: 'recent' as const, title: t('exercises.recent'), data: recent }]
      : []),
    ...(results.length > 0
      ? [
          {
            key: 'all' as const,
            title: t('exercises.count', { count: results.length }),
            data: results,
          },
        ]
      : []),
  ];

  return (
    <>
      <SearchField
        label={t('exercises.searchLabel')}
        clearLabel={t('exercises.clearSearch')}
        placeholder={t('exercises.searchPlaceholder')}
        value={query}
        onChangeText={setQuery}
      />
      <View style={{ flexDirection: 'row', gap: spacing[2] }}>
        <FilterButton
          accessibilityLabel={t('exercises.equipmentFilter')}
          label={equipment ? t(`equipment.${equipment}`) : t('exercises.allEquipment')}
          active={equipment !== null}
          onPress={() => setOpenSheet('equipment')}
        />
        <FilterButton
          accessibilityLabel={t('exercises.muscleFilter')}
          label={muscle ? t(`muscles.${muscle}`) : t('exercises.allMuscles')}
          active={muscle !== null}
          onPress={() => setOpenSheet('muscle')}
        />
      </View>
      <SectionList
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: spacing[6] }}
        sections={sections}
        extraData={selectedIds}
        keyExtractor={(exercise) => exercise.id}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        stickySectionHeadersEnabled={false}
        renderSectionHeader={({ section }) => (
          <View
            style={{
              paddingTop: spacing[3],
              paddingBottom: spacing[1],
              backgroundColor: colors.bg,
            }}
          >
            <Text variant="caption" color="textMuted" accessibilityRole="header">
              {section.title}
            </Text>
          </View>
        )}
        ItemSeparatorComponent={Separator}
        renderItem={({ item }) => (
          <ExerciseRow
            name={item.name}
            muscle={t(`muscles.${item.primaryMuscle}`)}
            isCustom={item.isCustom}
            selected={selectedIds ? selectedIds.has(item.id) : undefined}
            onPress={() => onPressExercise(item)}
            onInfo={onInfoExercise ? () => onInfoExercise(item) : undefined}
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
      <FilterSheet
        visible={openSheet === 'muscle'}
        title={t('exercises.muscleSheetTitle')}
        groups={muscleSheetGroups}
        value={muscle}
        resultCount={(value) =>
          filterExercises(searchable, { query, muscle: value, equipment }).length
        }
        resultLabel={(count) => t('exercises.showResults', { count })}
        clearLabel={t('exercises.clearFilter')}
        onApply={setMuscle}
        onClose={() => setOpenSheet(null)}
      />
      <FilterSheet
        visible={openSheet === 'equipment'}
        title={t('exercises.equipmentSheetTitle')}
        groups={equipmentSheetGroups}
        value={equipment}
        resultCount={(value) =>
          filterExercises(searchable, { query, muscle, equipment: value }).length
        }
        resultLabel={(count) => t('exercises.showResults', { count })}
        clearLabel={t('exercises.clearFilter')}
        onApply={setEquipment}
        onClose={() => setOpenSheet(null)}
      />
    </>
  );
}
