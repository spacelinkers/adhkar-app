import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, ChevronRight } from '../components/Icons';
import { Modal } from '../components/Modal';
import { ImageExtractButton } from '../components/ImageExtractButton';
import { useDuas } from '../hooks/useDuas';
import { useImageExtract } from '../hooks/useImageExtract';
import type { UseCardsResult } from '../hooks/useCards';
import type { Dua } from '../types';

interface Props {
  store:   UseCardsResult;
  isAdmin: boolean;
  email:   string | null;
}

const EMPTY: Omit<Dua, 'id' | 'createdAt' | 'createdBy'> = {
  title: '', arabic: '', translation: '', reward: '',
};

export function DuaLibraryPage({ isAdmin, email }: Props) {
  const navigate    = useNavigate();
  const duaStore    = useDuas(true);
  const imgExtract  = useImageExtract();

  // Admin: new dua form
  const [formOpen, setFormOpen] = useState(false);
  const [formData, setFormData] = useState(EMPTY);
  const [saving,   setSaving]   = useState(false);

  // Search
  const [query, setQuery] = useState('');
  const filtered = query.trim()
    ? duaStore.duas.filter((d) => d.title.toLowerCase().includes(query.toLowerCase()))
    : duaStore.duas;

  // Restore scroll position after the list has finished loading
  useEffect(() => {
    if (!duaStore.isLoaded) return;
    const saved = sessionStorage.getItem('library-scroll');
    if (!saved) return;
    sessionStorage.removeItem('library-scroll');
    requestAnimationFrame(() => window.scrollTo(0, Number(saved)));
  }, [duaStore.isLoaded]);

  const openNew = () => {
    setFormData(EMPTY);
    setFormOpen(true);
  };

  const handleExtracted = (data: { title: string; arabic: string; translation: string }) => {
    setFormData((prev) => ({
      ...prev,
      title:       data.title       || prev.title,
      arabic:      data.arabic      || prev.arabic,
      translation: data.translation || prev.translation,
    }));
  };

  const handleSave = async () => {
    if (!formData.title.trim()) return;
    setSaving(true);
    try {
      await duaStore.create(formData, email ?? '');
      setFormOpen(false);
    } finally {
      setSaving(false);
    }
  };

  const field = (key: keyof typeof formData, value: string) =>
    setFormData((prev) => ({ ...prev, [key]: value }));

  return (
    <div className="flex min-h-[100dvh] flex-col bg-bg">
      {/* Header */}
      <header className="mx-auto flex w-full max-w-[720px] items-center justify-between px-4 pb-3 pt-5">
        <button
          onClick={() => navigate('/')}
          aria-label="Back"
          className="grid h-10 w-10 cursor-pointer place-items-center rounded-xl border border-line bg-card text-ink-soft active:bg-line-soft"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="text-center">
          <div className="text-[17px] font-bold text-ink">Dua Library</div>
          <div className="text-[11px] text-ink-mute">{duaStore.duas.length} duas</div>
        </div>
        {isAdmin ? (
          <button
            onClick={openNew}
            className="flex cursor-pointer items-center gap-1.5 rounded-xl border-0 bg-primary px-3.5 py-2.5 text-[13px] font-semibold text-card active:scale-95"
          >
            <Plus className="h-3.5 w-3.5" />
            Add
          </button>
        ) : (
          <div className="w-10" />
        )}
      </header>

      {/* Search */}
      <div className="mx-auto w-full max-w-[720px] px-4 pb-3">
        <div className="relative">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-mute">
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
          </svg>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by title…"
            className="w-full rounded-xl border border-line bg-card py-2.5 pl-10 pr-4 text-[14px] text-ink placeholder:text-ink-mute focus:border-primary focus:outline-none"
          />
        </div>
      </div>

      {/* List */}
      <main className="mx-auto w-full max-w-[720px] flex-1 px-4 pb-24">
        {!duaStore.isLoaded ? (
          <div className="mt-16 text-center text-[13px] text-ink-mute">Loading…</div>
        ) : duaStore.duas.length === 0 ? (
          <div className="mt-8 rounded-xl border border-dashed border-line bg-card px-5 py-14 text-center">
            <div className="mb-3 font-arabic text-[36px] text-primary/30" dir="rtl">ٱدْعُ</div>
            <h2 className="mb-1 text-[16px] font-bold text-ink">No duas yet</h2>
            {isAdmin && (
              <p className="m-0 text-[13px] text-ink-mute">Tap "Add" above to add the first dua.</p>
            )}
          </div>
        ) : filtered.length === 0 ? (
          <div className="mt-8 rounded-xl border border-dashed border-line bg-card px-5 py-12 text-center">
            <p className="text-[14px] font-semibold text-ink">No duas match "{query}"</p>
            <p className="mt-1 text-[12px] text-ink-mute">Try a different word or clear the search.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-1.5 pt-1">
            {filtered.map((dua) => (
              <button
                key={dua.id}
                onClick={() => {
                  sessionStorage.setItem('library-scroll', String(window.scrollY));
                  navigate(`/library/${dua.id}`);
                }}
                className="flex w-full cursor-pointer items-center gap-3 rounded-xl border border-line-soft bg-card px-4 py-3.5 text-left transition-colors active:bg-primary-soft"
              >
                <div className="min-w-0 flex-1">
                  <span className="text-[14px] font-semibold text-ink">{dua.title}</span>
                </div>
                <ChevronRight className="h-4 w-4 flex-shrink-0 text-ink-mute" />
              </button>
            ))}
          </div>
        )}
      </main>

      {/* Admin: new dua modal */}
      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title="New Dua"
        subtitle="Title · Arabic · Translation · Reward"
        footer={
          <>
            <button onClick={() => setFormOpen(false)} className="btn btn-secondary">Cancel</button>
            <button onClick={handleSave} disabled={saving || !formData.title.trim()} className="btn btn-primary">
              {saving ? 'Saving…' : 'Save'}
            </button>
          </>
        }
      >
        <div className="mb-3.5">
          <div className="mb-2 flex items-center justify-between">
            <label className="form-label mb-0">Arabic Text</label>
            <ImageExtractButton
              extract={imgExtract.extract}
              loading={imgExtract.loading}
              error={imgExtract.error}
              onClearError={imgExtract.clearError}
              onExtracted={handleExtracted}
              dailyRemaining={imgExtract.dailyRemaining}
            />
          </div>
          <textarea className="form-textarea arabic-input" value={formData.arabic} onChange={(e) => field('arabic', e.target.value)} placeholder="ٱكْتُبِ ٱلدُّعَاءَ هُنَا" dir="rtl" />
        </div>
        <div className="mb-3.5">
          <label className="form-label">Title <span className="text-rose">*</span></label>
          <input className="form-input" value={formData.title} onChange={(e) => field('title', e.target.value)} placeholder="e.g. Dua Before Sleep" maxLength={120} />
        </div>
        <div className="mb-3.5">
          <label className="form-label">Translation</label>
          <textarea className="form-textarea" value={formData.translation} onChange={(e) => field('translation', e.target.value)} placeholder="The meaning of the dua…" />
        </div>
        <div>
          <label className="form-label">Reward / Virtue</label>
          <textarea className="form-textarea" value={formData.reward} onChange={(e) => field('reward', e.target.value)} placeholder="The reward or virtue of reciting this dua…" />
        </div>
      </Modal>
    </div>
  );
}
