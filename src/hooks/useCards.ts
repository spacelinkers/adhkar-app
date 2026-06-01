import { useCallback, useEffect, useRef, useState } from 'react';
import type { Card, Subcard, SyncState } from '../types';
import {
  loadLocal,
  saveLocal,
  subscribeToCards,
  persistCardRemote,
  deleteCardRemote,
  newCard as makeCard,
  newSubcard as makeSubcard,
} from '../lib/store';

interface UseCardsArgs {
  userId: string | null;
  enabled: boolean; // true when Firebase auth has resolved
}

export interface UseCardsResult {
  cards: Card[];
  isLoaded: boolean;
  sync: SyncState;
  cloudEnabled: boolean;
  // mutations
  createCard: (title: string, desc: string) => Promise<Card>;
  updateCard: (id: string, patch: Partial<Card>) => Promise<void>;
  deleteCard: (id: string) => Promise<void>;
  addSubcard:       (cardId: string, sub: Omit<Subcard, 'id'>) => Promise<void>;
  updateSubcard:    (cardId: string, subId: string, patch: Partial<Subcard>) => Promise<void>;
  deleteSubcard:    (cardId: string, subId: string) => Promise<void>;
  reorderSubcards:  (cardId: string, newOrder: Subcard[]) => Promise<void>;
  reorderCards:     (newOrder: Card[]) => Promise<void>;
  clearLocal: () => void;
}

