import { useEffect, useRef, useState } from 'react';
import { Modal } from './Modal';
import type { Subcard } from '../types';

interface Props {
  open: boolean;
  subcard: Subcard | null;
  onClose: () => void;
  onSave: (data: Omit<Subcard, 'id'>) => Promise<void>;
}

export function SubcardModal({ open, subcard, onClose, onSave }: Props) {
  const [title, setTitle] = useState('');
  const [arabic, setArabic] = useState('');
  const [translation, setTranslation] = useState('');
  const [reward, setReward] = useState('');
  const [saving, setSaving] = useState(false);
  const titleRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setTitle(subcard?.title ?? '');
      setArabic(subcard?.arabic ?? '');
      setTranslation(subcard?.translation ?? '');
      setReward(subcard?.reward ?? '');
      setSaving(false);
      const t = setTimeout(() => titleRef.current?.focus(), 200);
      return () => clearTimeout(t);
    }
  }, [open, subcard]);

  const handleSave = async () => {
    const t = title.trim();
    if (!t) {
      titleRef.current?.focus();
      return;
    }
    setSaving(true);
    try {
      await onSave({
        title: t,
        arabic: arabic.trim(),
        translation: translation.trim(),
        reward: reward.trim(),
      });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
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
        <div className="mt-1 text-[11px] text-ink-mute">
          A short name shown in the collection list
        </div>
      </div>
      <div className="mb-3.5">
        <label className="form-label">Arabic Text</label>
        <textarea
          className="form-textarea arabic-input"
          value={arabic}
          onChange={(e) => setArabic(e.target.value)}
          placeholder="ٱكْتُبِ ٱلدُّعَاءَ هُنَا"
          dir="rtl"
        />
      </div>
      <div className="mb-3.5">
        <label className="form-label">Translation</label>
        <textarea
          className="form-textarea"
          value={translation}
          onChange={(e) => setTranslation(e.target.value)}
          placeholder="The English meaning of the dua…"
        />
      </div>
      <div>
        <label className="form-label">Reward / Virtue</label>
        <textarea
          className="form-textarea"
          value={reward}
          onChange={(e) => setReward(e.target.value)}
          placeholder="The reward or virtue of reciting this dua…"
        />
      </div>
    </Modal>
  );
}
