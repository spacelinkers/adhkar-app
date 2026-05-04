import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CollectionCard } from '../components/CollectionCard';
import { CardModal } from '../components/CardModal';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { Plus, Logo } from '../components/Icons';
import { InspirationCard } from '../components/InspirationCard';
import type { UseCardsResult } from '../hooks/useCards';
import type { UseNotifSchedulesResult } from '../hooks/useNotifSchedules';

interface Props {
  store:       UseCardsResult;
  onSignOut:   () => Promise<void>;
  displayName: string | null;
  email:       string | null;
  photoURL:    string | null;
  userId:      string | null;
  notifStore:  UseNotifSchedulesResult;
}

export function HomePage({ store, onSignOut, displayName, email, photoURL, notifStore }: Props) {
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

        {/* Today's reminders stats */}
        {notifStore.todaySchedules.length > 0 && (
          <TodayStats schedules={notifStore.todaySchedules} done={notifStore.todayDone} onNavigate={navigate} />
        )}

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
            <div className="flex flex-col gap-2 pt-1">
              {cards.map((c) => (
                <CollectionCard
                  key={c.id}
                  card={c}
                />
              ))}
            </div>
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

// ── Today's Reminders Stats ──────────────────────────────────────────────────
import type { NotifSchedule } from '../types';
import type { NavigateFunction } from 'react-router-dom';

function TodayStats({
  schedules,
  done,
  onNavigate,
}: {
  schedules:  NotifSchedule[];
  done:       Record<string, boolean>;
  onNavigate: NavigateFunction;
}) {
  const doneCount  = schedules.filter((s) => done[s.id]).length;
  const totalCount = schedules.length;
  const allDone    = doneCount === totalCount;

  return (
    <div className="mx-4 mb-4 rounded-xl border border-line-soft bg-card shadow-soft-sm">
      {/* Header row */}
      <div className="flex items-center justify-between border-b border-line-soft px-4 py-3">
        <span className="text-[13px] font-bold text-ink">Today's Reminders</span>
        <span className={`text-[12px] font-semibold ${allDone ? 'text-primary' : 'text-ink-mute'}`}>
          {doneCount} / {totalCount} done
        </span>
      </div>

      {/* Progress bar */}
      <div className="mx-4 mt-2.5 h-1.5 overflow-hidden rounded-full bg-line-soft">
        <div
          className="h-full rounded-full bg-primary transition-all duration-500"
          style={{ width: `${totalCount ? (doneCount / totalCount) * 100 : 0}%` }}
        />
      </div>

      {/* List */}
      <div className="divide-y divide-line-soft px-4 py-1">
        {schedules.map((s) => {
          const isDone = !!done[s.id];
          const path   = s.type === 'card' ? `/card/${s.targetId}` : `/card/${s.cardId}/dua/${s.targetId}`;
          return (
            <button
              key={s.id}
              onClick={() => onNavigate(path)}
              className="flex w-full cursor-pointer items-center gap-3 py-2.5 text-left"
            >
              <span className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                isDone ? 'bg-primary text-card' : 'border border-line text-ink-mute'
              }`}>
                {isDone ? '✓' : ''}
              </span>
              <span className={`flex-1 text-[13px] font-medium ${isDone ? 'text-ink-mute line-through' : 'text-ink'}`}>
                {s.title}
              </span>
              <span className="text-[11px] text-ink-mute">{s.time}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
