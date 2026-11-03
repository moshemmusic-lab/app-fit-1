import { Search, X } from 'lucide-react-native';
import { TextInput, View, type TextInputProps } from 'react-native';

import { IconButton } from '@/components/ui/IconButton';
import { fontNameForVariant } from '@/theme/font-names';
import { useTheme } from '@/theme/ThemeProvider';

interface SearchFieldProps extends Omit<TextInputProps, 'style' | 'value' | 'onChangeText'> {
  /** Accessible name of the field (there is no visible label). */
  label: string;
  /** Accessible name of the clear button. */
  clearLabel: string;
  value: string;
  onChangeText: (text: string) => void;
}

/** Search input with a magnifier icon and a clear button once there is text. */
export function SearchField({
  label,
  clearLabel,
  value,
  onChangeText,
  ...props
}: SearchFieldProps) {
  const { colors, radius, sizes, spacing, typography } = useTheme();

  return (
    <View
      style={{
        minHeight: sizes.touchMin + spacing[2],
        flexDirection: 'row',
        alignItems: 'center',
        paddingLeft: spacing[3],
        borderRadius: radius.md,
        borderWidth: 1,
        borderColor: colors.line,
        backgroundColor: colors.surface2,
      }}
    >
      <Search size={sizes.icon * 0.8} strokeWidth={1.8} color={colors.textMuted} />
      <TextInput
        accessibilityLabel={label}
        accessibilityRole="search"
        value={value}
        onChangeText={onChangeText}
        placeholderTextColor={colors.textMuted}
        selectionColor={colors.accentText}
        cursorColor={colors.accentText}
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="search"
        clearButtonMode="never"
        style={{
          flex: 1,
          alignSelf: 'stretch',
          paddingHorizontal: spacing[2],
          color: colors.text,
          fontFamily: fontNameForVariant('body'),
          fontSize: typography.body.fontSize,
        }}
        {...props}
      />
      {value !== '' ? (
        <IconButton icon={X} label={clearLabel} onPress={() => onChangeText('')} />
      ) : null}
    </View>
  );
}
