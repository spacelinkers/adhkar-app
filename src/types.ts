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

export interface NotifSchedule {
  id:           string;
  type:         'card' | 'subcard';
  targetId:     string;
  cardId:       string;
  title:        string;
  time:         string;       // "HH:MM"
  days:         number[];     // 0=Sun..6=Sat; empty = every day
  enabled:      boolean;
  tz:           string;       // IANA timezone e.g. "Asia/Dhaka"
  lastSentDate: string | null;
}

export interface AmalCard {
  id:          string;
  title:       string;
  amal:        string;
  description: string;
  time:        string;    // "HH:MM" — when to perform
  days:        number[];  // 0=Sun..6=Sat; empty = every day
  duaRefs:     Array<{ cardId: string; subId: string; title: string; arabic?: string; translation?: string }>;
  createdAt:   number;
}

export interface AmalLog {
  amalId: string;
  date:   string;   // "YYYY-MM-DD"
  status: 'done' | 'undone';
}

export type SyncKind = 'idle' | 'syncing' | 'ok' | 'error' | 'offline';

export interface SyncState {
  kind: SyncKind;
  text: string;
}
