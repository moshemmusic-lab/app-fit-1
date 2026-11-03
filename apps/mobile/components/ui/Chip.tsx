import { Check } from 'lucide-react-native';
import { Pressable, type PressableProps } from 'react-native';

import { Text } from '@/components/ui/Text';
import { useTheme } from '@/theme/ThemeProvider';

interface ChipProps extends Omit<PressableProps, 'children'> {
  label: string;
  selected: boolean;
}

/** Selectable chip. Selected = lime fill **and** a check icon (state never relies on color only). */
export function Chip({ label, selected, ...props }: ChipProps) {
  const { colors, radius, sizes, spacing } = useTheme();

  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ checked: selected }}
      style={({ pressed }) => ({
        minHeight: sizes.touchMin,
        paddingHorizontal: spacing[4],
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing[1],
        borderRadius: radius.pill,
        borderWidth: 1,
        borderColor: selected ? colors.lime : colors.lineStrong,
        backgroundColor: selected ? colors.lime : 'transparent',
        opacity: pressed ? 0.8 : 1,
      })}
      {...props}
    >
      {selected ? <Check size={18} strokeWidth={2.2} color={colors.inkOnLime} /> : null}
      <Text variant="bodyStrong" color={selected ? 'inkOnLime' : 'text'}>
        {label}
      </Text>
    </Pressable>
  );
}
