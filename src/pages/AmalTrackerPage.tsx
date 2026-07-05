import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  DndContext, closestCenter, PointerSensor, TouchSensor,
  useSensor, useSensors, type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext, verticalListSortingStrategy,
  useSortable, arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ArrowLeft, Plus, Edit, Trash, X, ChevronRight } from '../components/Icons';
import { useDuas } from '../hooks/useDuas';
import type { AmalCard, AmalLog } from '../types';
import type { UseCardsResult } from '../hooks/useCards';
import type { UseAmalCardsResult } from '../hooks/useAmalCards';

interface Props {
  store:     UseCardsResult;
  amalStore: UseAmalCardsResult;
}

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
function todayISO() { return new Date().toISOString().slice(0, 10); }

// ── Main Page ─────────────────────────────────────────────────────────────────
export function AmalTrackerPage({ store, amalStore }: Props) {
  const navigate  = useNavigate();
  const duaStore  = useDuas(true);
  const [modalCard, setModalCard] = useState<AmalCard | 'new' | null>(null);
  const [detailCard, setDetailCard] = useState<AmalCard | null>(null);
  const [menuId,   setMenuId]   = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const today = todayISO();

  const activeToday = amalStore.cards.filter((c) => {
    const dow  = new Date().getDay();
    const days = Array.isArray(c.days) ? c.days : [];
    return days.length === 0 || days.includes(dow);
  });
  const doneToday = activeToday.filter((c) => amalStore.getLog(c.id, today)?.status === 'done').length;

  return (
    <div className="flex min-h-[100dvh] flex-col bg-bg">
      {/* Header — matches DuaLibraryPage */}
      <header className="mx-auto flex w-full max-w-[720px] items-center justify-between px-4 pb-3 pt-5">
        <button
          onClick={() => navigate('/')}
          aria-label="Back"
          className="grid h-10 w-10 cursor-pointer place-items-center rounded-xl border border-line bg-card text-ink-soft active:bg-line-soft"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="text-center">
          <div className="text-[17px] font-bold text-ink">Amal Tracker</div>
          <div className="text-[11px] text-ink-mute">
            {doneToday} / {activeToday.length} done today
          </div>
        </div>
        <button
          onClick={() => setModalCard('new')}
          className="flex cursor-pointer items-center gap-1.5 rounded-xl bg-primary px-3.5 py-2.5 text-[13px] font-semibold text-card active:scale-95"
        >
          <Plus className="h-3.5 w-3.5" />
          Add
        </button>
      </header>

      {/* List */}
      <main className="mx-auto w-full max-w-[720px] flex-1 px-4 pb-24">
        {amalStore.cards.length === 0 ? (
          <div className="mt-8 rounded-xl border border-dashed border-line bg-card px-5 py-14 text-center">
            <div className="mb-3 font-arabic text-[36px] text-primary/30" dir="rtl">نِيَّة</div>
            <h2 className="mb-1 text-[16px] font-bold text-ink">No amals yet</h2>
            <p className="m-0 text-[13px] text-ink-mute">Tap "Add" above to add your first amal.</p>
          </div>
        ) : (
          <SortableAmalList
            cards={amalStore.cards}
            today={today}
            menuId={menuId}
            amalStore={amalStore}
            onDetail={setDetailCard}
            onMenuToggle={(id) => setMenuId((prev) => prev === id ? null : id)}
            onMenuClose={() => setMenuId(null)}
            onEdit={(card) => { setMenuId(null); setModalCard(card); }}
            onDelete={(card) => { setMenuId(null); setDeleteId(card.id); }}
          />
        )}
      </main>

      {/* Add / Edit modal */}
      {modalCard !== null && (
        <AmalCardModal
          card={modalCard === 'new' ? null : modalCard}
          store={store}
          duas={duaStore.duas}
          onClose={() => setModalCard(null)}
          onSave={(data) => {
            if (modalCard === 'new') amalStore.addCard(data);
            else amalStore.updateCard(modalCard.id, data);
            setModalCard(null);
          }}
        />
      )}

      {/* Detail sheet */}
      {detailCard && (
        <DetailSheet
          card={detailCard}
          log={amalStore.log.filter((l) => l.amalId === detailCard.id)}
          onClose={() => setDetailCard(null)}
        />
      )}

      {/* Delete confirm */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-6" onClick={() => setDeleteId(null)}>
          <div className="w-full max-w-xs rounded-2xl bg-card p-5 shadow-soft-lg" onClick={(e) => e.stopPropagation()}>
            <p className="mb-1 text-[15px] font-bold text-ink">Delete amal?</p>
            <p className="mb-5 text-[13px] text-ink-mute">This entry and all its history will be removed.</p>
            <div className="flex gap-2">
              <button onClick={() => setDeleteId(null)} className="flex-1 cursor-pointer rounded-xl border border-line py-2.5 text-[13px] font-semibold text-ink-mute">Cancel</button>
              <button onClick={() => { amalStore.deleteCard(deleteId); setDeleteId(null); }} className="flex-1 cursor-pointer rounded-xl bg-rose py-2.5 text-[13px] font-semibold text-card">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Sortable list wrapper ─────────────────────────────────────────────────────
function SortableAmalList({ cards, today, menuId, amalStore, onDetail, onMenuToggle, onMenuClose, onEdit, onDelete }: {
  cards:        AmalCard[];
  today:        string;
  menuId:       string | null;
  amalStore:    import('../hooks/useAmalCards').UseAmalCardsResult;
  onDetail:     (card: AmalCard) => void;
  onMenuToggle: (id: string) => void;
  onMenuClose:  () => void;
  onEdit:       (card: AmalCard) => void;
  onDelete:     (card: AmalCard) => void;
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor,   { activationConstraint: { delay: 200, tolerance: 6 } }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIdx = cards.findIndex((c) => c.id === active.id);
    const newIdx = cards.findIndex((c) => c.id === over.id);
    amalStore.reorderCards(arrayMove(cards, oldIdx, newIdx));
  };

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={cards.map((c) => c.id)} strategy={verticalListSortingStrategy}>
        <div className="flex flex-col gap-1.5 pt-1">
          {cards.map((card) => (
            <AmalCardRow
              key={card.id}
              card={card}
              logEntry={amalStore.getLog(card.id, today)}
              menuOpen={menuId === card.id}
              onToggleDone={() => amalStore.toggleLog(card.id, today)}
              onDetail={() => onDetail(card)}
              onMenuToggle={() => onMenuToggle(card.id)}
              onMenuClose={onMenuClose}
              onEdit={() => onEdit(card)}
              onDelete={() => onDelete(card)}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}

// ── Card row (sortable) ───────────────────────────────────────────────────────
function AmalCardRow({ card, logEntry, menuOpen, onToggleDone, onDetail, onMenuToggle, onMenuClose, onEdit, onDelete }: {
  card:         AmalCard;
  logEntry:     AmalLog | undefined;
  menuOpen:     boolean;
  onToggleDone: () => void;
  onDetail:     () => void;
  onMenuToggle: () => void;
  onMenuClose:  () => void;
  onEdit:       () => void;
  onDelete:     () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: card.id });
  const style  = { transform: CSS.Transform.toString(transform), transition };
  const status = logEntry?.status ?? 'pending';
  const isDone   = status === 'done';
  const isUndone = status === 'undone';

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-2 rounded-xl border border-line-soft bg-card transition-shadow ${
        isDragging ? 'shadow-soft-lg opacity-80' : 'shadow-soft-sm'
      }`}
    >
      {/* Drag handle */}
      <div
        {...attributes}
        {...listeners}
        style={{ touchAction: 'none' }}
        className="flex h-full cursor-grab items-center px-2 py-4 text-ink-mute/40 active:cursor-grabbing"
      >
        <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
          <circle cx="7" cy="6"  r="1.5" /><circle cx="13" cy="6"  r="1.5" />
          <circle cx="7" cy="10" r="1.5" /><circle cx="13" cy="10" r="1.5" />
          <circle cx="7" cy="14" r="1.5" /><circle cx="13" cy="14" r="1.5" />
        </svg>
      </div>

      <div className="flex min-w-0 flex-1 items-center gap-3 py-3 pr-4">
      {/* Done toggle */}
      <button
        onClick={onToggleDone}
        aria-label={isDone ? 'Mark undone' : 'Mark done'}
        className="flex-shrink-0"
      >
        <span className={`flex h-7 w-7 items-center justify-center rounded-full text-[13px] font-bold transition-colors ${
          isDone   ? 'bg-primary text-card' :
          isUndone ? 'bg-rose/10 text-rose border border-rose/30' :
                     'border-2 border-line text-transparent'
        }`}>
          {isDone ? '✓' : isUndone ? '✕' : ''}
        </span>
      </button>

      {/* Content — tappable for detail */}
      <button onClick={onDetail} className="flex min-w-0 flex-1 cursor-pointer flex-col text-left">
        <span className={`text-[14px] font-semibold ${isDone ? 'text-ink-mute line-through' : 'text-ink'}`}>
          {card.title}
        </span>
        {card.amal && (
          <span className="mt-0.5 truncate text-[12.5px] text-ink-mute">{card.amal}</span>
        )}
        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5">
          {card.time && (
            <span className="text-[11px] text-ink-mute">⏰ {card.time}</span>
          )}
          {(card.days ?? []).length > 0 && (
            <span className="text-[11px] text-ink-mute">
              {(card.days ?? []).map((d) => DAY_LABELS[d]).join(', ')}
            </span>
          )}
          {card.duaRefs.length > 0 && (
            <span className="text-[11px] text-primary">{card.duaRefs.length} dua{card.duaRefs.length > 1 ? 's' : ''}</span>
          )}
        </div>
      </button>

      {/* Detail chevron + menu */}
      <div className="flex flex-shrink-0 items-center gap-0.5">
        <button onClick={onDetail} className="grid h-8 w-6 cursor-pointer place-items-center text-ink-mute">
          <ChevronRight className="h-4 w-4" />
        </button>
        <div className="relative">
          <button onClick={onMenuToggle} className="grid h-8 w-8 cursor-pointer place-items-center rounded-xl text-ink-mute hover:bg-line-soft">
            <span className="text-base leading-none tracking-[2px]">···</span>
          </button>
          {menuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={onMenuClose} />
              <div className="absolute right-0 top-9 z-20 w-32 overflow-hidden rounded-xl border border-line bg-card shadow-soft-lg">
                <button onClick={onEdit} className="flex w-full cursor-pointer items-center gap-2 px-3 py-2.5 text-[13px] font-medium text-ink hover:bg-line-soft">
                  <Edit className="h-3.5 w-3.5 text-ink-mute" /> Edit
                </button>
                <button onClick={onDelete} className="flex w-full cursor-pointer items-center gap-2 px-3 py-2.5 text-[13px] font-medium text-rose hover:bg-line-soft">
                  <Trash className="h-3.5 w-3.5" /> Delete
                </button>
              </div>
            </>
          )}
        </div>
      </div>
      </div>
    </div>
  );
}

// ── Detail sheet (history view) ───────────────────────────────────────────────
function DetailSheet({ card, log, onClose }: {
  card:    AmalCard;
  log:     AmalLog[];
  onClose: () => void;
}) {
  const sorted = [...log].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center" onClick={onClose}>
      <div className="w-full max-w-sm rounded-t-3xl bg-card shadow-soft-lg sm:rounded-2xl" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between border-b border-line-soft px-5 py-4">
          <div>
            <p className="text-[15px] font-bold text-ink">{card.title}</p>
            {card.amal && <p className="text-[11.5px] text-ink-mute">{card.amal}</p>}
          </div>
          <button onClick={onClose} className="grid h-8 w-8 cursor-pointer place-items-center rounded-xl text-ink-mute hover:bg-line-soft">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Description + duas */}
        {(card.description || card.duaRefs.length > 0) && (
          <div className="border-b border-line-soft px-5 py-3">
            {card.description && (
              <p className="mb-3 text-[13px] leading-[1.55] text-ink-mute">{card.description}</p>
            )}
            {card.duaRefs.map((ref) => (
              <div key={ref.subId} className="mb-3 rounded-xl border border-line-soft bg-bg px-4 py-3 last:mb-0">
                <p className="mb-1.5 text-[11.5px] font-semibold text-primary">{ref.title || 'Dua'}</p>
                {ref.arabic && (
                  <p className="mb-2 text-right font-arabic text-[20px] leading-[1.9] text-ink" dir="rtl">
                    {ref.arabic}
                  </p>
                )}
                {ref.translation && (
                  <p className="text-[12.5px] leading-[1.55] text-ink-mute">{ref.translation}</p>
                )}
              </div>
            ))}
          </div>
        )}

        {/* History */}
        <div className="max-h-[45vh] overflow-y-auto">
          <p className="px-5 pt-3 pb-1 text-[10.5px] font-bold uppercase tracking-wider text-ink-mute">History</p>
          {sorted.length === 0 ? (
            <p className="px-5 py-4 text-[13px] text-ink-mute">No history yet.</p>
          ) : (
            <div className="divide-y divide-line-soft px-5">
              {sorted.map((entry) => (
                <div key={entry.date} className="flex items-center justify-between py-2.5">
                  <span className="text-[13px] text-ink">{entry.date}</span>
                  <span className={`text-[12px] font-semibold ${entry.status === 'done' ? 'text-primary' : 'text-rose'}`}>
                    {entry.status === 'done' ? '✓ Done' : '✕ Missed'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="h-6" />
      </div>
    </div>
  );
}

// ── Add / Edit modal ──────────────────────────────────────────────────────────
type DuaRef = AmalCard['duaRefs'][number];

function AmalCardModal({ card, store: _store, duas, onClose, onSave }: {
  card:    AmalCard | null;
  store:   UseCardsResult;
  duas:    import('../types').Dua[];
  onClose: () => void;
  onSave:  (data: Omit<AmalCard, 'id' | 'createdAt'>) => void;
}) {
  const [view,        setView]        = useState<'form' | 'picker'>('form');
  const [query,       setQuery]       = useState('');
  const [title,       setTitle]       = useState(card?.title       ?? '');
  const [amal,        setAmal]        = useState(card?.amal        ?? '');
  const [description, setDescription] = useState(card?.description ?? '');
  const [time,        setTime]        = useState(card?.time        ?? '08:00');
  const [days,        setDays]        = useState<number[]>(card?.days ?? []);
  const [duaRefs,     setDuaRefs]     = useState<DuaRef[]>(card?.duaRefs ?? []);

  const toggleDay = (d: number) =>
    setDays((prev) => prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d].sort());

  const toggleDua = (ref: DuaRef) =>
    setDuaRefs((prev) =>
      prev.some((r) => r.subId === ref.subId)
        ? prev.filter((r) => r.subId !== ref.subId)
        : [...prev, ref],
    );

  const isSelected = (subId: string) => duaRefs.some((r) => r.subId === subId);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center" onClick={view === 'form' ? onClose : undefined}>
      <div className="w-full max-w-sm rounded-t-3xl bg-card shadow-soft-lg sm:rounded-2xl" onClick={(e) => e.stopPropagation()}>

        {view === 'form' ? (
          <>
            <div className="flex items-center justify-between border-b border-line-soft px-5 py-4">
              <p className="text-[15px] font-bold text-ink">{card ? 'Edit Amal' : 'New Amal'}</p>
              <button onClick={onClose} className="grid h-8 w-8 cursor-pointer place-items-center rounded-xl text-ink-mute hover:bg-line-soft">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="max-h-[72vh] overflow-y-auto px-5 py-4">
              <div className="flex flex-col gap-3.5">

                {/* Title */}
                <div>
                  <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-ink-mute">Title *</label>
                  <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Morning Adhkar"
                    className="w-full rounded-xl border border-line bg-bg px-3.5 py-2.5 text-[14px] text-ink placeholder:text-ink-mute/50 focus:border-primary focus:outline-none" />
                </div>

                {/* Amal */}
                <div>
                  <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-ink-mute">Amal</label>
                  <input value={amal} onChange={(e) => setAmal(e.target.value)} placeholder="e.g. Recite 33× SubhanAllah"
                    className="w-full rounded-xl border border-line bg-bg px-3.5 py-2.5 text-[14px] text-ink placeholder:text-ink-mute/50 focus:border-primary focus:outline-none" />
                </div>

                {/* Description */}
                <div>
                  <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-ink-mute">Description</label>
                  <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Notes or benefits…" rows={2}
                    className="w-full resize-none rounded-xl border border-line bg-bg px-3.5 py-2.5 text-[14px] text-ink placeholder:text-ink-mute/50 focus:border-primary focus:outline-none" />
                </div>

                {/* Time */}
                <div>
                  <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-ink-mute">Time</label>
                  <input type="time" value={time} onChange={(e) => setTime(e.target.value)}
                    className="w-full rounded-xl border border-line bg-bg px-3.5 py-3 text-[16px] font-bold text-ink focus:border-primary focus:outline-none" />
                </div>

                {/* Days */}
                <div>
                  <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-ink-mute">
                    Repeat — {days.length === 0 ? 'Every day' : days.map((d) => DAY_LABELS[d]).join(', ')}
                  </p>
                  <div className="flex gap-1.5">
                    {DAY_LABELS.map((label, i) => (
                      <button key={i} type="button" onClick={() => toggleDay(i)}
                        className={`flex-1 cursor-pointer rounded-xl py-2 text-[11px] font-bold transition-colors ${
                          days.includes(i) ? 'bg-primary text-card' : 'bg-line-soft text-ink-mute hover:bg-line'
                        }`}>
                        {label[0]}
                      </button>
                    ))}
                  </div>
                  <p className="mt-1 text-[11px] text-ink-mute">Leave all unselected for every day.</p>
                </div>

                {/* Linked duas */}
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-ink-mute">Linked Duas ({duaRefs.length})</label>
                    <button type="button" onClick={() => setView('picker')} className="text-[12px] font-semibold text-primary">
                      + Add from Library
                    </button>
                  </div>
                  {duaRefs.length > 0 ? (
                    <div className="flex flex-col gap-1.5">
                      {duaRefs.map((ref) => (
                        <div key={ref.subId} className="flex items-center justify-between rounded-xl bg-primary-soft px-3 py-2">
                          <span className="text-[12.5px] font-medium text-primary">{ref.title || 'Dua'}</span>
                          <button type="button" onClick={() => setDuaRefs((p) => p.filter((r) => r.subId !== ref.subId))} className="cursor-pointer text-primary/60 hover:text-rose">
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[12px] text-ink-mute">No duas linked yet.</p>
                  )}
                </div>
              </div>
            </div>

            <div className="border-t border-line-soft px-5 py-4">
              <button
                onClick={() => { if (title.trim()) onSave({ title: title.trim(), amal: amal.trim(), description: description.trim(), time, days, duaRefs }); }}
                disabled={!title.trim()}
                className="w-full cursor-pointer rounded-xl bg-primary py-3 text-[14px] font-semibold text-card disabled:opacity-50"
              >
                {card ? 'Update' : 'Save'}
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="border-b border-line-soft px-5 py-4">
              <div className="mb-3 flex items-center gap-3">
                <button onClick={() => setView('form')} className="grid h-8 w-8 cursor-pointer place-items-center rounded-xl text-ink-mute hover:bg-line-soft">
                  <ArrowLeft className="h-4 w-4" />
                </button>
                <p className="flex-1 text-[15px] font-bold text-ink">Add Duas</p>
                <span className="text-[12px] font-semibold text-primary">{duaRefs.length} selected</span>
              </div>
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search duas…"
                className="w-full rounded-xl border border-line bg-bg px-3.5 py-2.5 text-[13px] text-ink placeholder:text-ink-mute/50 focus:border-primary focus:outline-none"
              />
            </div>

            <div className="max-h-[55vh] overflow-y-auto pb-6">
              {(() => {
                const filtered = query.trim()
                  ? duas.filter((d) => d.title.toLowerCase().includes(query.toLowerCase()))
                  : duas;
                if (duas.length === 0) return <p className="py-10 text-center text-[13px] text-ink-mute">No duas in the library yet.</p>;
                if (filtered.length === 0) return <p className="py-10 text-center text-[13px] text-ink-mute">No results for "{query}"</p>;
                return filtered.map((dua) => {
                  const selected = isSelected(dua.id);
                  return (
                    <button key={dua.id} type="button"
                      onClick={() => toggleDua({ cardId: 'library', subId: dua.id, title: dua.title, arabic: dua.arabic, translation: dua.translation })}
                      className={`flex w-full cursor-pointer items-center gap-3 px-5 py-3 text-left transition-colors ${selected ? 'bg-primary-soft' : 'hover:bg-line-soft'}`}
                    >
                      <span className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${selected ? 'bg-primary text-card' : 'border border-line'}`}>
                        {selected ? '✓' : ''}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className={`truncate text-[13px] font-medium ${selected ? 'text-primary' : 'text-ink'}`}>{dua.title}</p>
                        {dua.arabic && (
                          <p className="mt-0.5 truncate text-right font-arabic text-[14px] text-ink-mute" dir="rtl">
                            {dua.arabic.slice(0, 50)}{dua.arabic.length > 50 ? '…' : ''}
                          </p>
                        )}
                      </div>
                    </button>
                  );
                });
              })()}
            </div>

            <div className="border-t border-line-soft px-5 py-4">
              <button onClick={() => setView('form')} className="w-full cursor-pointer rounded-xl bg-primary py-3 text-[14px] font-semibold text-card">
                Done{duaRefs.length > 0 ? ` (${duaRefs.length})` : ''}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
