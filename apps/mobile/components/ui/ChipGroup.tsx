import { View } from 'react-native';

import { Chip } from '@/components/ui/Chip';
import { useTheme } from '@/theme/ThemeProvider';

interface ChipGroupProps<T extends string> {
  options: readonly { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  accessibilityLabel: string;
}

/** Single choice between a few short options. */
export function ChipGroup<T extends string>({
  options,
  value,
  onChange,
  accessibilityLabel,
}: ChipGroupProps<T>) {
  const { spacing } = useTheme();

  return (
    <View
      accessibilityRole="radiogroup"
      accessibilityLabel={accessibilityLabel}
      style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing[2] }}
    >
      {options.map((option) => (
        <Chip
          key={option.value}
          label={option.label}
          selected={value === option.value}
          onPress={() => onChange(option.value)}
        />
      ))}
    </View>
  );
}
