import { Constants, type Database } from '../database.types';
import { workoutVisibilities, type WorkoutVisibility } from '../schemas/account';

type Enums = Database['public']['Enums'];

export type ReportReason = Enums['report_reason'];
export type ReportTarget = Enums['report_target'];
export type FollowStatus = Enums['follow_status'];

/** Why something can be reported, in the order the sheet lists them (database enum). */
export const reportReasons: readonly ReportReason[] = Constants.public.Enums.report_reason;

/** Who can see a workout or routine: the same three values for both. */
export const contentVisibilities = workoutVisibilities;
export type ContentVisibility = WorkoutVisibility;

/** A visibility read from the database; anything unexpected is treated as private. */
export function toContentVisibility(value: string): ContentVisibility {
  return contentVisibilities.find((visibility) => visibility === value) ?? 'private';
}

/** Same limit as the database (comments.body). */
export const commentMaxLength = 500;

export type RelativeTime =
  { unit: 'now' } | { unit: 'minutes' | 'hours' | 'days'; count: number } | { unit: 'date' };

/**
 * How long ago something happened, for a feed: "ahora", minutes, hours, days (up to a week),
 * then the date.
 */
export function relativeTime(at: Date, now: Date): RelativeTime {
  const minutes = Math.floor((now.getTime() - at.getTime()) / 60_000);
  if (minutes < 1) return { unit: 'now' };
  if (minutes < 60) return { unit: 'minutes', count: minutes };
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return { unit: 'hours', count: hours };
  const days = Math.floor(hours / 24);
  if (days < 7) return { unit: 'days', count: days };
  return { unit: 'date' };
}
