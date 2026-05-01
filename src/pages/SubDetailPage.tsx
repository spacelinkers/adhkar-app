import { useState } from 'react';
import { useNavigate, useParams, Navigate } from 'react-router-dom';
import { SubcardModal } from '../components/SubcardModal';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { Edit, Trash, ArrowLeft, ChevronLeft, ChevronRight } from '../components/Icons';
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

  const [revealed, setRevealed] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  if (!store.isLoaded) return null;
  if (!card) return <Navigate to="/" replace />;
  if (!sub) return <Navigate to={`/card/${cardId}`} replace />;

  const goTo = (newIdx: number) => {
    setRevealed(false);
    navigate(`/card/${cardId}/dua/${subs[newIdx].id}`, { replace: true });
  };

  const hasPrev = idx > 0;
  const hasNext = idx < subs.length - 1;

  return (
    <div className="flex min-h-[100dvh] flex-col bg-bg">
      {/* Minimal header */}
      <header className="flex items-center justify-between px-4 pt-5 pb-3">
        <button
          onClick={() => navigate(`/card/${cardId}`)}
          aria-label="Back"
          className="grid h-10 w-10 cursor-pointer place-items-center rounded-xl border border-line bg-card text-ink-soft active:bg-line-soft"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>

        <div className="text-center">
          <div className="text-[13px] font-semibold text-ink">{card.title}</div>
          <div className="text-[11px] text-ink-mute">
            {idx + 1} / {subs.length}
          </div>
        </div>

        {/* Actions menu */}
        <div className="relative">
          <button
            onClick={() => setMenuOpen((o) => !o)}
            aria-label="Options"
            className="grid h-10 w-10 cursor-pointer place-items-center rounded-xl border border-line bg-card text-ink-soft active:bg-line-soft"
          >
            <span className="text-lg leading-none tracking-[2px]">···</span>
          </button>
          {menuOpen && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setMenuOpen(false)}
              />
              <div className="absolute right-0 top-12 z-20 w-36 overflow-hidden rounded-xl border border-line bg-card shadow-soft-lg">
                <button
                  onClick={() => { setMenuOpen(false); setEditOpen(true); }}
                  className="flex w-full cursor-pointer items-center gap-2.5 px-4 py-3 text-[13.5px] font-medium text-ink hover:bg-line-soft"
                >
                  <Edit className="h-4 w-4 text-ink-mute" />
                  Edit
                </button>
                <button
                  onClick={() => { setMenuOpen(false); setConfirmDelete(true); }}
                  className="flex w-full cursor-pointer items-center gap-2.5 px-4 py-3 text-[13.5px] font-medium text-rose hover:bg-line-soft"
                >
                  <Trash className="h-4 w-4" />
                  Delete
                </button>
              </div>
            </>
          )}
        </div>
      </header>

      {/* Progress bar */}
      <div className="mx-4 h-[3px] overflow-hidden rounded-full bg-line">
        <div
          className="h-full rounded-full bg-primary transition-all duration-300"
          style={{ width: `${((idx + 1) / subs.length) * 100}%` }}
        />
      </div>

      {/* Main content — vertically centered */}
      <main className="flex flex-1 flex-col items-center justify-center px-5 py-8">
        <div className="w-full max-w-[620px]">
          {/* Arabic block */}
          <div
            className="mb-8 rounded-2xl bg-card p-6 text-right shadow-soft-md"
            dir="rtl"
          >
            {sub.arabic ? (
              <p className="m-0 font-arabic text-[28px] leading-[2.2] text-ink">
                {sub.arabic}
              </p>
            ) : (
              <p className="m-0 text-center font-sans text-sm italic text-ink-mute">
                — No Arabic text —
              </p>
            )}
          </div>

          {/* Title (if any) */}
          {sub.title?.trim() && (
            <div className="mb-5 text-center text-[16px] font-semibold text-ink">
              {sub.title}
            </div>
          )}

          {/* Translation reveal */}
          {(sub.translation || sub.reward) && (
            <>
              {!revealed ? (
                <button
                  onClick={() => setRevealed(true)}
                  className="w-full cursor-pointer rounded-xl border-[1.5px] border-dashed border-primary/40 bg-primary-soft/60 py-4 text-[13.5px] font-semibold text-primary transition-colors hover:bg-primary-soft active:bg-primary-soft"
                >
                  Tap to reveal translation
                </button>
              ) : (
                <div className="animate-fade-in space-y-4">
                  {sub.translation && (
                    <div className="rounded-xl bg-card px-5 py-4 shadow-soft-sm">
                      <div className="mb-1.5 text-[10px] font-bold uppercase tracking-[1.5px] text-ink-mute">
                        Translation
                      </div>
                      <p className="m-0 text-[15px] leading-[1.7] text-ink-soft">
                        {sub.translation}
                      </p>
                    </div>
                  )}
                  {sub.reward && (
                    <div className="rounded-xl border-l-[3px] border-gold bg-gold-soft px-4 py-3.5 shadow-soft-sm">
                      <div className="mb-1.5 text-[10px] font-bold uppercase tracking-[1.5px] text-gold-deep">
                        Reward
                      </div>
                      <p className="m-0 text-[13.5px] leading-[1.65] text-ink">
                        {sub.reward}
                      </p>
                    </div>
                  )}
                  <button
                    onClick={() => setRevealed(false)}
                    className="w-full cursor-pointer rounded-xl border border-line bg-card py-2.5 text-[12px] font-medium text-ink-mute hover:bg-line-soft"
                  >
                    Hide
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {/* Prev / Next navigation */}
      <nav className="flex items-center justify-between border-t border-line bg-card px-5 py-4">
        <button
          onClick={() => hasPrev && goTo(idx - 1)}
          disabled={!hasPrev}
          aria-label="Previous"
          className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-xl border border-line bg-card text-ink-soft transition-colors disabled:opacity-30 active:bg-line-soft"
        >
          <ChevronLeft className="h-5 w-5" strokeWidth={2.5} />
        </button>

        <div className="text-[12px] font-semibold text-ink-mute">
          {idx + 1} of {subs.length}
        </div>

        <button
          onClick={() => hasNext && goTo(idx + 1)}
          disabled={!hasNext}
          aria-label="Next"
          className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-xl border border-line bg-card text-ink-soft transition-colors disabled:opacity-30 active:bg-line-soft"
        >
          <ChevronRight className="h-5 w-5" strokeWidth={2.5} />
        </button>
      </nav>

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
    </div>
  );
}
