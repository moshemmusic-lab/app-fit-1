import { Check, ChevronRight, Dumbbell, Info } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';

import { IconButton } from '@/components/ui/IconButton';
import { Text } from '@/components/ui/Text';
import { useTheme } from '@/theme/ThemeProvider';

const THUMBNAIL_SIZE = 48;

interface ExerciseRowProps {
  name: string;
  /** Its main muscle, e.g. "Pecho". */
  muscle: string;
  isCustom: boolean;
  /** Selection mode when defined: the picture turns into a lime check when selected. */
  selected?: boolean;
  onPress: () => void;
  /** Shows an (i) button that opens the exercise's page without choosing it. */
  onInfo?: () => void;
}

export function ExerciseRow({
  name,
  muscle,
  isCustom,
  selected,
  onPress,
  onInfo,
}: ExerciseRowProps) {
  const { t } = useTranslation();
  const { colors, radius, sizes, spacing } = useTheme();
  const selectable = selected !== undefined;
  const details = [muscle, ...(isCustom ? [t('exercises.custom')] : [])].join('. ');

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[1] }}>
      <Pressable
        accessibilityRole={selectable ? 'checkbox' : 'button'}
        accessibilityState={selectable ? { checked: selected } : undefined}
        accessibilityLabel={`${name}. ${details}`}
        onPress={onPress}
        style={({ pressed }) => ({
          flex: 1,
          minHeight: sizes.touchMin + spacing[4],
          paddingVertical: spacing[2],
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing[3],
          opacity: pressed ? 0.6 : 1,
        })}
      >
        {/*
          Exercise pictures are still to be decided (docs/MVP.md 4.2): until then, a neutral
          icon holds their place. Selected = lime fill **and** a check, like Chip.
        */}
        <View
          style={{
            width: THUMBNAIL_SIZE,
            height: THUMBNAIL_SIZE,
            borderRadius: radius.md,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: selected ? colors.lime : colors.surface2,
          }}
        >
          {selected ? (
            <Check size={sizes.icon} strokeWidth={2.6} color={colors.inkOnLime} />
          ) : (
            <Dumbbell size={sizes.icon} strokeWidth={1.6} color={colors.textMuted} />
          )}
        </View>
        <View style={{ flex: 1, gap: spacing[1] }}>
          <Text variant="bodyStrong">{name}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[2] }}>
            <Text variant="caption" color="textMuted">
              {muscle}
            </Text>
            {isCustom ? (
              <View
                style={{
                  paddingHorizontal: spacing[2],
                  paddingVertical: 2,
                  borderRadius: radius.md,
                  backgroundColor: colors.surface2,
                }}
              >
                <Text variant="caption">{t('exercises.custom')}</Text>
              </View>
            ) : null}
          </View>
        </View>
        {!selectable && !onInfo ? (
          <ChevronRight size={sizes.icon * 0.8} strokeWidth={1.8} color={colors.textMuted} />
        ) : null}
      </Pressable>
      {onInfo ? (
        <IconButton icon={Info} label={t('exercises.info', { name })} onPress={onInfo} />
      ) : null}
    </View>
  );
}
