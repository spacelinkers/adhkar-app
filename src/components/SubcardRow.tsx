import { useNavigate, useParams } from 'react-router-dom';
import type { Subcard } from '../types';
import { ChevronRight } from './Icons';

interface Props {
  sub: Subcard;
  num: number;
}

export function SubcardRow({ sub, num }: Props) {
  const navigate = useNavigate();
  const { cardId } = useParams<{ cardId: string }>();
  const hasTitle = !!sub.title?.trim();

  const open = () => navigate(`/card/${cardId}/dua/${sub.id}`);

  return (
    <div
      onClick={open}
      className="flex animate-sub-in cursor-pointer items-center gap-3.5 rounded-md border border-line-soft bg-card px-4 py-3.5 shadow-soft-sm transition-transform active:scale-[.99]"
    >
      <div className="grid h-[30px] w-[30px] flex-shrink-0 place-items-center rounded-lg bg-primary-soft text-xs font-bold tabular-nums text-primary">
        {String(num).padStart(2, '0')}
      </div>
      <div
        className={`min-w-0 flex-1 text-[14.5px] leading-snug ${
          hasTitle
            ? 'font-semibold text-ink'
            : 'font-medium italic text-ink-mute'
        }`}
      >
        {hasTitle ? sub.title : 'Untitled Dua'}
      </div>
      <span className="text-ink-mute">
        <ChevronRight className="h-4 w-4" strokeWidth={2.5} />
      </span>
    </div>
  );
}
