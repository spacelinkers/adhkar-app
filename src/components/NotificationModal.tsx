import { useState, useEffect } from 'react';
import { Bell, X } from './Icons';
import type { UseNotifSchedulesResult } from '../hooks/useNotifSchedules';

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

interface Props {
  type:       'card' | 'subcard';
  targetId:   string;
  cardId:     string;
  title:      string;
  userId:     string;
  notifStore: UseNotifSchedulesResult;
}

// ── Bell trigger button ───────────────────────────────────────────────────────
export function NotifBellButton({
  type, targetId, notifStore, onClick,
}: {
  type:       'card' | 'subcard';
  targetId:   string;
  notifStore: UseNotifSchedulesResult;
  onClick:    () => void;
}) {
  const hasSchedule = !!notifStore.getFor(type, targetId);

  return (
    <button
      onClick={onClick}
      aria-label="Set reminder"
      className={`relative grid h-9 w-9 cursor-pointer place-items-center rounded-xl transition-all active:scale-95 ${
        hasSchedule
          ? 'text-primary'
          : 'text-ink-mute hover:text-ink-soft'
      }`}
    >
      <Bell className="h-4 w-4" />
      <span className={`absolute left-1.5 top-1.5 h-2 w-2 rounded-full ring-2 ring-card ${
        hasSchedule ? 'bg-primary' : 'bg-line'
      }`} />
    </button>
  );
}

// ── Reminder modal (controlled) ───────────────────────────────────────────────
export function NotificationModal({ type, targetId, cardId, title, userId, notifStore }: Props) {
  const [open, setOpen]     = useState(false);
  const [time, setTime]     = useState('08:00');
  const [days, setDays]     = useState<number[]>([]);
  const [saving, setSaving] = useState(false);

  const existing    = notifStore.getFor(type, targetId);
  const hasSchedule = !!existing;

  useEffect(() => {
    if (!open) return;
    if (existing) { setTime(existing.time); setDays(existing.days); }
    else          { setTime('08:00');        setDays([]);            }
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggleDay = (d: number) =>
    setDays((prev) => prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d].sort());

  const handleSave = async () => {
    setSaving(true);
    try {
      if (notifStore.permissionState !== 'granted') {
        const granted = await notifStore.requestPermission(userId);
        if (!granted) return;
      }
      await notifStore.setSchedule({
        type, targetId, cardId, title, time, days, enabled: true,
        tz: Intl.DateTimeFormat().resolvedOptions().timeZone,
      });
      setOpen(false);
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async () => {
    if (!existing) return;
    setSaving(true);
    try { await notifStore.removeSchedule(existing.id); setOpen(false); }
    finally { setSaving(false); }
  };

  return (
    <>
      <NotifBellButton type={type} targetId={targetId} notifStore={notifStore} onClick={() => setOpen(true)} />
      <NotifSheet
        open={open} onClose={() => setOpen(false)}
        title={title} hasSchedule={hasSchedule}
        time={time} setTime={setTime}
        days={days} toggleDay={toggleDay}
        saving={saving} onSave={handleSave} onRemove={handleRemove}
        needsPermission={notifStore.permissionState !== 'granted' && notifStore.permissionState !== 'unsupported'}
      />
    </>
  );
}

// ── Bottom sheet (shared between both usages) ─────────────────────────────────
export function NotifSheet({
  open, onClose, title, hasSchedule,
  time, setTime, days, toggleDay,
  saving, onSave, onRemove, needsPermission,
}: {
  open:            boolean;
  onClose:         () => void;
  title:           string;
  hasSchedule:     boolean;
  time:            string;
  setTime:         (t: string) => void;
  days:            number[];
  toggleDay:       (d: number) => void;
  saving:          boolean;
  onSave:          () => void;
  onRemove:        () => void;
  needsPermission: boolean;
}) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-t-3xl bg-card p-5 pb-8 shadow-soft-lg sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="mb-5 flex items-start justify-between">
          <div>
            <p className="text-[17px] font-bold text-ink">
              {hasSchedule ? 'Edit Reminder' : 'Set Reminder'}
            </p>
            <p className="mt-0.5 line-clamp-1 text-[12px] text-ink-mute">{title}</p>
          </div>
          <button
            onClick={onClose}
            className="grid h-8 w-8 cursor-pointer place-items-center rounded-xl text-ink-mute hover:bg-line-soft"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {needsPermission && (
          <div className="mb-4 rounded-xl bg-amber-50 px-4 py-3 text-[12.5px] font-medium text-amber-700">
            📳 Tap Save — you'll be asked to allow notifications.
          </div>
        )}

        {/* Time picker */}
        <div className="mb-4">
          <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-ink-mute">Remind me at</p>
          <input
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className="w-full rounded-xl border border-line bg-bg px-4 py-3 text-[18px] font-bold text-ink focus:border-primary focus:outline-none"
          />
        </div>

        {/* Days */}
        <div className="mb-6">
          <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-ink-mute">
            Repeat — {days.length === 0 ? 'Every day' : days.map((d) => DAY_LABELS[d]).join(', ')}
          </p>
          <div className="flex gap-1.5">
            {DAY_LABELS.map((label, i) => (
              <button
                key={i}
                type="button"
                onClick={() => toggleDay(i)}
                className={`flex-1 cursor-pointer rounded-xl py-2.5 text-[11px] font-bold transition-colors ${
                  days.includes(i)
                    ? 'bg-primary text-card'
                    : 'bg-line-soft text-ink-mute hover:bg-line'
                }`}
              >
                {label[0]}
              </button>
            ))}
          </div>
          <p className="mt-1.5 text-[11px] text-ink-mute">Leave all unselected to repeat every day.</p>
        </div>

        {/* Buttons */}
        <div className="flex flex-col gap-2">
          <button
            onClick={onSave}
            disabled={saving}
            className="w-full cursor-pointer rounded-xl bg-primary py-3.5 text-[14px] font-semibold text-card shadow-soft-sm transition-transform active:scale-[.98] disabled:opacity-60"
          >
            {saving ? 'Saving…' : hasSchedule ? 'Update Reminder' : 'Set Reminder'}
          </button>
          {hasSchedule && (
            <button
              onClick={onRemove}
              disabled={saving}
              className="w-full cursor-pointer rounded-xl border border-line py-3.5 text-[14px] font-semibold text-rose transition-colors hover:bg-rose/5 disabled:opacity-60"
            >
              Remove Reminder
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
