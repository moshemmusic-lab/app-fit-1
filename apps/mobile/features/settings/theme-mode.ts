import { defaultThemeMode, type ThemeMode } from '@app-fit/shared/theme';

export type ThemePreference = ThemeMode | 'system';

export const defaultThemePreference: ThemePreference = defaultThemeMode;

export function resolveThemeMode(
  preference: ThemePreference,
  systemScheme: string | null | undefined,
): ThemeMode {
  if (preference !== 'system') return preference;
  // Dark is the default whenever the system does not explicitly ask for light.
  return systemScheme === 'light' ? 'light' : 'dark';
}
