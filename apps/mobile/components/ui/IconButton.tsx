import type { LucideIcon } from 'lucide-react-native';
import { Pressable, type PressableProps } from 'react-native';

import { useTheme } from '@/theme/ThemeProvider';

interface IconButtonProps extends Omit<PressableProps, 'children' | 'style'> {
  icon: LucideIcon;
  /** Required: icon-only buttons always need an accessible label (docs/DESIGN.md). */
  label: string;
}

export function IconButton({ icon: Icon, label, ...props }: IconButtonProps) {
  const { colors, sizes } = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => ({
        width: sizes.touchMin,
        height: sizes.touchMin,
        alignItems: 'center',
        justifyContent: 'center',
        opacity: pressed ? 0.6 : 1,
      })}
      {...props}
    >
      <Icon size={sizes.icon} strokeWidth={1.8} color={colors.text} />
    </Pressable>
  );
}