export function useCards({ userId, enabled }: UseCardsArgs): UseCardsResult {
  const [cards, setCards] = useState<Card[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [sync, setSync] = useState<SyncState>({ kind: 'idle', text: '' });
  const cloudEnabled = enabled && !!userId;

  // Keep latest cards in a ref so async ops don't race React state updates
  const cardsRef = useRef<Card[]>([]);
  cardsRef.current = cards;

  const syncTimer = useRef<number | null>(null);
  const flashSync = useCallback((kind: SyncState['kind'], text: string) => {
    setSync({ kind, text });
    if (syncTimer.current) window.clearTimeout(syncTimer.current);
    if (kind === 'ok') {
      syncTimer.current = window.setTimeout(
        () => setSync({ kind: 'idle', text: '' }),
        1800,
      );
    } else if (kind === 'error') {
      syncTimer.current = window.setTimeout(
        () => setSync({ kind: 'idle', text: '' }),
        4000,
      );
    }
  }, []);

  // ─── Load: subscribe to Firestore or read localStorage ───
  useEffect(() => {
    if (cloudEnabled && userId) {
      flashSync('syncing', 'Syncing…');
      const unsub = subscribeToCards(
        userId,
        (next) => {
          setCards(next);
          saveLocal(next); // mirror to local for offline reads
          setIsLoaded(true);
          flashSync('ok', 'Synced');
        },
        (err) => {
          console.error(err);
          flashSync('error', 'Sync error');
          // fall back to local cache
          if (!isLoaded) {
            setCards(loadLocal());
            setIsLoaded(true);
          }
        },
      );
      return () => unsub();
    } else if (!enabled) {
      // Firebase explicitly disabled — load from local
      setCards(loadLocal());
      setIsLoaded(true);
    }
    // If enabled but userId not yet ready, do nothing (waits for auth)
  }, [cloudEnabled, userId, enabled, flashSync, isLoaded]);

  // ─── Online/offline indicator ───
  useEffect(() => {
    const onOnline = () => {
      if (cloudEnabled) flashSync('ok', 'Back online');
    };
    const onOffline = () => flashSync('offline', 'Offline');
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, [cloudEnabled, flashSync]);

  // ─── Mutations ───
  const persist = useCallback(
    async (card: Card) => {
      if (cloudEnabled && userId) {
        flashSync('syncing', 'Saving…');
        try {
          await persistCardRemote(userId, card);
          flashSync('ok', 'Saved');
        } catch (err) {
          console.error(err);
          flashSync('error', 'Save failed');
        }
      } else {
        saveLocal(cardsRef.current);
      }
    },
    [cloudEnabled, userId, flashSync],
  );

  const createCard = useCallback(
    async (title: string, desc: string) => {
      const card = makeCard(title, desc);
      setCards((prev) => [...prev, card]);
      await persist(card);
      return card;
    },
    [persist],
  );

  const updateCard = useCallback(
    async (id: string, patch: Partial<Card>) => {
      let updated: Card | null = null;
      setCards((prev) =>
        prev.map((c) => {
          if (c.id !== id) return c;
          updated = { ...c, ...patch, updatedAt: Date.now() };
          return updated;
        }),
      );
      if (updated) await persist(updated);
    },
    [persist],
  );

  const deleteCard = useCallback(
    async (id: string) => {
      setCards((prev) => prev.filter((c) => c.id !== id));
      if (cloudEnabled && userId) {
        flashSync('syncing', 'Deleting…');
        try {
          await deleteCardRemote(userId, id);
          flashSync('ok', 'Deleted');
        } catch (err) {
          console.error(err);
          flashSync('error', 'Delete failed');
        }
      } else {
        saveLocal(cardsRef.current);
      }
    },
    [cloudEnabled, userId, flashSync],
  );

  const addSubcard = useCallback(
    async (cardId: string, sub: Omit<Subcard, 'id'>) => {
      const subcard = makeSubcard(sub.title, sub.arabic, sub.translation, sub.reward);
      let updated: Card | null = null;
      setCards((prev) =>
        prev.map((c) => {
          if (c.id !== cardId) return c;
          updated = {
            ...c,
            subcards: [...(c.subcards || []), subcard],
            updatedAt: Date.now(),
          };
          return updated;
        }),
      );
      if (updated) await persist(updated);
    },
    [persist],
  );

  const updateSubcard = useCallback(
    async (cardId: string, subId: string, patch: Partial<Subcard>) => {
      let updated: Card | null = null;
      setCards((prev) =>
        prev.map((c) => {
          if (c.id !== cardId) return c;
          updated = {
            ...c,
            subcards: c.subcards.map((s) => (s.id === subId ? { ...s, ...patch } : s)),
            updatedAt: Date.now(),
          };
          return updated;
        }),
      );
      if (updated) await persist(updated);
    },
    [persist],
  );

  const deleteSubcard = useCallback(
    async (cardId: string, subId: string) => {
      let updated: Card | null = null;
      setCards((prev) =>
        prev.map((c) => {
          if (c.id !== cardId) return c;
          updated = {
            ...c,
            subcards: c.subcards.filter((s) => s.id !== subId),
            updatedAt: Date.now(),
          };
          return updated;
        }),
      );
      if (updated) await persist(updated);
    },
    [persist],
  );

  const reorderSubcards = useCallback(
    async (cardId: string, newOrder: Subcard[]) => {
      let updated: Card | undefined;
      setCards((prev) =>
        prev.map((c) => {
          if (c.id !== cardId) return c;
          updated = { ...c, subcards: newOrder, updatedAt: Date.now() };
          return updated;
        }),
      );
      if (updated) await persist(updated);
    },
    [persist],
  );

  const reorderCards = useCallback(
    async (newOrder: Card[]) => {
      const stamped = newOrder.map((card, i) => ({ ...card, sortOrder: i }));
      setCards(stamped);
      for (const card of stamped) await persist(card);
    },
    [persist],
  );

  const clearLocalData = useCallback(() => {
    if (cloudEnabled) {
      // Only clears local cache; reload to refetch from cloud
      try {
        localStorage.removeItem('adhkar_collection_v1');
      } catch {
        /* ignore */
      }
      window.location.reload();
    } else {
      setCards([]);
      try {
        localStorage.removeItem('adhkar_collection_v1');
      } catch {
        /* ignore */
      }
    }
  }, [cloudEnabled]);

  return {
    cards,
    isLoaded,
    sync,
    cloudEnabled,
    createCard,
    updateCard,
    deleteCard,
    addSubcard,
    updateSubcard,
    deleteSubcard,
    reorderSubcards,
    reorderCards,
    clearLocal: clearLocalData,
  };
}
