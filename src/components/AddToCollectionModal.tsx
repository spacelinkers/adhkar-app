import { useEffect, useRef, useState } from 'react';
import { Modal } from './Modal';
import { Book } from './Icons';
import type { Card, Dua } from '../types';

interface Props {
  open:        boolean;
  dua:         Dua | null;
  collections: Card[];
  onClose:     () => void;
  onAdd:       (cardId: string, dua: Dua) => Promise<void>;
  onRemove:    (cardId: string, subId: string) => Promise<void>;
}

// Find the subcard that came from this dua — prefer duaId match, fall back to title+arabic.
function findSubcard(card: Card, dua: Dua) {
  return (
    (card.subcards ?? []).find((s) => s.duaId === dua.id) ??
    (card.subcards ?? []).find((s) => s.arabic === dua.arabic && s.title === dua.title)
  );
}

export function AddToCollectionModal({ open, dua, collections, onClose, onAdd, onRemove }: Props) {
  const [busy, setBusy] = useState<string | null>(null);

  // localIn tracks the add/remove state per card for the current modal session.
  // Keyed by cardId. Only re-initialised when the dua being shown changes,
  // so toggling one card never affects another card's display.
  const [localIn, setLocalIn] = useState<Record<string, boolean>>({});
  const initDuaId = useRef<string | null>(null);

  useEffect(() => {
    if (!open || !dua) return;
    if (dua.id === initDuaId.current) return; // same dua — keep existing local state
    initDuaId.current = dua.id;
    const init: Record<string, boolean> = {};
    collections.forEach((c) => { init[c.id] = !!findSubcard(c, dua); });
    setLocalIn(init);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, dua]); // intentionally omit 'collections': we only init once per dua

  const handleToggle = async (cardId: string) => {
    if (!dua || busy) return;
    const wasIn = localIn[cardId] ?? false;

    // Optimistic flip for just this card.
    setLocalIn((prev) => ({ ...prev, [cardId]: !wasIn }));
    setBusy(cardId);

    try {
      if (wasIn) {
        // Find the subcard in the current collections snapshot.
        const card = collections.find((c) => c.id === cardId);
        const sub  = card ? findSubcard(card, dua) : undefined;
        if (sub) await onRemove(cardId, sub.id);
      } else {
        await onAdd(cardId, dua);
      }
    } catch {
      // Revert only this card on failure.
      setLocalIn((prev) => ({ ...prev, [cardId]: wasIn }));
    } finally {
      setBusy(null);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Add to Collection"
      subtitle={dua?.title ?? ''}
    >
      {collections.length === 0 ? (
        <div className="py-8 text-center">
          <div className="mb-2 font-arabic text-[28px] text-primary/30" dir="rtl">ٱبْدَأْ</div>
          <p className="text-[13px] text-ink-mute">
            You have no collections yet.<br />Create one on the home page first.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2 py-1">
          {collections.map((card) => {
            const inCol   = localIn[card.id] ?? false;
            const loading = busy === card.id;
            return (
              <button
                key={card.id}
                onClick={() => handleToggle(card.id)}
                disabled={!!busy}
                className={[
                  'flex w-full cursor-pointer items-center gap-3 rounded-xl border px-4 py-3.5 text-left transition-colors disabled:cursor-default',
                  inCol
                    ? 'border-primary/30 bg-primary-soft'
                    : 'border-line-soft bg-card hover:bg-primary-soft active:bg-primary-soft',
                ].join(' ')}
              >
                <div className="grid h-9 w-9 flex-shrink-0 place-items-center rounded-[10px] bg-primary-soft text-primary">
                  <Book className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[14px] font-semibold text-ink">{card.title}</div>
                  <div className="text-[11px] text-ink-mute">
                    {card.subcards?.length ?? 0} {(card.subcards?.length ?? 0) === 1 ? 'entry' : 'entries'}
                  </div>
                </div>
                <span className="flex-shrink-0 text-[12px] font-semibold">
                  {loading ? (
                    <span className="text-ink-mute">…</span>
                  ) : inCol ? (
                    <span className="text-rose">Remove</span>
                  ) : (
                    <span className="text-primary">Add</span>
                  )}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </Modal>
  );
}
