import '@/i18n';

import { useIsRestoring } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';

import { useSettings } from '@/features/account/api';
import { StartupError } from '@/features/auth/components/StartupError';
import { SessionProvider, useSession } from '@/features/auth/session';
import { useWorkoutSync } from '@/features/workouts/sync';
import { persistOptions, queryClient } from '@/lib/query-client';
import { fontAssets } from '@/theme/fonts';
import { ThemeProvider } from '@/theme/ThemeProvider';

void SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts(fontAssets);

  return (
    <PersistQueryClientProvider client={queryClient} persistOptions={persistOptions}>
      <SessionProvider>
        <ThemeProvider>
          {/* If fonts fail to load, fall back to system fonts rather than blocking the app. */}
          <RootNavigator fontsReady={fontsLoaded || fontError !== null} />
        </ThemeProvider>
      </SessionProvider>
    </PersistQueryClientProvider>
  );
}

/**
 * Decides which part of the app is reachable:
 * signed out → sign-in · signed in without onboarding → onboarding · otherwise → the app.
 */
function RootNavigator({ fontsReady }: { fontsReady: boolean }) {
  const isRestoringCache = useIsRestoring();
  const { session, isLoading: isLoadingSession, isRestoredSession } = useSession();
  const settings = useSettings(session?.user.id);

  const isSignedIn = session !== null;
  const hasSettings = settings.data !== undefined;
  const isOnboarded = Boolean(settings.data?.onboardingCompletedAt);
  // Signed in, but the settings never loaded and nothing is cached on the phone.
  const settingsUnavailable =
    isSignedIn && !hasSettings && (settings.isError || settings.fetchStatus === 'paused');
  const isCheckingAccount = isSignedIn && !hasSettings && !settingsUnavailable;
  // Uploads finished workouts whenever possible, whatever screen is open.
  useWorkoutSync(isSignedIn && isOnboarded ? session.user.id : undefined);
  // On a cold start keep the splash while the account loads. Right after signing in,
  // stay on the sign-in screens instead (see the guards below).
  const isReady =
    fontsReady &&
    !isRestoringCache &&
    !isLoadingSession &&
    !(isCheckingAccount && isRestoredSession);

  useEffect(() => {
    if (isReady) void SplashScreen.hideAsync();
  }, [isReady]);

  if (!isReady) return null;

  if (settingsUnavailable) {
    return (
      <StartupError
        error={settings.error}
        onRetry={() => void settings.refetch()}
        retrying={settings.isFetching}
      />
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={!isSignedIn || isCheckingAccount}>
        <Stack.Screen name="sign-in" />
        <Stack.Screen name="verify-code" />
      </Stack.Protected>
      <Stack.Protected guard={isSignedIn && hasSettings && !isOnboarded}>
        <Stack.Screen name="onboarding" />
      </Stack.Protected>
      <Stack.Protected guard={isSignedIn && hasSettings && isOnboarded}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="edit-profile" />
        <Stack.Screen name="settings" />
        <Stack.Screen name="exercises/index" />
        <Stack.Screen name="exercises/[id]" />
        <Stack.Screen name="exercises/pick" options={{ presentation: 'modal' }} />
        <Stack.Screen name="active-workout" />
        <Stack.Screen name="workout-summary" options={{ gestureEnabled: false }} />
      </Stack.Protected>
    </Stack>
  );
}
