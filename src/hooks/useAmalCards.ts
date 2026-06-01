import { useState, useCallback } from 'react';
import type { AmalCard, AmalLog } from '../types';

const LS_CARDS = 'adhkar_amal';
const LS_LOG   = 'adhkar_amal_log';
const MAX_BACKFILL_DAYS = 90;

function todayISO() { return new Date().toISOString().slice(0, 10); }

function isoFromDate(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function readCards(): AmalCard[] {
  try { return JSON.parse(localStorage.getItem(LS_CARDS) ?? '[]'); }
  catch { return []; }
}

function readLog(): AmalLog[] {
  try { return JSON.parse(localStorage.getItem(LS_LOG) ?? '[]'); }
  catch { return []; }
}

function persist(cards: AmalCard[]) { localStorage.setItem(LS_CARDS, JSON.stringify(cards)); }
function persistLog(log: AmalLog[]) { localStorage.setItem(LS_LOG, JSON.stringify(log)); }

// On each app open, for every past day (up to MAX_BACKFILL_DAYS back) where an amal
// was scheduled but has no log entry, inject an 'undone' record.
function backfillUndone(cards: AmalCard[], log: AmalLog[]): AmalLog[] {
  const logSet = new Set(log.map((l) => `${l.amalId}|${l.date}`));
  const extras: AmalLog[] = [];

  const today     = new Date(); today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1);

  for (const card of cards) {
    const cardDays = Array.isArray(card.days) ? card.days : [];
    const start = new Date(Math.max(card.createdAt ?? Date.now(), today.getTime() - MAX_BACKFILL_DAYS * 86400000));
    start.setHours(0, 0, 0, 0);

    for (let d = new Date(start); d <= yesterday; d.setDate(d.getDate() + 1)) {
      const dow = d.getDay();
      if (cardDays.length > 0 && !cardDays.includes(dow)) continue;
      const iso = isoFromDate(d);
      if (!logSet.has(`${card.id}|${iso}`)) {
        extras.push({ amalId: card.id, date: iso, status: 'undone' });
        logSet.add(`${card.id}|${iso}`);
      }
    }
  }

  if (!extras.length) return log;
  const updated = [...log, ...extras];
  persistLog(updated);
  return updated;
}

export interface UseAmalCardsResult {
  cards:        AmalCard[];
  log:          AmalLog[];
  addCard:      (data: Omit<AmalCard, 'id' | 'createdAt'>) => void;
  updateCard:   (id: string, data: Omit<AmalCard, 'id' | 'createdAt'>) => void;
  deleteCard:   (id: string) => void;
  reorderCards: (newOrder: AmalCard[]) => void;
  toggleLog:    (amalId: string, date: string) => void;
  getLog:       (amalId: string, date: string) => AmalLog | undefined;
}

export function useAmalCards(): UseAmalCardsResult {
  const [cards, setCards] = useState<AmalCard[]>(readCards);
  const [log, setLog] = useState<AmalLog[]>(() => {
    const raw = readLog();
    return backfillUndone(readCards(), raw);
  });

  const addCard = useCallback((data: Omit<AmalCard, 'id' | 'createdAt'>) => {
    setCards((prev) => {
      const next = [...prev, { ...data, id: crypto.randomUUID(), createdAt: Date.now() }];
      persist(next);
      return next;
    });
  }, []);

  const updateCard = useCallback((id: string, data: Omit<AmalCard, 'id' | 'createdAt'>) => {
    setCards((prev) => {
      const next = prev.map((c) => c.id === id ? { ...c, ...data } : c);
      persist(next);
      return next;
    });
  }, []);

  const reorderCards = useCallback((newOrder: AmalCard[]) => {
    setCards(newOrder);
    persist(newOrder);
  }, []);

  const deleteCard = useCallback((id: string) => {
    setCards((prev) => {
      const next = prev.filter((c) => c.id !== id);
      persist(next);
      return next;
    });
    setLog((prev) => {
      const next = prev.filter((l) => l.amalId !== id);
      persistLog(next);
      return next;
    });
  }, []);

  // Toggle done ↔ undone for a given amal on a given date.
  const toggleLog = useCallback((amalId: string, date: string) => {
    setLog((prev) => {
      const existing = prev.find((l) => l.amalId === amalId && l.date === date);
      const next = existing
        ? prev.map((l) => l.amalId === amalId && l.date === date
            ? { ...l, status: l.status === 'done' ? 'undone' as const : 'done' as const }
            : l)
        : [...prev, { amalId, date, status: 'done' as const }];
      persistLog(next);
      return next;
    });
  }, []);

  const getLog = useCallback(
    (amalId: string, date: string) => log.find((l) => l.amalId === amalId && l.date === date),
    [log],
  );

  return { cards, log, addCard, updateCard, deleteCard, reorderCards, toggleLog, getLog };
}
