import {
  addDays,
  bodyWeightLimitsKg,
  dayKey,
  isValidBodyWeightKg,
  parseDayKey,
  startOfDay,
} from '@app-fit/shared/progress';
import { formatDecimal, fromKg, parseDecimal, toKg } from '@app-fit/shared/workouts';
import { onlineManager } from '@tanstack/react-query';
import { router } from 'expo-router';
import { ChevronLeft, ChevronRight, Trash2 } from 'lucide-react-native';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Pressable, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { FormMessage } from '@/components/ui/FormMessage';
import { IconButton } from '@/components/ui/IconButton';
import { Screen } from '@/components/ui/Screen';
import { ErrorState, LoadingState } from '@/components/ui/StateViews';
import { Text } from '@/components/ui/Text';
import { TextField } from '@/components/ui/TextField';
import { useSettings } from '@/features/account/api';
import { useUserId } from '@/features/auth/session';
import { useBodyWeights, useDeleteBodyWeight, useSaveBodyWeight } from '@/features/progress/api';
import { BodyWeightChart } from '@/features/progress/components/BodyWeightChart';
import { useProgressFormat } from '@/features/progress/format';
import type { BodyWeightEntry } from '@/features/progress/types';
import { classifyError } from '@/lib/errors';
import { formatLongDate, formatLongDateInSentence } from '@/lib/dates';
import { useErrorMessage } from '@/lib/use-error-message';
import { useTheme } from '@/theme/ThemeProvider';

/** Log the weight of a day (today by default), see it over time and fix or delete entries. */
export default function BodyWeightScreen() {
  const { t } = useTranslation();
  const { colors, radius, spacing } = useTheme();
  const getErrorMessage = useErrorMessage();
  const userId = useUserId();
  const unit = useSettings(userId).data?.units ?? 'kg';
  const format = useProgressFormat(unit);
  const entries = useBodyWeights(userId);
  const saveWeight = useSaveBodyWeight(userId);
  const deleteWeight = useDeleteBodyWeight(userId);

  const todayKey = dayKey(startOfDay(new Date()));
  const [day, setDay] = useState(todayKey);
  const [text, setText] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const existing = entries.data?.find((entry) => entry.day === day);

  const dayName =
    day === todayKey
      ? t('bodyWeight.today')
      : day === dayKey(addDays(parseDayKey(todayKey), -1))
        ? t('bodyWeight.yesterday')
        : formatLongDate(parseDayKey(day));

  const moveDay = (step: number) => {
    const next = dayKey(addDays(parseDayKey(day), step));
    if (next <= todayKey) setDay(next);
    setFormError(null);
  };

  const failureMessage = (error: Error) =>
    classifyError(error, onlineManager.isOnline()) === 'offline'
      ? t('bodyWeight.offlineEdit')
      : `${t('bodyWeight.saveFailed')} ${getErrorMessage(error)}`;

  const save = () => {
    setFormError(null);
    const value = parseDecimal(text);
    const weightKg = value === null ? null : toKg(value, unit);
    if (weightKg === null || !isValidBodyWeightKg(weightKg)) {
      setFormError(
        t('bodyWeight.invalid', {
          min: formatDecimal(fromKg(bodyWeightLimitsKg.min, unit), 0),
          max: formatDecimal(fromKg(bodyWeightLimitsKg.max, unit), 0),
          unit,
        }),
      );
      return;
    }
    saveWeight.mutate(
      { day, weightKg },
      {
        onSuccess: () => setText(''),
        onError: (error) => setFormError(failureMessage(error)),
      },
    );
  };

  const edit = (entry: BodyWeightEntry) => {
    setDay(entry.day);
    setText(formatDecimal(fromKg(entry.weightKg, unit), 2));
    setFormError(null);
  };

  const confirmDelete = (entry: BodyWeightEntry) => {
    const date = formatLongDateInSentence(parseDayKey(entry.day));
    Alert.alert(t('bodyWeight.deleteConfirmTitle'), t('bodyWeight.deleteConfirmBody', { date }), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('bodyWeight.delete'),
        style: 'destructive',
        onPress: () =>
          deleteWeight.mutate(entry.id, {
            onError: (error) => Alert.alert(t('bodyWeight.saveFailed'), failureMessage(error)),
          }),
      },
    ]);
  };

  return (
    <Screen withBottomInset onBack={() => router.back()} title={t('bodyWeight.title')}>
      <Card>
        <View style={{ gap: spacing[1] }}>
          <Text variant="label" color="textMuted">
            {t('bodyWeight.dayLabel')}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[2] }}>
            <IconButton
              icon={ChevronLeft}
              label={t('bodyWeight.previousDay')}
              onPress={() => moveDay(-1)}
            />
            <Text variant="bodyStrong" style={{ flex: 1, textAlign: 'center' }}>
              {dayName}
            </Text>
            <View style={{ opacity: day === todayKey ? 0 : 1 }}>
              <IconButton
                icon={ChevronRight}
                label={t('bodyWeight.nextDay')}
                disabled={day === todayKey}
                accessibilityElementsHidden={day === todayKey}
                onPress={() => moveDay(1)}
              />
            </View>
          </View>
        </View>
        <TextField
          label={t('bodyWeight.weightLabel', { unit })}
          placeholder={t('bodyWeight.weightPlaceholder')}
          keyboardType="decimal-pad"
          value={text}
          onChangeText={setText}
          hint={
            existing
              ? t('bodyWeight.replaceHint', { value: format.weight(existing.weightKg) })
              : undefined
          }
        />
        {formError ? <FormMessage message={formError} /> : null}
        <Button label={t('bodyWeight.save')} loading={saveWeight.isPending} onPress={save} />
      </Card>

      {entries.data ? (
        entries.data.length === 0 ? (
          <Text variant="body" color="textMuted">
            {t('bodyWeight.empty')}
          </Text>
        ) : (
          <>
            <Card>
              <BodyWeightChart entries={entries.data} unit={unit} />
            </Card>
            <View style={{ gap: spacing[2] }}>
              <Text variant="heading" accessibilityRole="header">
                {t('bodyWeight.entries')}
              </Text>
              <Text variant="caption" color="textMuted">
                {t('bodyWeight.editHint')}
              </Text>
              {entries.data.map((entry) => (
                <View
                  key={entry.id}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    borderRadius: radius.md,
                    backgroundColor: colors.surface,
                  }}
                >
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => edit(entry)}
                    style={({ pressed }) => ({
                      flex: 1,
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: spacing[3],
                      padding: spacing[3],
                      opacity: pressed ? 0.6 : 1,
                    })}
                  >
                    <Text variant="body" style={{ flex: 1 }}>
                      {formatLongDate(parseDayKey(entry.day))}
                    </Text>
                    <Text variant="bodyStrong">{format.weight(entry.weightKg)}</Text>
                  </Pressable>
                  <IconButton
                    icon={Trash2}
                    label={t('bodyWeight.deleteLabel', {
                      date: formatLongDateInSentence(parseDayKey(entry.day)),
                    })}
                    onPress={() => confirmDelete(entry)}
                  />
                </View>
              ))}
            </View>
          </>
        )
      ) : entries.isError || entries.fetchStatus === 'paused' ? (
        <ErrorState
          message={getErrorMessage(entries.error)}
          onRetry={() => void entries.refetch()}
          retrying={entries.isFetching}
        />
      ) : (
        <LoadingState />
      )}
    </Screen>
  );
}
