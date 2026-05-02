# Feature: Arabic OCR from Image (Gemini Vision)

## What it does
User takes a screenshot of a Dua (from a book, phone, website etc.) and uploads it inside the "Add Entry" flow. The app extracts the Arabic text, translates it, and auto-fills the form fields — no manual typing needed.

## API choice
- **Google Gemini Vision** — `gemini-2.0-flash` or `gemini-1.5-flash`
- Free tier: 15 req/min, 1,500 req/day — sufficient for 2–3 users
- API key obtained from: https://aistudio.google.com (no billing needed)
- Endpoint: `generativelanguage.googleapis.com` (Google AI Studio, NOT Vertex AI)

## What one API call returns
Send the image → receive structured JSON:
```json
{
  "arabic": "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ",
  "translation": "In the name of Allah, the Most Gracious, the Most Merciful",
  "title": "Bismillah"
}
```
One prompt handles OCR + translation + field structuring in a single call.

---

## Architecture: Cloud Function Proxy (recommended)

```
Phone → Firebase Cloud Function → Gemini API
              ↑
       checks + increments
       Firestore daily counter
```

- Gemini API key lives ONLY in the Cloud Function environment (never in the app bundle)
- Users cannot extract the key or bypass the daily limit
- Daily counter stored in Firestore under `users/{userId}/meta/usage`

### Alternative: Browser-side (simpler, fine for trusted users)
- Call Gemini directly from the app
- API key stored in `.env.local` / Firebase Hosting env — still somewhat exposed in the bundle
- Daily counter still in Firestore but bypassable by a determined user
- Acceptable since users are already on the email allowlist

---

## Daily limit implementation

### Firestore document structure
```
users/{userId}/meta/usage
  date:  "2026-05-02"   ← ISO date string (YYYY-MM-DD)
  count: 3               ← number of Gemini calls today
```

### Logic (runs before every Gemini call)
```
1. Read users/{userId}/meta/usage
2. If doc.date !== today  → reset count to 0, update date
3. If count >= DAILY_LIMIT → block call, show "Daily limit reached. Try again tomorrow."
4. If count < DAILY_LIMIT  → proceed with Gemini call
5. After successful Gemini call → increment count by 1
```

### Suggested limits
- Per user per day: **20 calls** (generous for real use, safe for free tier)
- Global daily ceiling: 1,500 (Gemini free tier hard limit)

### Firestore security rules addition needed
```js
match /users/{userId}/meta/usage {
  allow read, write: if request.auth != null && request.auth.uid == userId;
}
```

---

## UI changes needed

### 1. SubcardModal (Add Entry form)
- Add an image upload button (camera icon) next to the Arabic field
- On tap: open file picker (accepts image/*)
- Show loading spinner while Gemini processes
- On success: auto-fill `arabic`, `translation`, `title` fields
- User can still edit fields after auto-fill

### 2. Usage indicator (optional)
- Show remaining calls for the day somewhere in the form
- e.g. "5 / 20 scans used today"

---

## Files to create / modify

| File | Change |
|---|---|
| `functions/index.ts` | New Firebase Cloud Function: `extractDua(imageBase64)` — checks limit, calls Gemini, increments counter |
| `functions/package.json` | New file — dependencies for Cloud Functions |
| `src/lib/gemini.ts` | New file — client-side helper to call the Cloud Function |
| `src/components/SubcardModal.tsx` | Add image upload button + loading state + auto-fill logic |
| `src/hooks/useDailyLimit.ts` | New hook — reads/checks/increments Firestore usage counter |
| `firestore.rules` | Add rule for `users/{userId}/meta/usage` |
| `firebase.json` | Add `"functions"` section |
| `.env.local` | Add `GEMINI_API_KEY` (used only in Cloud Function, not frontend) |

---

## Gemini prompt to use
```
You are an Arabic OCR and translation assistant.
Extract the Arabic text from this image of a Dua or Quranic verse.
Return ONLY a JSON object with these exact fields:
{
  "title": "<short English name for this dua, max 5 words>",
  "arabic": "<the full Arabic text exactly as shown, with diacritics>",
  "translation": "<accurate English translation>"
}
If no Arabic text is found, return { "error": "No Arabic text found" }.
Do not include any explanation outside the JSON.
```

---

## Notes
- `gemini-2.0-flash` is preferred — faster and cheaper than 1.5-pro
- Images should be sent as base64-encoded strings in the API request
- Max image size: ~4MB before base64 encoding
- Free tier resets daily at midnight Pacific Time (Google's servers)
- Cloud Functions require the Firebase Blaze (pay-as-you-go) plan to be enabled,
  but costs will be $0 at this usage scale (generous free tier for functions too)
