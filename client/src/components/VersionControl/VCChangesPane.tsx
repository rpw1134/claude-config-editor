import { useState } from "react";
import { useVersionControl } from "../../contexts/VersionControlContext";
import {
  postVcCommit,
  postVcGitignoreProtect,
  postVcGitignoreUnblock,
  postVcGitignoreStryde,
} from "../../lib/api";
import type { ChangeEntry } from "../../lib/api";
import { VCDiffViewer } from "./VCDiffViewer";

interface VCChangesPaneProps {
  projectPath: string;
}

// ── Status badge ──────────────────────────────────────────────────────────────

interface StatusDotProps {
  status: ChangeEntry["status"];
}

const StatusDot = ({ status }: StatusDotProps) => {
  const color =
    status === "M"
      ? "bg-amber-400"
      : "bg-emerald-400";

  return (
    <span
      className={`shrink-0 w-1.5 h-1.5 rounded-full ${color}`}
      title={status === "M" ? "Modified" : status === "A" ? "Added" : "Untracked"}
    />
  );
};

// ── Banner ────────────────────────────────────────────────────────────────────

interface BannerProps {
  variant: "amber" | "blue";
  children: React.ReactNode;
}

const Banner = ({ variant, children }: BannerProps) => {
  const borderColor = variant === "amber" ? "border-amber-400/30" : "border-blue-400/30";
  const bgColor = variant === "amber" ? "bg-amber-400/8" : "bg-blue-400/8";
  const textColor = variant === "amber" ? "text-amber-300" : "text-blue-300";

  return (
    <div className={`flex items-start gap-3 px-4 py-3 border-b ${borderColor} ${bgColor}`}>
      <span className={`text-[11px] font-semibold uppercase tracking-wide shrink-0 mt-0.5 ${textColor}`}>
        {variant === "amber" ? "Warning" : "Info"}
      </span>
      <div className="flex flex-col gap-1.5 flex-1 min-w-0">{children}</div>
    </div>
  );
};

// ── Main component ────────────────────────────────────────────────────────────

