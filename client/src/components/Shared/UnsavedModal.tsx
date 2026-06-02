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
      className="bg-(--bg-surface) rounded-2xl border border-(--border-subtle) p-8 max-w-sm w-full mx-4 shadow-2xl"
      onClick={(e) => e.stopPropagation()}
    >
      <h2 className='font-["Bricolage_Grotesque",sans-serif] text-[20px] font-semibold text-(--text-primary) m-0 mb-2'>
        Unsaved changes
      </h2>
      <p className="text-[13px] text-(--text-muted) m-0 mb-8 leading-relaxed">
        Your unsaved changes will be lost.
      </p>
      <div className="flex items-center gap-4">
        <button
          onClick={onLeave}
          className="text-[13px] font-medium text-red-400 bg-transparent border border-red-500/30 px-3 py-1.5 rounded-lg cursor-pointer hover:bg-red-500/10 transition-colors duration-150"
        >
          Leave
        </button>
        <button
          onClick={onKeep}
          className="text-[13px] text-(--text-muted) bg-transparent border-none cursor-pointer hover:text-(--text-secondary) transition-colors duration-150"
        >
          Keep editing
        </button>
      </div>
    </div>
  </div>
);
