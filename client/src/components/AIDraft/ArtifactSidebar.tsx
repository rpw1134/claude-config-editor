import { useAIDraft } from "../../contexts/AIDraftContext";
import { XIcon } from "../Icons";
import { ArtifactCard } from "./ArtifactCard";

// ── Type labels ───────────────────────────────────────────────────────────────

const TYPE_LABELS: Record<string, string> = {
  agent: "Agent",
  skill: "Skill",
  "claude-md": "CLAUDE.md",
  link: "Link",
  mcp: "MCP Server",
  hook: "Hook",
};

// ── Nav arrow ─────────────────────────────────────────────────────────────────

interface NavArrowProps {
  direction: "prev" | "next";
  disabled: boolean;
  onClick: () => void;
}

const NavArrow = ({ direction, disabled, onClick }: NavArrowProps) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className="w-7 h-7 flex items-center justify-center rounded-lg bg-transparent border-none cursor-pointer text-(--text-muted) hover:text-(--text-primary) hover:bg-(--bg-hover) transition-all duration-150 disabled:opacity-25 disabled:cursor-not-allowed"
  >
    <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
      <path
        d={direction === "prev" ? "M7.5 2L4 6L7.5 10" : "M4.5 2L8 6L4.5 10"}
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  </button>
);

// ── ArtifactSidebar ───────────────────────────────────────────────────────────

export const ArtifactSidebar = () => {
  const {
    artifacts,
    sidebarOpen,
    activeArtifactIndex,
    setSidebarOpen,
    setActiveArtifactIndex,
  } = useAIDraft();

  const activeArtifact = artifacts[activeArtifactIndex] ?? null;
  const total = artifacts.length;
  const typeLabel = activeArtifact ? (TYPE_LABELS[activeArtifact.type] ?? activeArtifact.type) : "Draft";

  return (
    <div
      className="shrink-0 flex flex-col h-full bg-(--bg-surface) border-l border-(--border-faint) overflow-hidden transition-[width] duration-300 ease-in-out"
      style={{ width: sidebarOpen ? 420 : 0 }}
    >
      {sidebarOpen && (
        <>
          {/* Header */}
          <div className="shrink-0 flex items-center gap-2 px-5 h-13 border-b border-(--border-faint)">
            <span className="flex-1 text-[11px] font-semibold uppercase tracking-widest text-(--text-muted) select-none">
              {typeLabel}
            </span>

            {total > 1 && (
              <div className="flex items-center gap-0.5">
                <NavArrow
                  direction="prev"
                  disabled={activeArtifactIndex === 0}
                  onClick={() => setActiveArtifactIndex(activeArtifactIndex - 1)}
                />
                <span className="text-[12px] text-(--text-muted) min-w-10.5 text-center font-medium tabular-nums">
                  {activeArtifactIndex + 1} / {total}
                </span>
                <NavArrow
                  direction="next"
                  disabled={activeArtifactIndex === total - 1}
                  onClick={() => setActiveArtifactIndex(activeArtifactIndex + 1)}
                />
              </div>
            )}

            <button
              onClick={() => setSidebarOpen(false)}
              className="w-7 h-7 flex items-center justify-center rounded-lg bg-transparent border-none cursor-pointer text-(--text-muted) hover:text-(--text-primary) hover:bg-(--bg-hover) transition-all duration-150 ml-1"
            >
              <XIcon />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 min-h-0 flex flex-col">
            {activeArtifact ? (
              <ArtifactCard key={activeArtifact.id} artifact={activeArtifact} />
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center gap-2 px-6 text-center">
                <p className="text-[14px] text-(--text-muted)">No drafts yet.</p>
                <p className="text-[13px] text-(--text-muted)">
                  Ask me to create an agent or skill.
                </p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};
