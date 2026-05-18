interface UnsavedModalProps {
  onLeave: () => void;
  onKeep: () => void;
}

export const UnsavedModal = ({ onLeave, onKeep }: UnsavedModalProps) => (
  <div
    className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
    onClick={onKeep}
  >
    <div
      className="bg-(--bg-surface) rounded-4.5 border border-(--border-subtle) p-8 max-w-90 w-full mx-4 shadow-2xl"
      onClick={(e) => e.stopPropagation()}
    >
      <h2 className="m-0 mb-2 text-[20px] font-bold text-(--text-primary)">
        Unsaved changes
      </h2>
      <p className="m-0 mb-6 text-[14px] text-(--text-secondary)">
        Leave without saving? Your changes will be lost.
      </p>
      <div className="flex items-center gap-3">
        <button
          onClick={onLeave}
          className="px-5 py-2.5 rounded-2.5 text-[14px] font-medium text-white bg-(--error) border-none cursor-pointer transition-colors duration-150"
        >
          Leave
        </button>
        <button
          onClick={onKeep}
          className="text-[14px] text-(--text-muted) bg-transparent border-none cursor-pointer transition-colors duration-150 hover:text-(--text-secondary)"
        >
          Keep editing
        </button>
      </div>
    </div>
  </div>
);
