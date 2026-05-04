import { useState } from 'react';
import { useNavigate, useParams, Navigate } from 'react-router-dom';
import { SubcardModal } from '../components/SubcardModal';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { NotificationModal } from '../components/NotificationModal';
import { Edit, Trash, ArrowLeft, ChevronLeft, ChevronRight } from '../components/Icons';
import type { UseCardsResult } from '../hooks/useCards';
import type { UseNotifSchedulesResult } from '../hooks/useNotifSchedules';

interface Props {
  store:      UseCardsResult;
  userId:     string | null;
  notifStore: UseNotifSchedulesResult;
}

export function SubDetailPage({ store, userId, notifStore }: Props) {
  const { cardId, subId } = useParams<{ cardId: string; subId: string }>();
  const navigate = useNavigate();

  const card = store.cards.find((c) => c.id === cardId);
  const subs = card?.subcards || [];
  const idx  = subs.findIndex((s) => s.id === subId);
  const sub  = idx >= 0 ? subs[idx] : null;

  const [editOpen,      setEditOpen]      = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [menuOpen,      setMenuOpen]      = useState(false);

  if (!store.isLoaded) return null;
  if (!card) return <Navigate to="/" replace />;
  if (!sub)  return <Navigate to={`/card/${cardId}`} replace />;

  const goTo    = (i: number) => navigate(`/card/${cardId}/dua/${subs[i].id}`, { replace: true });
  const hasPrev = idx > 0;
  const hasNext = idx < subs.length - 1;

  return (
    <div className="flex min-h-[100dvh] flex-col bg-bg">
      {/* Header */}
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
          <div className="text-[11px] text-ink-mute">{idx + 1} / {subs.length}</div>
        </div>

        <div className="flex items-center gap-1">
          {userId && (
            <NotificationModal
              type="subcard"
              targetId={sub.id}
              cardId={card.id}
              title={sub.title || card.title}
              userId={userId}
              notifStore={notifStore}
            />
          )}

          {/* ⋯ menu */}
          <div className="relative">
            <button
              onClick={() => setMenuOpen((o) => !o)}
              aria-label="Options"
              className="grid h-9 w-9 cursor-pointer place-items-center rounded-xl border border-line bg-card text-ink-soft active:bg-line-soft"
            >
              <span className="text-lg leading-none tracking-[2px]">···</span>
            </button>
            {menuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                <div className="absolute right-0 top-11 z-20 w-36 overflow-hidden rounded-xl border border-line bg-card shadow-soft-lg">
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
        </div>
      </header>

      {/* Progress bar */}
      <div className="mx-4 h-[3px] overflow-hidden rounded-full bg-line">
        <div
          className="h-full rounded-full bg-primary transition-all duration-300"
          style={{ width: `${((idx + 1) / subs.length) * 100}%` }}
        />
      </div>

      {/* Page title */}
      {sub.title?.trim() && (
        <div className="px-5 pt-6 pb-1 text-center">
          <span className="mb-2.5 inline-block rounded-full bg-gold-soft px-3.5 py-1 text-[10px] font-bold uppercase tracking-[1.8px] text-gold-deep">
            No. {String(idx + 1).padStart(2, '0')}
          </span>
          <h1 className="mt-1 font-display text-[28px] font-bold leading-snug text-ink">
            {sub.title}
          </h1>
        </div>
      )}

      {/* Main content */}
      <main className="flex flex-1 flex-col items-center justify-center px-4 py-8">
        <div className="w-full max-w-[620px] rounded-xl border border-dashed border-line bg-card px-5 py-12 text-center">
          <div className="mb-6 font-arabic text-[32px] leading-[1.9] text-primary" dir="rtl">
            {sub.arabic || '—'}
          </div>
          {sub.translation && (
            <p className="mb-3 text-[16px] font-bold leading-snug text-ink">{sub.translation}</p>
          )}
          {sub.reward && (
            <p className="m-0 text-[13px] leading-[1.6] text-ink-mute">{sub.reward}</p>
          )}
        </div>
      </main>

      {/* Prev / Next */}
      <nav className="flex items-center justify-between border-t border-line bg-card px-5 py-4">
        <button onClick={() => hasPrev && goTo(idx - 1)} disabled={!hasPrev} aria-label="Previous"
          className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-xl border border-line bg-card text-ink-soft transition-colors disabled:opacity-30 active:bg-line-soft">
          <ChevronLeft className="h-5 w-5" strokeWidth={2.5} />
        </button>
        <div className="text-[12px] font-semibold text-ink-mute">{idx + 1} of {subs.length}</div>
        <button onClick={() => hasNext && goTo(idx + 1)} disabled={!hasNext} aria-label="Next"
          className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-xl border border-line bg-card text-ink-soft transition-colors disabled:opacity-30 active:bg-line-soft">
          <ChevronRight className="h-5 w-5" strokeWidth={2.5} />
        </button>
      </nav>

      <SubcardModal
        open={editOpen} subcard={sub}
        onClose={() => setEditOpen(false)}
        onSave={async (data) => { await store.updateSubcard(card.id, sub.id, data); }}
      />

      <ConfirmDialog
        open={confirmDelete} title="Delete dua?" message="This dua will be permanently removed."
        onConfirm={async () => { await store.deleteSubcard(card.id, sub.id); setConfirmDelete(false); navigate(`/card/${cardId}`); }}
        onCancel={() => setConfirmDelete(false)}
      />
    </div>
  );
}
