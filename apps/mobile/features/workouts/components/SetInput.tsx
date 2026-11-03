import {
  formatDecimal,
  formatDuration,
  parseDecimal,
  parseDuration,
} from '@app-fit/shared/workouts';
import { useState } from 'react';
import { TextInput } from 'react-native';

import { fontNameForVariant } from '@/theme/font-names';
import { useTheme } from '@/theme/ThemeProvider';

export type SetInputKind = 'decimal' | 'integer' | 'duration';

interface SetInputProps {
  kind: SetInputKind;
  /** Value in the units shown (lb if the user trains in lb, km for distance). */
  value: number | null;
  /** Suggested value, shown in grey: marking the set uses it if the field is empty. */
  placeholder: number | null;
  onChange: (value: number | null) => void;
  accessibilityLabel: string;
}

function format(kind: SetInputKind, value: number | null): string {
  if (value === null) return '';
  return kind === 'duration' ? formatDuration(value) : formatDecimal(value);
}

function parse(kind: SetInputKind, text: string): number | null {
  if (kind === 'duration') return parseDuration(text);
  if (kind === 'integer') return /^\d+$/.test(text.trim()) ? Number(text.trim()) : null;
  return parseDecimal(text);
}

const keyboardTypes = {
  decimal: 'decimal-pad',
  integer: 'number-pad',
  duration: 'numbers-and-punctuation',
} as const;

/** Compact field of a set row. Keeps what the user types while focused (e.g. "102,"). */
export function SetInput({
  kind,
  value,
  placeholder,
  onChange,
  accessibilityLabel,
}: SetInputProps) {
  const { colors, radius, sizes, typography } = useTheme();
  const [text, setText] = useState('');
  const [focused, setFocused] = useState(false);

  return (
    <TextInput
      accessibilityLabel={accessibilityLabel}
      value={focused ? text : format(kind, value)}
      placeholder={format(kind, placeholder)}
      placeholderTextColor={colors.textSubtle}
      keyboardType={keyboardTypes[kind]}
      selectTextOnFocus
      selectionColor={colors.accentText}
      cursorColor={colors.accentText}
      onFocus={() => {
        setText(format(kind, value));
        setFocused(true);
      }}
      onBlur={() => setFocused(false)}
      onChangeText={(next) => {
        setText(next);
        onChange(parse(kind, next));
      }}
      style={{
        flex: 1,
        minHeight: sizes.touchMin,
        borderRadius: radius.sm,
        backgroundColor: colors.surface2,
        color: colors.text,
        textAlign: 'center',
        fontFamily: fontNameForVariant('bodyStrong'),
        fontSize: typography.bodyStrong.fontSize,
      }}
    />
  );
}
