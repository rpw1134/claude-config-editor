// ── Toast ──────────────────────────────────────────────────────────────────────

const CheckIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <path
      d="M3 8.5L6.5 12L13 4"
      stroke="#22c55e"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const ErrorIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <path
      d="M8 3v5.5M8 11.5v.5"
      stroke="#ef4444"
      strokeWidth="1.75"
      strokeLinecap="round"
    />
    <circle cx="8" cy="8" r="6" stroke="#ef4444" strokeWidth="1.5" />
  </svg>
);

export type ToastType = 'success' | 'error';

interface ToastProps {
  message: string;
  type?: ToastType;
}

export const Toast = ({ message, type = 'success' }: ToastProps) => {
  const isError = type === 'error';
  return (
    <div
      className={[
        "fixed z-100 flex items-center gap-2.5",
        isError
          ? "top-6 left-1/2 -translate-x-1/2"
          : "bottom-6 right-6",
        "bg-(--bg-elevated) rounded-xl shadow-2xl px-4 py-3",
        isError
          ? "border border-red-500/30"
          : "border border-(--border-default)",
        "toast-in",
      ].join(" ")}
    >
      {isError ? <ErrorIcon /> : <CheckIcon />}
      <span className="text-[13px] text-(--text-primary) leading-none whitespace-nowrap">
        {message}
      </span>
    </div>
  );
};
