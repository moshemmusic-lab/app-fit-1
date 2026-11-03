import type { SetValues } from '@app-fit/shared/workouts';
import { Check } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';

import { Text } from '@/components/ui/Text';
import { useTheme } from '@/theme/ThemeProvider';

import type { DisplayField } from '../fields';
import type { DraftSet } from '../types';
import { SetInput } from './SetInput';

/** Width of the set number and check columns, shared with the header row. */
export const SET_NUMBER_WIDTH = 36;

interface SetRowProps {
  number: number;
  set: DraftSet;
  /** Inputs of the row with their column name (also used as accessible name). */
  fields: readonly (DisplayField & { label: string })[];
  /** Suggested values (last time's, else the set above): grey placeholders, used when marked done. */
  suggestion: SetValues | undefined;
  /** Last time's values as text ("80 kg × 8"), or null. */
  previousLabel: string | null;
  onChange: (patch: Partial<SetValues>) => void;
  onToggleComplete: () => void;
  onOptions: () => void;
}

/**
 * One set: number, last time, inputs and the check. Done = lime check **and** filled
 * button, so the state does not rely on color alone (docs/DESIGN.md).
 */
export function SetRow({
  number,
  set,
  fields,
  suggestion,
  previousLabel,
  onChange,
  onToggleComplete,
  onOptions,
}: SetRowProps) {
  const { t } = useTranslation();
  const { colors, radius, sizes, spacing } = useTheme();
  const done = set.completedAt !== null;

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[2] }}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('activeWorkout.setOptions', { number })}
        onPress={onOptions}
        hitSlop={spacing[1]}
        style={({ pressed }) => ({
          width: SET_NUMBER_WIDTH,
          minHeight: sizes.touchMin,
          alignItems: 'center',
          justifyContent: 'center',
          opacity: pressed ? 0.6 : 1,
        })}
      >
        <Text variant="bodyStrong" color={done ? 'text' : 'textMuted'}>
          {number}
        </Text>
      </Pressable>

      <Text variant="caption" color="textMuted" numberOfLines={1} style={{ flex: 1.2 }}>
        {previousLabel ?? '—'}
      </Text>

      {fields.map(({ field, kind, label, toDisplay, fromDisplay }) => {
        const value = set[field];
        const suggested = suggestion?.[field] ?? null;
        return (
          <SetInput
            key={field}
            kind={kind}
            accessibilityLabel={`${label} · ${t('activeWorkout.columns.set')} ${number}`}
            value={value === null ? null : toDisplay(value)}
            placeholder={suggested === null ? null : toDisplay(suggested)}
            onChange={(next) => onChange({ [field]: next === null ? null : fromDisplay(next) })}
          />
        );
      })}

      <Pressable
        accessibilityRole="checkbox"
        accessibilityState={{ checked: done }}
        accessibilityLabel={
          done
            ? t('activeWorkout.uncompleteSet', { number })
            : t('activeWorkout.completeSet', { number })
        }
        onPress={onToggleComplete}
        style={({ pressed }) => ({
          width: sizes.touchMin,
          height: sizes.touchMin,
          borderRadius: radius.md,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: done ? colors.lime : colors.surface2,
          opacity: pressed ? 0.7 : 1,
        })}
      >
        <Check
          size={sizes.icon * 0.9}
          strokeWidth={2.4}
          color={done ? colors.inkOnLime : colors.textSubtle}
        />
      </Pressable>
    </View>
  );
}
