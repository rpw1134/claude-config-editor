import { useEffect, useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { useShell } from "../contexts/ShellContext";
import { decodeProject, encodeProject } from "../lib/navigation";
import { listGrids, createGrid } from "../lib/api";
import type { GridSummary } from "../types/grids";
import { GridsIcon } from "../components/Icons";

export { GridEditor } from "./grid/GridEditor";

interface GridCardRowProps {
  grid: GridSummary;
  onClick: () => void;
  isLast: boolean;
}

const GridCardRow = ({ grid, onClick, isLast }: GridCardRowProps) => (
  <button
    onClick={onClick}
    className={[
      "w-full flex items-center gap-5 pl-6 pr-4 min-h-20 text-left cursor-pointer",
      "bg-transparent transition-colors duration-120 border-none hover:bg-(--bg-hover)",
      !isLast ? "border-b border-(--border-faint)" : "",
    ].join(" ")}
  >
    <div className="w-9 h-9 rounded-xl bg-(--accent)/10 flex items-center justify-center shrink-0 text-(--accent)">
      <GridsIcon size={16} />
    </div>
    <div className="flex flex-col gap-0.5 flex-1 min-w-0">
      <span className="font-['Instrument_Sans',sans-serif] text-[18px] font-semibold text-(--text-primary) truncate">
        {grid.name}
      </span>
      {grid.description && (
        <span className="text-[13px] text-(--text-muted) truncate">
          {grid.description}
        </span>
      )}
    </div>
    <svg
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      className="text-(--text-muted) shrink-0"
    >
      <path
        d="M5.5 3L9.5 7L5.5 11"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  </button>
);

interface CreateGridModalProps {
  onConfirm: (name: string, description: string) => void;
  onClose: () => void;
}

const CreateGridModal = ({ onConfirm, onClose }: CreateGridModalProps) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const nameError = submitted && !name.trim() ? "Name is required" : null;
  const descriptionError =
    submitted && !description.trim() ? "Description is required" : null;

  const handleSubmit = () => {
    setSubmitted(true);
    if (name.trim() && description.trim())
      onConfirm(name.trim(), description.trim());
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="w-110 bg-(--bg-elevated) border border-(--border-subtle) rounded-2xl shadow-2xl p-7 flex flex-col gap-5"
        style={{ animation: "modalFadeIn 0.18s ease-out both" }}
      >
        <div>
          <h2 className="text-[18px] font-bold text-(--text-primary) m-0 mb-1.5 font-['Bricolage_Grotesque',sans-serif]">
            New Grid
          </h2>
          <p className="text-[13px] text-(--text-muted) m-0">
            A Grid is a visual orchestration system. You'll connect agents and
            skills to auto-generate an orchestrator agent.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <div>
            <label className="text-[12px] font-semibold text-(--text-secondary) uppercase tracking-[0.08em] block mb-1.5">
              Name
            </label>
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSubmit();
                if (e.key === "Escape") onClose();
              }}
              placeholder="my-orchestration"
              className={[
                "w-full bg-(--bg-surface) border rounded-xl px-3.5 py-2.5 text-[14px] text-(--text-primary) outline-none focus:outline-none transition-colors duration-120 placeholder:text-(--text-muted) font-mono",
                nameError
                  ? "border-red-500/60 focus:border-red-500/80"
                  : "border-(--border-subtle) focus:border-(--accent)",
              ].join(" ")}
            />
            {nameError && (
              <p className="text-[12px] text-red-400 mt-1.5 m-0">{nameError}</p>
            )}
          </div>
          <div>
            <label className="text-[12px] font-semibold text-(--text-secondary) uppercase tracking-[0.08em] block mb-1.5">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSubmit(); }
                if (e.key === "Escape") onClose();
              }}
              placeholder="What does this orchestrator do?"
              rows={3}
              className={[
                "w-full bg-(--bg-surface) border rounded-xl px-3.5 py-2.5 text-[14px] text-(--text-primary) outline-none focus:outline-none transition-colors duration-120 placeholder:text-(--text-muted) resize-none",
                descriptionError
                  ? "border-red-500/60 focus:border-red-500/80"
                  : "border-(--border-subtle) focus:border-(--accent)",
              ].join(" ")}
            />
            {descriptionError && (
              <p className="text-[12px] text-red-400 mt-1.5 m-0">
                {descriptionError}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-[13px] font-medium text-(--text-secondary) bg-transparent border border-(--border-subtle) cursor-pointer hover:bg-white/5 transition-colors duration-120"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="px-5 py-2 rounded-lg text-[13px] font-semibold text-(--bg-base) bg-(--accent) border-none cursor-pointer hover:bg-(--accent-hover) transition-colors duration-120"
          >
            Create Grid
          </button>
        </div>
      </div>
    </div>
  );
};

