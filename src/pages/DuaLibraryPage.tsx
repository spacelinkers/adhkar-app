import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Edit, Trash } from '../components/Icons';
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

export function DuaLibraryPage({ store, isAdmin, email }: Props) {
  const navigate  = useNavigate();
  const duaStore  = useDuas(true);

  // Admin form state
  const [formOpen,   setFormOpen]   = useState(false);
  const [editing,    setEditing]    = useState<Dua | null>(null);
  const [formData,   setFormData]   = useState(EMPTY);
  const [saving,     setSaving]     = useState(false);

  // Delete confirm
  const [confirmDua, setConfirmDua] = useState<Dua | null>(null);

  // Add-to-collection
  const [addTarget,  setAddTarget]  = useState<Dua | null>(null);

  const openNew = () => {
    setEditing(null);
    setFormData(EMPTY);
    setFormOpen(true);
  };

  const openEdit = (dua: Dua) => {
    setEditing(dua);
    setFormData({ title: dua.title, arabic: dua.arabic, translation: dua.translation, reward: dua.reward });
    setFormOpen(true);
  };

  const handleSave = async () => {
    if (!formData.title.trim()) return;
    setSaving(true);
    try {
      if (editing) {
        await duaStore.update(editing.id, formData);
      } else {
        await duaStore.create(formData, email ?? '');
      }
      setFormOpen(false);
    } finally {
      setSaving(false);
    }
  };

  const handleAddToCollection = async (cardId: string, dua: Dua) => {
    await store.addSubcard(cardId, {
      duaId:       dua.id,
      title:       dua.title,
      arabic:      dua.arabic,
      translation: dua.translation,
      reward:      dua.reward,
    });
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
        ) : (
          <div className="flex flex-col gap-3 pt-1">
            {duaStore.duas.map((dua) => (
              <div
                key={dua.id}
                className="rounded-xl border border-line-soft bg-card shadow-soft-sm"
              >
                {/* Arabic */}
                <div className="border-b border-line-soft px-5 pt-5 pb-4 text-right" dir="rtl">
                  <p className="m-0 font-arabic text-[24px] leading-[2] text-primary">
                    {dua.arabic || '—'}
                  </p>
                </div>

                {/* Content */}
                <div className="px-5 pt-4 pb-3">
                  <div className="mb-2.5 inline-flex items-center gap-1.5 rounded-full bg-primary-soft px-2.5 py-0.5 text-[11px] font-bold text-primary">
                    {dua.title}
                  </div>

                  {dua.translation && (
                    <p className="mb-2 text-[14px] font-semibold leading-snug text-ink">
                      {dua.translation}
                    </p>
                  )}

                  {dua.reward && (
                    <p className="m-0 text-[12.5px] leading-[1.6] text-ink-mute">
                      {dua.reward}
                    </p>
                  )}
                </div>

                {/* Footer actions */}
                <div className="flex items-center justify-between border-t border-line-soft px-4 py-2.5">
                  {isAdmin ? (
                    <div className="flex gap-1">
                      <button
                        onClick={() => openEdit(dua)}
                        className="grid h-8 w-8 cursor-pointer place-items-center rounded-lg text-ink-mute hover:bg-line-soft"
                        aria-label="Edit"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setConfirmDua(dua)}
                        className="grid h-8 w-8 cursor-pointer place-items-center rounded-lg text-ink-mute hover:bg-line-soft active:text-rose"
                        aria-label="Delete"
                      >
                        <Trash className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <div />
                  )}
                  <button
                    onClick={() => setAddTarget(dua)}
                    className="flex cursor-pointer items-center gap-1.5 rounded-lg bg-primary px-3.5 py-2 text-[12.5px] font-semibold text-card active:scale-95"
                  >
                    <Plus className="h-3 w-3" />
                    Add to my collection
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Admin: Add / Edit dua modal */}
      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editing ? 'Edit Dua' : 'New Dua'}
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
          <input
            className="form-input"
            value={formData.title}
            onChange={(e) => field('title', e.target.value)}
            placeholder="e.g. Dua Before Sleep"
            maxLength={120}
          />
        </div>
        <div className="mb-3.5">
          <label className="form-label">Arabic Text</label>
          <textarea
            className="form-textarea arabic-input"
            value={formData.arabic}
            onChange={(e) => field('arabic', e.target.value)}
            placeholder="ٱكْتُبِ ٱلدُّعَاءَ هُنَا"
            dir="rtl"
          />
        </div>
        <div className="mb-3.5">
          <label className="form-label">Translation</label>
          <textarea
            className="form-textarea"
            value={formData.translation}
            onChange={(e) => field('translation', e.target.value)}
            placeholder="The English meaning of the dua…"
          />
        </div>
        <div>
          <label className="form-label">Reward / Virtue</label>
          <textarea
            className="form-textarea"
            value={formData.reward}
            onChange={(e) => field('reward', e.target.value)}
            placeholder="The reward or virtue of reciting this dua…"
          />
        </div>
      </Modal>

      {/* Delete confirm */}
      <ConfirmDialog
        open={!!confirmDua}
        title="Delete dua?"
        message={`"${confirmDua?.title}" will be permanently removed from the library.`}
        onConfirm={async () => {
          if (confirmDua) await duaStore.remove(confirmDua.id);
          setConfirmDua(null);
        }}
        onCancel={() => setConfirmDua(null)}
      />

      {/* Add to collection */}
      <AddToCollectionModal
        open={!!addTarget}
        dua={addTarget}
        collections={store.cards}
        onClose={() => setAddTarget(null)}
        onAdd={handleAddToCollection}
        onRemove={(cardId, subId) => store.deleteSubcard(cardId, subId)}
      />
    </div>
  );
}
