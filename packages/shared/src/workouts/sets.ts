import type { TrackingType } from '../exercises/taxonomy';

/** What a set can record. Weight in kg, distance in metres, duration in seconds. */
export interface SetValues {
  weightKg: number | null;
  reps: number | null;
  durationS: number | null;
  distanceM: number | null;
  calories: number | null;
}

export type SetField = keyof SetValues;

export const emptySetValues: SetValues = {
  weightKg: null,
  reps: null,
  durationS: null,
  distanceM: null,
  calories: null,
};

/** The fields each kind of exercise shows, in order, and which ones a completed set needs. */
export const setFieldsByTrackingType: Record<
  TrackingType,
  readonly { field: SetField; required: boolean }[]
> = {
  weight_reps: [
    { field: 'weightKg', required: true },
    { field: 'reps', required: true },
  ],
  // The weight is optional extra load (a weighted pull-up).
  bodyweight_reps: [
    { field: 'weightKg', required: false },
    { field: 'reps', required: true },
  ],
  duration: [{ field: 'durationS', required: true }],
  distance_duration: [
    { field: 'distanceM', required: true },
    { field: 'durationS', required: true },
  ],
  calories_duration: [
    { field: 'calories', required: true },
    { field: 'durationS', required: true },
  ],
};

/** Empty fields take last time's value: that is what makes a set "two taps". */
export function fillFromPrevious(
  values: SetValues,
  previous: SetValues | undefined,
  trackingType: TrackingType,
): SetValues {
  const filled = { ...values };
  for (const { field } of setFieldsByTrackingType[trackingType]) {
    filled[field] = values[field] ?? previous?.[field] ?? null;
  }
  return filled;
}

/** A set can be marked done when every required field has a sensible value. */
export function canCompleteSet(values: SetValues, trackingType: TrackingType): boolean {
  return setFieldsByTrackingType[trackingType].every(({ field, required }) => {
    const value = values[field];
    if (value === null) return !required;
    // Weight may be 0 (an unloaded machine); reps, time, distance and calories must be above 0.
    return field === 'weightKg' ? value >= 0 : value > 0;
  });
}

/** Weight × reps. Bodyweight exercises only count the extra load. */
export function setVolumeKg(values: SetValues): number {
  return values.weightKg !== null && values.reps !== null ? values.weightKg * values.reps : 0;
}

export function workoutVolumeKg(exercises: readonly { sets: readonly SetValues[] }[]): number {
  return exercises.reduce(
    (total, exercise) =>
      total + exercise.sets.reduce((subtotal, set) => subtotal + setVolumeKg(set), 0),
    0,
  );
}
