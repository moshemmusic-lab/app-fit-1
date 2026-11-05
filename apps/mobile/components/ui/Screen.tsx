import { ChevronLeft } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Text } from '@/components/ui/Text';
import { useTheme } from '@/theme/ThemeProvider';

interface ScreenProps {
  title?: string;
  /** Content above the title, e.g. the wordmark. */
  header?: ReactNode;
  /** Actions on the right of the top bar. */
  headerRight?: ReactNode;
  /** Shows a back button in the top bar. */
  onBack?: () => void;
  /** Keeps the top bar's space even when it has no buttons, so multi-step screens don't jump. */
  keepTopBar?: boolean;
  /** Replaces the top bar, e.g. with a ModalHeader ("Cancelar · title · Guardar"). */
  topBar?: ReactNode;
  /** Main actions pinned to the bottom, within thumb reach (docs/DESIGN.md). */
  footer?: ReactNode;
  /** Screens outside the tab bar need the bottom safe area. */
  withBottomInset?: boolean;
  /**
   * `false` for screens built around a long list (FlatList), which scrolls by itself:
   * the content fills the screen instead of going inside a ScrollView.
   */
  scroll?: boolean;
  children?: ReactNode;
}

/** Base layout for every screen: theme background, safe area, title and keyboard handling. */
export function Screen({
  title,
  header,
  headerRight,
  onBack,
  keepTopBar = false,
  topBar,
  footer,
  withBottomInset = false,
  scroll = true,
  children,
}: ScreenProps) {
  const { t } = useTranslation();
  const { colors, sizes, spacing } = useTheme();
  const showTopBar = keepTopBar || onBack !== undefined || headerRight !== undefined;

  return (
    <SafeAreaView
      edges={withBottomInset ? ['top', 'bottom'] : ['top']}
      style={{ flex: 1, backgroundColor: colors.bg }}
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {topBar ?? null}
        {!topBar && showTopBar ? (
          <View
            style={{
              minHeight: sizes.touchMin,
              paddingHorizontal: spacing[2],
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            {onBack ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t('common.back')}
                onPress={onBack}
                hitSlop={spacing[2]}
                style={({ pressed }) => ({
                  width: sizes.touchMin,
                  height: sizes.touchMin,
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: pressed ? 0.6 : 1,
                })}
              >
                <ChevronLeft size={sizes.icon} strokeWidth={1.8} color={colors.text} />
              </Pressable>
            ) : (
              <View />
            )}
            {headerRight}
          </View>
        ) : null}
        {scroll ? (
          <ScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ padding: spacing[4], gap: spacing[6], flexGrow: 1 }}
          >
            {header}
            {title ? (
              <Text variant="screenTitle" accessibilityRole="header">
                {title}
              </Text>
            ) : null}
            {children}
          </ScrollView>
        ) : (
          <View
            style={{
              flex: 1,
              paddingHorizontal: spacing[4],
              paddingTop: spacing[4],
              gap: spacing[4],
            }}
          >
            {header}
            {title ? (
              <Text variant="screenTitle" accessibilityRole="header">
                {title}
              </Text>
            ) : null}
            {children}
          </View>
        )}
        {footer ? (
          <View
            style={{ paddingHorizontal: spacing[4], paddingVertical: spacing[3], gap: spacing[2] }}
          >
            {footer}
          </View>
        ) : null}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
