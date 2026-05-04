// On-device alarm logic — loaded via importScripts inside the Workbox SW.
// Uses setTimeout to fire Web Notifications at the scheduled time.
// All data lives on-device; no server involved.

const _timers = new Map(); // scheduleId → timeoutId[]

self.addEventListener('message', (event) => {
  const msg = event.data;
  if (!msg) return;
  if (msg.type === 'SYNC_ALARMS') _syncAlarms(msg.schedules ?? []);
});

function _syncAlarms(schedules) {
  for (const timers of _timers.values()) timers.forEach(clearTimeout);
  _timers.clear();
  for (const s of schedules) {
    if (s.enabled) _scheduleAlarm(s);
  }
}

function _scheduleAlarm(schedule) {
  const delays = _nextFireDelays(schedule.time, schedule.days);
  if (!delays.length) return;
  _timers.set(schedule.id, delays.map((ms) => setTimeout(() => _fire(schedule), ms)));
}

function _fire(schedule) {
  _timers.delete(schedule.id);
  const today = new Date().toISOString().slice(0, 10);
  self.registration.showNotification('⏰ ' + schedule.title, {
    body:               'Tap Done when finished',
    icon:               '/icon-192.png',
    badge:              '/icon-192.png',
    requireInteraction: true,
    tag:                'alarm-' + schedule.id,
    data:               { scheduleId: schedule.id, date: today },
    actions:            [{ action: 'done', title: '✓ Done' }],
  });
}

// Returns an array of ms-delays for fires within the next 48 hours.
function _nextFireDelays(time, days) {
  const [h, m] = time.split(':').map(Number);
  const now = Date.now();
  const delays = [];
  for (let offset = 0; offset <= 1; offset++) {
    const d = new Date();
    d.setDate(d.getDate() + offset);
    d.setHours(h, m, 0, 0);
    const ms = d.getTime() - now;
    if (ms <= 0) continue;
    if (days.length === 0 || days.includes(d.getDay())) {
      delays.push(ms);
      break;
    }
  }
  return delays;
}

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const { scheduleId, date } = event.notification.data ?? {};
  const url = event.action === 'done' && scheduleId
    ? '/?done=' + scheduleId + '&date=' + date
    : '/';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      for (const client of list) {
        if ('navigate' in client) { client.navigate(url); client.focus(); return; }
      }
      return self.clients.openWindow(url);
    }),
  );
});
