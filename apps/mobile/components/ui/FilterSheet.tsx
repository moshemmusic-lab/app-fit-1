import { Check } from 'lucide-react-native';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { useTheme } from '@/theme/ThemeProvider';

export interface FilterOption<T extends string> {
  value: T;
  label: string;
}

export interface FilterGroup<T extends string> {
  /** e.g. "Tren superior"; no title for a single flat group. */
  title?: string;
  options: readonly FilterOption<T>[];
}

interface FilterSheetProps<T extends string> {
  visible: boolean;
  title: string;
  groups: readonly FilterGroup<T>[];
  /** The filter in use (`null` = none). The sheet edits a copy until "Ver N" is tapped. */
  value: T | null;
  /** How many results a choice would give, for the "Ver N ejercicios" button. */
  resultCount: (value: T | null) => number;
  resultLabel: (count: number) => string;
  clearLabel: string;
  onApply: (value: T | null) => void;
  onClose: () => void;
}

function chunkPairs<T>(items: readonly T[]): T[][] {
  const rows: T[][] = [];
  for (let index = 0; index < items.length; index += 2) rows.push(items.slice(index, index + 2));
  return rows;
}

/**
 * One filter's options as a two-column grid in a sheet from the bottom. Tapping an option
 * selects it (again to deselect); the count updates; "Ver N" applies it.
 */
export function FilterSheet<T extends string>({
  visible,
  title,
  groups,
  value,
  resultCount,
  resultLabel,
  clearLabel,
  onApply,
  onClose,
}: FilterSheetProps<T>) {
  const { t } = useTranslation();
  const { colors, radius, sizes, spacing } = useTheme();
  const insets = useSafeAreaInsets();
  const [choice, setChoice] = useState<T | null>(value);
  const [wasVisible, setWasVisible] = useState(visible);

  // Each time it opens, start from the filter in use (adjusted while rendering, not in an effect).
  if (visible !== wasVisible) {
    setWasVisible(visible);
    if (visible) setChoice(value);
  }

  const count = resultCount(choice);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
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
            maxHeight: '85%',
            paddingTop: spacing[4],
            paddingBottom: Math.max(insets.bottom, spacing[4]),
            gap: spacing[3],
            borderTopLeftRadius: radius.md,
            borderTopRightRadius: radius.md,
            backgroundColor: colors.surface,
          }}
        >
          <Text
            variant="bodyStrong"
            accessibilityRole="header"
            style={{ textAlign: 'center', paddingHorizontal: spacing[4] }}
          >
            {title}
          </Text>
          <ScrollView
            accessibilityRole="radiogroup"
            accessibilityLabel={title}
            contentContainerStyle={{ paddingHorizontal: spacing[4], gap: spacing[4] }}
          >
            {groups.map((group) => (
              <View key={group.title ?? 'all'} style={{ gap: spacing[2] }}>
                {group.title ? (
                  <Text variant="label" color="textMuted">
                    {group.title}
                  </Text>
                ) : null}
                {chunkPairs(group.options).map((row) => (
                  <View key={row[0]?.value} style={{ flexDirection: 'row', gap: spacing[2] }}>
                    {row.map((option) => {
                      const selected = choice === option.value;
                      return (
                        <Pressable
                          key={option.value}
                          accessibilityRole="radio"
                          accessibilityState={{ checked: selected }}
                          onPress={() => setChoice(selected ? null : option.value)}
                          style={({ pressed }) => ({
                            flex: 1,
                            minHeight: sizes.touchMin + spacing[3],
                            paddingHorizontal: spacing[3],
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: spacing[2],
                            borderRadius: radius.md,
                            backgroundColor: selected ? colors.lime : colors.surface2,
                            opacity: pressed ? 0.8 : 1,
                          })}
                        >
                          <Text
                            variant="bodyStrong"
                            color={selected ? 'inkOnLime' : 'text'}
                            style={{ flex: 1 }}
                          >
                            {option.label}
                          </Text>
                          {selected ? (
                            <Check size={18} strokeWidth={2.2} color={colors.inkOnLime} />
                          ) : null}
                        </Pressable>
                      );
                    })}
                    {/* Keeps a lone last option at half width. */}
                    {row.length === 1 ? (
                      // Same padding as an option: flex shares the space left after padding.
                      <View style={{ flex: 1, paddingHorizontal: spacing[3] }} />
                    ) : null}
                  </View>
                ))}
              </View>
            ))}
          </ScrollView>
          <View style={{ flexDirection: 'row', gap: spacing[2], paddingHorizontal: spacing[4] }}>
            <View style={{ flex: 1 }}>
              <Button
                label={clearLabel}
                variant="secondary"
                tall
                disabled={choice === null && value === null}
                onPress={() => {
                  onApply(null);
                  onClose();
                }}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Button
                label={resultLabel(count)}
                disabled={count === 0}
                onPress={() => {
                  onApply(choice);
                  onClose();
                }}
              />
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}
