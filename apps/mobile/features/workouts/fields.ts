import type { TrackingType } from '@app-fit/shared/exercises';
import type { WeightUnit } from '@app-fit/shared/schemas';
import {
  formatDecimal,
  formatDuration,
  fromKg,
  setFieldsByTrackingType,
  toKg,
  type SetField,
  type SetValues,
} from '@app-fit/shared/workouts';
import { useTranslation } from 'react-i18next';

import type { SetInputKind } from './components/SetInput';

export interface DisplayField {
  field: SetField;
  kind: SetInputKind;
  /** Stored value (kg, metres, seconds) → what the user sees (lb, km…). */
  toDisplay: (value: number) => number;
  fromDisplay: (value: number) => number;
}

const identity = (value: number) => value;

/** The inputs of a set row for this kind of exercise, converted to the user's units. */
export function displayFields(trackingType: TrackingType, unit: WeightUnit): DisplayField[] {
  return setFieldsByTrackingType[trackingType].map(({ field }) => {
    switch (field) {
      case 'weightKg':
        return {
          field,
          kind: 'decimal',
          toDisplay: (kg) => fromKg(kg, unit),
          fromDisplay: (value) => toKg(value, unit),
        };
      case 'distanceM':
        return {
          field,
          kind: 'decimal',
          toDisplay: (metres) => metres / 1000,
          fromDisplay: (km) => km * 1000,
        };
      case 'durationS':
        return { field, kind: 'duration', toDisplay: identity, fromDisplay: identity };
      case 'reps':
      case 'calories':
        return { field, kind: 'integer', toDisplay: identity, fromDisplay: identity };
    }
  });
}

/** i18n key of the column header for a field. */
export function columnKey(field: SetField, trackingType: TrackingType, unit: WeightUnit) {
  switch (field) {
    case 'weightKg':
      if (trackingType === 'bodyweight_reps') return unit === 'kg' ? 'extraKg' : 'extraLb';
      return unit === 'kg' ? 'weightKg' : 'weightLb';
    case 'reps':
      return 'reps';
    case 'durationS':
      return 'duration';
    case 'distanceM':
      return 'distance';
    case 'calories':
      return 'calories';
  }
}

/** "80 kg × 8", "5 km · 25:00"… or null when there is nothing to show. */
export function usePreviousFormatter(unit: WeightUnit) {
  const { t } = useTranslation();
  const weight = (kg: number) => formatDecimal(fromKg(kg, unit), 1);
  const unitLabel = unit === 'kg' ? 'kg' : 'lb';

  return (values: SetValues | undefined, trackingType: TrackingType): string | null => {
    if (!values) return null;
    const { weightKg, reps, durationS, distanceM, calories } = values;
    switch (trackingType) {
      case 'weight_reps':
        return weightKg !== null && reps !== null
          ? t('activeWorkout.previous.weightReps', {
              weight: weight(weightKg),
              unit: unitLabel,
              reps,
            })
          : null;
      case 'bodyweight_reps':
        if (reps === null) return null;
        return weightKg
          ? t('activeWorkout.previous.extraWeightReps', {
              weight: weight(weightKg),
              unit: unitLabel,
              reps,
            })
          : t('activeWorkout.previous.reps', { reps });
      case 'duration':
        return durationS !== null
          ? t('activeWorkout.previous.duration', { duration: formatDuration(durationS) })
          : null;
      case 'distance_duration':
        return distanceM !== null && durationS !== null
          ? t('activeWorkout.previous.distanceDuration', {
              distance: formatDecimal(distanceM / 1000),
              duration: formatDuration(durationS),
            })
          : null;
      case 'calories_duration':
        return calories !== null && durationS !== null
          ? t('activeWorkout.previous.caloriesDuration', {
              calories,
              duration: formatDuration(durationS),
            })
          : null;
    }
  };
}
