import { Logo } from './Icons';

interface Props {
  status: string;
  hidden: boolean;
}

export function BootScreen({ status, hidden }: Props) {
  return (
    <div
      className={`fixed inset-0 z-[500] flex flex-col items-center justify-center gap-3.5 bg-bg transition-opacity duration-400 ${
        hidden ? 'pointer-events-none opacity-0' : 'opacity-100'
      }`}
    >
      <div className="grid h-14 w-14 place-items-center rounded-[14px] bg-primary shadow-soft-md animate-float">
        <Logo className="h-7 w-7 text-card" />
      </div>
      <div className="text-lg font-bold text-ink">Adhkār</div>
      <div className="text-xs font-medium text-ink-mute">{status}</div>
    </div>
  );
}
