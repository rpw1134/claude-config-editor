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

interface ToastProps {
  message: string;
}

export const Toast = ({ message }: ToastProps) => {
  return (
    <div
      className={[
        "fixed bottom-6 right-6 z-100",
        "flex items-center gap-2.5",
        "bg-(--bg-elevated) border border-(--border-default) rounded-xl shadow-2xl px-4 py-3",
        "toast-in",
      ].join(" ")}
    >
      <CheckIcon />
      <span className="text-[13px] text-(--text-primary) leading-none">
        {message}
      </span>
    </div>
  );
};
