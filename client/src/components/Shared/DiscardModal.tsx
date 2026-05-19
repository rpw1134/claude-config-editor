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
        className="bg-(--bg-surface) rounded-4.5 border border-(--border-subtle) p-8 max-w-90 w-full mx-4 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="m-0 mb-2 text-[20px] font-bold text-(--text-primary)">
          {title}
        </h2>
        <p className="m-0 mb-6 text-[14px] text-(--text-secondary)">
          {message}
        </p>
        <div className="flex items-center gap-3">
          <button
            onClick={onConfirm}
            className="px-5 py-2.5 rounded-2.5 text-[14px] font-medium text-white bg-(--error) border-none cursor-pointer transition-colors duration-150"
          >
            {confirmLabel}
          </button>
          <button
            onClick={onCancel}
            className="text-[14px] text-(--text-muted) bg-transparent border-none cursor-pointer transition-colors duration-150 hover:text-(--text-secondary)"
          >
            Keep editing
          </button>
        </div>
      </div>
    </div>
  );
};
