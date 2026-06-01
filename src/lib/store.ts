import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  query,
  Unsubscribe,
} from 'firebase/firestore';
import { db } from './firebase';
import type { Card, Subcard } from '../types';

const STORAGE_KEY = 'adhkar_collection_v1';

// ─── Migration: ensure subcards have title field ───
function migrateCards(cards: Card[]): Card[] {
  return cards.map((card) => ({
    ...card,
    subcards: (card.subcards || []).map((sub) => {
      if (typeof sub.title === 'string' && sub.title.trim()) return sub;
      const fallback =
        (sub.translation && sub.translation.trim().split(/\s+/).slice(0, 6).join(' ')) ||
        (sub.arabic && sub.arabic.trim().slice(0, 30)) ||
        '';
      return { ...sub, title: fallback };
    }),
  }));
}

// ─── localStorage layer ───
export function loadLocal(): Card[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (parsed && Array.isArray(parsed.cards)) {
      return migrateCards(parsed.cards);
    }
    return [];
  } catch {
    return [];
  }
}

export function saveLocal(cards: Card[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ cards }));
  } catch {
    /* ignore quota errors */
  }
}

export function clearLocal(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

// ─── Firestore layer ───
export function subscribeToCards(
  userId: string,
  onChange: (cards: Card[]) => void,
  onError: (err: Error) => void,
): Unsubscribe {
  if (!db) throw new Error('Firestore not initialised');
  const cardsRef = collection(db, 'users', userId, 'cards');
  return onSnapshot(
    query(cardsRef),
    (snap) => {
      const cards: Card[] = [];
      snap.forEach((d) => {
        const data = d.data();
        cards.push({
          id: d.id,
          title: data.title || '',
          desc: data.desc || '',
          subcards: Array.isArray(data.subcards) ? data.subcards : [],
          createdAt: data.createdAt || 0,
          updatedAt: data.updatedAt || data.createdAt || 0,
          sortOrder: typeof data.sortOrder === 'number' ? data.sortOrder : undefined,
        });
      });
      cards.sort((a, b) => {
        const aOrder = a.sortOrder ?? a.createdAt ?? 0;
        const bOrder = b.sortOrder ?? b.createdAt ?? 0;
        return aOrder - bOrder;
      });
      onChange(cards);
    },
    (err) => onError(err as Error),
  );
}

export async function persistCardRemote(userId: string, card: Card): Promise<void> {
  if (!db) throw new Error('Firestore not initialised');
  const ref = doc(db, 'users', userId, 'cards', card.id);
  await setDoc(ref, {
    title: card.title || '',
    desc: card.desc || '',
    subcards: card.subcards || [],
    createdAt: card.createdAt || Date.now(),
    updatedAt: Date.now(),
    ...(typeof card.sortOrder === 'number' ? { sortOrder: card.sortOrder } : {}),
  });
}

export async function deleteCardRemote(userId: string, cardId: string): Promise<void> {
  if (!db) throw new Error('Firestore not initialised');
  await deleteDoc(doc(db, 'users', userId, 'cards', cardId));
}

// ─── Helpers ───
export const uid = () =>
  Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

export function newCard(title: string, desc: string): Card {
  const now = Date.now();
  return { id: uid(), title, desc, subcards: [], createdAt: now, updatedAt: now };
}

export function newSubcard(
  title: string,
  arabic: string,
  translation: string,
  reward: string,
): Subcard {
  return { id: uid(), title, arabic, translation, reward };
}
