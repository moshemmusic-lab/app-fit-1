import type { TrackingType } from '@app-fit/shared/exercises';
import type { WeightUnit } from '@app-fit/shared/schemas';
import { formatDuration, type SetValues } from '@app-fit/shared/workouts';
import { MoreHorizontal, Plus, Timer } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { IconButton } from '@/components/ui/IconButton';
import { Text } from '@/components/ui/Text';
import { TextField } from '@/components/ui/TextField';
import { SetInput } from '@/features/workouts/components/SetInput';
import { SET_NUMBER_WIDTH } from '@/features/workouts/components/SetRow';
import { columnKey, displayFields } from '@/features/workouts/fields';
import { numberSets } from '@/features/workouts/finish';
import { useTheme } from '@/theme/ThemeProvider';

import { targetValues } from '../routine-logic';
import type { RoutineExercise, RoutineSet } from '../types';

interface RoutineExerciseEditorProps {
  exercise: RoutineExercise;
  name: string;
  trackingType: TrackingType;
  unit: WeightUnit;
  noteOpen: boolean;
  onChangeNotes: (notes: string) => void;
  onChangeSet: (set: RoutineSet, patch: Partial<SetValues>) => void;
  onSetOptions: (set: RoutineSet, setName: string) => void;
  onAddSet: () => void;
  onRestPress: () => void;
  onOptions: () => void;
}

/** An exercise of a routine: its rest and target sets (no check: nothing is done here). */
export function RoutineExerciseEditor({
  exercise,
  name,
  trackingType,
  unit,
  noteOpen,
  onChangeNotes,
  onChangeSet,
  onSetOptions,
  onAddSet,
  onRestPress,
  onOptions,
}: RoutineExerciseEditorProps) {
  const { t } = useTranslation();
  const { colors, radius, sizes, spacing } = useTheme();
  // Calories are never a target (they are a result).
  const fields = displayFields(trackingType, unit)
    .filter(({ field }) => field !== 'calories')
    .map((field) => ({
      ...field,
      label: t(`activeWorkout.columns.${columnKey(field.field, trackingType, unit)}`),
    }));
  const numbers = numberSets(exercise.sets);

  const labelOf = (set: RoutineSet, index: number) => {
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

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[2] }}>
        <Text
          variant="label"
          color="textMuted"
          style={{ width: SET_NUMBER_WIDTH, textAlign: 'center' }}
        >
          {t('activeWorkout.columns.set')}
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
      </View>

      {exercise.sets.map((set, index) => {
        const { label, setName } = labelOf(set, index);
        const values = targetValues(set);
        return (
          <View
            key={set.id}
            style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[2] }}
          >
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('activeWorkout.setOptions', { set: setName })}
              onPress={() => onSetOptions(set, setName)}
              hitSlop={spacing[1]}
              style={({ pressed }) => ({
                width: SET_NUMBER_WIDTH,
                minHeight: sizes.touchMin,
                alignItems: 'center',
                justifyContent: 'center',
                opacity: pressed ? 0.6 : 1,
              })}
            >
              <Text variant="bodyStrong" color={set.setType === 'warmup' ? 'warm' : 'text'}>
                {label}
              </Text>
            </Pressable>
            {fields.map(({ field, kind, label: fieldLabel, toDisplay, fromDisplay }) => {
              const value = values?.[field] ?? null;
              return (
                <SetInput
                  key={field}
                  kind={kind}
                  accessibilityLabel={t('activeWorkout.inputLabel', {
                    field: fieldLabel,
                    set: setName,
                  })}
                  value={value === null ? null : toDisplay(value)}
                  placeholder={null}
                  onChange={(next) =>
                    onChangeSet(set, { [field]: next === null ? null : fromDisplay(next) })
                  }
                />
              );
            })}
          </View>
        );
      })}

      <Button label={t('activeWorkout.addSet')} variant="ghost" icon={Plus} onPress={onAddSet} />
    </View>
  );
}
