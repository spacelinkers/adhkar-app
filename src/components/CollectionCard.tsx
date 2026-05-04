import { useNavigate } from 'react-router-dom';
import type { Card } from '../types';
import { Book, ChevronRight } from './Icons';

interface Props {
  card: Card;
}

export function CollectionCard({ card }: Props) {
  const navigate = useNavigate();
  const count = card.subcards?.length || 0;
  const previewDesc = card.desc
    ? card.desc.slice(0, 40) + (card.desc.length > 40 ? '…' : '')
    : '';

  return (
    <div
      className="flex animate-card-in cursor-pointer items-start gap-3 rounded-lg border border-line-soft bg-card p-4 shadow-soft-sm transition-transform active:scale-[.99]"
      onClick={() => navigate(`/card/${card.id}`)}
    >
      <div className="grid h-10 w-10 flex-shrink-0 place-items-center rounded-[10px] bg-primary-soft text-primary">
        <Book className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <h3 className="m-0 mb-0.5 text-[15px] font-bold leading-snug text-ink">{card.title}</h3>
        <div className="text-xs font-medium text-ink-mute">
          {count} {count === 1 ? 'entry' : 'entries'}
          {previewDesc && ` · ${previewDesc}`}
        </div>
      </div>
      <span className="self-center text-ink-mute">
        <ChevronRight className="h-4 w-4" strokeWidth={2.5} />
      </span>
    </div>
  );
}
