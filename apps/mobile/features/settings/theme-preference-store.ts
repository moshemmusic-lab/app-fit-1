import 'expo-sqlite/localStorage/install';

import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { defaultThemePreference, type ThemePreference } from './theme-mode';

interface ThemePreferenceState {
  preference: ThemePreference;
  setPreference: (preference: ThemePreference) => void;
}

// Saved on the phone (not in the account): each device can look different.
export const useThemePreferenceStore = create<ThemePreferenceState>()(
  persist(
    (set) => ({
      preference: defaultThemePreference,
      setPreference: (preference) => set({ preference }),
    }),
    {
      name: 'movyn-theme-preference',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ preference: state.preference }),
    },
  ),
);
