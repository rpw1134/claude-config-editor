import type { Artifact } from "../../types/aiDraft";

const TYPE_LABELS: Record<Artifact["type"], string> = {
  agent: "Agent",
  skill: "Skill",
  "claude-md": "CLAUDE.md",
};

const TYPE_COLORS: Record<Artifact["type"], string> = {
  agent: "bg-violet-500/15 text-violet-400",
  skill: "bg-amber-500/15 text-amber-400",
  "claude-md": "bg-sky-500/15 text-sky-400",
};

interface AIDraftUnsavedModalProps {
  unsavedArtifacts: Artifact[];
  onLeave: () => void;
  onKeep: () => void;
}

export const AIDraftUnsavedModal = ({
  unsavedArtifacts,
  onLeave,
  onKeep,
}: AIDraftUnsavedModalProps) => {
  const count = unsavedArtifacts.length;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={onKeep}
    >
      <div
        className="bg-(--bg-surface) rounded-2xl border border-(--border-subtle) p-8 max-w-sm w-full mx-4 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className='font-["Bricolage_Grotesque",sans-serif] text-[20px] font-semibold text-(--text-primary) m-0 mb-2'>
          Leave without saving?
        </h2>
        <p className="text-[13px] text-(--text-muted) m-0 mb-3 leading-relaxed">
          {count === 1 ? "1 unsaved draft" : `${count} unsaved drafts`} will be
          permanently discarded:
        </p>

        <ul className="list-none m-0 p-0 mb-6 flex flex-col gap-1.5">
          {unsavedArtifacts.map((a) => (
            <li key={a.id} className="flex items-center gap-2">
              <span
                className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold ${TYPE_COLORS[a.type]}`}
              >
                {TYPE_LABELS[a.type]}
              </span>
              <span className="text-[13px] text-(--text-secondary) truncate">
                {a.name}
              </span>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-3">
          <button
            onClick={onKeep}
            className="text-[13px] font-semibold text-(--accent) bg-(--accent)/10 border border-(--accent)/20 px-5 py-2.5 rounded-xl cursor-pointer hover:bg-(--accent)/15 transition-all duration-150"
          >
            Keep editing
          </button>
          <button
            onClick={onLeave}
            className="text-[13px] font-semibold text-red-400 bg-red-500/10 border border-red-500/20 px-5 py-2.5 rounded-xl cursor-pointer hover:bg-red-500/15 transition-all duration-150"
          >
            Leave and discard
          </button>
        </div>
      </div>
    </div>
  );
};
