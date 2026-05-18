import { useEffect, useRef, useState } from "react";
import { fetchProjects } from "../../lib/api";
import type { ProjectInfo } from "../../lib/api";

interface ProjectPickerProps {
  selectedPath: string | null;
  onSelect: (path: string) => void;
  onNew?: () => void;
  refreshKey?: number;
}


const PlusIcon = () => (
  <svg
    width="12"
    height="12"
    viewBox="0 0 12 12"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M6 1.5V10.5M1.5 6H10.5"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
    />
  </svg>
);

// ── Modal ─────────────────────────────────────────────────────────────────────

interface ProjectModalProps {
  projects: ProjectInfo[];
  selectedPath: string | null;
  onSelect: (project: ProjectInfo) => void;
  onClose: () => void;
  onNew?: () => void;
}

const ProjectModal = ({
  projects,
  selectedPath,
  onSelect,
  onClose,
  onNew,
}: ProjectModalProps) => {
  const backdropRef = useRef<HTMLDivElement>(null);

  // Close on ESC
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === backdropRef.current) onClose();
  };

  return (
    <div
      ref={backdropRef}
      onClick={handleBackdropClick}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
    >
      <div
        className="w-105 max-h-130 flex flex-col rounded-2xl border border-(--border-default) bg-(--bg-elevated) overflow-hidden"
        style={{ boxShadow: "0 24px 64px rgba(0,0,0,0.6)" }}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-(--border-faint) shrink-0 flex items-center justify-between">
          <span className="text-[15px] font-semibold text-(--text-primary)">
            Switch Project
          </span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="text-(--text-muted) hover:text-(--text-primary) bg-transparent border-none cursor-pointer text-[20px] leading-none transition-colors flex items-center"
          >
            ×
          </button>
        </div>

        {/* Scrollable project list */}
        <div className="flex-1 overflow-y-auto min-h-0">
          {projects.length === 0 ? (
            <p className='px-5 py-4 text-[13px] text-(--text-muted) font-["Fira_Code",monospace]'>
              No projects found
            </p>
          ) : (
            projects.map((project) => {
              const isActive = project.path === selectedPath;
              const isGlobal = project.name === "global";
              return (
                <button
                  key={project.path}
                  onClick={() => onSelect(project)}
                  className={[
                    "w-full text-left px-5 py-3 flex items-start gap-3 border-none cursor-pointer transition-colors duration-100 border-b border-(--border-faint) last:border-b-0",
                    isActive
                      ? "bg-(--accent-dim)"
                      : "bg-transparent hover:bg-(--bg-hover)",
                  ].join(" ")}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span
                        className={[
                          "text-[14px] font-medium leading-tight",
                          isActive
                            ? "text-(--text-accent)"
                            : "text-(--text-primary)",
                        ].join(" ")}
                      >
                        {project.name}
                      </span>
                      {isGlobal && (
                        <span className="inline-flex items-center px-1.5 py-px rounded text-[11px] font-semibold uppercase tracking-wider bg-(--bg-surface) text-(--text-muted) border border-(--border-subtle)">
                          Global
                        </span>
                      )}
                    </div>
                    <p className='font-["Fira_Code",monospace] text-[11px] text-(--text-muted) overflow-hidden text-ellipsis whitespace-nowrap mt-0.5 m-0'>
                      {project.path}
                    </p>
                  </div>
                  {isActive && (
                    <span className="shrink-0 mt-1.5 w-1.5 h-1.5 rounded-full bg-(--accent)" />
                  )}
                </button>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-(--border-faint) shrink-0">
          {onNew ? (
            <button
              type="button"
              onClick={() => { onNew(); onClose(); }}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-(--border-subtle) bg-transparent text-(--text-secondary) text-[13px] font-medium cursor-pointer hover:bg-(--bg-elevated) hover:text-(--text-primary) transition-colors"
            >
              <PlusIcon />
              Add project
            </button>
          ) : (
            <button
              type="button"
              disabled
              className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-(--border-subtle) bg-transparent text-(--text-muted) text-[13px] font-medium cursor-not-allowed opacity-50 transition-colors"
            >
              <PlusIcon />
              Add project
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// ── ProjectPicker ─────────────────────────────────────────────────────────────

export const ProjectPicker = ({
  selectedPath,
  onSelect,
  onNew,
  refreshKey,
}: ProjectPickerProps) => {
  const [projects, setProjects] = useState<ProjectInfo[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProjects()
      .then((data) => {
        const global = data.filter((p) => p.name === "global");
        const rest = data
          .filter((p) => p.name !== "global")
          .sort((a, b) => a.name.localeCompare(b.name));
        setProjects([...global, ...rest]);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [refreshKey]);

  const selected = projects.find((p) => p.path === selectedPath) ?? null;

  const handleSelect = (project: ProjectInfo) => {
    onSelect(project.path);
    setOpen(false);
  };

  return (
    <div className="p-3 border-b border-(--border-faint)">
      <p className="px-2 mb-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-(--text-muted)">
        Project
      </p>
      <button
        onClick={() => setOpen(true)}
        className={[
          "w-full flex items-center justify-between gap-2 px-3 py-2 rounded-md text-left text-[14px] min-h-9 cursor-pointer border border-(--border-subtle) transition-all duration-150",
          selected
            ? "bg-(--bg-surface) text-(--text-secondary) hover:bg-(--bg-elevated) hover:text-(--text-secondary)"
            : "bg-(--bg-surface) text-(--text-muted) hover:bg-(--bg-elevated) hover:text-(--text-secondary)",
        ].join(" ")}
      >
        {loading ? (
          <span className='font-["Fira_Code",monospace] text-(--text-muted) text-[13px]'>
            Loading…
          </span>
        ) : selected ? (
          <span className="font-medium overflow-hidden text-ellipsis whitespace-nowrap">
            {selected.name}
          </span>
        ) : (
          <span className="italic text-(--text-muted)">Select a project…</span>
        )}
      </button>

      {open && (
        <ProjectModal
          projects={projects}
          selectedPath={selectedPath}
          onSelect={handleSelect}
          onClose={() => setOpen(false)}
          onNew={onNew}
        />
      )}
    </div>
  );
};
