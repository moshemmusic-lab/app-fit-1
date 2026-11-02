import { describe, expect, it } from 'vitest';

import { defaultThemePreference, resolveThemeMode } from './theme-mode';

describe('theme preference', () => {
  it('starts in dark mode', () => {
    expect(defaultThemePreference).toBe('dark');
  });

  it('uses the chosen theme regardless of the system', () => {
    expect(resolveThemeMode('dark', 'light')).toBe('dark');
    expect(resolveThemeMode('light', 'dark')).toBe('light');
  });

  it('follows the system only when asked, falling back to dark', () => {
    expect(resolveThemeMode('system', 'light')).toBe('light');
    expect(resolveThemeMode('system', 'dark')).toBe('dark');
    expect(resolveThemeMode('system', null)).toBe('dark');
  });
});
