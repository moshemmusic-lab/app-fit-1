import type { TrackingType } from '@app-fit/shared/exercises';
import type { WeightUnit } from '@app-fit/shared/schemas';
import { fillFromPrevious, type SetValues } from '@app-fit/shared/workouts';
import { MoreHorizontal, Plus } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { IconButton } from '@/components/ui/IconButton';
import { Text } from '@/components/ui/Text';
import { useTheme } from '@/theme/ThemeProvider';

import { columnKey, displayFields, usePreviousFormatter } from '../fields';
import type { DraftExercise, DraftSet } from '../types';
import { SET_NUMBER_WIDTH, SetRow } from './SetRow';

interface WorkoutExerciseCardProps {
  exercise: DraftExercise;
  name: string;
  trackingType: TrackingType;
  unit: WeightUnit;
  /** Last time's completed sets of this exercise. */
  previousSets: readonly SetValues[] | undefined;
  onChangeSet: (set: DraftSet, patch: Partial<SetValues>) => void;
  onToggleSet: (set: DraftSet, suggestion: SetValues | undefined) => void;
  onSetOptions: (set: DraftSet) => void;
  onAddSet: () => void;
  onOptions: () => void;
}

export function WorkoutExerciseCard({
  exercise,
  name,
  trackingType,
  unit,
  previousSets,
  onChangeSet,
  onToggleSet,
  onSetOptions,
  onAddSet,
  onOptions,
}: WorkoutExerciseCardProps) {
  const { t } = useTranslation();
  const { colors, radius, sizes, spacing } = useTheme();
  const formatPrevious = usePreviousFormatter(unit);
  const fields = displayFields(trackingType, unit).map((field) => ({
    ...field,
    label: t(`activeWorkout.columns.${columnKey(field.field, trackingType, unit)}`),
  }));

  // What each set suggests (grey placeholder, used when marked done with empty fields):
  // last time's set in that position, else the set above it.
  const suggestions: (SetValues | undefined)[] = [];
  exercise.sets.forEach((set, index) => {
    const above = exercise.sets[index - 1];
    suggestions.push(
      previousSets?.[index] ??
        (above ? fillFromPrevious(above, suggestions[index - 1], trackingType) : undefined),
    );
  });

  return (
    <View
      style={{
        padding: spacing[3],
        gap: spacing[2],
        borderRadius: radius.lg,
        backgroundColor: colors.surface,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[2] }}>
        <Text variant="bodyStrong" style={{ flex: 1, paddingLeft: spacing[1] }}>
          {name}
        </Text>
        <IconButton
          icon={MoreHorizontal}
          label={t('activeWorkout.exerciseOptions')}
          onPress={onOptions}
        />
      </View>

      {/* Column headers, aligned with the inputs of SetRow. */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[2] }}>
        <Text
          variant="label"
          color="textMuted"
          style={{ width: SET_NUMBER_WIDTH, textAlign: 'center' }}
        >
          {t('activeWorkout.columns.set')}
        </Text>
        <Text variant="label" color="textMuted" style={{ flex: 1.2 }}>
          {t('activeWorkout.columns.previous')}
        </Text>
        {fields.map(({ field, label }) => (
          <Text
            key={field}
            variant="label"
            color="textMuted"
            style={{ flex: 1, textAlign: 'center' }}
          >
            {label}
          </Text>
        ))}
        <View style={{ width: sizes.touchMin }} />
      </View>

      {exercise.sets.map((set, index) => (
        <SetRow
          key={set.id}
          number={index + 1}
          set={set}
          fields={fields}
          suggestion={suggestions[index]}
          previousLabel={formatPrevious(previousSets?.[index], trackingType)}
          onChange={(patch) => onChangeSet(set, patch)}
          onToggleComplete={() => onToggleSet(set, suggestions[index])}
          onOptions={() => onSetOptions(set)}
        />
      ))}

      <Button label={t('activeWorkout.addSet')} variant="ghost" icon={Plus} onPress={onAddSet} />
    </View>
  );
}
