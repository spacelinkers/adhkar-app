// Firebase Messaging Service Worker
// Uses /__/firebase/init.js (auto-served by Firebase Hosting with your project config)
importScripts('https://www.gstatic.com/firebasejs/10.13.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.13.0/firebase-messaging-compat.js');

let messaging = null;

try {
  importScripts('/__/firebase/init.js');
  messaging = firebase.messaging();
} catch (e) {
  // Not on Firebase Hosting (local dev) — FCM won't work, that's fine
  console.log('[SW] firebase-messaging-sw: skipping FCM init (local dev)');
}

if (messaging) {
  messaging.onBackgroundMessage((payload) => {
    const title     = payload.data?.title ?? 'Adhkār Reminder';
    const body      = payload.data?.body  ?? 'Time for your dua';
    const scheduleId = payload.data?.scheduleId ?? '';
    const date       = payload.data?.date ?? '';

    self.registration.showNotification(title, {
      body,
      icon:             '/icon-192.png',
      badge:            '/icon-192.png',
      requireInteraction: true,
      data:             { scheduleId, date },
      actions: [
        { action: 'done', title: '✓ Done' },
      ],
    });
  });
}

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const { scheduleId, date } = event.notification.data ?? {};
  const url = event.action === 'done' && scheduleId
    ? `/?done=${scheduleId}&date=${date}`
    : '/';

  event.waitUntil(
    clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if ('navigate' in client) {
            client.navigate(url);
            client.focus();
            return;
          }
        }
        return clients.openWindow(url);
      }),
  );
});
