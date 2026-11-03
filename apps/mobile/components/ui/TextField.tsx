import { useState } from 'react';
import { TextInput, View, type TextInputProps } from 'react-native';

import { FormMessage } from '@/components/ui/FormMessage';
import { Text } from '@/components/ui/Text';
import { fontNameForVariant } from '@/theme/font-names';
import { useTheme } from '@/theme/ThemeProvider';

interface TextFieldProps extends Omit<TextInputProps, 'style'> {
  label: string;
  hint?: string;
  error?: string | null;
  /** Shown under the field on the right, e.g. a character counter. */
  trailingHint?: string;
}

export function TextField({
  label,
  hint,
  error,
  trailingHint,
  multiline,
  onFocus,
  onBlur,
  ...props
}: TextFieldProps) {
  const { colors, radius, sizes, spacing, typography } = useTheme();
  const [focused, setFocused] = useState(false);

  return (
    <View style={{ gap: spacing[2] }}>
      <Text variant="label" color="textMuted">
        {label}
      </Text>
      <TextInput
        accessibilityLabel={label}
        accessibilityHint={hint}
        placeholderTextColor={colors.textMuted}
        selectionColor={colors.accentText}
        cursorColor={colors.accentText}
        multiline={multiline}
        onFocus={(event) => {
          setFocused(true);
          onFocus?.(event);
        }}
        onBlur={(event) => {
          setFocused(false);
          onBlur?.(event);
        }}
        style={{
          minHeight: multiline ? sizes.touchMin * 2 : sizes.touchMin + spacing[2],
          paddingHorizontal: spacing[4],
          paddingVertical: spacing[3],
          borderRadius: radius.md,
          borderWidth: 1,
          borderColor: focused ? colors.lineStrong : colors.line,
          backgroundColor: colors.surface2,
          color: colors.text,
          fontFamily: fontNameForVariant('body'),
          fontSize: typography.body.fontSize,
          textAlignVertical: multiline ? 'top' : 'center',
        }}
        {...props}
      />
      {error ? <FormMessage message={error} /> : null}
      {hint || trailingHint ? (
        <View style={{ flexDirection: 'row', gap: spacing[2] }}>
          <Text variant="caption" color="textMuted" style={{ flex: 1 }}>
            {hint ?? ''}
          </Text>
          {trailingHint ? (
            <Text variant="caption" color="textMuted">
              {trailingHint}
            </Text>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}
