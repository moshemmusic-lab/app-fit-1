import { ChevronRight } from 'lucide-react-native';
import { Pressable, View } from 'react-native';

import { Text } from '@/components/ui/Text';
import { useTheme } from '@/theme/ThemeProvider';

interface ExerciseRowProps {
  name: string;
  /** e.g. "Pecho · Barra". */
  details: string;
  onPress: () => void;
}

export function ExerciseRow({ name, details, onPress }: ExerciseRowProps) {
  const { colors, sizes, spacing } = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
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
      <ChevronRight size={sizes.icon * 0.8} strokeWidth={1.8} color={colors.textMuted} />
    </Pressable>
  );
}
