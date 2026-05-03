"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractDuaFromImage = void 0;
const https_1 = require("firebase-functions/v2/https");
const params_1 = require("firebase-functions/params");
const admin = __importStar(require("firebase-admin"));
admin.initializeApp();
const GEMINI_API_KEY = (0, params_1.defineSecret)('GEMINI_API_KEY');
const DAILY_LIMIT = 20;
exports.extractDuaFromImage = (0, https_1.onCall)({ secrets: [GEMINI_API_KEY], region: 'us-central1' }, async (request) => {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j;
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'You must be signed in.');
    }
    const { imageBase64, mimeType } = request.data;
    if (!imageBase64 || typeof imageBase64 !== 'string') {
        throw new https_1.HttpsError('invalid-argument', 'imageBase64 is required.');
    }
    if (!mimeType || !mimeType.startsWith('image/')) {
        throw new https_1.HttpsError('invalid-argument', 'mimeType must be an image type.');
    }
    const userId = request.auth.uid;
    const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
    const usageRef = admin.firestore()
        .collection('users').doc(userId)
        .collection('meta').doc('usage');
    // Atomically check and increment the daily counter
    let newCount = 0;
    await admin.firestore().runTransaction(async (tx) => {
        var _a, _b;
        const snap = await tx.get(usageRef);
        const data = (_a = snap.data()) !== null && _a !== void 0 ? _a : {};
        const currentDate = data.date;
        const currentCount = (_b = data.count) !== null && _b !== void 0 ? _b : 0;
        const count = currentDate === today ? currentCount : 0;
        if (count >= DAILY_LIMIT) {
            throw new https_1.HttpsError('resource-exhausted', `Daily limit of ${DAILY_LIMIT} scans reached. Try again tomorrow.`);
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
    let geminiResult;
    try {
        const response = await fetch(url, {
            method: 'POST',
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
        const body = await response.json();
        const text = (_f = (_e = (_d = (_c = (_b = (_a = body.candidates) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.content) === null || _c === void 0 ? void 0 : _c.parts) === null || _d === void 0 ? void 0 : _d[0]) === null || _e === void 0 ? void 0 : _e.text) !== null && _f !== void 0 ? _f : '{}';
        geminiResult = JSON.parse(text);
    }
    catch (err) {
        // Roll back the counter increment on failure
        await admin.firestore().runTransaction(async (tx) => {
            var _a, _b;
            const snap = await tx.get(usageRef);
            const data = (_a = snap.data()) !== null && _a !== void 0 ? _a : {};
            const count = (_b = data.count) !== null && _b !== void 0 ? _b : 1;
            tx.set(usageRef, Object.assign(Object.assign({}, data), { count: Math.max(0, count - 1) }));
        });
        throw new https_1.HttpsError('internal', `Failed to process image: ${err.message}`);
    }
    if (geminiResult.error) {
        // Roll back counter — no useful result was produced
        await admin.firestore().runTransaction(async (tx) => {
            var _a, _b;
            const snap = await tx.get(usageRef);
            const data = (_a = snap.data()) !== null && _a !== void 0 ? _a : {};
            const count = (_b = data.count) !== null && _b !== void 0 ? _b : 1;
            tx.set(usageRef, Object.assign(Object.assign({}, data), { count: Math.max(0, count - 1) }));
        });
        throw new https_1.HttpsError('not-found', geminiResult.error);
    }
    return {
        title: (_g = geminiResult.title) !== null && _g !== void 0 ? _g : '',
        arabic: (_h = geminiResult.arabic) !== null && _h !== void 0 ? _h : '',
        translation: (_j = geminiResult.translation) !== null && _j !== void 0 ? _j : '',
        usedToday: newCount,
        remainingToday: DAILY_LIMIT - newCount,
    };
});
//# sourceMappingURL=index.js.map