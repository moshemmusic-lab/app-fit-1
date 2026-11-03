export const partsOfDay = ['morning', 'afternoon', 'evening'] as const;
export type PartOfDay = (typeof partsOfDay)[number];

/** Used for the default workout title ("Entreno de tarde"). */
export function partOfDay(date: Date): PartOfDay {
  const hour = date.getHours();
  if (hour >= 6 && hour < 14) return 'morning';
  if (hour >= 14 && hour < 21) return 'afternoon';
  return 'evening';
}
