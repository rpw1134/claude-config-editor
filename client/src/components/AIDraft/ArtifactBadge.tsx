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
        "absolute top-4 right-4 z-10",
        "flex items-center gap-2 px-3.5 py-2 rounded-xl border",
        "text-[13px] font-semibold cursor-pointer",
        "transition-all duration-200",
        sidebarOpen
          ? "bg-(--bg-elevated) border-(--border-subtle) text-(--text-secondary) hover:text-(--text-primary)"
          : hasUnsaved
            ? "bg-(--accent)/8 border-(--accent)/25 text-(--accent) shadow-[0_0_16px_rgba(0,229,255,0.10)]"
            : "bg-(--bg-elevated) border-(--border-subtle) text-(--text-secondary) hover:border-(--border-default) hover:text-(--text-primary)",
      ].join(" ")}
    >
      <span className={hasUnsaved && !sidebarOpen ? "text-(--accent)" : "text-(--text-muted)"}>
        <ArtifactsIcon />
      </span>

      <span>Drafts</span>

      <span
        className={[
          "min-w-5 h-5 px-1.5 rounded-lg flex items-center justify-center text-[11px] font-bold leading-none",
          hasUnsaved && !sidebarOpen
            ? "bg-(--accent) text-black"
            : "bg-(--bg-hover) text-(--text-muted)",
        ].join(" ")}
      >
        {total}
      </span>
    </button>
  );
};
