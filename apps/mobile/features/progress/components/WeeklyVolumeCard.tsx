import { weeklyTotals } from '@app-fit/shared/progress';
import type { WeightUnit } from '@app-fit/shared/schemas';
import { fromKg } from '@app-fit/shared/workouts';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { BarChart } from '@/components/charts/BarChart';
import { formatCompact } from '@/components/charts/scale';
import { Card } from '@/components/ui/Card';
import { Text } from '@/components/ui/Text';
import { formatDayMonth } from '@/lib/dates';
import { useTheme } from '@/theme/ThemeProvider';

import { useProgressFormat } from '../format';
import type { TrainingEntry } from '../types';

const WEEKS = 12;

interface WeeklyVolumeCardProps {
  entries: readonly TrainingEntry[];
  unit: WeightUnit;
}

/** Volume of the last 12 weeks. The selected week (this one at first) is shown above. */
export function WeeklyVolumeCard({ entries, unit }: WeeklyVolumeCardProps) {
  const { t } = useTranslation();
  const { spacing } = useTheme();
  const format = useProgressFormat(unit);
  const weeks = useMemo(() => weeklyTotals(entries, WEEKS, new Date()), [entries]);
  const [selected, setSelected] = useState(WEEKS - 1);
  const week = weeks[selected] ?? weeks[weeks.length - 1];
  if (!week) return null;

  const weekName =
    selected === WEEKS - 1
      ? t('progress.thisWeek')
      : t('progress.weekOf', { date: formatDayMonth(week.weekStart) });
  const firstWeek = weeks[0];

  return (
    <Card>
      <Text variant="heading" accessibilityRole="header">
        {t('progress.weeklyVolume')}
      </Text>
      <View style={{ gap: spacing[1] }}>
        <Text variant="label" color="textMuted">
          {weekName}
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: spacing[2] }}>
          <Text variant="metric">{format.volume(week.volumeKg)}</Text>
          <Text variant="caption" color="textMuted">
            {t('progress.workoutCount', { count: week.workouts })}
          </Text>
        </View>
      </View>
      <BarChart
        data={weeks.map((item) => ({
          key: String(item.weekStart.getTime()),
          value: item.volumeKg,
        }))}
        selectedIndex={selected}
        onSelect={setSelected}
        xLabels={[
          ...(firstWeek ? [{ index: 0, label: formatDayMonth(firstWeek.weekStart) }] : []),
          { index: WEEKS - 1, label: t('progress.thisWeek') },
        ]}
        formatTick={(kg) => formatCompact(fromKg(kg, unit))}
        accessibilityLabel={t('progress.weeklyChartLabel', {
          weeks: WEEKS,
          week: weekName,
          value: format.volume(week.volumeKg),
        })}
      />
      <Text variant="caption" color="textMuted">
        {t('progress.weeklyVolumeHint')}
      </Text>
    </Card>
  );
}
