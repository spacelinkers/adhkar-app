import { useCallback, useEffect, useState } from 'react';
import {
  collection, doc, onSnapshot, setDoc, deleteDoc,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { NotifSchedule } from '../types';

export interface UseNotifSchedulesResult {
  schedules:        NotifSchedule[];
  todayDone:        Record<string, boolean>; // scheduleId → true if done today
  todaySchedules:   NotifSchedule[];         // enabled schedules active today
  setSchedule:      (s: Omit<NotifSchedule, 'id' | 'lastSentDate'>) => Promise<void>;
  removeSchedule:   (scheduleId: string) => Promise<void>;
  markDone:         (scheduleId: string) => Promise<void>;
  getFor:           (type: 'card' | 'subcard', targetId: string) => NotifSchedule | undefined;
  permissionState:  NotificationPermission | 'unsupported';
  requestPermission:(userId: string) => Promise<boolean>;
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function isActiveToday(s: NotifSchedule): boolean {
  if (!s.enabled) return false;
  if (s.days.length === 0) return true;
  return s.days.includes(new Date().getDay());
}

export function useNotifSchedules(userId: string | null): UseNotifSchedulesResult {
  const [schedules, setSchedules] = useState<NotifSchedule[]>([]);
  const [todayDone, setTodayDone] = useState<Record<string, boolean>>({});
  const [permissionState, setPermissionState] = useState<NotificationPermission | 'unsupported'>(
    typeof Notification === 'undefined' ? 'unsupported' : Notification.permission,
  );

  // Subscribe to schedules
  useEffect(() => {
    if (!userId || !db) return;
    return onSnapshot(collection(db, 'users', userId, 'schedules'), (snap) => {
      setSchedules(snap.docs.map((d) => ({ id: d.id, ...d.data() } as NotifSchedule)));
    });
  }, [userId]);

  // Subscribe to today's completions document
  useEffect(() => {
    if (!userId || !db) return;
    const today = todayISO();
    return onSnapshot(doc(db, 'users', userId, 'completions', today), (snap) => {
      const data = snap.data() ?? {};
      const done: Record<string, boolean> = {};
      Object.keys(data).forEach((k) => { done[k] = true; });
      setTodayDone(done);
    });
  }, [userId]);

  const setSchedule = useCallback(async (s: Omit<NotifSchedule, 'id' | 'lastSentDate'>) => {
    if (!userId || !db) return;
    const id = `${s.type}_${s.targetId}`;
    await setDoc(doc(db, 'users', userId, 'schedules', id), {
      ...s,
      lastSentDate: null,
    });
  }, [userId]);

  const removeSchedule = useCallback(async (scheduleId: string) => {
    if (!userId || !db) return;
    await deleteDoc(doc(db, 'users', userId, 'schedules', scheduleId));
  }, [userId]);

  const markDone = useCallback(async (scheduleId: string) => {
    if (!userId || !db) return;
    const today = todayISO();
    await setDoc(
      doc(db, 'users', userId, 'completions', today),
      { [scheduleId]: { completedAt: Date.now() } },
      { merge: true },
    );
  }, [userId]);

  const getFor = useCallback(
    (type: 'card' | 'subcard', targetId: string) =>
      schedules.find((s) => s.type === type && s.targetId === targetId),
    [schedules],
  );

  const requestPermission = useCallback(async (uid: string): Promise<boolean> => {
    const { requestNotificationPermission } = await import('../lib/fcm');
    const token = await requestNotificationPermission(uid);
    const state = typeof Notification !== 'undefined' ? Notification.permission : 'unsupported' as const;
    setPermissionState(state);
    return !!token;
  }, []);

  const todaySchedules = schedules.filter(isActiveToday);

  return {
    schedules,
    todayDone,
    todaySchedules,
    setSchedule,
    removeSchedule,
    markDone,
    getFor,
    permissionState,
    requestPermission,
  };
}
