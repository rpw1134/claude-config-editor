import { useEffect, useRef, useState } from "react";
import { fetchProjects, forkResource } from "../../lib/api";
import type { ForkResourceType, ProjectInfo } from "../../lib/api";

interface ForkModalProps {
  resourceType: ForkResourceType;
  name: string;
  sourceProjectPath: string;
  onClose: () => void;
  onSuccess: () => void;
}

type Status = "idle" | "loading" | "success" | "conflict" | "error";

const RESOURCE_LABEL: Record<ForkResourceType, string> = {
  agent: "Agent",
  skill: "Skill",
  mcp: "MCP server",
  grid: "Grid",
};

export const ForkModal = ({
  resourceType,
  name,
  sourceProjectPath,
  onClose,
  onSuccess,
}: ForkModalProps) => {
  const backdropRef = useRef<HTMLDivElement>(null);
  const [projects, setProjects] = useState<ProjectInfo[]>([]);
  const [projectsLoading, setProjectsLoading] = useState(true);
  const [selected, setSelected] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    fetchProjects()
      .then((data) => {
        const others = data
          .filter((p) => p.path !== sourceProjectPath)
          .sort((a, b) => {
            if (a.name === "global") return -1;
            if (b.name === "global") return 1;
            return a.name.localeCompare(b.name);
          });
        setProjects(others);
        setProjectsLoading(false);
      })
      .catch(() => setProjectsLoading(false));
  }, [sourceProjectPath]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  useEffect(() => {
    if (status === "success") {
      const t = setTimeout(() => { onSuccess(); onClose(); }, 1200);
      return () => clearTimeout(t);
    }
  }, [status, onSuccess, onClose]);

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === backdropRef.current) onClose();
  };

  const handleFork = async () => {
    if (!selected || status === "loading") return;
    setStatus("loading");
    setErrorMsg(null);
    try {
      await forkResource(resourceType, name, sourceProjectPath, selected);
      setStatus("success");
    } catch (err) {
      const e = err as Error & { status?: number };
      if (e.status === 409) {
        setStatus("conflict");
        setErrorMsg(e.message);
      } else {
        setStatus("error");
        setErrorMsg(e.message ?? "Fork failed");
      }
    }
  };

  const label = RESOURCE_LABEL[resourceType];
  const canFork = selected !== null && status !== "loading" && status !== "success";

  return (
    <div
      ref={backdropRef}
      onClick={handleBackdropClick}
      className="fixed inset-0 z-60 flex items-center justify-center bg-black/50 backdrop-blur-sm"
    >
      <div
        className="bg-(--bg-surface) rounded-2xl border border-(--border-subtle) w-full max-w-sm mx-4 shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-(--border-faint)">
          <h2 className='font-["Bricolage_Grotesque",sans-serif] m-0 text-[18px] font-semibold text-(--text-primary)'>
            Fork {label}
          </h2>
          <p className="m-0 mt-1 text-[13px] text-(--text-muted)">
            Copy <span className="font-mono text-(--text-secondary)">{name}</span> into another project
          </p>
        </div>

        {/* Project list */}
        <div className="max-h-56 overflow-y-auto">
          {projectsLoading ? (
            <p className="px-6 py-4 text-[13px] text-(--text-muted)">Loading projects…</p>
          ) : projects.length === 0 ? (
            <p className="px-6 py-4 text-[13px] text-(--text-muted)">No other projects available.</p>
          ) : (
            projects.map((project) => {
              const isSelected = project.path === selected;
              return (
                <button
                  key={project.path}
                  onClick={() => { setSelected(project.path); setStatus("idle"); setErrorMsg(null); }}
                  className={[
                    "w-full text-left px-6 py-3 border-none border-b border-(--border-faint) last:border-b-0 cursor-pointer transition-colors duration-100",
                    isSelected
                      ? "bg-(--accent-dim)"
                      : "bg-transparent hover:bg-(--bg-hover)",
                  ].join(" ")}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={[
                        "text-[14px] font-medium leading-tight",
                        isSelected ? "text-(--text-accent)" : "text-(--text-primary)",
                      ].join(" ")}
                    >
                      {project.name}
                    </span>
                    {project.name === "global" && (
                      <span className="inline-flex items-center px-1.5 py-px rounded text-[11px] font-semibold uppercase tracking-wider bg-(--bg-surface) text-(--text-muted) border border-(--border-subtle)">
                        Global
                      </span>
                    )}
                  </div>
                  <p className='font-["Fira_Code",monospace] text-[11px] text-(--text-muted) overflow-hidden text-ellipsis whitespace-nowrap mt-0.5 m-0'>
                    {project.path}
                  </p>
                </button>
              );
            })
          )}
        </div>

        {/* Status messages */}
        {(status === "conflict" || status === "error") && errorMsg && (
          <p className="mx-6 mt-3 text-[12px] text-rose-400">
            {errorMsg}
          </p>
        )}
        {status === "success" && (
          <p className="mx-6 mt-3 text-[12px] text-emerald-400">
            Forked successfully.
          </p>
        )}

        {/* Footer */}
        <div className="px-6 py-4 border-t border-(--border-faint) flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="text-[13px] text-(--text-muted) bg-transparent border-none cursor-pointer hover:text-(--text-secondary) transition-colors duration-150"
          >
            Cancel
          </button>
          <button
            onClick={handleFork}
            disabled={!canFork}
            className={[
              "text-[13px] font-medium px-4 py-1.5 rounded-lg border transition-colors duration-150",
              canFork
                ? "text-(--text-primary) border-(--border-subtle) bg-(--bg-elevated) hover:bg-(--bg-hover) cursor-pointer"
                : "text-(--text-muted) border-(--border-faint) bg-transparent cursor-not-allowed opacity-50",
            ].join(" ")}
          >
            {status === "loading" ? "Forking…" : "Fork"}
          </button>
        </div>
      </div>
    </div>
  );
};
