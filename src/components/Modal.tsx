import { ReactNode, useEffect } from 'react';
import { X } from './Icons';

interface Props {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
}

export function Modal({ open, onClose, title, subtitle, children, footer }: Props) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      className="fixed inset-0 z-[100] flex animate-fade-in items-end justify-center bg-[rgba(15,31,26,0.55)] backdrop-blur-[4px]"
    >
      <div className="flex w-full max-w-[560px] flex-col overflow-hidden rounded-t-[24px] bg-card shadow-[0_-10px_40px_rgba(15,31,26,0.18)] animate-slide-up max-h-[92vh]">
        <div className="mx-auto mb-1.5 mt-2 h-1 w-[38px] rounded-sm bg-line" />
        <div className="flex items-center justify-between border-b border-line-soft px-[22px] pb-[14px] pt-2">
          <div>
            <h2 className="m-0 text-lg font-bold">{title}</h2>
            {subtitle && (
              <div className="mt-0.5 text-[11px] font-medium text-ink-mute">{subtitle}</div>
            )}
          </div>
          <button
            onClick={onClose}
            className="grid h-[30px] w-[30px] cursor-pointer place-items-center rounded-full border border-line bg-card-soft text-ink-soft"
            aria-label="Close"
          >
            <X className="h-[13px] w-[13px]" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-[22px] py-4">{children}</div>
        {footer && (
          <div
            className="flex gap-2.5 border-t border-line-soft bg-card-soft px-[22px] pt-3.5"
            style={{ paddingBottom: 'calc(14px + env(safe-area-inset-bottom))' }}
          >
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
