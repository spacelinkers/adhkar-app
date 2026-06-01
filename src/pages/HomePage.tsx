import { useEffect, useState } from 'react';
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
import { CollectionCard } from '../components/CollectionCard';
import { CardModal } from '../components/CardModal';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { Plus, Logo, X, Book, ChevronRight } from '../components/Icons';
import { InspirationCard } from '../components/InspirationCard';
import type { UseCardsResult } from '../hooks/useCards';
import type { UseNotifSchedulesResult } from '../hooks/useNotifSchedules';
import type { UseAmalCardsResult } from '../hooks/useAmalCards';

interface Props {
  store:       UseCardsResult;
  onSignOut:   () => Promise<void>;
  displayName: string | null;
  email:       string | null;
  photoURL:    string | null;
  userId:      string | null;
  notifStore:  UseNotifSchedulesResult;
  amalStore:   UseAmalCardsResult;
}

export function HomePage({ store, onSignOut, displayName, email, photoURL, notifStore, amalStore }: Props) {
  const navigate = useNavigate();
  const { cards, cloudEnabled, createCard, clearLocal } = store;
  const [modalOpen,    setModalOpen]    = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  const [avatarOpen,   setAvatarOpen]   = useState(false);
  const [doneToast,    setDoneToast]    = useState('');

  const openNew = () => setModalOpen(true);

  const handleSave = async (title: string, desc: string) => {
    await createCard(title, desc);
  };

  // Handle ?done=scheduleId&date=… from notification "Done" tap
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const scheduleId = params.get('done');
    const date       = params.get('date');
    if (!scheduleId || !date) return;
    window.history.replaceState({}, '', '/');
    notifStore.markDone(scheduleId).then(() => {
      const s = notifStore.schedules.find((x) => x.id === scheduleId);
      setDoneToast(`"${s?.title ?? 'Reminder'}" marked as done ✓`);
      setTimeout(() => setDoneToast(''), 4000);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const initials = displayName
    ? displayName.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()
    : email?.[0]?.toUpperCase() ?? '?';

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

        <div className="flex items-center gap-2">
          <button
            onClick={openNew}
            className="flex cursor-pointer items-center gap-1.5 rounded-xl border-0 bg-primary px-4 py-2.5 text-[13px] font-semibold text-card shadow-soft-sm transition-transform active:scale-95"
          >
            <Plus className="h-3.5 w-3.5" />
            New
          </button>

          {/* Avatar button */}
          <div className="relative">
            <button
              onClick={() => setAvatarOpen((o) => !o)}
              aria-label="Account"
              className="h-10 w-10 cursor-pointer overflow-hidden rounded-full border-2 border-line bg-primary-soft transition-transform active:scale-95"
            >
              {photoURL ? (
                <img src={photoURL} alt={displayName ?? 'Profile'} className="h-full w-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                <span className="flex h-full w-full items-center justify-center text-[13px] font-bold text-primary">
                  {initials}
                </span>
              )}
            </button>

            {/* Popup */}
            {avatarOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setAvatarOpen(false)} />
                <div className="absolute right-0 top-[calc(100%+8px)] z-20 w-56 overflow-hidden rounded-2xl border border-line bg-card shadow-soft-lg animate-pop">

                  {/* Profile info */}
                  <div className="flex items-center gap-3 border-b border-line-soft px-4 py-3.5">
                    <div className="h-9 w-9 flex-shrink-0 overflow-hidden rounded-full border border-line">
                      {photoURL ? (
                        <img src={photoURL} alt="" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                      ) : (
                        <span className="flex h-full w-full items-center justify-center bg-primary-soft text-[12px] font-bold text-primary">
                          {initials}
                        </span>
                      )}
                    </div>
                    <div className="min-w-0">
                      {displayName && (
                        <div className="truncate text-[13px] font-semibold text-ink">{displayName}</div>
                      )}
                      <div className="truncate text-[11px] text-ink-mute">{email}</div>
                    </div>
                  </div>

                  {/* Sign out */}
                  <button
                    onClick={() => { setAvatarOpen(false); onSignOut(); }}
                    className="flex w-full cursor-pointer items-center gap-2.5 px-4 py-3.5 text-[13.5px] font-medium text-rose transition-colors hover:bg-line-soft"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
                    </svg>
                    Sign out
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[720px] pb-32">
        {/* Done toast */}
        {doneToast && (
          <div className="mx-4 mb-3 mt-1 rounded-xl bg-primary px-4 py-3 text-[13px] font-semibold text-card shadow-soft-md">
            {doneToast}
          </div>
        )}

        <InspirationCard />

        {/* Dua tracker cards */}
        <DuaTrackerCards onNavigate={navigate} amalStore={amalStore} />

        {/* Dua Library entry point */}
        <button
          onClick={() => navigate('/library')}
          className="mx-4 mb-4 w-[calc(100%-2rem)] cursor-pointer overflow-hidden rounded-xl bg-gradient-to-br from-teal-600 to-cyan-900 px-5 py-6 text-center shadow-soft-md transition-transform active:scale-[.98]"
        >
          <div className="mb-1.5 inline-block rounded-full bg-white/20 px-3 py-0.5 text-[9px] font-bold uppercase tracking-[2px] text-white">
            Dua Library
          </div>
          <div className="my-2 font-arabic text-[24px] leading-[1.95] text-white" dir="rtl">
            ٱدْعُونِي أَسْتَجِبْ لَكُمْ
          </div>
          <p className="mb-0.5 text-[13px] font-semibold text-white">Call upon Me, I will respond</p>
          <p className="m-0 text-[11.5px] text-white/65">Browse duas &amp; add to your collections</p>
        </button>

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
            <SortableCollectionList
              cards={cards}
              onReorder={(newOrder) => store.reorderCards(newOrder)}
            />
          )}

          {/* Footer */}
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
        className="fixed bottom-6 right-5 z-40 grid h-14 w-14 cursor-pointer place-items-center rounded-2xl border-0 bg-primary text-card transition-transform active:scale-90"
        style={{ boxShadow: '0 8px 24px rgba(15,61,46,.35), 0 2px 6px rgba(15,61,46,.2)' }}
      >
        <Plus className="h-[22px] w-[22px]" />
      </button>

      <CardModal
        open={modalOpen}
        card={null}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
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

// ── Sortable collection list ──────────────────────────────────────────────────
import type { Card } from '../types';

function SortableCollectionList({ cards, onReorder }: {
  cards:     Card[];
  onReorder: (newOrder: Card[]) => void;
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { delay: 400, tolerance: 8 } }),
    useSensor(TouchSensor,   { activationConstraint: { delay: 400, tolerance: 8 } }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIdx = cards.findIndex((c) => c.id === active.id);
    const newIdx = cards.findIndex((c) => c.id === over.id);
    onReorder(arrayMove(cards, oldIdx, newIdx));
  };

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={cards.map((c) => c.id)} strategy={verticalListSortingStrategy}>
        <div className="flex flex-col gap-2 pt-1">
          {cards.map((c) => (
            <SortableCollectionCard key={c.id} card={c} />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}

function SortableCollectionCard({ card }: { card: Card }) {
  const navigate = useNavigate();
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: card.id });
  const style   = { transform: CSS.Transform.toString(transform), transition };
  const count   = card.subcards?.length || 0;
  const preview = card.desc ? card.desc.slice(0, 40) + (card.desc.length > 40 ? '…' : '') : '';

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`flex animate-card-in cursor-pointer items-start gap-3 rounded-lg border border-line-soft bg-card p-4 shadow-soft-sm transition-all select-none
        ${isDragging ? 'shadow-soft-lg scale-[1.02] opacity-90' : 'active:scale-[.99]'}
      `}
      onClick={() => !isDragging && navigate(`/card/${card.id}`)}
    >
      <div className="grid h-10 w-10 flex-shrink-0 place-items-center rounded-[10px] bg-primary-soft text-primary">
        <Book className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <h3 className="m-0 mb-0.5 text-[15px] font-bold leading-snug text-ink">{card.title}</h3>
        <div className="text-xs font-medium text-ink-mute">
          {count} {count === 1 ? 'entry' : 'entries'}
          {preview && ` · ${preview}`}
        </div>
      </div>
      <span className="self-center text-ink-mute">
        <ChevronRight className="h-4 w-4" strokeWidth={2.5} />
      </span>
    </div>
  );
}

