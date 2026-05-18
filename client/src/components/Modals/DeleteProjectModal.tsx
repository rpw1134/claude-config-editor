import { useEffect, useRef, useState } from "react";
import { deleteProject } from "../../lib/api";

// ── Icons ─────────────────────────────────────────────────────────────────────

const CloseIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
    <path d="M1.293 1.293a1 1 0 0 1 1.414 0L7 5.586l4.293-4.293a1 1 0 1 1 1.414 1.414L8.414 7l4.293 4.293a1 1 0 0 1-1.414 1.414L7 8.414l-4.293 4.293a1 1 0 0 1-1.414-1.414L5.586 7 1.293 2.707a1 1 0 0 1 0-1.414z" />
  </svg>
);

// ── DeleteProjectModal ────────────────────────────────────────────────────────

export interface DeleteProjectModalProps {
  projectName: string;
  projectPath: string;
  onDeleted: () => void;
  onClose: () => void;
}

export const DeleteProjectModal = ({
  projectName,
  projectPath,
  onDeleted,
  onClose,
}: DeleteProjectModalProps) => {
  const [confirmValue, setConfirmValue] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const isConfirmed = confirmValue === projectName;

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  const handleDelete = async () => {
    if (!isConfirmed || deleting) return;
    setDeleting(true);
    setError(null);
    try {
      await deleteProject(projectPath);
      onDeleted();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setDeleting(false);
    }
  };

  const inputClass = [
    'w-full px-4 py-3 rounded-xl text-[14px] font-["Fira_Code",monospace]',
    "bg-(--bg-elevated) text-(--text-primary) outline-none outline-0 focus:outline-none focus:ring-0 transition-colors duration-150 box-border",
    "border border-(--border-subtle) focus:border-(--accent)",
  ].join(" ");

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="w-full max-w-md mx-4 bg-(--bg-surface) border border-(--border-subtle) rounded-2xl p-8 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <h2 className='text-[22px] font-semibold text-(--text-primary) leading-tight font-["Bricolage_Grotesque",sans-serif] m-0'>
            Delete project?
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 w-8 h-8 flex items-center justify-center rounded-lg text-(--text-muted) hover:text-(--text-primary) hover:bg-(--bg-elevated) transition-colors duration-150 cursor-pointer border-none bg-transparent"
            aria-label="Close"
          >
            <CloseIcon />
          </button>
        </div>

        {/* Warning text */}
        <div className="flex flex-col gap-3 mb-6">
          <p className="m-0 text-[14px] text-(--text-secondary) leading-relaxed">
            This will permanently delete the{" "}
            <span className='font-["Fira_Code",monospace] text-[13px] text-(--text-primary) bg-(--bg-elevated) px-1.5 py-0.5 rounded-md'>
              .claude/
            </span>{" "}
            directory for this project, removing all agents, skills, MCP server
            configs, and{" "}
            <span className='font-["Fira_Code",monospace] text-[13px] text-(--text-primary) bg-(--bg-elevated) px-1.5 py-0.5 rounded-md'>
              CLAUDE.md
            </span>
            .
          </p>
          <p className="m-0 text-[14px] text-(--text-secondary) leading-relaxed">
            Your project's code and files are{" "}
            <span className="font-semibold text-(--text-primary)">
              not affected
            </span>{" "}
            — only Claude Code configuration is removed.
          </p>
        </div>

        <div className="border-t border-(--border-subtle) mb-6" />

        {/* Confirmation input */}
        <div className="mb-5">
          <label className="block text-[11px] font-medium text-(--text-muted) tracking-widest uppercase mb-3">
            Type the project name to confirm
          </label>
          <input
            ref={inputRef}
            type="text"
            value={confirmValue}
            onChange={(e) => setConfirmValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && isConfirmed) handleDelete();
            }}
            placeholder={projectName}
            className={inputClass}
            autoComplete="off"
            spellCheck={false}
          />
        </div>

        {/* Error */}
        {error && (
          <p className="mb-4 text-[12px] text-(--error) font-['Fira_Code',monospace]">
            {error}
          </p>
        )}

        {/* Actions */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleDelete}
            disabled={!isConfirmed || deleting}
            className={[
              "flex-1 py-3 rounded-xl text-[14px] font-semibold transition-colors duration-150 border-none",
              isConfirmed && !deleting
                ? "bg-(--error) text-white cursor-pointer hover:opacity-90"
                : "bg-(--bg-elevated) text-(--text-muted) border border-(--border-subtle) cursor-not-allowed",
            ].join(" ")}
          >
            {deleting ? "Deleting…" : "Delete project"}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="text-[14px] text-(--text-muted) bg-transparent border-none cursor-pointer transition-colors duration-150 hover:text-(--text-secondary)"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
