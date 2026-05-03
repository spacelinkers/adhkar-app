import { useRef } from 'react';
import type { ExtractedDua } from '../hooks/useImageExtract';

const DAILY_LIMIT = 300;

interface Props {
  onExtracted:    (data: ExtractedDua) => void;
  loading:        boolean;
  error:          string | null;
  onClearError:   () => void;
  extract:        (file: File) => Promise<ExtractedDua | null>;
  dailyRemaining: number;
}

export function ImageExtractButton({
  onExtracted,
  loading,
  error,
  onClearError,
  extract,
  dailyRemaining,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);

  const exhausted = dailyRemaining <= 0;

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (inputRef.current) inputRef.current.value = '';
    if (!file) return;
    const data = await extract(file);
    if (data) onExtracted(data);
  };

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => { onClearError(); inputRef.current?.click(); }}
          disabled={loading || exhausted}
          className="flex cursor-pointer items-center gap-1.5 rounded-xl border border-line bg-card px-3 py-2 text-[12px] font-semibold text-ink-soft transition-colors hover:bg-primary-soft hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
          title="Extract Arabic text from an image"
        >
          {loading ? (
            <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M21 12a9 9 0 1 1-6.219-8.56" />
            </svg>
          ) : (
            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
              <circle cx="12" cy="13" r="4" />
            </svg>
          )}
          {loading ? 'Extracting…' : 'Extract from image'}
        </button>

        <span className={`text-[11px] ${dailyRemaining <= 10 ? 'text-rose' : 'text-ink-mute'}`}>
          {dailyRemaining}/{DAILY_LIMIT} left today
        </span>
      </div>

      {error && (
        <p className="text-[11.5px] text-rose">{error}</p>
      )}

      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
    </div>
  );
}
