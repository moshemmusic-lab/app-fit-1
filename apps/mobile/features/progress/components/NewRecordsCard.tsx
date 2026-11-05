import type { NewRecord } from '@app-fit/shared/progress';
import type { WeightUnit } from '@app-fit/shared/schemas';
import { Trophy } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Card } from '@/components/ui/Card';
import { Text } from '@/components/ui/Text';
import { useExerciseLibrary } from '@/features/exercises/api';
import { usePreviousFormatter } from '@/features/workouts/fields';
import { useTheme } from '@/theme/ThemeProvider';

import { useProgressFormat } from '../format';

interface NewRecordsCardProps {
  records: readonly NewRecord[];
  unit: WeightUnit;
}

/** "2 récords nuevos": each exercise with the records it beat and the previous best. */
export function NewRecordsCard({ records, unit }: NewRecordsCardProps) {
  const { t } = useTranslation();
  const { colors, sizes, spacing } = useTheme();
  const format = useProgressFormat(unit);
  const formatSet = usePreviousFormatter(unit);
  const library = useExerciseLibrary();
  const exercisesById = new Map((library.data ?? []).map((exercise) => [exercise.id, exercise]));
  const exerciseIds = [...new Set(records.map((record) => record.exerciseId))];

  return (
    <Card>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[2] }}>
        <Trophy size={sizes.icon} strokeWidth={1.8} color={colors.accentText} />
        <Text variant="heading" accessibilityRole="header">
          {t('records.newRecords', { count: records.length })}
        </Text>
      </View>
      {exerciseIds.map((exerciseId) => {
        const exercise = exercisesById.get(exerciseId);
        return (
          <View key={exerciseId} style={{ gap: spacing[2] }}>
            <Text variant="bodyStrong">{exercise?.name ?? '—'}</Text>
            {records
              .filter((record) => record.exerciseId === exerciseId)
              .map((record) => {
                // The best set is shown as the set itself ("105 kg × 8"), plus its volume.
                const setText =
                  record.recordType === 'max_volume' && exercise
                    ? formatSet(record.set, exercise.trackingType)
                    : null;
                return (
                  <View
                    key={record.recordType}
                    accessible
                    style={{ flexDirection: 'row', alignItems: 'flex-start', gap: spacing[3] }}
                  >
                    <Text variant="body" color="textMuted" style={{ flex: 1 }}>
                      {format.recordLabel(record.recordType, exercise?.trackingType)}
                    </Text>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text variant="bodyStrong">
                        {setText ?? format.recordValue(record.recordType, record.value)}
                      </Text>
                      <Text variant="caption" color="textMuted">
                        {setText
                          ? `${format.recordValue(record.recordType, record.value)} · ${t('records.previous', { value: format.recordValue(record.recordType, record.previousValue) })}`
                          : t('records.previous', {
                              value: format.recordValue(record.recordType, record.previousValue),
                            })}
                      </Text>
                    </View>
                  </View>
                );
              })}
          </View>
        );
      })}
    </Card>
  );
}
