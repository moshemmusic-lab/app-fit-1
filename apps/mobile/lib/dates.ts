// Dates in the user's language and local time. Only Spanish (Spain) exists for now; the locale
// will come from the user's settings with the other languages.
const locale = 'es-ES';

const capitalize = (text: string) => text.charAt(0).toLocaleUpperCase(locale) + text.slice(1);

/** "4 nov" */
export function formatDayMonth(date: Date): string {
  return date.toLocaleDateString(locale, { day: 'numeric', month: 'short' }).replace('.', '');
}

/** "4 nov 2025" when it is not this year, else "4 nov". */
export function formatShortDate(date: Date, now = new Date()): string {
  if (date.getFullYear() === now.getFullYear()) return formatDayMonth(date);
  return date
    .toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric' })
    .replace('.', '');
}

/** "miércoles, 4 de noviembre" (with the year when it is not this year), inside a sentence. */
export function formatLongDateInSentence(date: Date, now = new Date()): string {
  return date.toLocaleDateString(locale, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: date.getFullYear() === now.getFullYear() ? undefined : 'numeric',
  });
}

/** "Miércoles, 4 de noviembre": the same, starting a line. */
export function formatLongDate(date: Date, now = new Date()): string {
  return capitalize(formatLongDateInSentence(date, now));
}

/** "Noviembre de 2026" */
export function formatMonthYear(date: Date): string {
  return capitalize(date.toLocaleDateString(locale, { month: 'long', year: 'numeric' }));
}

/** "18:30" */
export function formatTime(date: Date): string {
  return date.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });
}
