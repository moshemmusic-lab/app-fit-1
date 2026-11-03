import type { TrackingType } from '@app-fit/shared/exercises';
import type { WeightUnit } from '@app-fit/shared/schemas';
import { fillFromPrevious, formatDuration, type SetValues } from '@app-fit/shared/workouts';
import { MoreHorizontal, Plus, Timer } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { IconButton } from '@/components/ui/IconButton';
import { Text } from '@/components/ui/Text';
import { TextField } from '@/components/ui/TextField';
import { useTheme } from '@/theme/ThemeProvider';

import { columnKey, displayFields, usePreviousFormatter } from '../fields';
import { numberSets } from '../finish';
import type { DraftExercise, DraftSet } from '../types';
import { SET_NUMBER_WIDTH, SetRow } from './SetRow';

interface WorkoutExerciseCardProps {
  exercise: DraftExercise;
  name: string;
  trackingType: TrackingType;
  unit: WeightUnit;
  /** Last time's completed sets of this exercise. */
  previousSets: readonly SetValues[] | undefined;
  /** Shows the note field (it has text or the user chose "Añadir nota"). */
  noteOpen: boolean;
  onChangeNotes: (notes: string) => void;
  onChangeSet: (set: DraftSet, patch: Partial<SetValues>) => void;
  onToggleSet: (set: DraftSet, suggestion: SetValues | undefined) => void;
  /** `setName` is the set's accessible name ("serie 2"), for the options title. */
  onSetOptions: (set: DraftSet, setName: string) => void;
  onAddSet: () => void;
  onRestPress: () => void;
  onOptions: () => void;
}

export function WorkoutExerciseCard({
  exercise,
  name,
  trackingType,
  unit,
  previousSets,
  noteOpen,
  onChangeNotes,
  onChangeSet,
  onToggleSet,
  onSetOptions,
  onAddSet,
  onRestPress,
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

  // Warm-ups show "C" and get no number; drop and failure sets show "D" and "F".
  const numbers = numberSets(exercise.sets);
  const labelOf = (set: DraftSet, index: number) => {
    const number = numbers[index];
    if (set.setType === 'warmup' || number === null || number === undefined) {
      return {
        label: t('activeWorkout.setTypeShort.warmup'),
        setName: t('activeWorkout.warmupSetLabel'),
      };
    }
    if (set.setType === 'normal') {
      return { label: String(number), setName: t('activeWorkout.setLabel', { number }) };
    }
    return {
      label: t(`activeWorkout.setTypeShort.${set.setType}`),
      setName: t('activeWorkout.setTypeLabel', {
        number,
        type: t(`activeWorkout.setTypes.${set.setType}`),
      }),
    };
  };

  const restLabel =
    exercise.restSeconds === null
      ? t('activeWorkout.restOff')
      : t('activeWorkout.rest', { time: formatDuration(exercise.restSeconds) });

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
        <View style={{ flex: 1, paddingLeft: spacing[1] }}>
          <Text variant="bodyStrong">{name}</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={restLabel}
            accessibilityHint={t('activeWorkout.restTitle')}
            onPress={onRestPress}
            style={({ pressed }) => ({
              minHeight: sizes.touchMin,
              flexDirection: 'row',
              alignItems: 'center',
              gap: spacing[1],
              alignSelf: 'flex-start',
              opacity: pressed ? 0.6 : 1,
            })}
          >
            <Timer size={sizes.icon * 0.7} strokeWidth={1.8} color={colors.textMuted} />
            <Text variant="caption" color="textMuted">
              {restLabel}
            </Text>
          </Pressable>
        </View>
        <IconButton
          icon={MoreHorizontal}
          label={t('activeWorkout.exerciseOptions')}
          onPress={onOptions}
        />
      </View>

      {noteOpen ? (
        <TextField
          label={t('activeWorkout.exerciseNoteLabel')}
          placeholder={t('activeWorkout.exerciseNotePlaceholder')}
          value={exercise.notes}
          onChangeText={onChangeNotes}
          multiline
          maxLength={1000}
        />
      ) : null}

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

      {exercise.sets.map((set, index) => {
        const { label, setName } = labelOf(set, index);
        return (
          <SetRow
            key={set.id}
            label={label}
            setName={setName}
            set={set}
            fields={fields}
            suggestion={suggestions[index]}
            previousLabel={formatPrevious(previousSets?.[index], trackingType)}
            onChange={(patch) => onChangeSet(set, patch)}
            onToggleComplete={() => onToggleSet(set, suggestions[index])}
            onOptions={() => onSetOptions(set, setName)}
          />
        );
      })}

      <Button label={t('activeWorkout.addSet')} variant="ghost" icon={Plus} onPress={onAddSet} />
    </View>
  );
}
