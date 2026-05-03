import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Edit, Trash, Plus } from '../components/Icons';
import { Modal } from '../components/Modal';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { AddToCollectionModal } from '../components/AddToCollectionModal';
import { useDuas } from '../hooks/useDuas';
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

export function DuaDetailPage({ store, isAdmin, email }: Props) {
  const navigate  = useNavigate();
  const { duaId } = useParams<{ duaId: string }>();
  const duaStore  = useDuas(true);

  const dua = duaStore.duas.find((d) => d.id === duaId) ?? null;

  // Edit form
  const [formOpen, setFormOpen] = useState(false);
  const [formData, setFormData] = useState(EMPTY);
  const [saving,   setSaving]   = useState(false);

  const openEdit = () => {
    if (!dua) return;
    setFormData({ title: dua.title, arabic: dua.arabic, translation: dua.translation, reward: dua.reward });
    setFormOpen(true);
  };

  const handleSave = async () => {
    if (!dua || !formData.title.trim()) return;
    setSaving(true);
    try {
      await duaStore.update(dua.id, formData);
      setFormOpen(false);
    } finally {
      setSaving(false);
    }
  };

  // Delete
  const [confirmOpen, setConfirmOpen] = useState(false);
  const handleDelete = async () => {
    if (!dua) return;
    await duaStore.remove(dua.id);
    navigate('/library');
  };

  // Add to collection
  const [addOpen, setAddOpen] = useState(false);
  const handleAdd = async (cardId: string, d: Dua) => {
    await store.addSubcard(cardId, {
      duaId:       d.id,
      title:       d.title,
      arabic:      d.arabic,
      translation: d.translation,
      reward:      d.reward,
    });
  };

  const field = (key: keyof typeof formData, value: string) =>
    setFormData((prev) => ({ ...prev, [key]: value }));

  if (!duaStore.isLoaded) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-bg">
        <p className="text-[13px] text-ink-mute">Loading…</p>
      </div>
    );
  }

  if (!dua) {
    return (
      <div className="flex min-h-[100dvh] flex-col items-center justify-center gap-4 bg-bg px-6 text-center">
        <p className="text-[15px] font-semibold text-ink">Dua not found.</p>
        <button onClick={() => navigate('/library')} className="text-[13px] text-primary underline">
          Back to Library
        </button>
      </div>
    );
  }

  return (
    <div className="flex min-h-[100dvh] flex-col bg-bg">
      {/* Header */}
      <header className="mx-auto w-full max-w-[720px] px-4 pt-5 pb-3">
        {/* Button row */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate('/library')}
            aria-label="Back"
            className="grid h-10 w-10 cursor-pointer place-items-center rounded-xl border border-line bg-card text-ink-soft active:bg-line-soft"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>

          {isAdmin && (
            <div className="flex gap-1">
              <button
                onClick={openEdit}
                aria-label="Edit"
                className="grid h-10 w-10 cursor-pointer place-items-center rounded-xl border border-line bg-card text-ink-soft active:bg-line-soft"
              >
                <Edit className="h-4 w-4" />
              </button>
              <button
                onClick={() => setConfirmOpen(true)}
                aria-label="Delete"
                className="grid h-10 w-10 cursor-pointer place-items-center rounded-xl border border-line bg-card text-ink-soft active:text-rose"
              >
                <Trash className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>

        {/* Title — full width, centred, wraps freely */}
        <h1 className="mt-3 text-center text-[20px] font-bold leading-snug text-ink">
          {dua.title}
        </h1>
      </header>

      {/* Content */}
      <main className="mx-auto w-full max-w-[720px] flex-1 px-4 pb-32">
        <div className="rounded-xl border border-line-soft bg-card shadow-soft-sm">
          {/* Arabic */}
          <div className="border-b border-line-soft px-5 pt-6 pb-5 text-right" dir="rtl">
            <p className="m-0 font-arabic text-[28px] leading-[2] text-primary">
              {dua.arabic || '—'}
            </p>
          </div>

          {/* Translation */}
          {dua.translation && (
            <div className="border-b border-line-soft px-5 py-4">
              <p className="text-[14px] font-semibold leading-relaxed text-ink">
                {dua.translation}
              </p>
            </div>
          )}

          {/* Reward */}
          {dua.reward && (
            <div className="px-5 py-4">
              <div className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-ink-mute">
                Reward / Virtue
              </div>
              <p className="m-0 text-[13px] leading-relaxed text-ink-mute">
                {dua.reward}
              </p>
            </div>
          )}
        </div>
      </main>

      {/* Add to collection FAB */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40">
        <button
          onClick={() => setAddOpen(true)}
          className="flex cursor-pointer items-center gap-2 rounded-2xl bg-primary px-5 py-3 text-[13px] font-semibold text-card shadow-soft-lg active:scale-95"
        >
          <Plus className="h-3.5 w-3.5" />
          Add to my collection
        </button>
      </div>

      {/* Edit modal */}
      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title="Edit Dua"
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
          <label className="form-label">Title <span className="text-rose">*</span></label>
          <input className="form-input" value={formData.title} onChange={(e) => field('title', e.target.value)} maxLength={120} />
        </div>
        <div className="mb-3.5">
          <label className="form-label">Arabic Text</label>
          <textarea className="form-textarea arabic-input" value={formData.arabic} onChange={(e) => field('arabic', e.target.value)} dir="rtl" />
        </div>
        <div className="mb-3.5">
          <label className="form-label">Translation</label>
          <textarea className="form-textarea" value={formData.translation} onChange={(e) => field('translation', e.target.value)} />
        </div>
        <div>
          <label className="form-label">Reward / Virtue</label>
          <textarea className="form-textarea" value={formData.reward} onChange={(e) => field('reward', e.target.value)} />
        </div>
      </Modal>

      {/* Delete confirm */}
      <ConfirmDialog
        open={confirmOpen}
        title="Delete dua?"
        message={`"${dua.title}" will be permanently removed from the library.`}
        onConfirm={handleDelete}
        onCancel={() => setConfirmOpen(false)}
      />

      {/* Add to collection */}
      <AddToCollectionModal
        open={addOpen}
        dua={dua}
        collections={store.cards}
        onClose={() => setAddOpen(false)}
        onAdd={handleAdd}
        onRemove={(cardId, subId) => store.deleteSubcard(cardId, subId)}
      />
    </div>
  );
}
