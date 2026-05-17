import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { fetchSkillScripts, createSkillScript } from "../../lib/api";

// ── Icons ─────────────────────────────────────────────────────────────────────

const FolderIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
    <path
      d="M2 5.5C2 4.67 2.67 4 3.5 4H7.09l1.5 1.5H14.5C15.33 5.5 16 6.17 16 7V13.5C16 14.33 15.33 15 14.5 15H3.5C2.67 15 2 14.33 2 13.5V5.5Z"
      stroke="currentColor"
      strokeWidth="1.25"
      strokeLinejoin="round"
    />
  </svg>
);

const FileIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <path
      d="M2.5 2C2.5 1.45 2.95 1 3.5 1H8.09l3.41 3.41V12C11.5 12.55 11.05 13 10.5 13h-7C3 13 2.5 12.55 2.5 12V2Z"
      stroke="currentColor"
      strokeWidth="1.1"
      strokeLinejoin="round"
    />
    <path
      d="M8 1v3.5H11.5"
      stroke="currentColor"
      strokeWidth="1.1"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const PlusIcon = () => (
  <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
    <path
      d="M5.5 1V10M1 5.5H10"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </svg>
);

const CloseIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
    <path d="M1.293 1.293a1 1 0 0 1 1.414 0L7 5.586l4.293-4.293a1 1 0 1 1 1.414 1.414L8.414 7l4.293 4.293a1 1 0 0 1-1.414 1.414L7 8.414l-4.293 4.293a1 1 0 0 1-1.414-1.414L5.586 7 1.293 2.707a1 1 0 0 1 0-1.414z" />
  </svg>
);

// ── Language config ───────────────────────────────────────────────────────────

type Language = "bash" | "python" | "javascript" | "typescript";

const LANGUAGES: { id: Language; label: string; ext: string; initial: string }[] =
  [
    { id: "bash", label: "Bash", ext: "sh", initial: "#!/bin/bash\n" },
    {
      id: "python",
      label: "Python",
      ext: "py",
      initial: "#!/usr/bin/env python3\n",
    },
    { id: "javascript", label: "JavaScript", ext: "js", initial: "// Script\n" },
    { id: "typescript", label: "TypeScript", ext: "ts", initial: "// Script\n" },
  ];

const NAME_PATTERN = /^[a-zA-Z0-9_-]+$/;

// ── ScriptRow ──────────────────────────────────────────────────────────────────

interface ScriptRowProps {
  file: string;
  onClick: () => void;
}

const ScriptRow = ({ file, onClick }: ScriptRowProps) => (
  <button
    type="button"
    onClick={onClick}
    className="group w-full flex items-center gap-3 px-8 py-3.5 rounded-lg bg-transparent border-none cursor-pointer hover:bg-(--bg-hover) transition-colors duration-100 text-left"
  >
    <span className="text-(--text-muted) shrink-0 group-hover:text-(--text-secondary) transition-colors duration-100">
      <FileIcon />
    </span>
    <span className='font-["Fira_Code",monospace] text-[14px] text-(--text-primary) group-hover:text-white transition-colors duration-100 flex-1 min-w-0'>
      {file}
    </span>
  </button>
);

// ── CreateScriptModal ──────────────────────────────────────────────────────────

interface CreateScriptModalProps {
  skillName: string;
  projectPath: string;
  projectId: string;
  onClose: () => void;
}

