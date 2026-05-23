import { useEffect, useRef, useState } from 'react';

interface EdgeDescriptionModalProps {
  initialDescription?: string;
  onConfirm: (description: string) => void;
  onCancel: () => void;
}

export const EdgeDescriptionModal = ({
  initialDescription = '',
  onConfirm,
  onCancel,
}: EdgeDescriptionModalProps) => {
  const [value, setValue] = useState(initialDescription);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    textareaRef.current?.focus();
    // Place cursor at end of pre-filled text
    const len = initialDescription.length;
    textareaRef.current?.setSelectionRange(len, len);
  }, [initialDescription]);

  const handleConfirm = () => {
    if (value.trim()) onConfirm(value.trim());
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleConfirm(); }
    if (e.key === 'Escape') onCancel();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}
    >
      <div
        className="w-105 bg-(--bg-elevated) border border-(--border-subtle) rounded-2xl shadow-2xl p-6 flex flex-col gap-4"
        style={{ animation: 'modalFadeIn 0.18s ease-out both' }}
        onKeyDown={handleKey}
      >
        <div>
          <h3 className="text-[16px] font-bold text-(--text-primary) m-0 mb-1">
            Connection Directions
          </h3>
          <p className="text-[13px] text-(--text-muted) m-0">
            These directions will be appended verbatim to the agent's invocation message and become part of its system context. Be clear and concise — write them as instructions.
          </p>
        </div>
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="e.g. Use this agent when the user asks about billing or subscription issues."
          rows={3}
          className="w-full bg-(--bg-surface) border border-(--border-subtle) rounded-xl px-3.5 py-2.5 text-[13px] text-(--text-primary) resize-none outline-none focus:outline-none focus:border-(--accent) transition-colors duration-120 placeholder:text-(--text-muted)"
        />
        <div className="flex items-center justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-lg text-[13px] font-medium text-(--text-secondary) bg-transparent border border-(--border-subtle) cursor-pointer hover:bg-white/5 transition-colors duration-120"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={!value.trim()}
            className="px-4 py-2 rounded-lg text-[13px] font-semibold text-(--bg-base) bg-(--accent) border-none cursor-pointer hover:bg-(--accent-hover) transition-colors duration-120 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Save Directions
          </button>
        </div>
      </div>
    </div>
  );
};
