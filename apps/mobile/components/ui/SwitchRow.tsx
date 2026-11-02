import { Switch, View } from 'react-native';

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
        thumbColor={value ? colors.inkOnLime : colors.textMuted}
        ios_backgroundColor={colors.surface2}
      />
    </View>
  );
}
