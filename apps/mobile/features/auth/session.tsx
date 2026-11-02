import type { Session } from '@supabase/supabase-js';
import { useQueryClient } from '@tanstack/react-query';
import { createContext, use, useEffect, useState, type ReactNode } from 'react';

import { supabase } from '@/lib/supabase';

interface SessionState {
  session: Session | null;
  /** True until the saved session (if any) has been read from the phone. */
  isLoading: boolean;
}

const SessionContext = createContext<SessionState>({ session: null, isLoading: true });

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
  const [state, setState] = useState<SessionState>({ session: null, isLoading: true });

  useEffect(() => {
    // Fires INITIAL_SESSION right away with the session saved on the phone, then every change.
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        // Nothing from the previous account may stay cached on the phone.
        queryClient.clear();
      }
      setState({ session, isLoading: false });
    });
    return () => data.subscription.unsubscribe();
  }, [queryClient]);

  return <SessionContext value={state}>{children}</SessionContext>;
}
