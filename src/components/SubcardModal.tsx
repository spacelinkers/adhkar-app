import { useEffect, useRef, useState } from 'react';
import { Modal } from './Modal';
import { useDuas } from '../hooks/useDuas';
import { ArrowLeft, X } from './Icons';
import type { Subcard } from '../types';

interface Props {
  open: boolean;
  subcard: Subcard | null;
  onClose: () => void;
  onSave: (data: Omit<Subcard, 'id'>) => Promise<void>;
}

export function SubcardModal({ open, subcard, onClose, onSave }: Props) {
  const [title,       setTitle]       = useState('');
  const [arabic,      setArabic]      = useState('');
  const [translation, setTranslation] = useState('');
  const [reward,      setReward]      = useState('');
  const [saving,      setSaving]      = useState(false);
  const [pickerOpen,  setPickerOpen]  = useState(false);
  const [query,       setQuery]       = useState('');
  const titleRef = useRef<HTMLInputElement>(null);

  const duaStore = useDuas(true);

  useEffect(() => {
    if (open) {
      setTitle(subcard?.title ?? '');
      setArabic(subcard?.arabic ?? '');
      setTranslation(subcard?.translation ?? '');
      setReward(subcard?.reward ?? '');
      setSaving(false);
      setPickerOpen(false);
      setQuery('');
      const t = setTimeout(() => titleRef.current?.focus(), 200);
      return () => clearTimeout(t);
    }
  }, [open, subcard]);

  const handleSave = async () => {
    const t = title.trim();
    if (!t) { titleRef.current?.focus(); return; }
    setSaving(true);
    try {
      await onSave({ title: t, arabic: arabic.trim(), translation: translation.trim(), reward: reward.trim() });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const selectFromLibrary = (dua: { title: string; arabic: string; translation: string }) => {
    if (!title.trim())       setTitle(dua.title);
    if (!arabic.trim())      setArabic(dua.arabic);
    if (!translation.trim()) setTranslation(dua.translation);
    setPickerOpen(false);
    setQuery('');
  };

  const filtered = query.trim()
    ? duaStore.duas.filter((d) => d.title.toLowerCase().includes(query.toLowerCase()))
    : duaStore.duas;

  return (
    <>
      <Modal
        open={open}
        onClose={onClose}
        title={subcard ? 'Edit Dua' : 'New Dua'}
        subtitle="Title · Arabic · translation · reward"
        footer={
          <>
            <button onClick={onClose} className="btn btn-secondary">Cancel</button>
            <button onClick={handleSave} disabled={saving} className="btn btn-primary">
              {saving ? 'Saving…' : 'Save'}
            </button>
          </>
        }
      >
        {/* Add from Library */}
        <div className="mb-4 flex items-center justify-between rounded-xl border border-dashed border-primary/30 bg-primary-soft px-3.5 py-2.5">
          <span className="text-[12.5px] font-medium text-primary">Fill from Dua Library</span>
          <button
            type="button"
            onClick={() => setPickerOpen(true)}
            className="cursor-pointer rounded-lg bg-primary px-3 py-1 text-[12px] font-semibold text-card"
          >
            Browse
          </button>
        </div>

        <div className="mb-3.5">
          <label className="form-label">
            Title <span className="ml-0.5 text-rose">*</span>
          </label>
          <input
            ref={titleRef}
            className="form-input"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Dua Before Sleep"
            maxLength={120}
          />
          <div className="mt-1 text-[11px] text-ink-mute">A short name shown in the collection list</div>
        </div>
        <div className="mb-3.5">
          <label className="form-label">Arabic Text</label>
          <textarea className="form-textarea arabic-input" value={arabic} onChange={(e) => setArabic(e.target.value)} placeholder="ٱكْتُبِ ٱلدُّعَاءَ هُنَا" dir="rtl" />
        </div>
        <div className="mb-3.5">
          <label className="form-label">Translation</label>
          <textarea className="form-textarea" value={translation} onChange={(e) => setTranslation(e.target.value)} placeholder="The meaning of the dua…" />
        </div>
        <div>
          <label className="form-label">Reward / Virtue</label>
          <textarea className="form-textarea" value={reward} onChange={(e) => setReward(e.target.value)} placeholder="The reward or virtue of reciting this dua…" />
        </div>
      </Modal>

      {/* Library picker overlay */}
      {pickerOpen && (
        <div className="fixed inset-0 z-[110] flex items-end justify-center bg-black/40 sm:items-center" onClick={() => setPickerOpen(false)}>
          <div className="w-full max-w-sm rounded-t-3xl bg-card shadow-soft-lg sm:rounded-2xl" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="border-b border-line-soft px-5 py-4">
              <div className="mb-3 flex items-center gap-3">
                <button onClick={() => { setPickerOpen(false); setQuery(''); }} className="grid h-8 w-8 cursor-pointer place-items-center rounded-xl text-ink-mute hover:bg-line-soft">
                  <ArrowLeft className="h-4 w-4" />
                </button>
                <p className="flex-1 text-[15px] font-bold text-ink">Add from Library</p>
                <button onClick={() => { setPickerOpen(false); setQuery(''); }} className="grid h-8 w-8 cursor-pointer place-items-center rounded-xl text-ink-mute hover:bg-line-soft">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search duas…"
                autoFocus
                className="w-full rounded-xl border border-line bg-bg px-3.5 py-2.5 text-[13px] text-ink placeholder:text-ink-mute/50 focus:border-primary focus:outline-none"
              />
            </div>

            {/* List */}
            <div className="max-h-[55vh] overflow-y-auto pb-6">
              {duaStore.duas.length === 0 ? (
                <p className="py-10 text-center text-[13px] text-ink-mute">No duas in the library yet.</p>
              ) : filtered.length === 0 ? (
                <p className="py-10 text-center text-[13px] text-ink-mute">No results for "{query}"</p>
              ) : (
                filtered.map((dua) => (
                  <button
                    key={dua.id}
                    type="button"
                    onClick={() => selectFromLibrary(dua)}
                    className="flex w-full cursor-pointer items-center gap-3 px-5 py-3 text-left transition-colors hover:bg-primary-soft active:bg-primary-soft"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-medium text-ink">{dua.title}</p>
                      {dua.arabic && (
                        <p className="mt-0.5 truncate text-right font-arabic text-[14px] text-ink-mute" dir="rtl">
                          {dua.arabic.slice(0, 50)}{dua.arabic.length > 50 ? '…' : ''}
                        </p>
                      )}
                    </div>
                    <span className="flex-shrink-0 rounded-lg bg-primary-soft px-2 py-0.5 text-[11px] font-semibold text-primary">Add</span>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
