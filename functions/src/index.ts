import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { defineSecret } from 'firebase-functions/params';
import * as admin from 'firebase-admin';

admin.initializeApp();

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

