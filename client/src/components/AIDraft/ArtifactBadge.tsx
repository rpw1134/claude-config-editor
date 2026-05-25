import { useAIDraft } from "../../contexts/AIDraftContext";
import { ArtifactsIcon } from "../Icons";

// ── ArtifactBadge ─────────────────────────────────────────────────────────────

export const ArtifactBadge = () => {
  const { artifacts, sidebarOpen, setSidebarOpen, unsavedCount } = useAIDraft();
  const total = artifacts.length;

  if (total === 0) return null;

  const hasUnsaved = unsavedCount > 0;

  return (
    <button
      onClick={() => setSidebarOpen(!sidebarOpen)}
      title={sidebarOpen ? "Close drafts" : "Open drafts"}
      className={[
        "absolute top-3 right-3 z-10 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-[12px] font-semibold transition-all duration-150 cursor-pointer",
        sidebarOpen
          ? "bg-(--bg-elevated) border-(--border-subtle) text-(--text-secondary) hover:text-(--text-primary)"
          : hasUnsaved
            ? "bg-(--accent)/10 border-(--accent)/25 text-(--accent) hover:bg-(--accent)/15"
            : "bg-(--bg-elevated) border-(--border-subtle) text-(--text-secondary) hover:text-(--text-primary)",
      ].join(" ")}
    >
      <span className={hasUnsaved && !sidebarOpen ? "text-(--accent)" : "text-(--text-muted)"}>
        <ArtifactsIcon />
      </span>
      <span className="relative">
        Drafts
        {hasUnsaved && !sidebarOpen && (
          <span className="absolute -top-1.5 -right-3 min-w-3.5 h-3.5 px-0.5 flex items-center justify-center rounded-full bg-(--accent) text-[9px] font-bold text-white animate-pulse leading-none">
            {unsavedCount > 9 ? "9+" : unsavedCount}
          </span>
        )}
      </span>
    </button>
  );
};
