import { Check } from 'lucide-react-native';
import { Pressable, View, type PressableProps } from 'react-native';

import { Text } from '@/components/ui/Text';
import { useTheme } from '@/theme/ThemeProvider';

interface OptionCardProps extends Omit<PressableProps, 'children' | 'style'> {
  title: string;
  description?: string;
  selected: boolean;
}

/** Full-width single choice. Selected = lime fill **and** a check icon, like Chip. */
export function OptionCard({ title, description, selected, ...props }: OptionCardProps) {
  const { colors, radius, sizes, spacing } = useTheme();

  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ checked: selected }}
      accessibilityLabel={description ? `${title}. ${description}` : title}
      style={({ pressed }) => ({
        minHeight: sizes.touchMin + spacing[4],
        padding: spacing[4],
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing[3],
        borderRadius: radius.md,
        borderWidth: 1,
        borderColor: selected ? colors.lime : colors.line,
        backgroundColor: selected ? colors.lime : colors.surface,
        opacity: pressed ? 0.8 : 1,
      })}
      {...props}
    >
      <View style={{ flex: 1, gap: spacing[1] }}>
        <Text variant="bodyStrong" color={selected ? 'inkOnLime' : 'text'}>
          {title}
        </Text>
        {description ? (
          <Text variant="caption" color={selected ? 'inkOnLime' : 'textMuted'}>
            {description}
          </Text>
        ) : null}
      </View>
      {/* The slot is always there so the text does not reflow when the card gets selected. */}
      <View style={{ width: sizes.icon, height: sizes.icon }}>
        {selected ? <Check size={sizes.icon} strokeWidth={2.2} color={colors.inkOnLime} /> : null}
      </View>
    </Pressable>
  );
}
