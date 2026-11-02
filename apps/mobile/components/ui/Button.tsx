import type { LucideIcon } from 'lucide-react-native';
import { ActivityIndicator, Pressable, View, type PressableProps } from 'react-native';

import { Text } from '@/components/ui/Text';
import { useTheme } from '@/theme/ThemeProvider';

type ButtonVariant = 'primary' | 'secondary' | 'ghost';

interface ButtonProps extends Omit<PressableProps, 'children' | 'style'> {
  label: string;
  variant?: ButtonVariant;
  loading?: boolean;
  icon?: LucideIcon;
}

/**
 * Primary = lime fill with `inkOnLime` text (the main action of a screen).
 * Secondary = `surface2` fill. Ghost = no fill, for low-emphasis actions.
 */
export function Button({
  label,
  variant = 'primary',
  loading = false,
  disabled,
  icon: Icon,
  ...props
}: ButtonProps) {
  const { colors, radius, sizes, spacing } = useTheme();
  const isDisabled = disabled === true || loading;
  const textColor = variant === 'primary' ? 'inkOnLime' : 'text';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      disabled={isDisabled}
      style={({ pressed }) => ({
        minHeight: variant === 'primary' ? sizes.buttonPrimary : sizes.touchMin,
        paddingHorizontal: spacing[4],
        borderRadius: radius.md,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor:
          variant === 'primary'
            ? colors.lime
            : variant === 'secondary'
              ? colors.surface2
              : 'transparent',
        opacity: isDisabled ? 0.5 : pressed ? 0.8 : 1,
      })}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color={colors[textColor]} />
      ) : (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[2] }}>
          {Icon ? <Icon size={20} strokeWidth={1.8} color={colors[textColor]} /> : null}
          <Text variant="bodyStrong" color={textColor}>
            {label}
          </Text>
        </View>
      )}
    </Pressable>
  );
}
