import { useCallback, useEffect, useRef, useState } from 'react';
import {
  isFirebaseConfigured,
  subscribeToAuth,
  signInWithGoogle,
  signOutUser,
  isEmailAllowed,
} from '../lib/firebase';

export type AuthStatus = 'pending' | 'authed' | 'unauthenticated' | 'denied' | 'error';

export interface AuthState {
  status: AuthStatus;
  userId: string | null;
  email:  string | null;
  error:  string | null;
  signIn:  () => Promise<void>;
  signOut: () => Promise<void>;
}

export function useAuth(): AuthState {
  const [status,  setStatus]  = useState<AuthStatus>(isFirebaseConfigured ? 'pending' : 'unauthenticated');
  const [userId,  setUserId]  = useState<string | null>(null);
  const [email,   setEmail]   = useState<string | null>(null);
  const [error,   setError]   = useState<string | null>(null);

  // Prevents the sign-out triggered by a denied user from resetting status back to 'unauthenticated'.
  const deniedRef = useRef(false);

  useEffect(() => {
    return subscribeToAuth(async (user) => {
      if (!user || !user.email) {
        if (!deniedRef.current) {
          setStatus('unauthenticated');
          setUserId(null);
          setEmail(null);
        }
        deniedRef.current = false;
        return;
      }

      try {
        const allowed = await isEmailAllowed(user.email);
        if (allowed) {
          deniedRef.current = false;
          setStatus('authed');
          setUserId(user.uid);
          setEmail(user.email);
          setError(null);
        } else {
          deniedRef.current = true;
          const deniedEmail = user.email;
          await signOutUser();
          setStatus('denied');
          setUserId(null);
          setEmail(deniedEmail);
        }
      } catch (err) {
        deniedRef.current = false;
        setStatus('error');
        setError((err as Error).message);
      }
    });
  }, []);

  const signIn = useCallback(async () => {
    setStatus('pending');
    setError(null);
    try {
      await signInWithGoogle();
      // onAuthStateChanged handles the rest
    } catch (err: unknown) {
      const code = (err as { code?: string }).code;
      // User closed the popup — not a real error
      if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
        setStatus('unauthenticated');
      } else {
        setStatus('error');
        setError((err as Error).message);
      }
    }
  }, []);

  const signOut = useCallback(async () => {
    deniedRef.current = false;
    await signOutUser();
    setStatus('unauthenticated');
    setUserId(null);
    setEmail(null);
    setError(null);
  }, []);

  return { status, userId, email, error, signIn, signOut };
}
