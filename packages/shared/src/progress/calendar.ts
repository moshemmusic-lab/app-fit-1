// Weeks run Monday to Sunday (Spain) and use the phone's local time: a workout at 23:30 on
// Sunday belongs to that Sunday wherever the user is.

/** Midnight of the same day, local time. */
export function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

/** Adds calendar days (safe across daylight saving changes). */
export function addDays(date: Date, days: number): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
}

/** Monday 00:00 of the week of `date`, local time. */
export function startOfWeek(date: Date): Date {
  const mondayOffset = (date.getDay() + 6) % 7;
  return addDays(startOfDay(date), -mondayOffset);
}

/** "2026-11-04" for a local date. */
export function dayKey(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

/** "2026-11-04" → that day at 00:00 local time. */
export function parseDayKey(key: string): Date {
  const [year = 0, month = 1, day = 1] = key.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export interface TrainingDay {
  startedAt: string;
  endedAt: string;
  volumeKg: number;
}

export interface WeekTotals {
  weekStart: Date;
  workouts: number;
  volumeKg: number;
  durationS: number;
}

/** Totals of the last `weeks` weeks, oldest first; the last one is the current week. */
export function weeklyTotals(
  workouts: readonly TrainingDay[],
  weeks: number,
  now: Date,
): WeekTotals[] {
  const currentWeek = startOfWeek(now);
  const totals = Array.from({ length: weeks }, (_, index) => ({
    weekStart: addDays(currentWeek, (index - weeks + 1) * 7),
    workouts: 0,
    volumeKg: 0,
    durationS: 0,
  }));
  const byWeek = new Map(totals.map((week) => [week.weekStart.getTime(), week]));

  for (const workout of workouts) {
    const startedAt = new Date(workout.startedAt);
    const week = byWeek.get(startOfWeek(startedAt).getTime());
    if (!week) continue;
    week.workouts += 1;
    week.volumeKg += workout.volumeKg;
    week.durationS += Math.max(
      0,
      Math.round((new Date(workout.endedAt).getTime() - startedAt.getTime()) / 1000),
    );
  }
  return totals;
}

/**
 * Weeks in a row with at least one workout. The current week only breaks the streak once it
 * is over: until then, the streak counts up to last week.
 */
export function weekStreak(startedAts: readonly string[], now: Date): number {
  const trainedWeeks = new Set(startedAts.map((at) => startOfWeek(new Date(at)).getTime()));
  let week = startOfWeek(now);
  if (!trainedWeeks.has(week.getTime())) week = addDays(week, -7);
  let streak = 0;
  while (trainedWeeks.has(week.getTime())) {
    streak += 1;
    week = addDays(week, -7);
  }
  return streak;
}

/** The days with a workout, as day keys. */
export function trainedDays(startedAts: readonly string[]): Set<string> {
  return new Set(startedAts.map((at) => dayKey(new Date(at))));
}

/**
 * The weeks of a month for a calendar, Monday first. Days of other months are null.
 * `month` is 0-based, like Date.
 */
export function monthWeeks(year: number, month: number): (Date | null)[][] {
  const first = new Date(year, month, 1);
  const weeks: (Date | null)[][] = [];
  let day = startOfWeek(first);
  while (weeks.length === 0 || day.getMonth() === month) {
    const week: (Date | null)[] = [];
    for (let index = 0; index < 7; index += 1) {
      week.push(day.getMonth() === month ? day : null);
      day = addDays(day, 1);
    }
    weeks.push(week);
  }
  return weeks;
}
