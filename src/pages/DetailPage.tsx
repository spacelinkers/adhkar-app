import { useState } from 'react';
import { useNavigate, useParams, Navigate } from 'react-router-dom';
import { BrandBar } from '../components/BrandBar';
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
        subtitle={`${subs.length} ${subs.length === 1 ? 'entry' : 'entries'}`}
        onBack={() => navigate('/')}
        rightSlot={
          <div className="flex gap-1">
            <button
              onClick={() => setEditCardOpen(true)}
              aria-label="Edit collection"
              className="grid h-9 w-9 cursor-pointer place-items-center rounded-xl border border-line bg-card text-ink-soft active:bg-line-soft"
            >
              <Edit className="h-4 w-4" />
            </button>
            <button
              onClick={() => setConfirmDelete(true)}
              aria-label="Delete collection"
              className="grid h-9 w-9 cursor-pointer place-items-center rounded-xl border border-line bg-card text-ink-soft active:bg-line-soft active:text-rose"
            >
              <Trash className="h-4 w-4" />
            </button>
          </div>
        }
      />

      <main className="mx-auto max-w-[720px] pb-32">
        <div className="px-4">
        {card.desc && (
          <p className="mb-4 mt-1 text-[13.5px] leading-[1.6] text-ink-soft">{card.desc}</p>
        )}

        {subs.length === 0 ? (
          <div className="mt-4 rounded-xl border border-dashed border-line bg-card px-5 py-12 text-center">
            <div className="mb-3 font-arabic text-[32px] text-primary/40" dir="rtl">ٱدْعُ</div>
            <h2 className="mb-1.5 text-[16px] font-bold text-ink">Nothing here yet</h2>
            <p className="m-0 text-[13px] text-ink-mute">
              Add your first entry using the button below.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-2 pt-1">
            {subs.map((sub, i) => (
              <DuaRow key={sub.id} sub={sub} num={i + 1} cardId={cardId!} />
            ))}
          </div>
        )}

        <button
          onClick={openNewSub}
          className="mt-4 flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border-[1.5px] border-dashed border-line bg-card py-4 text-[13.5px] font-semibold text-primary transition-colors hover:bg-primary-soft active:bg-primary-soft"
        >
          <Plus className="h-3.5 w-3.5" />
          Add Entry
        </button>
        </div>
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
        message={`"${card.title}" and all ${subs.length} entr${
          subs.length === 1 ? 'y' : 'ies'
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

function DuaRow({ sub, num, cardId }: { sub: Subcard; num: number; cardId: string }) {
  const navigate = useNavigate();
  const hasTitle = !!sub.title?.trim();
  const hasArabic = !!sub.arabic?.trim();

  return (
    <button
      onClick={() => navigate(`/card/${cardId}/dua/${sub.id}`)}
      className="group w-full cursor-pointer rounded-xl border border-line-soft bg-card px-4 py-4 text-left shadow-soft-sm transition-all active:scale-[.99] active:shadow-none"
    >
      <div className="flex items-start gap-3.5">
        <div className="mt-0.5 grid h-7 w-7 flex-shrink-0 place-items-center rounded-lg bg-primary-soft text-[11px] font-bold tabular-nums text-primary">
          {String(num).padStart(2, '0')}
        </div>
        <div className="min-w-0 flex-1">
          <div
            className={`text-[14.5px] font-semibold leading-snug ${
              hasTitle ? 'text-ink' : 'italic text-ink-mute'
            }`}
          >
            {hasTitle ? sub.title : 'Untitled'}
          </div>
          {hasArabic && (
            <div
              className="mt-1.5 truncate text-right font-arabic text-[17px] text-ink-mute"
              dir="rtl"
            >
              {sub.arabic.slice(0, 60)}{sub.arabic.length > 60 ? '…' : ''}
            </div>
          )}
        </div>
      </div>
    </button>
  );
}
