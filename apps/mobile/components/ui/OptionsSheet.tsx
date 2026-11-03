import { Check, type LucideIcon } from 'lucide-react-native';
import { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, Platform, Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { useTheme } from '@/theme/ThemeProvider';

export interface SheetOption {
  label: string;
  onPress: () => void;
  icon?: LucideIcon;
  /** Shows a check: the current choice. */
  selected?: boolean;
}

export interface OptionsSheetConfig {
  title?: string;
  options: SheetOption[];
}

interface OptionsSheetProps {
  /** Open while not null. */
  config: OptionsSheetConfig | null;
  onClose: () => void;
}

/**
 * List of actions that slides up from the bottom, within thumb reach. Used instead of
 * Alert because Android alerts show three buttons at most.
 */
export function OptionsSheet({ config, onClose }: OptionsSheetProps) {
  const { t } = useTranslation();
  const { colors, radius, sizes, spacing } = useTheme();
  const insets = useSafeAreaInsets();
  // On iOS the chosen action runs once the sheet is gone, so it can open an alert or navigate.
  const pendingAction = useRef<(() => void) | null>(null);

  const runPendingAction = () => {
    const action = pendingAction.current;
    pendingAction.current = null;
    action?.();
  };

  const choose = (option: SheetOption) => {
    pendingAction.current = option.onPress;
    onClose();
    if (Platform.OS !== 'ios') runPendingAction();
  };

  return (
    <Modal
      visible={config !== null}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      onDismiss={runPendingAction}
    >
      <View style={{ flex: 1, justifyContent: 'flex-end' }}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('common.cancel')}
          onPress={onClose}
          style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 }}
        >
          <View style={{ flex: 1, backgroundColor: colors.bg, opacity: 0.6 }} />
        </Pressable>
        <View
          style={{
            paddingHorizontal: spacing[4],
            paddingTop: spacing[4],
            paddingBottom: Math.max(insets.bottom, spacing[4]),
            gap: spacing[1],
            borderTopLeftRadius: radius.xl,
            borderTopRightRadius: radius.xl,
            backgroundColor: colors.surface,
          }}
        >
          {config?.title ? (
            <Text variant="label" color="textMuted" style={{ paddingBottom: spacing[2] }}>
              {config.title}
            </Text>
          ) : null}
          {config?.options.map((option) => {
            const Icon = option.icon;
            return (
              <Pressable
                key={option.label}
                accessibilityRole="button"
                accessibilityState={option.selected ? { selected: true } : undefined}
                onPress={() => choose(option)}
                style={({ pressed }) => ({
                  minHeight: sizes.touchMin + spacing[2],
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: spacing[3],
                  opacity: pressed ? 0.6 : 1,
                })}
              >
                {Icon ? (
                  <Icon size={sizes.icon} strokeWidth={1.8} color={colors.textMuted} />
                ) : null}
                <Text variant="bodyStrong" style={{ flex: 1 }}>
                  {option.label}
                </Text>
                {option.selected ? (
                  <Check size={sizes.icon} strokeWidth={2.2} color={colors.accentText} />
                ) : null}
              </Pressable>
            );
          })}
          <View style={{ paddingTop: spacing[2] }}>
            <Button label={t('common.cancel')} variant="secondary" onPress={onClose} />
          </View>
        </View>
      </View>
    </Modal>
  );
}
