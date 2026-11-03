import 'expo-sqlite/localStorage/install';

import NetInfo from '@react-native-community/netinfo';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import { focusManager, onlineManager, QueryClient } from '@tanstack/react-query';
import type { PersistQueryClientProviderProps } from '@tanstack/react-query-persist-client';
import { AppState } from 'react-native';

const ONE_WEEK_MS = 1000 * 60 * 60 * 24 * 7;

// Queries pause while offline and resume when the connection comes back.
onlineManager.setEventListener((setOnline) =>
  NetInfo.addEventListener((state) => {
    // `isConnected` is null while unknown: assume online until told otherwise.
    setOnline(state.isConnected !== false);
  }),
);

// Refetch stale data when the app comes back to the foreground.
focusManager.setEventListener((handleFocus) => {
  const subscription = AppState.addEventListener('change', (status) => {
    handleFocus(status === 'active');
  });
  return () => subscription.remove();
});

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Kept long enough to be saved on the phone and open the app without connection.
      gcTime: ONE_WEEK_MS,
      staleTime: 30_000,
      retry: 2,
    },
  },
});

export const persistOptions: PersistQueryClientProviderProps['persistOptions'] = {
  persister: createAsyncStoragePersister({ storage: localStorage, key: 'movyn-query-cache' }),
  maxAge: ONE_WEEK_MS,
  // Change it when cached data shapes change, so old caches are discarded.
  buster: 'account-v1',
};
