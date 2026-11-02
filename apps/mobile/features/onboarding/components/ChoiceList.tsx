import { View } from 'react-native';

import { OptionCard } from '@/components/ui/OptionCard';
import { useTheme } from '@/theme/ThemeProvider';

interface ChoiceListProps<T extends string> {
  options: readonly { value: T; title: string; description?: string }[];
  value: T | null;
  onChange: (value: T) => void;
}

export function ChoiceList<T extends string>({ options, value, onChange }: ChoiceListProps<T>) {
  const { spacing } = useTheme();

  return (
    <View accessibilityRole="radiogroup" style={{ gap: spacing[2] }}>
      {options.map((option) => (
        <OptionCard
          key={option.value}
          title={option.title}
          description={option.description}
          selected={value === option.value}
          onPress={() => onChange(option.value)}
        />
      ))}
    </View>
  );
}