export const VCChangesPane = ({ projectPath }: VCChangesPaneProps) => {
  const { status, refresh } = useVersionControl();
  const [commitMessage, setCommitMessage] = useState("");
  const [committing, setCommitting] = useState(false);
  const [expandedDiffFile, setExpandedDiffFile] = useState<string | null>(null);
  const [localsPromptDismissed, setLocalsPromptDismissed] = useState(false);
  const [strydeDecided, setStrydeDecided] = useState(false);

  if (!status) return null;

  const { changes, gitignore } = status;
  const hasChanges = changes.length > 0;

  const handleCommit = async () => {
    if (!commitMessage.trim() || !hasChanges || committing) return;
    setCommitting(true);
    try {
      await postVcCommit(projectPath, commitMessage.trim());
      setCommitMessage("");
      setExpandedDiffFile(null);
      refresh();
    } finally {
      setCommitting(false);
    }
  };

  const handleUnblock = async () => {
    if (!gitignore.claudeIgnoredBy) return;
    await postVcGitignoreUnblock(projectPath, gitignore.claudeIgnoredBy);
    refresh();
  };

  const handleProtect = async () => {
    await postVcGitignoreProtect(projectPath);
    setLocalsPromptDismissed(true);
    refresh();
  };

  const handleStrydeIgnore = async (ignore: boolean) => {
    await postVcGitignoreStryde(projectPath, ignore);
    setStrydeDecided(true);
    refresh();
  };

  const showLocalsPrompt =
    !gitignore.localsProtected && !localsPromptDismissed;
  const showStrydePrompt =
    !gitignore.strydeIgnored && !strydeDecided;

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-(--bg-base)">

      {/* ── Banners ─────────────────────────────────────────────────── */}
      {gitignore.claudeIgnored && (
        <Banner variant="amber">
          <p className="m-0 text-[13px] text-(--text-primary)">
            <code className="font-['Fira_Code',monospace] text-[12px]">.claude/</code>{" "}
            is excluded by{" "}
            <code className="font-['Fira_Code',monospace] text-[12px]">.gitignore</code>
            {gitignore.claudeIgnoredBy && (
              <> at <code className="font-['Fira_Code',monospace] text-[12px]">{gitignore.claudeIgnoredBy}</code></>
            )}
            . Version control won't track changes until this is resolved.
          </p>
          <button
            onClick={handleUnblock}
            className="self-start text-[12px] font-medium text-amber-300 bg-amber-400/10 border border-amber-400/20 px-3 py-1 rounded cursor-pointer hover:bg-amber-400/15 transition-colors duration-150"
          >
            Remove ignore entry
          </button>
        </Banner>
      )}

      {showLocalsPrompt && (
        <Banner variant="blue">
          <p className="m-0 text-[13px] text-(--text-primary)">
            Local config files may contain tokens. Add them to{" "}
            <code className="font-['Fira_Code',monospace] text-[12px]">.gitignore</code>?
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={handleProtect}
              className="text-[12px] font-medium text-blue-300 bg-blue-400/10 border border-blue-400/20 px-3 py-1 rounded cursor-pointer hover:bg-blue-400/15 transition-colors duration-150"
            >
              Protect
            </button>
            <button
              onClick={() => setLocalsPromptDismissed(true)}
              className="text-[12px] text-(--text-muted) bg-transparent border-none cursor-pointer hover:text-(--text-secondary) transition-colors duration-150"
            >
              Skip
            </button>
          </div>
        </Banner>
      )}

      {showStrydePrompt && (
        <Banner variant="blue">
          <p className="m-0 text-[13px] text-(--text-primary)">
            Track{" "}
            <code className="font-['Fira_Code',monospace] text-[12px]">.stryde/</code>{" "}
            settings with git?
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleStrydeIgnore(true)}
              className="text-[12px] font-medium text-blue-300 bg-blue-400/10 border border-blue-400/20 px-3 py-1 rounded cursor-pointer hover:bg-blue-400/15 transition-colors duration-150"
            >
              Ignore (recommended)
            </button>
            <button
              onClick={() => handleStrydeIgnore(false)}
              className="text-[12px] text-(--text-muted) bg-transparent border-none cursor-pointer hover:text-(--text-secondary) transition-colors duration-150"
            >
              Track with git
            </button>
          </div>
        </Banner>
      )}

      {/* ── Header ──────────────────────────────────────────────────── */}
      <div className="shrink-0 px-6 pt-6 pb-4 border-b border-(--border-faint)">
        <h1 className="m-0 text-[18px] font-semibold text-(--text-primary)">
          Version Control
        </h1>
      </div>

      {/* ── Changes list (scrollable) ────────────────────────────────── */}
      <div className="flex-1 min-h-0 overflow-y-auto px-4 py-4 flex flex-col gap-1">
        {hasChanges ? (
          <>
            <div className="mb-2 px-2 flex items-center">
              <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-(--text-muted)">
                Changes ({changes.length})
              </span>
            </div>

            {changes.map((entry) => {
              const isExpanded = expandedDiffFile === entry.file;
              return (
                <div key={entry.file} className="flex flex-col">
                  <div className="flex items-center gap-3 px-4 py-2.5 rounded-lg border border-white/7 bg-white/[0.025]">
                    <StatusDot status={entry.status} />
                    <span className="flex-1 min-w-0 font-['Fira_Code',monospace] text-[12px] text-(--text-secondary) truncate">
                      {entry.file}
                    </span>
                    <button
                      onClick={() =>
                        setExpandedDiffFile(isExpanded ? null : entry.file)
                      }
                      className="shrink-0 text-[12px] font-medium text-(--accent) bg-transparent border-none cursor-pointer px-2 py-1 rounded hover:bg-(--accent)/8 transition-colors duration-150"
                    >
                      {isExpanded ? "Hide" : "View diff"}
                    </button>
                  </div>

                  {isExpanded && (
                    <div className="mt-1.5 mb-1">
                      <VCDiffViewer
                        projectPath={projectPath}
                        filePath={entry.file}
                        hash="HEAD"
                        onClose={() => setExpandedDiffFile(null)}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </>
        ) : (
          <div className="flex items-center gap-2 text-(--text-muted) text-[14px] px-2 py-4">
            <span className="text-emerald-400">✓</span>
            <span>All changes committed</span>
          </div>
        )}
      </div>

      {/* ── Commit section ───────────────────────────────────────────── */}
      <div className="shrink-0 p-4 border-t border-(--border-faint) flex flex-col gap-2">
        <textarea
          value={commitMessage}
          onChange={(e) => setCommitMessage(e.target.value)}
          placeholder="Commit message…"
          rows={2}
          disabled={!hasChanges}
          className="w-full resize-none bg-(--bg-surface) border border-(--border-subtle) rounded-lg text-[13px] text-(--text-primary) px-3 py-2 placeholder:text-(--text-muted) focus:outline-none focus:border-(--accent)/50 transition-colors duration-150 disabled:opacity-40 disabled:cursor-not-allowed"
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
              handleCommit();
            }
          }}
        />
        <button
          onClick={handleCommit}
          disabled={!hasChanges || !commitMessage.trim() || committing}
          className="self-end px-4 py-2 rounded-lg text-[13px] font-semibold text-white bg-(--accent) border-none cursor-pointer transition-all duration-150 hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {committing ? "Committing…" : "Commit Changes"}
        </button>
      </div>
    </div>
  );
};
