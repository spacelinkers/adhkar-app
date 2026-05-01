import { ReactNode } from 'react';

interface StatCardProps {
  label: string;
  value: ReactNode;
  sub: string;
  valueClass?: string;
}

export function StatCard({ label, value, sub, valueClass = '' }: StatCardProps) {
  return (
    <div className="rounded-lg border border-line-soft bg-card p-4 text-center shadow-soft-sm">
      <div className="mb-2.5 text-[10px] font-bold uppercase tracking-[1.8px] text-ink-mute">
        {label}
      </div>
      <div className={`mb-1.5 leading-none text-primary ${valueClass || 'text-3xl font-bold'}`}>
        {value}
      </div>
      <div className="text-[11px] font-medium text-ink-mute">{sub}</div>
    </div>
  );
}

interface RingStatProps {
  count: number;
  target?: number;
  label: string;
  sub: string;
}

export function RingStat({ count, target = 12, label, sub }: RingStatProps) {
  const pct = Math.min(100, Math.round((count / target) * 100));
  const r = 34;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;

  return (
    <div className="rounded-lg border border-line-soft bg-card p-4 text-center shadow-soft-sm">
      <div className="mb-2.5 text-[10px] font-bold uppercase tracking-[1.8px] text-ink-mute">
        {label}
      </div>
      <div className="relative mx-auto mb-1.5 h-[78px] w-[78px]">
        <svg viewBox="0 0 80 80" className="h-full w-full -rotate-90">
          <circle cx="40" cy="40" r={r} fill="none" stroke="#dfe7dd" strokeWidth="6" />
          <circle
            cx="40"
            cy="40"
            r={r}
            fill="none"
            stroke="#1d5d44"
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={`${dash} ${circ}`}
            style={{ transition: 'stroke-dasharray .6s' }}
          />
        </svg>
        <div className="absolute inset-0 grid place-items-center text-base font-bold text-primary">
          {count}
        </div>
      </div>
      <div className="text-[11px] font-medium text-ink-mute">{sub}</div>
    </div>
  );
}
