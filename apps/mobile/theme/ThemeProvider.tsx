import { themes, type Theme } from '@app-fit/shared/theme';
import { DarkTheme, DefaultTheme, ThemeProvider as NavigationThemeProvider } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SystemUI from 'expo-system-ui';
import { createContext, use, useEffect, useMemo, type ReactNode } from 'react';
import { useColorScheme } from 'react-native';

import { resolveThemeMode } from '@/features/settings/theme-mode';
import { useThemePreferenceStore } from '@/features/settings/theme-preference-store';

const ThemeContext = createContext<Theme>(themes.dark);

export function useTheme(): Theme {
  return use(ThemeContext);
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const preference = useThemePreferenceStore((state) => state.preference);
  const systemScheme = useColorScheme();
  const theme = themes[resolveThemeMode(preference, systemScheme)];

  // Keeps navigation containers and transitions on the brand colors (no white flashes).
  const navigationTheme = useMemo(() => {
    const base = theme.mode === 'dark' ? DarkTheme : DefaultTheme;
    return {
      ...base,
      colors: {
        ...base.colors,
        primary: theme.colors.accentText,
        background: theme.colors.bg,
        card: theme.colors.surface,
        text: theme.colors.text,
        border: theme.colors.line,
      },
    };
  }, [theme]);

  useEffect(() => {
    void SystemUI.setBackgroundColorAsync(theme.colors.bg);
  }, [theme]);

  return (
    <ThemeContext value={theme}>
      <NavigationThemeProvider value={navigationTheme}>
        <StatusBar style={theme.mode === 'dark' ? 'light' : 'dark'} />
        {children}
      </NavigationThemeProvider>
    </ThemeContext>
  );
}
