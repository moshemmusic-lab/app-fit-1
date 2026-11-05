import type { TrackingType } from '@app-fit/shared/exercises';
import type { PersonalRecordType, ProgressMetric } from '@app-fit/shared/progress';
import type { WeightUnit } from '@app-fit/shared/schemas';
import { formatDecimal, formatDuration, fromKg } from '@app-fit/shared/workouts';
import { useTranslation } from 'react-i18next';

import { formatCompact } from '@/components/charts/scale';

/** Progress numbers in the user's units: "102,5 kg", "1:30", "5,2 km", "12 repeticiones". */
export function useProgressFormat(unit: WeightUnit) {
  const { t } = useTranslation();

  const weight = (kg: number) => `${formatDecimal(fromKg(kg, unit), 1)} ${unit}`;
  const volume = (kg: number) => `${formatDecimal(fromKg(kg, unit), 0)} ${unit}`;
  const distance = (metres: number) => `${formatDecimal(metres / 1000, 2)} km`;
  const reps = (count: number) => t('records.repsValue', { count });

  const recordLabel = (type: PersonalRecordType, trackingType: TrackingType | undefined) =>
    type === 'max_weight' && trackingType === 'bodyweight_reps'
      ? t('records.maxExtraWeight')
      : t(`records.types.${type}`);

  const recordValue = (type: PersonalRecordType, value: number): string => {
    switch (type) {
      case 'est_1rm':
      case 'max_weight':
        return weight(value);
      case 'max_volume':
        return volume(value);
      case 'max_reps':
        return reps(value);
      case 'max_duration':
        return formatDuration(value);
      case 'max_distance':
        return distance(value);
    }
  };

  const metricValue = (metric: ProgressMetric, value: number): string => {
    switch (metric) {
      case 'est_1rm':
      case 'max_weight':
        return weight(value);
      case 'session_volume':
        return volume(value);
      case 'max_reps':
      case 'session_reps':
        return reps(value);
      case 'max_duration':
      case 'session_duration':
        return formatDuration(value);
      case 'session_distance':
        return distance(value);
      case 'session_calories':
        return `${Math.round(value)} kcal`;
    }
  };

  /** Short values for a chart axis. */
  const metricTick = (metric: ProgressMetric, value: number): string => {
    switch (metric) {
      case 'est_1rm':
      case 'max_weight':
      case 'session_volume':
        return formatCompact(fromKg(value, unit));
      case 'max_duration':
      case 'session_duration':
        return formatDuration(value);
      case 'session_distance':
        return formatDecimal(value / 1000, 1);
      case 'max_reps':
      case 'session_reps':
      case 'session_calories':
        return formatCompact(value);
    }
  };

  return { weight, volume, distance, recordLabel, recordValue, metricValue, metricTick };
}