// ── Dua Tracker Cards ────────────────────────────────────────────────────────
import type { NavigateFunction } from 'react-router-dom';

function RingProgress({ pct, size = 72, trackColor = '#dfe7dd', fillColor = '#1d5d44', textColor = '#0f1f1a' }: {
  pct: number; size?: number; trackColor?: string; fillColor?: string; textColor?: string;
}) {
  const r    = (size - 8) / 2;
  const circ = 2 * Math.PI * r;
  const off  = circ * (1 - Math.min(pct, 100) / 100);
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={5} stroke={trackColor} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={5} stroke={fillColor}
          strokeDasharray={circ} strokeDashoffset={off} strokeLinecap="round"
          style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%' }}
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-[13px] font-bold" style={{ color: textColor }}>
        {pct}%
      </span>
    </div>
  );
}

function DuaTrackerCards({ onNavigate, amalStore }: { onNavigate: NavigateFunction; amalStore: UseAmalCardsResult }) {
  const [detail, setDetail] = useState<null | 'monthly'>(null);
  const close = () => setDetail(null);

  const today     = new Date().toISOString().slice(0, 10);
  const monthPfx  = today.slice(0, 7); // "YYYY-MM"
  const dow       = new Date().getDay();

  // Today
  const amalsToday  = amalStore.cards.filter((c) => {
    const days = Array.isArray(c.days) ? c.days : [];
    return days.length === 0 || days.includes(dow);
  });
  const todayDone   = amalsToday.filter((c) => amalStore.getLog(c.id, today)?.status === 'done').length;
  const todayMissed = amalsToday.filter((c) => amalStore.getLog(c.id, today)?.status === 'undone').length;

  // This month
  const monthLog    = amalStore.log.filter((l) => l.date.startsWith(monthPfx));
  const monthDone   = monthLog.filter((l) => l.status === 'done').length;
  const monthMissed = monthLog.filter((l) => l.status === 'undone').length;
  const monthTotal  = monthDone + monthMissed;
  const monthPct    = monthTotal ? Math.round((monthDone / monthTotal) * 100) : 0;

  return (
    <>
      <div className="mx-4 mb-4 grid grid-cols-2 gap-3">
        {/* Amal Tracker card → navigates to /amal */}
        <button
          onClick={() => onNavigate('/amal')}
          className="relative cursor-pointer overflow-hidden rounded-xl shadow-soft-md transition-transform active:scale-[.98]"
          style={{ background: 'linear-gradient(145deg, #1d5d44 0%, #0d3326 100%)' }}
        >
          {/* Decorative circles */}
          <div className="absolute -right-5 -top-5 h-24 w-24 rounded-full bg-white/[0.06]" />
          <div className="absolute -bottom-6 -left-3 h-16 w-16 rounded-full bg-white/[0.05]" />
          <div className="absolute right-4 bottom-3 h-8 w-8 rounded-full bg-white/[0.07]" />

          <div className="relative px-4 pb-4 pt-4 text-center">
            {/* Badge */}
            <span className="inline-block rounded-full bg-white/[0.15] px-2.5 py-[3px] text-[8.5px] font-bold uppercase tracking-[1.8px] text-white/80">
              Amal Tracker
            </span>

            {/* Ring — today's completion */}
            <div className="mt-2 flex justify-center">
              <RingProgress
                pct={amalsToday.length ? Math.round((todayDone / amalsToday.length) * 100) : 0}
                size={68}
                trackColor="rgba(255,255,255,0.15)"
                fillColor="rgba(255,255,255,0.9)"
                textColor="rgba(255,255,255,0.95)"
              />
            </div>

            {/* Done / missed sub-card */}
            <div className="mt-2.5 rounded-xl bg-white/[0.1] px-2.5 py-1.5">
              <p className="text-[8.5px] font-bold uppercase tracking-wider text-white/50">Today</p>
              <p className="mt-0.5 text-[10.5px] font-medium text-white">
                <span className="text-emerald-300">{todayDone} done</span>
                <span className="mx-1 text-white/30">·</span>
                <span className="text-rose-300">{todayMissed} missed</span>
              </p>
            </div>
          </div>
        </button>

        {/* This Month card */}
        <button
          onClick={() => setDetail('monthly')}
          className="relative cursor-pointer overflow-hidden rounded-xl shadow-soft-md transition-transform active:scale-[.98]"
          style={{ background: 'linear-gradient(145deg, #4f46e5 0%, #1e1b4b 100%)' }}
        >
          {/* Decorative circles */}
          <div className="absolute -left-4 -top-4 h-20 w-20 rounded-full bg-white/[0.06]" />
          <div className="absolute -bottom-5 -right-3 h-16 w-16 rounded-full bg-white/[0.05]" />

          <div className="relative px-4 pb-4 pt-4 text-center">
            {/* Badge */}
            <span className="inline-block rounded-full bg-white/[0.15] px-2.5 py-[3px] text-[8.5px] font-bold uppercase tracking-[1.8px] text-white/80">
              This Month
            </span>

            {/* Ring */}
            <div className="my-2.5 flex justify-center">
              <RingProgress
                pct={monthPct}
                size={68}
                trackColor="rgba(255,255,255,0.15)"
                fillColor="rgba(255,255,255,0.9)"
                textColor="rgba(255,255,255,0.95)"
              />
            </div>

            {/* Monthly done / missed */}
            <div className="flex justify-center gap-4">
              <div className="text-center">
                <p className="text-[17px] font-bold leading-none text-white">{monthDone}</p>
                <p className="mt-0.5 text-[9px] text-white/55">done</p>
              </div>
              <div className="w-px bg-white/20" />
              <div className="text-center">
                <p className="text-[17px] font-bold leading-none text-white/70">{monthMissed}</p>
                <p className="mt-0.5 text-[9px] text-white/55">missed</p>
              </div>
            </div>
          </div>
        </button>
      </div>

      {/* Detail bottom sheet */}
      {detail && (
        <MonthCalendarSheet
          cards={amalStore.cards}
          log={amalStore.log}
          onClose={close}
        />
      )}
    </>
  );
}

