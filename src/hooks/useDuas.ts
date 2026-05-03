import { useEffect, useState, useCallback } from 'react';
import { subscribeToDuas, addDua, updateDua, deleteDua } from '../lib/firebase';
import type { Dua } from '../types';

export interface UseDuasResult {
  duas:     Dua[];
  isLoaded: boolean;
  create:   (data: Omit<Dua, 'id' | 'createdAt' | 'createdBy'>, email: string) => Promise<void>;
  update:   (id: string, patch: Partial<Omit<Dua, 'id'>>) => Promise<void>;
  remove:   (id: string) => Promise<void>;
}

export function useDuas(enabled: boolean): UseDuasResult {
  const [duas,     setDuas]     = useState<Dua[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (!enabled) return;
    const unsub = subscribeToDuas(
      (next) => { setDuas(next); setIsLoaded(true); },
      (err)  => { console.error('useDuas:', err); setIsLoaded(true); },
    );
    return unsub;
  }, [enabled]);

  const create = useCallback(async (
    data: Omit<Dua, 'id' | 'createdAt' | 'createdBy'>,
    email: string,
  ) => {
    await addDua({ ...data, createdAt: Date.now(), createdBy: email });
  }, []);

  const update = useCallback(async (id: string, patch: Partial<Omit<Dua, 'id'>>) => {
    await updateDua(id, patch);
  }, []);

  const remove = useCallback(async (id: string) => {
    await deleteDua(id);
  }, []);

  return { duas, isLoaded, create, update, remove };
}
