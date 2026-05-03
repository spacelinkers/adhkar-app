export interface Subcard {
  id: string;
  duaId?: string; // set when added from the Dua Library
  title: string;
  arabic: string;
  translation: string;
  reward: string;
}

export interface Card {
  id: string;
  title: string;
  desc: string;
  subcards: Subcard[];
  createdAt: number;
  updatedAt: number;
}

export interface Dua {
  id: string;
  title: string;
  arabic: string;
  translation: string;
  reward: string;
  createdAt: number;
  createdBy: string;
}

export type SyncKind = 'idle' | 'syncing' | 'ok' | 'error' | 'offline';

export interface SyncState {
  kind: SyncKind;
  text: string;
}
