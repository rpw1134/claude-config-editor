import { useEffect } from "react";

interface DiscardModalProps {
  title?: string;
  message?: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const DiscardModal = ({
  title = "Discard changes?",
  message = "You'll lose everything you've entered so far.",
  confirmLabel = "Discard",
  onConfirm,
  onCancel,
}: DiscardModalProps) => {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onCancel]);

  return (
    <div
      className="fixed inset-0 z-60 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={onCancel}
    >
      <div
        className="bg-(--bg-surface) rounded-2xl border border-(--border-subtle) p-8 max-w-sm w-full mx-4 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className='font-["Bricolage_Grotesque",sans-serif] m-0 mb-2 text-[20px] font-semibold text-(--text-primary)'>
          {title}
        </h2>
        <p className="m-0 mb-8 text-[13px] text-(--text-muted) leading-relaxed">
          {message}
        </p>
        <div className="flex items-center gap-4">
          <button
            onClick={onConfirm}
            className="text-[13px] font-medium text-red-400 bg-transparent border border-red-500/30 px-3 py-1.5 rounded-lg cursor-pointer hover:bg-red-500/10 transition-colors duration-150"
          >
            {confirmLabel}
          </button>
          <button
            onClick={onCancel}
            className="text-[13px] text-(--text-muted) bg-transparent border-none cursor-pointer hover:text-(--text-secondary) transition-colors duration-150"
          >
            Keep editing
          </button>
        </div>
      </div>
    </div>
  );
};
