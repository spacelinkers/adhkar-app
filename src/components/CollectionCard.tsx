import { useNavigate } from 'react-router-dom';
import type { Card } from '../types';
import { Book, Edit, Trash, ChevronRight } from './Icons';

interface Props {
  card: Card;
  onEdit: (card: Card) => void;
  onDelete: (card: Card) => void;
}

export function CollectionCard({ card, onEdit, onDelete }: Props) {
  const navigate = useNavigate();
  const count = card.subcards?.length || 0;
  const previewDesc = card.desc
    ? card.desc.slice(0, 40) + (card.desc.length > 40 ? '…' : '')
    : '';

  const open = () => navigate(`/card/${card.id}`);

  return (
    <div
      className="flex animate-card-in cursor-pointer items-start gap-3 rounded-lg border border-line-soft bg-card p-4 shadow-soft-sm transition-transform active:scale-[.99]"
      onClick={open}
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
      <div className="ml-1 flex flex-shrink-0 items-center gap-0.5" onClick={(e) => e.stopPropagation()}>
        <button
          aria-label="Edit"
          onClick={(e) => { e.stopPropagation(); onEdit(card); }}
          className="grid h-8 w-8 cursor-pointer place-items-center rounded-lg text-ink-mute transition-colors hover:bg-line-soft hover:text-ink active:bg-line-soft"
        >
          <Edit className="h-4 w-4" />
        </button>
        <button
          aria-label="Delete"
          onClick={(e) => { e.stopPropagation(); onDelete(card); }}
          className="grid h-8 w-8 cursor-pointer place-items-center rounded-lg text-ink-mute transition-colors hover:bg-line-soft active:text-rose"
        >
          <Trash className="h-4 w-4" />
        </button>
        <span className="self-center text-ink-mute">
          <ChevronRight className="h-4 w-4" strokeWidth={2.5} />
        </span>
      </div>
    </div>
  );
}
