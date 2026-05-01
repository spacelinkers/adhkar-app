import { useEffect, useState } from 'react';
import { ensureAuth, isFirebaseConfigured } from '../lib/firebase';

export type AuthStatus = 'pending' | 'authed' | 'disabled' | 'error';

export interface AuthState {
  status: AuthStatus;
  userId: string | null;
  error: string | null;
}

/**
 * Resolves to {status: 'authed', userId} when Firebase is configured and
 * anonymous sign-in succeeds. If Firebase isn't configured, resolves to
 * {status: 'disabled'} so the app can fall back to localStorage.
 */
export function useAuth(): AuthState {
  const [state, setState] = useState<AuthState>({
    status: isFirebaseConfigured ? 'pending' : 'disabled',
    userId: null,
    error: null,
  });

  useEffect(() => {
    if (!isFirebaseConfigured) return;
    let cancelled = false;
    ensureAuth()
      .then((user) => {
        if (cancelled) return;
        setState({ status: 'authed', userId: user.uid, error: null });
      })
      .catch((err: Error) => {
        if (cancelled) return;
        console.error('Auth failed:', err);
        setState({ status: 'error', userId: null, error: err.message });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}