const CreateScriptModal = ({
  skillName,
  projectPath,
  projectId,
  onClose,
}: CreateScriptModalProps) => {
  const navigate = useNavigate();
  const [scriptName, setScriptName] = useState("");
  const [language, setLanguage] = useState<Language>("bash");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

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

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = scriptName.trim();

    if (!trimmed) {
      setError("Name is required.");
      return;
    }
    if (!NAME_PATTERN.test(trimmed)) {
      setError("Only letters, numbers, hyphens, and underscores allowed.");
      return;
    }

    const lang = LANGUAGES.find((l) => l.id === language)!;
    const fileName = `${trimmed}.${lang.ext}`;

    setCreating(true);
    setError(null);

    try {
      await createSkillScript(projectPath, skillName, fileName, lang.initial);
      navigate(
        `/${encodeURIComponent(projectId)}/skills/${encodeURIComponent(skillName)}/scripts/${encodeURIComponent(fileName)}`,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setCreating(false);
    }
  };

  const canSubmit = scriptName.trim().length > 0 && !creating;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-sm mx-4 bg-(--bg-surface) border border-(--border-subtle) rounded-2xl p-8 shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between mb-1">
          <div className="flex-1 min-w-0 pr-4">
            <h2 className='text-[22px] font-semibold text-(--text-primary) leading-tight font-["Bricolage_Grotesque",sans-serif] m-0'>
              New Script
            </h2>
            <p className="mt-2 text-[13px] text-(--text-muted) leading-relaxed">
              Choose a name and language for your script.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 w-8 h-8 flex items-center justify-center rounded-lg text-(--text-muted) hover:text-(--text-primary) hover:bg-(--bg-elevated) transition-colors duration-150 cursor-pointer border-none bg-transparent"
            aria-label="Close"
          >
            <CloseIcon />
          </button>
        </div>

        <div className="border-t border-(--border-subtle) my-6" />

        <form onSubmit={handleCreate}>
          {/* Name input */}
          <label className="block text-[11px] font-medium text-(--text-muted) tracking-widest uppercase mb-3">
            Name
          </label>
          <input
            ref={inputRef}
            type="text"
            value={scriptName}
            onChange={(e) => {
              setScriptName(e.target.value);
              if (error) setError(null);
            }}
            placeholder="e.g. build"
            disabled={creating}
            className={[
              'w-full px-4 py-3 rounded-xl text-[14px] font-["Fira_Code",monospace]',
              "bg-(--bg-elevated) text-(--text-primary) outline-none transition-colors duration-150 box-border",
              "focus:border-(--accent)",
              error
                ? "border border-(--error)"
                : "border border-(--border-subtle)",
            ].join(" ")}
          />

          {/* Language select */}
          <label className="block text-[11px] font-medium text-(--text-muted) tracking-widest uppercase mt-5 mb-3">
            Language
          </label>
          <div className="grid grid-cols-4 gap-2">
            {LANGUAGES.map((lang) => (
              <button
                key={lang.id}
                type="button"
                onClick={() => setLanguage(lang.id)}
                disabled={creating}
                className={[
                  "py-2 rounded-lg text-[13px] font-medium border transition-colors duration-150 cursor-pointer",
                  language === lang.id
                    ? "bg-(--accent-dim) border-(--accent) text-(--text-primary)"
                    : "bg-(--bg-elevated) border-(--border-subtle) text-(--text-muted) hover:text-(--text-secondary) hover:border-(--border-default)",
                ].join(" ")}
              >
                {lang.label}
              </button>
            ))}
          </div>

          {error && (
            <p className="mt-3 text-[12px] text-(--error) font-['Fira_Code',monospace]">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={!canSubmit}
            className={[
              "w-full mt-6 py-3 rounded-xl text-[14px] font-semibold transition-colors duration-150",
              canSubmit
                ? "bg-(--accent) text-white cursor-pointer hover:bg-(--accent-hover) border-none"
                : "bg-(--bg-elevated) text-(--text-muted) border border-(--border-subtle) cursor-not-allowed",
            ].join(" ")}
          >
            {creating ? "Creating…" : "Create Script"}
          </button>
        </form>
      </div>
    </div>
  );
};

// ── ScriptsTab ─────────────────────────────────────────────────────────────────

export interface ScriptsTabProps {
  skillName: string;
  projectPath: string;
  autoCreate?: boolean;
}

export const ScriptsTab = ({
  skillName,
  projectPath,
  autoCreate,
}: ScriptsTabProps) => {
  const navigate = useNavigate();
  const { projectId } = useParams<{ projectId: string }>();
  const [scripts, setScripts] = useState<string[]>([]);
  const [createOpen, setCreateOpen] = useState(autoCreate ?? false);

  useEffect(() => {
    fetchSkillScripts(projectPath, skillName)
      .then(setScripts)
      .catch(() => setScripts([]));
  }, [projectPath, skillName]);

  const handleScriptClick = (file: string) => {
    if (!projectId) return;
    navigate(
      `/${encodeURIComponent(projectId)}/skills/${encodeURIComponent(skillName)}/scripts/${encodeURIComponent(file)}`,
    );
  };

  return (
    <div className="flex-1 overflow-y-auto flex items-center justify-center p-16">
      <div className="w-full max-w-3xl bg-(--bg-surface) border border-(--border-subtle) rounded-2xl shadow-2xl shadow-black/40">
        {/* Card header */}
        <div className="px-10 pt-9 pb-7 border-b border-(--border-faint) flex items-center gap-3">
          <span className="text-(--text-muted)">
            <FolderIcon />
          </span>
          <span className='font-["Bricolage_Grotesque",sans-serif] font-bold text-[22px] tracking-tight text-(--text-primary) flex-1 min-w-0'>
            {skillName}
            <span className='font-["Fira_Code",monospace] text-[15px] text-(--text-muted) ml-1'>
              /scripts
            </span>
          </span>
          <button
            type="button"
            onClick={() => setCreateOpen(true)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-(--accent) text-white text-[13px] font-medium hover:bg-(--accent-hover) transition-colors duration-150 border-none cursor-pointer shrink-0"
          >
            <PlusIcon />
            New Script
          </button>
        </div>

        {/* Script list or empty state */}
        {scripts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-10">
            <p className="text-[13px] text-(--text-muted) mb-4">
              No scripts yet.
            </p>
            <button
              type="button"
              onClick={() => setCreateOpen(true)}
              className="px-4 py-2 rounded-lg bg-(--accent) text-white text-[13px] font-medium hover:bg-(--accent-hover) transition-colors duration-150 border-none cursor-pointer"
            >
              Create your first script
            </button>
          </div>
        ) : (
          <div className="px-2 py-3">
            {scripts.map((file) => (
              <ScriptRow
                key={file}
                file={file}
                onClick={() => handleScriptClick(file)}
              />
            ))}
          </div>
        )}
      </div>

      {createOpen && projectId && (
        <CreateScriptModal
          skillName={skillName}
          projectPath={projectPath}
          projectId={projectId}
          onClose={() => setCreateOpen(false)}
        />
      )}
    </div>
  );
};
