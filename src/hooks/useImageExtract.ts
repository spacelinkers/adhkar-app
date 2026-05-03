import { useState } from 'react';
import { checkRateLimit, recordRequest, getUsage } from '../lib/geminiRateLimit';

export interface ExtractedDua {
  title:       string;
  arabic:      string;
  translation: string;
}

interface UseImageExtractResult {
  extract:        (file: File) => Promise<ExtractedDua | null>;
  loading:        boolean;
  error:          string | null;
  clearError:     () => void;
  dailyRemaining: number;
}

const ENDPOINT =
  `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${import.meta.env.VITE_GEMINI_API_KEY}`;

const PROMPT = `You are an Arabic OCR and translation assistant.
Extract the Arabic text from this image of a Dua or Quranic verse.
Return ONLY a JSON object with these exact fields:
{
  "title": "<short English name for this dua, max 5 words>",
  "arabic": "<the full Arabic text exactly as shown, with diacritics>",
  "translation": "<accurate English translation>"
}
If no Arabic text is found, return { "error": "No Arabic text found" }.
Do not include any explanation outside the JSON.`;


export function useImageExtract(): UseImageExtractResult {
  const [loading,        setLoading]        = useState(false);
  const [error,          setError]          = useState<string | null>(null);
  const [dailyRemaining, setDailyRemaining] = useState(() => getUsage().dailyRemaining);

  const extract = async (file: File): Promise<ExtractedDua | null> => {
    setError(null);

    const limit = checkRateLimit();
    if (!limit.allowed) {
      setError(limit.reason ?? 'Rate limit reached.');
      return null;
    }

    setLoading(true);
    recordRequest();
    setDailyRemaining(getUsage().dailyRemaining);

    try {
      const base64  = await fileToBase64(file);
      const payload = JSON.stringify({
        contents: [{
          parts: [
            { text: PROMPT },
            { inlineData: { mimeType: file.type, data: base64 } },
          ],
        }],
        generationConfig: { responseMimeType: 'application/json' },
      });

      const response = await fetch(ENDPOINT, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    payload,
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({})) as { error?: { message?: string } };
        setError(mapHttpError(response.status, body));
        return null;
      }

      const body   = await response.json() as {
        candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
      };
      const text   = body.candidates?.[0]?.content?.parts?.[0]?.text ?? '{}';
      const result = JSON.parse(text) as {
        title?: string; arabic?: string; translation?: string; error?: string;
      };

      if (result.error) {
        setError('No Arabic text found in this image.');
        return null;
      }

      return {
        title:       result.title       ?? '',
        arabic:      result.arabic      ?? '',
        translation: result.translation ?? '',
      };
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { extract, loading, error, clearError: () => setError(null), dailyRemaining };
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload  = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

function mapHttpError(status: number, body: { error?: { message?: string } }): string {
  if (status === 400) return 'Invalid image. Please try a different image.';
  if (status === 403) return 'API key is not authorised for this domain.';
  return body.error?.message ?? `API error ${status}. Please try again.`;
}