export const GridsLandingContent = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { gridsRefreshKey, onBumpGridsRefresh, onBumpVcRefresh, showToast } =
    useShell();
  const projectPath = projectId ? decodeProject(projectId) : null;

  const [grids, setGrids] = useState<GridSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => {
    if (!projectPath) return;
    let cancelled = false;
    listGrids(projectPath)
      .then((data) => {
        if (cancelled) return;
        setGrids(data);
        setLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setGrids([]);
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [projectPath, gridsRefreshKey]);

  if (!projectPath) return <Navigate to="/" replace />;

  const handleCreate = async (name: string, description: string) => {
    try {
      await createGrid(projectPath, name, description);
      onBumpGridsRefresh();
      onBumpVcRefresh();
      showToast(`Grid "${name}" created`);
      setShowCreate(false);
      navigate(
        `/${encodeProject(projectPath)}/grids/${encodeURIComponent(name)}`,
      );
    } catch {
      showToast("Failed to create grid");
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-y-auto bg-(--bg-base)">
      <div className="w-full px-14 pt-16 pb-12">
        <div className="flex items-center justify-between mb-10">
          <h1 className="font-['Bricolage_Grotesque',sans-serif] text-[40px] font-bold text-(--text-primary) tracking-[-0.03em] leading-[1.05] m-0">
            Grids
          </h1>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-1.75 px-4 py-2 rounded-lg border-none bg-white text-gray-900 text-[14px] font-semibold cursor-pointer shrink-0 transition-all duration-150 hover:bg-white/90"
          >
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
              <path
                d="M6.5 1.5V11.5M1.5 6.5H11.5"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
              />
            </svg>
            New Grid
          </button>
        </div>

        <p className="text-[14px] text-(--text-muted) mb-8 mt-0 max-w-130 leading-relaxed">
          Grids are visual multi-agent orchestration systems. Connect agents and
          skills on a canvas to auto-generate an orchestrator agent that routes
          tasks intelligently.
        </p>

        {!loading && grids.length === 0 && (
          <div className="pt-16 flex flex-col items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-(--accent)/8 flex items-center justify-center text-(--accent)/60">
              <GridsIcon size={20} />
            </div>
            <p className="text-[15px] text-(--text-muted) m-0">No grids yet</p>
            <button
              onClick={() => setShowCreate(true)}
              className="text-[13px] font-medium text-(--accent) bg-transparent border-none cursor-pointer hover:underline"
            >
              Create your first grid
            </button>
          </div>
        )}

        {!loading && grids.length > 0 && (
          <div className="border border-(--border-faint) rounded-xl overflow-hidden">
            {grids.map((g, i) => (
              <GridCardRow
                key={g.name}
                grid={g}
                isLast={i === grids.length - 1}
                onClick={() =>
                  navigate(
                    `/${encodeProject(projectPath)}/grids/${encodeURIComponent(g.name)}`,
                  )
                }
              />
            ))}
          </div>
        )}
      </div>

      {showCreate && (
        <CreateGridModal
          onConfirm={handleCreate}
          onClose={() => setShowCreate(false)}
        />
      )}
    </div>
  );
};

export const GridEditorContent = () => {
  const { projectId, name } = useParams<{ projectId: string; name: string }>();
  if (!projectId || !name) return <Navigate to="/" replace />;
  return null;
};
