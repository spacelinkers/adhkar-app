import { useState } from 'react';
import { useNavigate, useParams, Navigate } from 'react-router-dom';
import {
  DndContext, closestCenter, PointerSensor, TouchSensor,
  useSensor, useSensors, DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext, verticalListSortingStrategy,
  useSortable, arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { BrandBar } from '../components/BrandBar';
import { SubcardModal } from '../components/SubcardModal';
import { CardModal } from '../components/CardModal';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { NotificationModal } from '../components/NotificationModal';
import { Edit, Trash, Plus } from '../components/Icons';
import type { Subcard } from '../types';
import type { UseCardsResult } from '../hooks/useCards';
import type { UseNotifSchedulesResult } from '../hooks/useNotifSchedules';

function DotsIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
      <circle cx="5"  cy="12" r="1.5" />
      <circle cx="12" cy="12" r="1.5" />
      <circle cx="19" cy="12" r="1.5" />
    </svg>
  );
}

interface Props {
  store:       UseCardsResult;
  userId:      string | null;
  notifStore:  UseNotifSchedulesResult;
}

export function DetailPage({ store, userId, notifStore }: Props) {
  const { cardId } = useParams<{ cardId: string }>();
  const navigate = useNavigate();
  const card = store.cards.find((c) => c.id === cardId);
  const [subModalOpen,  setSubModalOpen]  = useState(false);
  const [editingSub,    setEditingSub]    = useState<Subcard | null>(null);
  const [editCardOpen,  setEditCardOpen]  = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [menuOpen,      setMenuOpen]      = useState(false);

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
          <div className="flex items-center gap-1">
            <NotificationModal
              type="card"
              targetId={card.id}
              cardId={card.id}
              title={card.title}
              userId={userId}
              notifStore={notifStore}
            />
            <div className="relative">
            <button
              onClick={() => setMenuOpen((o) => !o)}
              aria-label="Settings"
              className="grid h-9 w-9 cursor-pointer place-items-center rounded-xl border border-line bg-card text-ink-soft active:bg-line-soft"
            >
              <DotsIcon />
            </button>

            {menuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                <div className="absolute right-0 top-[calc(100%+6px)] z-20 w-44 overflow-hidden rounded-2xl border border-line bg-card shadow-soft-lg animate-pop">
                  <button
                    onClick={() => { setMenuOpen(false); setEditCardOpen(true); }}
                    className="flex w-full cursor-pointer items-center gap-2.5 px-4 py-3 text-[13.5px] font-medium text-ink transition-colors hover:bg-line-soft"
                  >
                    <Edit className="h-4 w-4 text-ink-mute" />
                    Edit collection
                  </button>
                  <div className="mx-4 border-t border-line-soft" />
                  <button
                    onClick={() => { setMenuOpen(false); setConfirmDelete(true); }}
                    className="flex w-full cursor-pointer items-center gap-2.5 px-4 py-3 text-[13.5px] font-medium text-rose transition-colors hover:bg-line-soft"
                  >
                    <Trash className="h-4 w-4" />
                    Delete collection
                  </button>
                </div>
              </>
            )}
            </div>
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
          <SortableList
            subs={subs}
            cardId={cardId!}
            onReorder={(newOrder) => store.reorderSubcards(card.id, newOrder)}
          />
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

// ── Sortable list ─────────────────────────────────────────────────────────────
function SortableList({ subs, cardId, onReorder }: {
  subs: Subcard[];
  cardId: string;
  onReorder: (newOrder: Subcard[]) => void;
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor,   { activationConstraint: { delay: 200, tolerance: 6 } }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIdx = subs.findIndex((s) => s.id === active.id);
    const newIdx = subs.findIndex((s) => s.id === over.id);
    onReorder(arrayMove(subs, oldIdx, newIdx));
  };

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={subs.map((s) => s.id)} strategy={verticalListSortingStrategy}>
        <div className="flex flex-col gap-2 pt-1">
          {subs.map((sub, i) => (
            <SortableDuaRow key={sub.id} sub={sub} num={i + 1} cardId={cardId} />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}

function SortableDuaRow({ sub, num, cardId }: { sub: Subcard; num: number; cardId: string }) {
  const navigate = useNavigate();
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: sub.id });
  const style = { transform: CSS.Transform.toString(transform), transition };
  const hasTitle  = !!sub.title?.trim();
  const hasArabic = !!sub.arabic?.trim();

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-2 rounded-xl border border-line-soft bg-card shadow-soft-sm transition-shadow ${
        isDragging ? 'shadow-soft-lg opacity-80' : ''
      }`}
    >
      {/* Drag handle */}
      <div
        {...attributes}
        {...listeners}
        className="flex h-full cursor-grab items-center px-2 py-4 text-ink-mute/40 active:cursor-grabbing"
      >
        <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
          <circle cx="7" cy="6"  r="1.5" /><circle cx="13" cy="6"  r="1.5" />
          <circle cx="7" cy="10" r="1.5" /><circle cx="13" cy="10" r="1.5" />
          <circle cx="7" cy="14" r="1.5" /><circle cx="13" cy="14" r="1.5" />
        </svg>
      </div>

      {/* Row content — tappable */}
      <button
        onClick={() => navigate(`/card/${cardId}/dua/${sub.id}`)}
        className="flex min-w-0 flex-1 items-start gap-3 py-4 pr-4 text-left"
      >
        <div className="mt-0.5 grid h-7 w-7 flex-shrink-0 place-items-center rounded-lg bg-primary-soft text-[11px] font-bold tabular-nums text-primary">
          {String(num).padStart(2, '0')}
        </div>
        <div className="min-w-0 flex-1">
          <div className={`text-[14.5px] font-semibold leading-snug ${hasTitle ? 'text-ink' : 'italic text-ink-mute'}`}>
            {hasTitle ? sub.title : 'Untitled'}
          </div>
          {hasArabic && (
            <div className="mt-1.5 truncate text-right font-arabic text-[17px] text-ink-mute" dir="rtl">
              {sub.arabic.slice(0, 60)}{sub.arabic.length > 60 ? '…' : ''}
            </div>
          )}
        </div>
      </button>
    </div>
  );
}
