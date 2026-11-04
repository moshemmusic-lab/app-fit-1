import { dayKey, monthWeeks, trainedDays, weekStreak } from '@app-fit/shared/progress';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Card } from '@/components/ui/Card';
import { IconButton } from '@/components/ui/IconButton';
import { Text } from '@/components/ui/Text';
import { formatLongDate, formatMonthYear } from '@/lib/dates';
import { useTheme } from '@/theme/ThemeProvider';

import type { TrainingEntry } from '../types';

const weekdays = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const;

/** Days of the month in a grid: no more than this, so the calendar stays compact. */
const DAY_MAX_SIZE = 40;

interface ConsistencyCardProps {
  entries: readonly TrainingEntry[];
}

/** The month with the days you trained, and your streak of weeks in a row. */
export function ConsistencyCard({ entries }: ConsistencyCardProps) {
  const { t } = useTranslation();
  const { colors, radius, spacing } = useTheme();
  const today = new Date();
  const [month, setMonth] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));
  const startedAts = useMemo(() => entries.map((entry) => entry.startedAt), [entries]);
  const days = useMemo(() => trainedDays(startedAts), [startedAts]);
  const streak = useMemo(() => weekStreak(startedAts, new Date()), [startedAts]);
  const weeks = monthWeeks(month.getFullYear(), month.getMonth());
  const monthCount = startedAts.filter((at) => {
    const date = new Date(at);
    return date.getFullYear() === month.getFullYear() && date.getMonth() === month.getMonth();
  }).length;
  const isCurrentMonth =
    month.getFullYear() === today.getFullYear() && month.getMonth() === today.getMonth();
  const todayKey = dayKey(today);

  const moveMonth = (step: number) =>
    setMonth((current) => new Date(current.getFullYear(), current.getMonth() + step, 1));

  return (
    <Card>
      <Text variant="heading" accessibilityRole="header">
        {t('progress.consistency')}
      </Text>
      <Text variant="body" color={streak > 0 ? 'text' : 'textMuted'}>
        {streak > 0 ? t('progress.streak', { count: streak }) : t('progress.streakNone')}
      </Text>

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[2] }}>
        <IconButton
          icon={ChevronLeft}
          label={t('progress.previousMonth')}
          onPress={() => moveMonth(-1)}
        />
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text variant="bodyStrong">{formatMonthYear(month)}</Text>
          <Text variant="caption" color="textMuted">
            {t('progress.monthWorkouts', { count: monthCount })}
          </Text>
        </View>
        <View style={{ opacity: isCurrentMonth ? 0 : 1 }}>
          <IconButton
            icon={ChevronRight}
            label={t('progress.nextMonth')}
            disabled={isCurrentMonth}
            accessibilityElementsHidden={isCurrentMonth}
            onPress={() => moveMonth(1)}
          />
        </View>
      </View>

      <View style={{ gap: spacing[1] }}>
        <View style={{ flexDirection: 'row' }} importantForAccessibility="no-hide-descendants">
          {weekdays.map((weekday) => (
            <View key={weekday} style={{ flex: 1, alignItems: 'center' }}>
              <Text variant="caption" color="textMuted">
                {t(`progress.weekdays.${weekday}`)}
              </Text>
            </View>
          ))}
        </View>
        {weeks.map((week, weekIndex) => (
          <View key={weekIndex} style={{ flexDirection: 'row' }}>
            {week.map((day, dayIndex) => {
              if (!day) return <View key={dayIndex} style={{ flex: 1 }} />;
              const key = dayKey(day);
              const trained = days.has(key);
              const isToday = key === todayKey;
              const isFuture = key > todayKey;
              return (
                <View key={key} style={{ flex: 1, alignItems: 'center', padding: spacing[1] / 2 }}>
                  <View
                    accessible
                    accessibilityLabel={
                      trained
                        ? t('progress.dayTrained', { date: formatLongDate(day) })
                        : formatLongDate(day)
                    }
                    style={{
                      width: '100%',
                      maxWidth: DAY_MAX_SIZE,
                      aspectRatio: 1,
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: radius.pill,
                      // Lime is a fill only; the number on it uses inkOnLime (docs/DESIGN.md).
                      backgroundColor: trained ? colors.lime : undefined,
                      borderWidth: isToday && !trained ? 1 : 0,
                      borderColor: colors.lineStrong,
                    }}
                  >
                    <Text
                      variant={trained ? 'bodyStrong' : 'body'}
                      color={trained ? 'inkOnLime' : isFuture ? 'textSubtle' : 'textMuted'}
                    >
                      {day.getDate()}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        ))}
      </View>
    </Card>
  );
}
