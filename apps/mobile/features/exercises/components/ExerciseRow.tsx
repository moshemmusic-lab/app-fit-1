import { Check, ChevronRight } from 'lucide-react-native';
import { Pressable, View } from 'react-native';

import { Text } from '@/components/ui/Text';
import { useTheme } from '@/theme/ThemeProvider';

interface ExerciseRowProps {
  name: string;
  /** e.g. "Pecho · Barra". */
  details: string;
  /** Selection mode when defined: shows a check instead of the chevron. */
  selected?: boolean;
  onPress: () => void;
}

export function ExerciseRow({ name, details, selected, onPress }: ExerciseRowProps) {
  const { colors, radius, sizes, spacing } = useTheme();
  const selectable = selected !== undefined;

  return (
    <Pressable
      accessibilityRole={selectable ? 'checkbox' : 'button'}
      accessibilityState={selectable ? { checked: selected } : undefined}
      accessibilityLabel={`${name}. ${details}`}
      onPress={onPress}
      style={({ pressed }) => ({
        minHeight: sizes.touchMin + spacing[4],
        paddingVertical: spacing[3],
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing[3],
        opacity: pressed ? 0.6 : 1,
      })}
    >
      <View style={{ flex: 1, gap: spacing[1] }}>
        <Text variant="bodyStrong">{name}</Text>
        <Text variant="caption" color="textMuted">
          {details}
        </Text>
      </View>
      {selectable ? (
        // Selected = lime fill **and** a check, like Chip.
        <View
          style={{
            width: sizes.icon + spacing[1],
            height: sizes.icon + spacing[1],
            borderRadius: radius.pill,
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: selected ? 0 : 1.5,
            borderColor: colors.lineStrong,
            backgroundColor: selected ? colors.lime : 'transparent',
          }}
        >
          {selected ? (
            <Check size={sizes.icon * 0.7} strokeWidth={2.6} color={colors.inkOnLime} />
          ) : null}
        </View>
      ) : (
        <ChevronRight size={sizes.icon * 0.8} strokeWidth={1.8} color={colors.textMuted} />
      )}
    </Pressable>
  );
}
