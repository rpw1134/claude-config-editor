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
      <div className="flex items-center gap-3">
        <button
          onClick={onKeep}
          className="text-[13px] font-semibold text-(--accent) bg-(--accent)/10 border border-(--accent)/20 px-5 py-2.5 rounded-xl cursor-pointer hover:bg-(--accent)/15 transition-all duration-150"
        >
          Keep editing
        </button>
        <button
          onClick={onLeave}
          className="text-[13px] font-medium text-(--text-secondary) bg-white/5 border border-white/12 px-5 py-2.5 rounded-xl cursor-pointer hover:bg-white/9 hover:border-white/20 hover:text-(--text-primary) transition-all duration-150"
        >
          Leave
        </button>
      </div>
    </div>
  </div>
);
