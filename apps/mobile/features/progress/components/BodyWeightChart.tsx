import { parseDayKey } from '@app-fit/shared/progress';
import type { WeightUnit } from '@app-fit/shared/schemas';
import { formatDecimal, fromKg } from '@app-fit/shared/workouts';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { LineChart } from '@/components/charts/LineChart';
import { Text } from '@/components/ui/Text';
import { formatDayMonth, formatLongDate, formatShortDate } from '@/lib/dates';
import { useTheme } from '@/theme/ThemeProvider';

import { useProgressFormat } from '../format';
import type { BodyWeightEntry } from '../types';

interface BodyWeightChartProps {
  /** Newest first, as they come from the server. */
  entries: readonly BodyWeightEntry[];
  unit: WeightUnit;
}

/** Body weight over time; the selected entry (the latest at first) is shown above. */
export function BodyWeightChart({ entries, unit }: BodyWeightChartProps) {
  const { t } = useTranslation();
  const { spacing } = useTheme();
  const format = useProgressFormat(unit);
  const points = useMemo(
    () =>
      [...entries]
        .reverse()
        .map((entry) => ({ key: entry.id, date: parseDayKey(entry.day), value: entry.weightKg })),
    [entries],
  );
  // The tapped entry; until then (or if it is deleted), the latest one.
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const tapped = points.findIndex((item) => item.key === selectedKey);
  const selected = tapped >= 0 ? tapped : points.length - 1;
  const point = points[selected];
  if (!point) return null;

  return (
    <View style={{ gap: spacing[3] }}>
      <View style={{ gap: spacing[1] }}>
        <Text variant="label" color="textMuted">
          {formatLongDate(point.date)}
        </Text>
        <Text variant="metric">{format.weight(point.value)}</Text>
      </View>
      <LineChart
        points={points}
        selectedIndex={selected}
        onSelect={(index) => setSelectedKey(points[index]?.key ?? null)}
        formatTick={(kg) => formatDecimal(fromKg(kg, unit), 1)}
        formatDate={(date) => formatShortDate(date)}
        accessibilityLabel={t('bodyWeight.chartLabel', {
          count: points.length,
          date: formatDayMonth(point.date),
          value: format.weight(point.value),
        })}
      />
    </View>
  );
}
