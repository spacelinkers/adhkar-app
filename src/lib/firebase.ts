import { initializeApp, FirebaseApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut as firebaseSignOut,
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
  doc,
  getDoc,
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  Unsubscribe,
} from 'firebase/firestore';
import type { Dua } from '../types';

const config = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID,
};

export const isFirebaseConfigured =
  !!config.apiKey && !!config.projectId && !!config.appId;

let app:  FirebaseApp | null = null;
let auth: Auth        | null = null;
let db:   Firestore   | null = null;

if (isFirebaseConfigured) {
  app  = initializeApp(config);
  auth = getAuth(app);
  db   = getFirestore(app);
  setPersistence(auth, browserLocalPersistence).catch(() => {});
  enableIndexedDbPersistence(db).catch(() => {});
}

export { app, auth, db };

export function subscribeToAuth(cb: (user: User | null) => void): () => void {
  if (!auth) { cb(null); return () => {}; }
  return onAuthStateChanged(auth, cb);
}

export async function signInWithGoogle(): Promise<User> {
  if (!auth) throw new Error('Firebase not configured');
  const provider = new GoogleAuthProvider();
  const result = await signInWithPopup(auth, provider);
  return result.user;
}

export async function signOutUser(): Promise<void> {
  if (auth) await firebaseSignOut(auth);
}

export async function isEmailAllowed(email: string): Promise<boolean> {
  if (!db) return false;
  const snap = await getDoc(doc(db, 'allowlist', email));
  return snap.exists();
}

export async function isEmailAdmin(email: string): Promise<boolean> {
  if (!db) return false;
  const snap = await getDoc(doc(db, 'admins', email));
  return snap.exists();
}

// ── Predefined Dua library ──

export function subscribeToDuas(
  onChange: (duas: Dua[]) => void,
  onError: (err: Error) => void,
): Unsubscribe {
  if (!db) return () => {};
  return onSnapshot(
    query(collection(db, 'duas'), orderBy('createdAt', 'asc')),
    (snap) => {
      const duas: Dua[] = snap.docs.map((d) => ({
        id: d.id,
        title:       d.data().title       ?? '',
        arabic:      d.data().arabic      ?? '',
        translation: d.data().translation ?? '',
        reward:      d.data().reward      ?? '',
        createdAt:   d.data().createdAt   ?? 0,
        createdBy:   d.data().createdBy   ?? '',
      }));
      onChange(duas);
    },
    (err) => onError(err as Error),
  );
}

export async function addDua(
  data: Omit<Dua, 'id'>,
): Promise<string> {
  if (!db) throw new Error('Firestore not initialised');
  const ref = await addDoc(collection(db, 'duas'), data);
  return ref.id;
}

export async function updateDua(
  id: string,
  patch: Partial<Omit<Dua, 'id'>>,
): Promise<void> {
  if (!db) throw new Error('Firestore not initialised');
  await updateDoc(doc(db, 'duas', id), patch);
}

export async function deleteDua(id: string): Promise<void> {
  if (!db) throw new Error('Firestore not initialised');
  await deleteDoc(doc(db, 'duas', id));
}
