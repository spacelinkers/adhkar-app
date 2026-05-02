import { useState } from 'react';
import { CollectionCard } from '../components/CollectionCard';
import { CardModal } from '../components/CardModal';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { Plus, Logo } from '../components/Icons';
import { InspirationCard } from '../components/InspirationCard';
import type { Card } from '../types';
import type { UseCardsResult } from '../hooks/useCards';

interface Props {
  store: UseCardsResult;
}

export function HomePage({ store }: Props) {
  const { cards, cloudEnabled, createCard, updateCard, deleteCard, clearLocal } = store;
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<Card | null>(null);
  const [confirmCard, setConfirmCard] = useState<Card | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);

  const openNew = () => { setEditingCard(null); setModalOpen(true); };
  const openEdit = (card: Card) => { setEditingCard(card); setModalOpen(true); };

  const handleSave = async (title: string, desc: string) => {
    if (editingCard) {
      await updateCard(editingCard.id, { title, desc });
    } else {
      await createCard(title, desc);
    }
  };

  return (
    <>
      {/* Header */}
      <header className="mx-auto flex max-w-[720px] items-center justify-between px-5 pb-3 pt-[18px]">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 flex-shrink-0 place-items-center rounded-xl bg-primary shadow-soft-sm">
            <Logo className="h-5 w-5 text-card" />
          </div>
          <div>
            <div className="text-[17px] font-bold text-ink">Adhkār</div>
            <div className="text-[11px] font-medium text-ink-mute">
              {cards.length} {cards.length === 1 ? 'sura' : 'suras'}
            </div>
          </div>
        </div>
        <button
          onClick={openNew}
          className="flex cursor-pointer items-center gap-1.5 rounded-xl border-0 bg-primary px-4 py-2.5 text-[13px] font-semibold text-card shadow-soft-sm transition-transform active:scale-95"
        >
          <Plus className="h-3.5 w-3.5" />
          New
        </button>
      </header>

      <main className="mx-auto max-w-[720px] pb-32">
        <InspirationCard />

        <div className="px-4">
        {cards.length === 0 ? (
          <div className="mt-8 rounded-2xl border border-dashed border-line bg-card px-5 py-14 text-center">
            <div className="mb-3 font-arabic text-[36px] text-primary/30" dir="rtl">ٱبْدَأْ</div>
            <h2 className="mb-1.5 text-[17px] font-bold text-ink">Begin memorising</h2>
            <p className="m-0 text-[13px] leading-[1.6] text-ink-mute">
              Add your first sura or collection<br />using the button above.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-2 pt-1">
            {cards.map((c) => (
              <CollectionCard
                key={c.id}
                card={c}
                onEdit={openEdit}
                onDelete={(card) => setConfirmCard(card)}
              />
            ))}
          </div>
        )}

        {/* Minimal footer */}
        <div className="mt-10 flex items-center justify-between border-t border-line-soft pt-4">
          <span className="text-[11px] text-ink-mute">
            {cloudEnabled ? 'Cloud sync on' : 'Local only'}
          </span>
          <button
            onClick={() => setConfirmClear(true)}
            className="cursor-pointer border-0 bg-transparent p-0 text-[11px] text-ink-mute underline underline-offset-2"
          >
            Clear data
          </button>
        </div>
        </div>
      </main>

      {/* FAB */}
      <button
        onClick={openNew}
        aria-label="Add collection"
        className="fixed bottom-[22px] right-1/2 z-40 grid h-14 w-14 cursor-pointer place-items-center rounded-2xl border-0 bg-primary text-card transition-transform active:scale-90"
        style={{
          transform: 'translateX(min(338px, 50vw))',
          boxShadow: '0 8px 24px rgba(15,61,46,.35), 0 2px 6px rgba(15,61,46,.2)',
        }}
      >
        <Plus className="h-[22px] w-[22px]" />
      </button>

      <CardModal
        open={modalOpen}
        card={editingCard}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
      />

      <ConfirmDialog
        open={!!confirmCard}
        title="Delete collection?"
        message={
          confirmCard
            ? `"${confirmCard.title}" and all ${confirmCard.subcards?.length || 0} entr${
                (confirmCard.subcards?.length || 0) === 1 ? 'y' : 'ies'
              } inside will be removed.`
            : ''
        }
        onConfirm={async () => {
          if (confirmCard) await deleteCard(confirmCard.id);
          setConfirmCard(null);
        }}
        onCancel={() => setConfirmCard(null)}
      />

      <ConfirmDialog
        open={confirmClear}
        title="Clear all data?"
        message={
          cloudEnabled
            ? 'Clears the local cache. Your data will reload from the cloud on next sync.'
            : 'This will permanently erase all data saved on this device.'
        }
        confirmLabel="Clear"
        onConfirm={() => { clearLocal(); setConfirmClear(false); }}
        onCancel={() => setConfirmClear(false)}
      />
    </>
  );
}
