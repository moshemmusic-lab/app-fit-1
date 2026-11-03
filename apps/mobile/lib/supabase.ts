// Installs `localStorage` backed by SQLite so the session survives app restarts.
import 'expo-sqlite/localStorage/install';

import type { Database } from '@app-fit/shared/database';
import { createClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';
import { AppState } from 'react-native';

import { resolveSupabaseUrl } from './supabase-url';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const key = process.env.EXPO_PUBLIC_SUPABASE_KEY;

if (!url || !key) {
  throw new Error(
    'Missing EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_KEY. Copy apps/mobile/.env.example to apps/mobile/.env.',
  );
}

/** The publishable key only: what it can read and write is decided by RLS. */
export const supabase = createClient<Database>(
  __DEV__ ? resolveSupabaseUrl(url, Constants.expoConfig?.hostUri) : url,
  key,
  {
    auth: {
      storage: localStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
    db: {
      // TanStack Query already retries. Retrying here too made errors take ~30 s to show.
      retry: false,
      // A request that hangs on a bad connection fails instead of loading forever.
      timeout: 15_000,
    },
  },
);

// Refresh the session only while the app is in the foreground (Supabase's advice for React Native).
AppState.addEventListener('change', (state) => {
  if (state === 'active') {
    void supabase.auth.startAutoRefresh();
  } else {
    void supabase.auth.stopAutoRefresh();
  }
});
