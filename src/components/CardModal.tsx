import { useEffect, useRef, useState } from 'react';
import { Modal } from './Modal';
import type { Card } from '../types';

interface Props {
  open: boolean;
  card: Card | null; // null = creating, Card = editing
  onClose: () => void;
  onSave: (title: string, desc: string) => Promise<void>;
}

export function CardModal({ open, card, onClose, onSave }: Props) {
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [saving, setSaving] = useState(false);
  const titleRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setTitle(card?.title ?? '');
      setDesc(card?.desc ?? '');
      setSaving(false);
      const t = setTimeout(() => titleRef.current?.focus(), 200);
      return () => clearTimeout(t);
    }
  }, [open, card]);

  const handleSave = async () => {
    const t = title.trim();
    if (!t) {
      titleRef.current?.focus();
      return;
    }
    setSaving(true);
    try {
      await onSave(t, desc.trim());
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={card ? 'Edit Collection' : 'New Collection'}
      subtitle="Group of related duas"
      footer={
        <>
          <button onClick={onClose} className="btn btn-secondary">Cancel</button>
          <button onClick={handleSave} disabled={saving} className="btn btn-primary">
            {saving ? 'Saving…' : 'Save'}
          </button>
        </>
      }
    >
      <div className="mb-4">
        <label className="form-label">
          Title <span className="ml-0.5 text-rose">*</span>
        </label>
        <input
          ref={titleRef}
          className="form-input"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Morning Adhkār"
          maxLength={100}
        />
      </div>
      <div>
        <label className="form-label">Description</label>
        <textarea
          className="form-textarea"
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
          placeholder="A short description…"
          maxLength={300}
        />
      </div>
    </Modal>
  );
}
