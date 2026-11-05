import { ChevronDown } from 'lucide-react-native';
import { Pressable } from 'react-native';

import { Text } from '@/components/ui/Text';
import { useTheme } from '@/theme/ThemeProvider';

interface FilterButtonProps {
  /** The chosen option, or "Todos los músculos" when there is none. */
  label: string;
  active: boolean;
  /** Read by screen readers: what this button filters by. */
  accessibilityLabel: string;
  onPress: () => void;
}

/** Opens a filter's sheet. In use = lime fill (plus the chosen name, so not color alone). */
export function FilterButton({ label, active, accessibilityLabel, onPress }: FilterButtonProps) {
  const { colors, radius, sizes, spacing } = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${accessibilityLabel}: ${label}`}
      onPress={onPress}
      style={({ pressed }) => ({
        flex: 1,
        minHeight: sizes.touchMin,
        paddingHorizontal: spacing[3],
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing[1],
        borderRadius: radius.md,
        backgroundColor: active ? colors.lime : colors.surface2,
        opacity: pressed ? 0.8 : 1,
      })}
    >
      <Text
        variant="bodyStrong"
        color={active ? 'inkOnLime' : 'text'}
        numberOfLines={1}
        style={{ flex: 1 }}
      >
        {label}
      </Text>
      <ChevronDown size={18} strokeWidth={2} color={active ? colors.inkOnLime : colors.textMuted} />
    </Pressable>
  );
}
