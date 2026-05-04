import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { onSchedule } from 'firebase-functions/v2/scheduler';
import { defineSecret, defineString } from 'firebase-functions/params';
import * as admin from 'firebase-admin';

admin.initializeApp();

const APP_URL = defineString('APP_URL', { default: 'https://your-app.web.app' });

const GEMINI_API_KEY = defineSecret('GEMINI_API_KEY');
const DAILY_LIMIT = 20;

interface ExtractRequest {
  imageBase64: string;
  mimeType:    string;
}

interface ExtractResponse {
  title:          string;
  arabic:         string;
  translation:    string;
  usedToday:      number;
  remainingToday: number;
}

export const extractDuaFromImage = onCall(
  { secrets: [GEMINI_API_KEY], region: 'us-central1' },
  async (request): Promise<ExtractResponse> => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'You must be signed in.');
    }

    const { imageBase64, mimeType } = request.data as ExtractRequest;

    if (!imageBase64 || typeof imageBase64 !== 'string') {
      throw new HttpsError('invalid-argument', 'imageBase64 is required.');
    }
    if (!mimeType || !mimeType.startsWith('image/')) {
      throw new HttpsError('invalid-argument', 'mimeType must be an image type.');
    }

    const userId  = request.auth.uid;
    const today   = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
    const usageRef = admin.firestore()
      .collection('users').doc(userId)
      .collection('meta').doc('usage');

    // Atomically check and increment the daily counter
    let newCount = 0;
    await admin.firestore().runTransaction(async (tx) => {
      const snap = await tx.get(usageRef);
      const data = snap.data() ?? {};

      const currentDate  = data.date  as string | undefined;
      const currentCount = (data.count as number | undefined) ?? 0;

      const count = currentDate === today ? currentCount : 0;

      if (count >= DAILY_LIMIT) {
        throw new HttpsError(
          'resource-exhausted',
          `Daily limit of ${DAILY_LIMIT} scans reached. Try again tomorrow.`,
        );
      }

      newCount = count + 1;
      tx.set(usageRef, { date: today, count: newCount });
    });

    // Call Gemini Vision API
    const apiKey = GEMINI_API_KEY.value();
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

    const prompt = `You are an Arabic OCR and translation assistant.
Extract the Arabic text from this image of a Dua or Quranic verse.
Return ONLY a JSON object with these exact fields:
{
  "title": "<short English name for this dua, max 5 words>",
  "arabic": "<the full Arabic text exactly as shown, with diacritics>",
  "translation": "<accurate English translation>"
}
If no Arabic text is found, return { "error": "No Arabic text found" }.
Do not include any explanation outside the JSON.`;

    let geminiResult: { title?: string; arabic?: string; translation?: string; error?: string };

    try {
      const response = await fetch(url, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [
              { text: prompt },
              { inlineData: { mimeType, data: imageBase64 } },
            ],
          }],
          generationConfig: { responseMimeType: 'application/json' },
        }),
      });

      if (!response.ok) {
        const err = await response.text();
        throw new Error(`Gemini API error ${response.status}: ${err}`);
      }

      const body = await response.json() as {
        candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
      };

      const text = body.candidates?.[0]?.content?.parts?.[0]?.text ?? '{}';
      geminiResult = JSON.parse(text);
    } catch (err) {
      // Roll back the counter increment on failure
      await admin.firestore().runTransaction(async (tx) => {
        const snap = await tx.get(usageRef);
        const data = snap.data() ?? {};
        const count = (data.count as number | undefined) ?? 1;
        tx.set(usageRef, { ...data, count: Math.max(0, count - 1) });
      });
      throw new HttpsError('internal', `Failed to process image: ${(err as Error).message}`);
    }

    if (geminiResult.error) {
      // Roll back counter — no useful result was produced
      await admin.firestore().runTransaction(async (tx) => {
        const snap = await tx.get(usageRef);
        const data = snap.data() ?? {};
        const count = (data.count as number | undefined) ?? 1;
        tx.set(usageRef, { ...data, count: Math.max(0, count - 1) });
      });
      throw new HttpsError('not-found', geminiResult.error);
    }

    return {
      title:          geminiResult.title       ?? '',
      arabic:         geminiResult.arabic      ?? '',
      translation:    geminiResult.translation ?? '',
      usedToday:      newCount,
      remainingToday: DAILY_LIMIT - newCount,
    };
  },
);

// ── Scheduled notification sender ─────────────────────────────────────────────
// Runs every minute via Cloud Scheduler and sends FCM pushes for due reminders.

function getTimeParts(date: Date, tz: string): { time: string; day: number; today: string } {
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: tz,
    year:     'numeric',
    month:    '2-digit',
    day:      '2-digit',
    hour:     '2-digit',
    minute:   '2-digit',
    hour12:   false,
  });
  const parts = Object.fromEntries(fmt.formatToParts(date).map((p) => [p.type, p.value]));
  const time  = `${parts.hour}:${parts.minute}`;
  const today = `${parts.year}-${parts.month}-${parts.day}`;
  const day   = new Date(`${today}T12:00:00`).getDay(); // 0=Sun
  return { time, day, today };
}

export const sendScheduledNotifications = onSchedule(
  { schedule: 'every 1 minutes', region: 'us-central1', timeoutSeconds: 55 },
  async () => {
    const db  = admin.firestore();
    const now = new Date();

    // Fetch all user schedule sub-collections via collection group
    const schedulesSnap = await db
      .collectionGroup('schedules')
      .where('enabled', '==', true)
      .get();

    if (schedulesSnap.empty) return;

    // Group by userId (parent path: users/{userId}/schedules/{id})
    const byUser = new Map<string, typeof schedulesSnap.docs>();
    for (const d of schedulesSnap.docs) {
      const userId = d.ref.parent.parent?.id;
      if (!userId) continue;
      if (!byUser.has(userId)) byUser.set(userId, []);
      byUser.get(userId)!.push(d);
    }

    const appUrl = APP_URL.value();

    for (const [userId, docs] of byUser) {
      // Get FCM token
      const fcmSnap = await db.collection('users').doc(userId)
        .collection('meta').doc('fcm').get();
      const fcmToken = fcmSnap.data()?.token as string | undefined;
      if (!fcmToken) continue;

      for (const schedDoc of docs) {
        const s = schedDoc.data();
        const tz = (s.tz as string | undefined) || 'UTC';

        const { time, day, today } = getTimeParts(now, tz);

        if (s.time !== time) continue;

        const days: number[] = s.days ?? [];
        if (days.length > 0 && !days.includes(day)) continue;

        if (s.lastSentDate === today) continue;

        try {
          await admin.messaging().send({
            token: fcmToken,
            data: {
              title:      `⏰ ${s.title as string}`,
              body:       'Tap Done when finished',
              scheduleId: schedDoc.id,
              userId,
              date:       today,
            },
            webpush: {
              notification: {
                title:              `⏰ ${s.title as string}`,
                body:               'Tap Done when finished',
                icon:               `${appUrl}/icon-192.png`,
                requireInteraction: true,
                actions:            [{ action: 'done', title: '✓ Done' }],
              },
              fcmOptions: { link: `${appUrl}/?done=${schedDoc.id}&date=${today}` },
            },
            android: { priority: 'high' },
          });

          await schedDoc.ref.update({ lastSentDate: today });
        } catch (err) {
          console.error(`sendScheduledNotifications: failed for user ${userId}:`, err);
        }
      }
    }
  },
);
