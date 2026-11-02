import { Check } from 'lucide-react-native';
import { Pressable, View } from 'react-native';

import { Text } from '@/components/ui/Text';
import { useTheme } from '@/theme/ThemeProvider';

interface CheckboxProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

/** Never pre-checked by the screens: consent must be an explicit action. */
export function Checkbox({ label, checked, onChange }: CheckboxProps) {
  const { colors, radius, sizes, spacing } = useTheme();
  const boxSize = sizes.icon;

  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      accessibilityLabel={label}
      onPress={() => onChange(!checked)}
      style={({ pressed }) => ({
        minHeight: sizes.touchMin,
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: spacing[3],
        paddingVertical: spacing[2],
        opacity: pressed ? 0.8 : 1,
      })}
    >
      <View
        style={{
          width: boxSize,
          height: boxSize,
          borderRadius: radius.sm / 2,
          borderWidth: 1.5,
          borderColor: checked ? colors.lime : colors.lineStrong,
          backgroundColor: checked ? colors.lime : 'transparent',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {checked ? <Check size={16} strokeWidth={2.6} color={colors.inkOnLime} /> : null}
      </View>
      <Text variant="body" style={{ flex: 1 }}>
        {label}
      </Text>
    </Pressable>
  );
}
