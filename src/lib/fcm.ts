import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { doc, setDoc } from 'firebase/firestore';
import { app, db } from './firebase';

const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY as string;

export async function requestNotificationPermission(userId: string): Promise<string | null> {
  if (!app || !db) return null;
  const permission = await Notification.requestPermission();
  if (permission !== 'granted') return null;
  return _getAndStoreToken(userId);
}

export async function getFcmToken(userId: string): Promise<string | null> {
  if (!app || !db || Notification.permission !== 'granted') return null;
  return _getAndStoreToken(userId);
}

async function _getAndStoreToken(userId: string): Promise<string | null> {
  if (!app || !db) return null;
  try {
    const messaging = getMessaging(app);
    const token = await getToken(messaging, { vapidKey: VAPID_KEY });
    if (token) {
      await setDoc(doc(db, 'users', userId, 'meta', 'fcm'), {
        token,
        updatedAt: Date.now(),
      });
    }
    return token ?? null;
  } catch (err) {
    console.error('FCM token error:', err);
    return null;
  }
}

export function listenForegroundMessages(onReminder: (title: string, body: string) => void) {
  if (!app) return () => {};
  const messaging = getMessaging(app);
  return onMessage(messaging, (payload) => {
    const title = payload.data?.title ?? payload.notification?.title ?? 'Reminder';
    const body  = payload.data?.body  ?? payload.notification?.body  ?? '';
    onReminder(title, body);
  });
}
