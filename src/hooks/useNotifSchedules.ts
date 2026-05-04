import { useCallback, useEffect, useState } from 'react';
import type { NotifSchedule } from '../types';

const LS_SCHEDULES = 'adhkar_schedules';
const LS_DONE_PFX  = 'adhkar_done_';

export interface UseNotifSchedulesResult {
  schedules:         NotifSchedule[];
  todayDone:         Record<string, boolean>;
  todaySchedules:    NotifSchedule[];
  setSchedule:       (s: Omit<NotifSchedule, 'id' | 'lastSentDate'>) => Promise<void>;
  removeSchedule:    (scheduleId: string) => Promise<void>;
  markDone:          (scheduleId: string) => Promise<void>;
  getFor:            (type: 'card' | 'subcard', targetId: string) => NotifSchedule | undefined;
  permissionState:   NotificationPermission | 'unsupported';
  requestPermission: (_userId: string) => Promise<boolean>;
}

function todayISO() { return new Date().toISOString().slice(0, 10); }

function isActiveToday(s: NotifSchedule): boolean {
  if (!s.enabled) return false;
  return s.days.length === 0 || s.days.includes(new Date().getDay());
}

function readSchedules(): NotifSchedule[] {
  try { return JSON.parse(localStorage.getItem(LS_SCHEDULES) ?? '[]'); }
  catch { return []; }
}

function readDoneToday(): Record<string, boolean> {
  try { return JSON.parse(localStorage.getItem(LS_DONE_PFX + todayISO()) ?? '{}'); }
  catch { return {}; }
}

async function postToSW(msg: object) {
  if (!('serviceWorker' in navigator)) return;
  try {
    const reg = await navigator.serviceWorker.ready;
    reg.active?.postMessage(msg);
  } catch { /* SW unavailable */ }
}

export function useNotifSchedules(_userId: string | null): UseNotifSchedulesResult {
  const [schedules, setSchedules] = useState<NotifSchedule[]>(readSchedules);
  const [todayDone, setTodayDone] = useState<Record<string, boolean>>(readDoneToday);
  const [permissionState, setPermissionState] = useState<NotificationPermission | 'unsupported'>(
    typeof Notification === 'undefined' ? 'unsupported' : Notification.permission,
  );

  // Re-register all alarms in the SW whenever the schedule list changes.
  useEffect(() => {
    postToSW({ type: 'SYNC_ALARMS', schedules });
  }, [schedules]);

  const setSchedule = useCallback(async (s: Omit<NotifSchedule, 'id' | 'lastSentDate'>) => {
    const id = `${s.type}_${s.targetId}`;
    setSchedules((prev) => {
      const list = [...prev.filter((x) => x.id !== id), { ...s, id, lastSentDate: null }];
      localStorage.setItem(LS_SCHEDULES, JSON.stringify(list));
      return list;
    });
  }, []);

  const removeSchedule = useCallback(async (scheduleId: string) => {
    setSchedules((prev) => {
      const list = prev.filter((x) => x.id !== scheduleId);
      localStorage.setItem(LS_SCHEDULES, JSON.stringify(list));
      return list;
    });
  }, []);

  const markDone = useCallback(async (scheduleId: string) => {
    const updated = { ...readDoneToday(), [scheduleId]: true };
    localStorage.setItem(LS_DONE_PFX + todayISO(), JSON.stringify(updated));
    setTodayDone(updated);
  }, []);

  const getFor = useCallback(
    (type: 'card' | 'subcard', targetId: string) =>
      schedules.find((s) => s.type === type && s.targetId === targetId),
    [schedules],
  );

  const requestPermission = useCallback(async (_uid: string): Promise<boolean> => {
    if (typeof Notification === 'undefined') return false;
    const result = await Notification.requestPermission();
    setPermissionState(result);
    return result === 'granted';
  }, []);

  return {
    schedules,
    todayDone,
    todaySchedules: schedules.filter(isActiveToday),
    setSchedule,
    removeSchedule,
    markDone,
    getFor,
    permissionState,
    requestPermission,
  };
}
