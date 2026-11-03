import type { LucideIcon } from 'lucide-react-native';
import { View, type ColorValue } from 'react-native';

import { useTheme } from '@/theme/ThemeProvider';

interface TabIconProps {
  icon: LucideIcon;
  focused: boolean;
  color: ColorValue;
}

/** Line icon with the lime bar that marks the active tab (docs/DESIGN.md). */
export function TabIcon({ icon: Icon, focused, color }: TabIconProps) {
  const { colors, radius, sizes, spacing } = useTheme();

  return (
    <View style={{ alignItems: 'center', gap: spacing[1] }}>
      <View
        style={{
          width: sizes.icon,
          height: 3,
          borderRadius: radius.pill,
          backgroundColor: focused ? colors.lime : 'transparent',
        }}
      />
      <Icon size={sizes.icon} strokeWidth={1.8} color={color} />
    </View>
  );
}
