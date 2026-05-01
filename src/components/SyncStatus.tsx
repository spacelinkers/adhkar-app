import type { SyncState } from '../types';

interface Props {
  sync: SyncState;
}

export function SyncStatus({ sync }: Props) {
  if (sync.kind === 'idle') return null;

  const dotClass =
    sync.kind === 'ok'
      ? 'bg-primary'
      : sync.kind === 'error'
      ? 'bg-rose'
      : sync.kind === 'offline'
      ? 'bg-ink-mute'
      : 'bg-gold animate-pulse-soft';

  return (
    <div className="fixed top-3 left-1/2 z-[200] flex -translate-x-1/2 items-center gap-1.5 rounded-full border border-line bg-card px-3 py-1.5 text-[11px] font-semibold text-ink-soft shadow-soft-sm">
      <span className={`h-1.5 w-1.5 rounded-full ${dotClass}`} />
      <span>{sync.text}</span>
    </div>
  );
}
