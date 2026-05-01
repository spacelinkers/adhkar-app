import { useState } from 'react';
import { useNavigate, useParams, Navigate } from 'react-router-dom';
import { BrandBar } from '../components/BrandBar';
import { SubcardRow } from '../components/SubcardRow';
import { SubcardModal } from '../components/SubcardModal';
import { CardModal } from '../components/CardModal';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { Edit, Trash, Plus } from '../components/Icons';
import type { Subcard } from '../types';
import type { UseCardsResult } from '../hooks/useCards';

interface Props {
  store: UseCardsResult;
}

export function DetailPage({ store }: Props) {
  const { cardId } = useParams<{ cardId: string }>();
  const navigate = useNavigate();
  const card = store.cards.find((c) => c.id === cardId);
  const [subModalOpen, setSubModalOpen] = useState(false);
  const [editingSub, setEditingSub] = useState<Subcard | null>(null);
  const [editCardOpen, setEditCardOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Wait for store to load before redirecting away
  if (!store.isLoaded) return null;
  if (!card) return <Navigate to="/" replace />;

  const subs = card.subcards || [];

  const openNewSub = () => { setEditingSub(null); setSubModalOpen(true); };

  const handleSubSave = async (data: Omit<Subcard, 'id'>) => {
    if (editingSub) {
      await store.updateSubcard(card.id, editingSub.id, data);
    } else {
      await store.addSubcard(card.id, data);
    }
  };

  return (
    <>
      <BrandBar
        title={card.title}
        subtitle="Duas inside"
        onBack={() => navigate('/')}
      />

      <main className="mx-auto max-w-[720px] px-4 pb-32">
        {/* Hero */}
        <div className="relative mb-4 mt-2 overflow-hidden rounded-xl bg-gradient-to-br from-primary to-primary-deep p-5 text-card shadow-soft-md">
          <div
            className="pointer-events-none absolute -bottom-8 -right-8 h-[160px] w-[160px] rounded-full"
            style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.06) 0%, transparent 70%)' }}
          />
          <div className="mb-2 text-[10px] font-bold uppercase tracking-[1.8px] text-gold-soft">
            Collection
          </div>
          <h1 className="m-0 mb-1.5 text-[22px] font-bold leading-tight">{card.title}</h1>
          {card.desc && (
            <p className="m-0 mb-3.5 text-[13px] leading-[1.55] text-white/85">{card.desc}</p>
          )}
          <div className="flex items-center justify-between border-t border-white/15 pt-3">
            <div className="rounded-full bg-white/10 px-2.5 py-1 text-xs font-semibold">
              {subs.length} {subs.length === 1 ? 'dua' : 'duas'}
            </div>
            <div className="flex gap-1">
              <button
                onClick={() => setEditCardOpen(true)}
                aria-label="Edit collection"
                className="grid h-8 w-8 cursor-pointer place-items-center rounded-lg text-white/70 transition-colors active:bg-white/10 active:text-card"
              >
                <Edit className="h-4 w-4" />
              </button>
              <button
                onClick={() => setConfirmDelete(true)}
                aria-label="Delete collection"
                className="grid h-8 w-8 cursor-pointer place-items-center rounded-lg text-white/70 transition-colors active:bg-white/10 active:text-rose"
              >
                <Trash className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        <div className="section-label">Duas</div>

        {subs.length === 0 ? (
          <div className="mt-2 rounded-lg border border-dashed border-line bg-card px-5 py-9 text-center">
            <div className="mb-2.5 font-arabic text-[26px] text-primary" dir="rtl">ٱدْعُ</div>
            <h2 className="mb-1.5 text-[17px] font-bold">No Duas Yet</h2>
            <p className="m-0 text-[13px] leading-[1.6] text-ink-mute">
              Add your first dua to this collection<br />using the button below.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {subs.map((sub, i) => (
              <SubcardRow key={sub.id} sub={sub} num={i + 1} />
            ))}
          </div>
        )}

        <button
          onClick={openNewSub}
          className="mt-3 flex w-full cursor-pointer items-center justify-center gap-2 rounded-md border-[1.5px] border-dashed border-line bg-card p-3.5 text-[13.5px] font-semibold text-primary transition-all hover:bg-primary-soft active:border-primary active:bg-primary-soft"
        >
          <Plus className="h-3.5 w-3.5" />
          Add Dua
        </button>
      </main>

      <SubcardModal
        open={subModalOpen}
        subcard={editingSub}
        onClose={() => setSubModalOpen(false)}
        onSave={handleSubSave}
      />

      <CardModal
        open={editCardOpen}
        card={card}
        onClose={() => setEditCardOpen(false)}
        onSave={async (title, desc) => {
          await store.updateCard(card.id, { title, desc });
        }}
      />

      <ConfirmDialog
        open={confirmDelete}
        title="Delete collection?"
        message={`"${card.title}" and all ${subs.length} dua${
          subs.length === 1 ? '' : 's'
        } inside will be removed.`}
        onConfirm={async () => {
          await store.deleteCard(card.id);
          setConfirmDelete(false);
          navigate('/');
        }}
        onCancel={() => setConfirmDelete(false)}
      />
    </>
  );
}
