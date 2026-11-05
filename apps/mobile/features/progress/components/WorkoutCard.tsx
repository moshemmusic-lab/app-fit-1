import type { WeightUnit } from '@app-fit/shared/schemas';
import { formatDuration } from '@app-fit/shared/workouts';
import { router } from 'expo-router';
import { ChevronRight, CloudUpload, Trophy } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';

import { Text } from '@/components/ui/Text';
import { formatLongDate, formatTime } from '@/lib/dates';
import { useTheme } from '@/theme/ThemeProvider';

import { useProgressFormat } from '../format';
import type { TrainingEntry } from '../types';

interface WorkoutCardProps {
  entry: TrainingEntry;
  unit: WeightUnit;
}

/** A workout in the history: title, date, totals, records and whether it is uploaded. */
export function WorkoutCard({ entry, unit }: WorkoutCardProps) {
  const { t } = useTranslation();
  const { colors, radius, sizes, spacing } = useTheme();
  const format = useProgressFormat(unit);
  const startedAt = new Date(entry.startedAt);
  const durationS = (new Date(entry.endedAt).getTime() - startedAt.getTime()) / 1000;
  const meta = [
    formatDuration(durationS),
    format.volume(entry.volumeKg),
    t('history.sets', { count: entry.setCount }),
    t('history.exercises', { count: entry.exerciseCount }),
  ].join(' · ');
  const smallIcon = sizes.icon * 0.7;

  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => router.push({ pathname: '/workouts/[id]', params: { id: entry.id } })}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing[3],
        padding: spacing[4],
        borderRadius: radius.lg,
        backgroundColor: pressed ? colors.surface2 : colors.surface,
      })}
    >
      <View style={{ flex: 1, gap: spacing[1] }}>
        <Text variant="bodyStrong" numberOfLines={1}>
          {entry.title}
        </Text>
        <Text variant="caption" color="textMuted">
          {`${formatLongDate(startedAt)} · ${formatTime(startedAt)}`}
        </Text>
        <Text variant="caption" color="textMuted">
          {meta}
        </Text>
        {entry.recordCount > 0 || entry.pending ? (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing[3] }}>
            {entry.recordCount > 0 ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[1] }}>
                <Trophy size={smallIcon} strokeWidth={1.8} color={colors.accentText} />
                <Text variant="caption" color="accentText">
                  {t('history.records', { count: entry.recordCount })}
                </Text>
              </View>
            ) : null}
            {entry.pending ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[1] }}>
                <CloudUpload size={smallIcon} strokeWidth={1.8} color={colors.textMuted} />
                <Text variant="caption" color="textMuted">
                  {t('history.pending')}
                </Text>
              </View>
            ) : null}
          </View>
        ) : null}
      </View>
      <ChevronRight size={sizes.icon} strokeWidth={1.8} color={colors.textSubtle} />
    </Pressable>
  );
}
