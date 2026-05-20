import { useState } from "react";
import { useVersionControl } from "../../contexts/VersionControlContext";
import { postVcInit } from "../../lib/api";
import { VersionControlIcon } from "../Icons";

interface VCInitPromptProps {
  projectPath: string;
}

export const VCInitPrompt = ({ projectPath }: VCInitPromptProps) => {
  const { status, refresh } = useVersionControl();
  const [initing, setIniting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleInit = async () => {
    setIniting(true);
    setError(null);
    try {
      await postVcInit(projectPath);
    } catch (err) {
      const e = err as { code?: string; message?: string };
      if (e.code === "GIT_NOT_FOUND") {
        setError("git is not installed. Please install git to use version control.");
      } else {
        setError(e.message ?? "Failed to initialize version control.");
      }
    } finally {
      setIniting(false);
      refresh();
    }
  };

  const repoRoot = status?.repoRoot ?? null;

  return (
    <div className="flex-1 flex items-center justify-center bg-(--bg-base)">
      <div className="flex flex-col items-center gap-4 max-w-sm w-full px-6 py-10 rounded-2xl bg-(--bg-elevated) border border-(--border-subtle)">
        <div className="text-(--text-muted)">
          <VersionControlIcon />
        </div>

        <div className="flex flex-col items-center gap-2 text-center">
          <h2 className="m-0 text-[22px] font-semibold text-(--text-primary)">
            Version Control
          </h2>
          <p className="m-0 text-[14px] text-(--text-secondary) leading-relaxed">
            Track changes to agents, skills, and config files using git. Restore
            any previous version with one click.
          </p>
        </div>

        {repoRoot ? (
          <p className="m-0 text-[12px] text-(--text-muted) font-['Fira_Code',monospace]">
            Git repo found at {repoRoot}
          </p>
        ) : (
          <p className="m-0 text-[12px] text-(--text-muted) font-['Fira_Code',monospace] text-center">
            No git repository found in {projectPath}
          </p>
        )}

        {error && (
          <p className="m-0 text-[13px] text-(--error) text-center">{error}</p>
        )}

        <button
          onClick={handleInit}
          disabled={initing}
          className="px-5 py-2 rounded-lg text-[14px] font-semibold text-(--accent) bg-(--accent)/10 border border-(--accent)/20 cursor-pointer transition-colors duration-150 hover:bg-(--accent)/15 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {initing ? "Initializing…" : repoRoot ? "Enable Version Control" : "Initialize Repository"}
        </button>
      </div>
    </div>
  );
};
