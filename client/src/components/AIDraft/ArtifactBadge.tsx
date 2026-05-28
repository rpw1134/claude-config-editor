import { useAIDraft } from "../../contexts/AIDraftContext";
import { ArtifactsIcon } from "../Icons";

// ── ArtifactBadge ─────────────────────────────────────────────────────────────

export const ArtifactBadge = () => {
  const { artifacts, sidebarOpen, setSidebarOpen } = useAIDraft();
  const total = artifacts.length;

  if (total === 0 || sidebarOpen) return null;

  return (
    <button
      onClick={() => setSidebarOpen(true)}
      title="Open drafts"
      className="absolute top-4 right-4 z-10 flex items-center gap-2 px-3.5 py-2 rounded-xl border bg-(--bg-elevated) border-(--border-subtle) text-(--text-secondary) hover:border-(--border-default) hover:text-(--text-primary) text-[13px] font-semibold cursor-pointer transition-all duration-200"
    >
      <span className="text-(--text-muted)">
        <ArtifactsIcon />
      </span>
      <span>Drafts</span>
      <span className="min-w-5 h-5 px-1.5 rounded-lg flex items-center justify-center text-[11px] font-bold leading-none bg-(--bg-hover) text-(--text-muted)">
        {total}
      </span>
    </button>
  );
};
