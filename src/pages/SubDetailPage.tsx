import { useState } from 'react';
import { useNavigate, useParams, Navigate } from 'react-router-dom';
import { BrandBar } from '../components/BrandBar';
import { SubcardModal } from '../components/SubcardModal';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { Edit, Trash } from '../components/Icons';
import type { UseCardsResult } from '../hooks/useCards';

interface Props {
  store: UseCardsResult;
}

export function SubDetailPage({ store }: Props) {
  const { cardId, subId } = useParams<{ cardId: string; subId: string }>();
  const navigate = useNavigate();

  const card = store.cards.find((c) => c.id === cardId);
  const subs = card?.subcards || [];
  const idx = subs.findIndex((s) => s.id === subId);
  const sub = idx >= 0 ? subs[idx] : null;

  const [editOpen, setEditOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (!store.isLoaded) return null;
  if (!card) return <Navigate to="/" replace />;
  if (!sub) return <Navigate to={`/card/${cardId}`} replace />;

  const hasTitle = !!sub.title?.trim();

  return (
    <>
      <BrandBar
        title={hasTitle ? sub.title : 'Untitled Dua'}
        subtitle={card.title}
        onBack={() => navigate(`/card/${cardId}`)}
      />

      <main className="mx-auto max-w-[720px] px-4 pb-32">
        <div className="mt-2 rounded-xl border border-line-soft bg-card px-5 py-5 shadow-soft-md">
          <div className="mb-2.5 inline-flex items-center gap-1.5 rounded-full bg-primary-soft px-2.5 py-1 text-[11px] font-bold tracking-[0.5px] text-primary">
            Dua · No. {String(idx + 1).padStart(2, '0')}
          </div>
          <h1
            className={`m-0 mb-4 text-[22px] font-bold leading-tight ${
              hasTitle ? 'text-ink' : 'italic text-ink-mute'
            }`}
          >
            {hasTitle ? sub.title : 'Untitled Dua'}
          </h1>

          {sub.arabic ? (
            <div
              className="mb-4 rounded-md bg-card-soft p-4 text-right font-arabic text-2xl leading-[2.1] text-ink"
              dir="rtl"
            >
              {sub.arabic}
            </div>
          ) : (
            <div className="mb-4 rounded-md bg-card-soft p-4 text-center font-sans text-xs italic text-ink-mute">
              — No Arabic text —
            </div>
          )}

          {sub.translation && (
            <div className="mb-3.5">
              <div className="mb-1.5 text-[10px] font-bold uppercase tracking-[1.5px] text-ink-mute">
                Translation
              </div>
              <div className="text-[15px] leading-[1.6] text-ink-soft">{sub.translation}</div>
            </div>
          )}

          {sub.reward && (
            <div className="mb-3.5">
              <div className="mb-1.5 text-[10px] font-bold uppercase tracking-[1.5px] text-ink-mute">
                Reward
              </div>
              <div className="rounded-r-lg border-l-[3px] border-gold bg-gold-soft px-3 py-2.5 text-[13.5px] leading-[1.65] text-ink">
                {sub.reward}
              </div>
            </div>
          )}

          <div className="mt-4 flex justify-end gap-1 border-t border-line-soft pt-3.5">
            <button
              onClick={() => setEditOpen(true)}
              aria-label="Edit"
              className="grid h-8 w-8 cursor-pointer place-items-center rounded-lg text-ink-mute transition-colors hover:bg-line-soft hover:text-ink"
            >
              <Edit className="h-4 w-4" />
            </button>
            <button
              onClick={() => setConfirmDelete(true)}
              aria-label="Delete"
              className="grid h-8 w-8 cursor-pointer place-items-center rounded-lg text-ink-mute transition-colors hover:bg-line-soft active:text-rose"
            >
              <Trash className="h-4 w-4" />
            </button>
          </div>
        </div>
      </main>

      <SubcardModal
        open={editOpen}
        subcard={sub}
        onClose={() => setEditOpen(false)}
        onSave={async (data) => {
          await store.updateSubcard(card.id, sub.id, data);
        }}
      />

      <ConfirmDialog
        open={confirmDelete}
        title="Delete dua?"
        message="This dua will be permanently removed."
        onConfirm={async () => {
          await store.deleteSubcard(card.id, sub.id);
          setConfirmDelete(false);
          navigate(`/card/${cardId}`);
        }}
        onCancel={() => setConfirmDelete(false)}
      />
    </>
  );
}
