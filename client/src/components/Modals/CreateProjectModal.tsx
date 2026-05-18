import { useEffect, useRef, useState } from "react";
import { createProject } from "../../lib/api";

// ── Icons ─────────────────────────────────────────────────────────────────────

const CloseIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
    <path d="M1.293 1.293a1 1 0 0 1 1.414 0L7 5.586l4.293-4.293a1 1 0 1 1 1.414 1.414L8.414 7l4.293 4.293a1 1 0 0 1-1.414 1.414L7 8.414l-4.293 4.293a1 1 0 0 1-1.414-1.414L5.586 7 1.293 2.707a1 1 0 0 1 0-1.414z" />
  </svg>
);

// ── DiscardModal ──────────────────────────────────────────────────────────────

const DiscardModal = ({
  onConfirm,
  onCancel,
}: {
  onConfirm: () => void;
  onCancel: () => void;
}) => {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onCancel]);

  return (
    <div
      className="fixed inset-0 z-60 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={onCancel}
    >
      <div
        className="bg-(--bg-surface) rounded-4.5 border border-(--border-subtle) p-8 max-w-90 w-full mx-4 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="m-0 mb-2 text-[20px] font-bold text-(--text-primary)">
          Discard this project?
        </h2>
        <p className="m-0 mb-6 text-[14px] text-(--text-secondary)">
          You'll lose the path you've entered.
        </p>
        <div className="flex items-center gap-3">
          <button
            onClick={onConfirm}
            className="px-5 py-2.5 rounded-2.5 text-[14px] font-medium text-white bg-(--error) border-none cursor-pointer transition-colors duration-150"
          >
            Discard
          </button>
          <button
            onClick={onCancel}
            className="text-[14px] text-(--text-muted) bg-transparent border-none cursor-pointer transition-colors duration-150 hover:text-(--text-secondary)"
          >
            Keep editing
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Field ─────────────────────────────────────────────────────────────────────

interface FieldProps {
  label: string;
  children: React.ReactNode;
}

const Field = ({ label, children }: FieldProps) => (
  <div>
    <label className="block text-[11px] font-medium text-(--text-muted) tracking-widest uppercase mb-3">
      {label}
    </label>
    {children}
  </div>
);

// ── CreateProjectModal ────────────────────────────────────────────────────────

export interface CreateProjectModalProps {
  onSuccess: (absolutePath: string, name: string) => void;
  onClose: () => void;
}

export const CreateProjectModal = ({
  onSuccess,
  onClose,
}: CreateProjectModalProps) => {
  const [pathSuffix, setPathSuffix] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);

  const hasData = pathSuffix !== "";

  const handleClose = () => {
    if (hasData) {
      setShowDiscardConfirm(true);
    } else {
      onClose();
    }
  };

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (showDiscardConfirm) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showDiscardConfirm, hasData]);

  const handleSubmit = async () => {
    if (submitting || !pathSuffix.trim()) return;
    setSubmitting(true);
    setError(null);

    try {
      const result = await createProject("~/" + pathSuffix.trim());
      onSuccess(result.absolutePath, result.name);
    } catch (err) {
      const e = err as Error & { code?: string };
      if (e.code === "already_project") {
        setError("This directory is already a Claude Code project.");
      } else {
        setError(e.message || "Something went wrong. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const canSubmit = pathSuffix.trim() !== "" && !submitting;

  return (
    <>
      {showDiscardConfirm && (
        <DiscardModal
          onConfirm={onClose}
          onCancel={() => setShowDiscardConfirm(false)}
        />
      )}
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
        onClick={(e) => {
          if (e.target === e.currentTarget) handleClose();
        }}
      >
        <div className="w-full max-w-md mx-4 bg-(--bg-surface) border border-(--border-subtle) rounded-2xl p-8 shadow-2xl">
          {/* Header */}
          <div className="flex items-start justify-between mb-1">
            <div className="flex-1 min-w-0 pr-4">
              <h2 className='text-[22px] font-semibold text-(--text-primary) leading-tight font-["Bricolage_Grotesque",sans-serif] m-0'>
                New Project
              </h2>
              <p className="mt-2 text-[13px] text-(--text-muted) leading-relaxed">
                Choose a directory to initialise as a Claude Code project.
              </p>
            </div>
            <button
              type="button"
              onClick={handleClose}
              className="shrink-0 w-8 h-8 flex items-center justify-center rounded-lg text-(--text-muted) hover:text-(--text-primary) hover:bg-(--bg-elevated) transition-colors duration-150 cursor-pointer border-none bg-transparent"
              aria-label="Close"
            >
              <CloseIcon />
            </button>
          </div>

          <div className="border-t border-(--border-subtle) my-6" />

          {/* Path field */}
          <Field label="Directory path">
            <div className="flex items-center gap-2">
              <span className='shrink-0 text-[14px] font-["Fira_Code",monospace] text-(--text-muted) select-none'>
                ~/
              </span>
              <input
                ref={inputRef}
                type="text"
                value={pathSuffix}
                onChange={(e) => {
                  setPathSuffix(e.target.value);
                  if (error) setError(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSubmit();
                }}
                placeholder="projects/my-app"
                spellCheck={false}
                className={[
                  'flex-1 px-4 py-3 rounded-xl text-[14px] font-["Fira_Code",monospace]',
                  'bg-(--bg-elevated) text-(--text-primary) outline-none outline-0 focus:outline-none focus:ring-0 transition-colors duration-150 box-border',
                  error
                    ? 'border border-(--error)'
                    : 'border border-(--border-subtle) focus:border-(--accent)',
                ].join(" ")}
              />
            </div>
          </Field>

          {/* Caption */}
          <p className="text-[12px] text-(--text-muted) leading-relaxed mt-2">
            If this directory doesn't exist, it and any parent directories will
            be created automatically.
          </p>

          {/* Error */}
          {error && (
            <p className="mt-2 text-[12px] text-(--error) font-['Fira_Code',monospace]">
              {error}
            </p>
          )}

          {/* Create button */}
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!canSubmit}
            className={[
              "w-full mt-6 py-3 rounded-xl text-[14px] font-semibold transition-colors duration-150",
              canSubmit
                ? "bg-(--accent) text-white cursor-pointer hover:bg-(--accent-hover) border-none"
                : "bg-(--bg-elevated) text-(--text-muted) border border-(--border-subtle) cursor-not-allowed",
            ].join(" ")}
          >
            {submitting ? "Creating…" : "Create Project"}
          </button>
        </div>
      </div>
    </>
  );
};
