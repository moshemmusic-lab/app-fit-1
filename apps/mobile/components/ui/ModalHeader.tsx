import { Pressable, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { useTheme } from '@/theme/ThemeProvider';

interface ModalHeaderProps {
  title: string;
  cancelLabel: string;
  onCancel: () => void;
  /** The screen's action on the right, e.g. "Guardar" or "Crear". */
  action?: {
    label: string;
    onPress: () => void;
    /** Primary (lime) for a save; ghost for a secondary action such as "Crear". */
    variant?: 'primary' | 'ghost';
    disabled?: boolean;
    loading?: boolean;
  };
}

/**
 * Top bar of a screen opened to create or pick something: "Cancelar" on the left, the title in
 * the middle and its action on the right, as is usual on iOS (docs/DESIGN.md).
 */
export function ModalHeader({ title, cancelLabel, onCancel, action }: ModalHeaderProps) {
  const { sizes, spacing } = useTheme();

  return (
    <View
      style={{
        minHeight: sizes.touchMin + spacing[2],
        // "Cancelar" brings its own padding; the action lines up with the screen margin.
        paddingLeft: spacing[2],
        paddingRight: spacing[4],
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing[2],
      }}
    >
      <View style={{ flex: 1, alignItems: 'flex-start' }}>
        <Pressable
          accessibilityRole="button"
          onPress={onCancel}
          hitSlop={spacing[1]}
          style={({ pressed }) => ({
            minHeight: sizes.touchMin,
            paddingHorizontal: spacing[2],
            justifyContent: 'center',
            opacity: pressed ? 0.6 : 1,
          })}
        >
          <Text variant="body">{cancelLabel}</Text>
        </Pressable>
      </View>
      <Text
        variant="bodyStrong"
        accessibilityRole="header"
        numberOfLines={1}
        style={{ flexShrink: 1, textAlign: 'center' }}
      >
        {title}
      </Text>
      <View style={{ flex: 1, alignItems: 'flex-end' }}>
        {action ? (
          <Button
            label={action.label}
            variant={action.variant ?? 'primary'}
            compact
            disabled={action.disabled}
            loading={action.loading}
            onPress={action.onPress}
          />
        ) : null}
      </View>
    </View>
  );
}