// ── Month Calendar Sheet ──────────────────────────────────────────────────────
import type { AmalCard, AmalLog } from '../types';

const WEEK_DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];

function isoDate(y: number, m: number, d: number) {
  return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

type DayStatus = 'done' | 'partial' | 'missed' | 'none' | 'future';

function getDayStatus(dateStr: string, cards: AmalCard[], log: AmalLog[], today: string): DayStatus {
  if (dateStr > today) return 'future';
  const dow = new Date(dateStr + 'T12:00:00').getDay();
  const scheduled = cards.filter((c) => {
    const days = Array.isArray(c.days) ? c.days : [];
    return days.length === 0 || days.includes(dow);
  });
  if (scheduled.length === 0) return 'none';
  const dayLog = log.filter((l) => l.date === dateStr);
  const done   = scheduled.filter((c) => dayLog.find((l) => l.amalId === c.id)?.status === 'done').length;
  const missed = scheduled.filter((c) => dayLog.find((l) => l.amalId === c.id)?.status === 'undone').length;
  if (done === scheduled.length) return 'done';
  if (done > 0)   return 'partial';
  if (missed > 0) return 'missed';
  return 'none';
}

function getDayItems(dateStr: string, cards: AmalCard[], log: AmalLog[]) {
  const dow = new Date(dateStr + 'T12:00:00').getDay();
  const scheduled = cards.filter((c) => {
    const days = Array.isArray(c.days) ? c.days : [];
    return days.length === 0 || days.includes(dow);
  });
  return scheduled.map((c) => {
    const entry = log.find((l) => l.amalId === c.id && l.date === dateStr);
    return { card: c, status: entry?.status ?? 'pending' };
  });
}

function MonthCalendarSheet({ cards, log, onClose }: {
  cards:   AmalCard[];
  log:     AmalLog[];
  onClose: () => void;
}) {
  const now   = new Date();
  const today = now.toISOString().slice(0, 10);

  const [viewYear,  setViewYear]  = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth());
  const [selected,  setSelected]  = useState<string | null>(null);

  const prevMonth = () => {
    if (viewMonth === 0) { setViewYear((y) => y - 1); setViewMonth(11); }
    else setViewMonth((m) => m - 1);
    setSelected(null);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewYear((y) => y + 1); setViewMonth(0); }
    else setViewMonth((m) => m + 1);
    setSelected(null);
  };

  const firstDow   = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  const cells: Array<number | null> = [
    ...Array(firstDow).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  // Pad to complete last row
  while (cells.length % 7 !== 0) cells.push(null);

  const dayItems = selected ? getDayItems(selected, cards, log) : [];

  // Per-amal stats for the viewed month
  const monthPfx = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}`;
  const amalMonthStats = cards.map((card) => {
    const monthLog = log.filter((l) => l.amalId === card.id && l.date.startsWith(monthPfx));
    const done   = monthLog.filter((l) => l.status === 'done').length;
    const missed = monthLog.filter((l) => l.status === 'undone').length;
    return { card, done, missed };
  }).filter((s) => s.done + s.missed > 0);

  const statusColor: Record<DayStatus, string> = {
    done:    'bg-primary text-card',
    partial: 'bg-amber-400 text-white',
    missed:  'bg-rose text-card',
    none:    '',
    future:  '',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center" onClick={onClose}>
      <div className="w-full max-w-sm rounded-t-3xl bg-card shadow-soft-lg sm:rounded-2xl" onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between border-b border-line-soft px-5 py-4">
          <div className="flex items-center gap-2">
            <button onClick={prevMonth} className="grid h-7 w-7 cursor-pointer place-items-center rounded-lg text-ink-mute hover:bg-line-soft text-[14px]">‹</button>
            <p className="text-[15px] font-bold text-ink">{MONTH_NAMES[viewMonth]} {viewYear}</p>
            <button onClick={nextMonth} className="grid h-7 w-7 cursor-pointer place-items-center rounded-lg text-ink-mute hover:bg-line-soft text-[14px]">›</button>
          </div>
          <button onClick={onClose} className="grid h-8 w-8 cursor-pointer place-items-center rounded-xl text-ink-mute hover:bg-line-soft">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="max-h-[78vh] overflow-y-auto px-4 pb-6 pt-3">
          {/* Weekday headers */}
          <div className="mb-1 grid grid-cols-7 text-center">
            {WEEK_DAYS.map((d) => (
              <span key={d} className="text-[10.5px] font-bold text-ink-mute">{d}</span>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-y-1">
            {cells.map((day, idx) => {
              if (!day) return <div key={idx} />;
              const dateStr  = isoDate(viewYear, viewMonth, day);
              const status   = getDayStatus(dateStr, cards, log, today);
              const isToday  = dateStr === today;
              const isSel    = dateStr === selected;
              const isFuture = status === 'future';
              return (
                <button
                  key={idx}
                  onClick={() => !isFuture && setSelected(isSel ? null : dateStr)}
                  disabled={isFuture}
                  className={`mx-auto flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-[12.5px] font-semibold transition-transform active:scale-90 disabled:cursor-default
                    ${statusColor[status] || (isFuture ? 'text-ink-mute/30' : 'text-ink')}
                    ${isToday && !statusColor[status] ? 'ring-2 ring-primary' : ''}
                    ${isSel ? 'ring-2 ring-offset-1 ring-primary/60' : ''}
                  `}
                >
                  {day}
                </button>
              );
            })}
          </div>

          {/* Legend */}
          <div className="mt-3 flex items-center justify-center gap-3">
            {(['done', 'partial', 'missed'] as DayStatus[]).map((s) => (
              <div key={s} className="flex items-center gap-1">
                <span className={`h-2.5 w-2.5 rounded-full ${s === 'done' ? 'bg-primary' : s === 'partial' ? 'bg-amber-400' : 'bg-rose'}`} />
                <span className="text-[10px] capitalize text-ink-mute">{s}</span>
              </div>
            ))}
          </div>

          {/* Day detail */}
          {selected && (
            <div className="mt-4 rounded-xl border border-line-soft bg-bg px-4 py-3">
              <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-ink-mute">
                {new Date(selected + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
              </p>
              {dayItems.length === 0 ? (
                <p className="text-[12.5px] text-ink-mute">No amals scheduled.</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {dayItems.map(({ card, status: s }) => (
                    <div key={card.id} className="flex items-center gap-2.5">
                      <span className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                        s === 'done'    ? 'bg-primary text-card' :
                        s === 'undone'  ? 'bg-rose/10 text-rose border border-rose/30' :
                                          'border border-line text-transparent'
                      }`}>
                        {s === 'done' ? '✓' : s === 'undone' ? '✕' : ''}
                      </span>
                      <span className={`text-[12.5px] font-medium ${s === 'done' ? 'text-ink-mute line-through' : 'text-ink'}`}>
                        {card.title}
                      </span>
                      {card.time && (
                        <span className="ml-auto text-[10.5px] text-ink-mute">{card.time}</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Per-amal monthly summary */}
          <div className="mt-4 border-t border-line-soft pt-4">
            <p className="mb-2.5 text-[11px] font-bold uppercase tracking-wider text-ink-mute">
              {MONTH_NAMES[viewMonth]} Summary
            </p>
            {amalMonthStats.length === 0 ? (
              <p className="text-[12.5px] text-ink-mute">No data for this month.</p>
            ) : (
              <div className="flex flex-col gap-2">
                {amalMonthStats.map(({ card, done, missed }) => {
                  const total = done + missed;
                  const pct   = total ? Math.round((done / total) * 100) : 0;
                  return (
                    <div key={card.id} className="rounded-xl border border-line-soft bg-bg px-3.5 py-2.5">
                      <div className="flex items-center justify-between">
                        <span className="truncate text-[13px] font-medium text-ink">{card.title}</span>
                        <span className="ml-2 flex-shrink-0 text-[11px] font-semibold text-ink-mute">{pct}%</span>
                      </div>
                      {/* Progress bar */}
                      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-line-soft">
                        <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
                      </div>
                      <div className="mt-1 flex gap-3">
                        <span className="text-[10.5px] font-medium text-primary">{done} done</span>
                        <span className="text-[10.5px] font-medium text-rose">{missed} missed</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
