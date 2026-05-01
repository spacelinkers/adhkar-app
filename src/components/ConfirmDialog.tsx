interface Props {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Delete',
  onConfirm,
  onCancel,
}: Props) {
  if (!open) return null;

  return (
    <div
      onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}
      className="fixed inset-0 z-[100] flex animate-fade-in items-center justify-center bg-[rgba(15,31,26,0.55)] p-6 backdrop-blur-[4px]"
    >
      <div className="m-auto max-w-[320px] rounded-[18px] bg-card p-5 shadow-soft-lg animate-pop">
        <h3 className="mb-1.5 text-base font-bold">{title}</h3>
        <p className="m-0 mb-4 text-[13px] leading-[1.5] text-ink-soft">{message}</p>
        <div className="flex gap-2">
          <button onClick={onCancel} className="btn btn-secondary">Cancel</button>
          <button onClick={onConfirm} className="btn btn-danger">{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}
