import { describe, expect, it } from 'vitest';

import { resolveThemeMode, useThemePreferenceStore } from './theme-preference-store';

describe('theme preference', () => {
  it('starts in dark mode', () => {
    expect(useThemePreferenceStore.getState().preference).toBe('dark');
  });

  it('updates the preference', () => {
    useThemePreferenceStore.getState().setPreference('light');
    expect(useThemePreferenceStore.getState().preference).toBe('light');
  });

  it('follows the system only when asked, defaulting to dark', () => {
    expect(resolveThemeMode('dark', 'light')).toBe('dark');
    expect(resolveThemeMode('light', 'dark')).toBe('light');
    expect(resolveThemeMode('system', 'light')).toBe('light');
    expect(resolveThemeMode('system', 'dark')).toBe('dark');
    expect(resolveThemeMode('system', null)).toBe('dark');
  });
});
