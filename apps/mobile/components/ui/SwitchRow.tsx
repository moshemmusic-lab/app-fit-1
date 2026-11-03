import { Platform, Switch, View } from 'react-native';

import { Text } from '@/components/ui/Text';
import { useTheme } from '@/theme/ThemeProvider';

interface SwitchRowProps {
  label: string;
  hint?: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  disabled?: boolean;
}

export function SwitchRow({ label, hint, value, onValueChange, disabled }: SwitchRowProps) {
  const { colors, sizes, spacing } = useTheme();

  return (
    <View
      style={{
        minHeight: sizes.touchMin,
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing[3],
      }}
    >
      <View style={{ flex: 1, gap: spacing[1] }}>
        <Text variant="bodyStrong">{label}</Text>
        {hint ? (
          <Text variant="caption" color="textMuted">
            {hint}
          </Text>
        ) : null}
      </View>
      <Switch
        accessibilityLabel={label}
        accessibilityHint={hint}
        value={value}
        onValueChange={onValueChange}
        disabled={disabled}
        trackColor={{ false: colors.surface2, true: colors.lime }}
        // iOS 26 applies a custom thumb color inconsistently (some rows tinted, others white),
        // so iOS keeps the system thumb.
        thumbColor={
          Platform.OS === 'android' ? (value ? colors.inkOnLime : colors.textMuted) : undefined
        }
        ios_backgroundColor={colors.surface2}
      />
    </View>
  );
}
