import { ScrollView } from 'react-native';

import { Chip } from '@/components/ui/Chip';
import { useTheme } from '@/theme/ThemeProvider';

interface FilterChipRowProps<T extends string> {
  options: readonly { value: T; label: string }[];
  /** `null` = no filter ("all" chip selected). */
  value: T | null;
  onChange: (value: T | null) => void;
  allLabel: string;
  accessibilityLabel: string;
}

/**
 * One optional filter as a horizontal row of chips. It bleeds to the screen edges so the
 * chips scroll from edge to edge. Tapping the selected chip again clears the filter.
 */
export function FilterChipRow<T extends string>({
  options,
  value,
  onChange,
  allLabel,
  accessibilityLabel,
}: FilterChipRowProps<T>) {
  const { spacing } = useTheme();

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      accessibilityRole="radiogroup"
      accessibilityLabel={accessibilityLabel}
      style={{ marginHorizontal: -spacing[4], flexGrow: 0 }}
      contentContainerStyle={{ paddingHorizontal: spacing[4], gap: spacing[2] }}
    >
      <Chip label={allLabel} selected={value === null} onPress={() => onChange(null)} />
      {options.map((option) => (
        <Chip
          key={option.value}
          label={option.label}
          selected={value === option.value}
          onPress={() => onChange(value === option.value ? null : option.value)}
        />
      ))}
    </ScrollView>
  );
}
