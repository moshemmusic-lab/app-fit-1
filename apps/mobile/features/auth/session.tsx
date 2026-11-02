import type { Session } from '@supabase/supabase-js';
import { useQueryClient } from '@tanstack/react-query';
import { createContext, use, useEffect, useState, type ReactNode } from 'react';

import { supabase } from '@/lib/supabase';

interface SessionState {
  session: Session | null;
  /** True until the saved session (if any) has been read from the phone. */
  isLoading: boolean;
  /** True when the session was restored at app start, false right after signing in. */
  isRestoredSession: boolean;
}

const initialState: SessionState = { session: null, isLoading: true, isRestoredSession: false };

const SessionContext = createContext<SessionState>(initialState);

export function useSession(): SessionState {
  return use(SessionContext);
}

/** Id of the signed-in user. Only use it in screens behind the signed-in guard. */
export function useUserId(): string {
  const { session } = useSession();
  if (!session) {
    throw new Error('useUserId() used outside a signed-in screen');
  }
  return session.user.id;
}

export function SessionProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [state, setState] = useState<SessionState>(initialState);

  useEffect(() => {
    // Fires INITIAL_SESSION right away with the session saved on the phone, then every change.
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        // Nothing from the previous account may stay cached on the phone.
        queryClient.clear();
      }
      setState((previous) => ({
        session,
        isLoading: false,
        // Token refreshes keep the original flag; a new sign-in resets it.
        isRestoredSession:
          event === 'INITIAL_SESSION'
            ? true
            : event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED'
              ? previous.isRestoredSession
              : false,
      }));
    });
    return () => data.subscription.unsubscribe();
  }, [queryClient]);

  return <SessionContext value={state}>{children}</SessionContext>;
}
