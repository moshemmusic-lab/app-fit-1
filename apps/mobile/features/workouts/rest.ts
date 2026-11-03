import type { TrackingType } from '@app-fit/shared/exercises';

/** Options offered when choosing an exercise's rest. */
export const restPresetsS = [30, 60, 90, 120, 150, 180, 240, 300] as const;

/** What the −/+ buttons of the timer change. */
export const REST_STEP_S = 15;

/** Strength rests longer than holds; cardio machines get no automatic rest. */
export function defaultRestSeconds(trackingType: TrackingType): number | null {
  switch (trackingType) {
    case 'weight_reps':
    case 'bodyweight_reps':
      return 90;
    case 'duration':
      return 60;
    case 'distance_duration':
    case 'calories_duration':
      return null;
  }
}

/** Whole seconds left, never negative. */
export function restRemainingS(endsAt: string, now: number): number {
  return Math.max(0, Math.ceil((Date.parse(endsAt) - now) / 1000));
}

/** New end time after −/+ (in seconds). Null when the rest is over. */
export function adjustRestEnd(endsAt: string, deltaS: number, now: number): string | null {
  const end = Date.parse(endsAt) + deltaS * 1000;
  return end <= now ? null : new Date(end).toISOString();
}
