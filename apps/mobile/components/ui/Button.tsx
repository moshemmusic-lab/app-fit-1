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
  /** Primary height for a secondary or ghost button placed next to a primary one. */
  tall?: boolean;
  /** Small button for a top bar ("Guardar"): touch height, tighter padding. */
  compact?: boolean;
  /** `start` lines the icon and label up on the left, for a full-width action row. */
  align?: 'center' | 'start';
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
  tall = false,
  compact = false,
  align = 'center',
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
        minHeight:
          (variant === 'primary' || tall) && !compact ? sizes.buttonPrimary : sizes.touchMin,
        paddingHorizontal: compact ? spacing[3] : spacing[4],
        borderRadius: radius.md,
        alignItems: align === 'start' ? 'flex-start' : 'center',
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
