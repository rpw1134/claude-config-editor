import { useAIDraft } from "../../contexts/AIDraftContext";
import { XIcon } from "../Icons";
import { ArtifactCard } from "./ArtifactCard";

// ── Nav arrows ────────────────────────────────────────────────────────────────

interface NavArrowProps {
  direction: "prev" | "next";
  disabled: boolean;
  onClick: () => void;
}

const NavArrow = ({ direction, disabled, onClick }: NavArrowProps) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className="w-6 h-6 flex items-center justify-center rounded-md bg-transparent border-none cursor-pointer text-(--text-muted) hover:text-(--text-primary) hover:bg-(--bg-hover) transition-all duration-150 disabled:opacity-30 disabled:cursor-not-allowed"
  >
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
      <path
        d={direction === "prev" ? "M7.5 2L4 6L7.5 10" : "M4.5 2L8 6L4.5 10"}
        stroke="currentColor"
        strokeWidth="1.4"
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

  return (
    <div
      className="shrink-0 flex flex-col h-full bg-(--bg-surface) border-l border-(--border-faint) overflow-hidden transition-[width] duration-250 ease-in-out"
      style={{ width: sidebarOpen ? 360 : 0 }}
    >
      {/* Only render content when open to avoid layout jank */}
      {sidebarOpen && (
        <>
          {/* Header */}
          <div className="shrink-0 flex items-center gap-2 px-4 py-3.5 border-b border-(--border-faint)">
            <h2 className='flex-1 m-0 text-[15px] font-["Bricolage_Grotesque",sans-serif] font-semibold text-(--text-primary)'>
              Drafts
            </h2>

            {/* Navigation */}
            {total > 1 && (
              <div className="flex items-center gap-1">
                <NavArrow
                  direction="prev"
                  disabled={activeArtifactIndex === 0}
                  onClick={() => setActiveArtifactIndex(activeArtifactIndex - 1)}
                />
                <span className="text-[12px] text-(--text-muted) min-w-[40px] text-center">
                  {activeArtifactIndex + 1} / {total}
                </span>
                <NavArrow
                  direction="next"
                  disabled={activeArtifactIndex === total - 1}
                  onClick={() => setActiveArtifactIndex(activeArtifactIndex + 1)}
                />
              </div>
            )}

            {total <= 1 && total > 0 && (
              <span className="text-[12px] text-(--text-muted)">
                {total} draft{total !== 1 ? "s" : ""}
              </span>
            )}

            <button
              onClick={() => setSidebarOpen(false)}
              className="w-7 h-7 flex items-center justify-center rounded-md bg-transparent border-none cursor-pointer text-(--text-muted) hover:text-(--text-primary) hover:bg-(--bg-hover) transition-all duration-150"
            >
              <XIcon />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 min-h-0 flex flex-col">
            {activeArtifact ? (
              <ArtifactCard artifact={activeArtifact} />
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center gap-2 px-6 text-center">
                <p className="text-[14px] text-(--text-muted)">
                  No drafts yet.
                </p>
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
