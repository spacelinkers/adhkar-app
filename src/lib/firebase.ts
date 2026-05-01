import { initializeApp, FirebaseApp } from 'firebase/app';
import {
  getAuth,
  signInAnonymously,
  setPersistence,
  browserLocalPersistence,
  onAuthStateChanged,
  Auth,
  User,
} from 'firebase/auth';
import {
  getFirestore,
  Firestore,
  enableIndexedDbPersistence,
} from 'firebase/firestore';

interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}

const config: FirebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

export const isFirebaseConfigured =
  !!config.apiKey && !!config.projectId && !!config.appId;

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;

if (isFirebaseConfigured) {
  app = initializeApp(config);
  auth = getAuth(app);
  db = getFirestore(app);
  // Best-effort offline persistence; ignore errors (multi-tab, private mode)
  enableIndexedDbPersistence(db).catch(() => {
    /* ignore */
  });
}

export { app, auth, db };

/**
 * Sign in anonymously and resolve with the user. Persists across reloads.
 */
export async function ensureAuth(): Promise<User> {
  if (!auth) throw new Error('Firebase not configured');
  await setPersistence(auth, browserLocalPersistence);
  return new Promise((resolve, reject) => {
    const unsub = onAuthStateChanged(
      auth!,
      (user) => {
        if (user) {
          unsub();
          resolve(user);
        } else {
          signInAnonymously(auth!).catch(reject);
        }
      },
      reject,
    );
  });
}
