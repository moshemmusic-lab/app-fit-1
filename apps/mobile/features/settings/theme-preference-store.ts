import { defaultThemeMode, type ThemeMode } from '@app-fit/shared/theme';
import { create } from 'zustand';

export type ThemePreference = ThemeMode | 'system';

interface ThemePreferenceState {
  preference: ThemePreference;
  setPreference: (preference: ThemePreference) => void;
}

// Not persisted yet: it resets to dark when the app restarts. Saving it belongs
// to the settings screen (MVP step 2).
export const useThemePreferenceStore = create<ThemePreferenceState>()((set) => ({
  preference: defaultThemeMode,
  setPreference: (preference) => set({ preference }),
}));

export function resolveThemeMode(
  preference: ThemePreference,
  systemScheme: string | null | undefined,
): ThemeMode {
  if (preference !== 'system') return preference;
  // Dark is the default whenever the system does not explicitly ask for light.
  return systemScheme === 'light' ? 'light' : 'dark';
}
