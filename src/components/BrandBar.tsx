import { ReactNode } from 'react';
import { Logo, ArrowLeft } from './Icons';

interface Props {
  title?: string;
  subtitle?: string;
  onBack?: () => void;
  rightSlot?: ReactNode;
}

export function BrandBar({ title = 'Adhkār', subtitle = 'Dua Collection', onBack, rightSlot }: Props) {
  if (onBack) {
    return (
      <div className="mx-auto flex max-w-[720px] items-center justify-between gap-3 px-5 pb-2 pt-[18px]">
        <button
          onClick={onBack}
          aria-label="Back"
          className="grid h-[38px] w-[38px] flex-shrink-0 cursor-pointer place-items-center rounded-[10px] border border-line bg-card text-ink-soft transition-colors active:scale-95 active:bg-line-soft"
        >
          <ArrowLeft className="h-[18px] w-[18px]" />
        </button>
        <div className="flex min-w-0 flex-1 items-center justify-center gap-3">
          <div className="min-w-0 text-center leading-[1.2]">
            <div className="overflow-hidden text-ellipsis whitespace-nowrap text-[17px] font-bold text-ink">
              {title}
            </div>
            {subtitle && (
              <div className="mt-0.5 overflow-hidden text-ellipsis whitespace-nowrap text-[12px] font-medium text-ink-mute">
                {subtitle}
              </div>
            )}
          </div>
        </div>
        <div className="w-[38px] flex-shrink-0">{rightSlot}</div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-[720px] items-center justify-between gap-3 px-5 pb-2 pt-[18px]">
      <div className="flex min-w-0 items-center gap-3">
        <div className="grid h-[42px] w-[42px] flex-shrink-0 place-items-center rounded-xl bg-primary shadow-soft-sm">
          <Logo className="h-[22px] w-[22px] text-card" />
        </div>
        <div className="min-w-0 leading-[1.2]">
          <div className="overflow-hidden text-ellipsis whitespace-nowrap text-lg font-bold text-ink">
            {title}
          </div>
          <div className="mt-0.5 overflow-hidden text-ellipsis whitespace-nowrap text-xs font-medium text-ink-mute">
            {subtitle}
          </div>
        </div>
      </div>
      {rightSlot}
    </div>
  );
}
