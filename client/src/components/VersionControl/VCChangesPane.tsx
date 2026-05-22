import { useState, useEffect, useRef } from "react";
import { useVersionControl } from "../../contexts/VersionControlContext";
import {
  postVcCommit,
  postVcGitignoreProtect,
  postVcGitignoreUnblock,
  postVcGitignoreStryde,
} from "../../lib/api";
import type { ChangeEntry } from "../../lib/api";
import { VCDiffViewer } from "./VCDiffViewer";
import { AgentIcon, SkillIcon, FileIcon, SearchIcon } from "../Icons";

interface VCChangesPaneProps {
  projectPath: string;
}

// ── Types ─────────────────────────────────────────────────────────────────────

type ChangeStatus = ChangeEntry["status"];

interface GroupedChanges {
  claude: { status: ChangeStatus } | null;
  agents: { name: string; file: string; status: ChangeStatus }[];
  skills: {
    name: string;
    status: ChangeStatus;
    files: { file: string; status: ChangeStatus; shortName: string }[];
  }[];
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function skillFileShortName(file: string, skillName: string): string {
  const prefix = `skills/${skillName}/`;
  return file.startsWith(prefix) ? file.slice(prefix.length) : file;
}

function groupChanges(changes: ChangeEntry[]): GroupedChanges {
  let claude: GroupedChanges["claude"] = null;
  const agentMap = new Map<string, { file: string; status: ChangeStatus }>();
  const skillMap = new Map<string, { files: { file: string; status: ChangeStatus; shortName: string }[] }>();

  for (const c of changes) {
    if (c.file === "CLAUDE.md") {
      claude = { status: c.status };
      continue;
    }
    const agentMatch = c.file.match(/^agents\/(.+)\.md$/);
    if (agentMatch) {
      agentMap.set(agentMatch[1], { file: c.file, status: c.status });
      continue;
    }
    const skillMatch = c.file.match(/^skills\/([^/]+)\//);
    if (skillMatch) {
      const name = skillMatch[1];
      if (!skillMap.has(name)) skillMap.set(name, { files: [] });
      skillMap.get(name)!.files.push({
        file: c.file,
        status: c.status,
        shortName: skillFileShortName(c.file, name),
      });
    }
  }

  const skills: GroupedChanges["skills"] = Array.from(skillMap.entries()).map(
    ([name, { files }]) => {
      const status = files.some((f) => f.status === "M")
        ? "M"
        : files.some((f) => f.status === "A")
          ? "A"
          : "??";
      return { name, status: status as ChangeStatus, files };
    },
  );

  const agents = Array.from(agentMap.entries()).map(([name, { file, status }]) => ({
    name,
    file,
    status,
  }));

  return { claude, agents, skills };
}

// ── CommitModal ───────────────────────────────────────────────────────────────

interface CommitModalProps {
  count: number;
  committing: boolean;
  onCommit: (message: string) => void;
  onClose: () => void;
}

const CommitModal = ({ count, committing, onCommit, onClose }: CommitModalProps) => {
  const [message, setMessage] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
      }
    };
    window.addEventListener("keydown", handleKey, true);
    return () => window.removeEventListener("keydown", handleKey, true);
  }, [onClose]);

  const handleSubmit = () => {
    if (!message.trim() || committing) return;
    onCommit(message);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-(--bg-surface) rounded-2xl border border-(--border-subtle) p-8 max-w-md w-full mx-4 shadow-2xl flex flex-col gap-5">
        <div className="flex flex-col gap-1">
          <h2 className="font-['Bricolage_Grotesque',sans-serif] text-[22px] font-semibold text-(--text-primary) m-0 leading-tight">
            Create commit
          </h2>
          <p className="m-0 text-[13px] text-(--text-muted)">
            {count} change{count !== 1 ? "s" : ""} will be committed
          </p>
        </div>

        <textarea
          ref={textareaRef}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Commit message…"
          rows={3}
          disabled={committing}
          className="w-full resize-none bg-(--bg-elevated) border border-(--border-subtle) rounded-lg text-[14px] text-(--text-primary) px-3 py-2.5 placeholder:text-(--text-muted) focus:outline-none focus:border-(--accent)/50 transition-colors duration-150 disabled:opacity-50"
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleSubmit();
          }}
        />

        <div className="flex items-center justify-between">
          <button
            onClick={onClose}
            className="text-[13px] text-(--text-muted) bg-transparent border-none cursor-pointer hover:text-(--text-secondary) transition-colors duration-150 px-0 py-0"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!message.trim() || committing}
            className="px-5 py-2 rounded-lg text-[13px] font-semibold text-white bg-(--accent) border-none cursor-pointer transition-all duration-150 hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {committing ? "Committing…" : "Commit"}
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Sub-components ────────────────────────────────────────────────────────────

const StatusLetter = ({ status }: { status: ChangeStatus }) => (
  <span
    className={`shrink-0 w-4 text-[11px] font-bold font-mono text-center ${
      status === "M"
        ? "text-amber-400"
        : status === "A"
          ? "text-emerald-400"
          : "text-(--text-muted)"
    }`}
    title={status === "M" ? "Modified" : status === "A" ? "Added" : "Untracked"}
  >
    {status === "M" ? "M" : status === "A" ? "A" : "U"}
  </span>
);

const DiffButton = ({
  expanded,
  onToggle,
}: {
  expanded: boolean;
  onToggle: () => void;
}) => (
  <button
    onClick={onToggle}
    className="shrink-0 text-[12px] font-medium text-(--accent) bg-transparent border-none cursor-pointer px-2 py-1 rounded hover:bg-(--accent)/8 transition-colors duration-150"
  >
    {expanded ? "Hide" : "View diff"}
  </button>
);

const Banner = ({
  variant,
  children,
}: {
  variant: "amber" | "blue";
  children: React.ReactNode;
}) => {
  const borderColor = variant === "amber" ? "border-amber-400/30" : "border-blue-400/30";
  const bgColor = variant === "amber" ? "bg-amber-400/8" : "bg-blue-400/8";
  const textColor = variant === "amber" ? "text-amber-300" : "text-blue-300";
  return (
    <div className={`flex items-start gap-3 px-4 py-3 border-b ${borderColor} ${bgColor}`}>
      <span
        className={`text-[11px] font-semibold uppercase tracking-wide shrink-0 mt-0.5 ${textColor}`}
      >
        {variant === "amber" ? "Warning" : "Info"}
      </span>
      <div className="flex flex-col gap-1.5 flex-1 min-w-0">{children}</div>
    </div>
  );
};

const ChangeRow = ({ children }: { children: React.ReactNode }) => (
  <div className="flex items-center gap-3 px-4 py-2.5 rounded-lg border border-white/7 bg-white/2.5">
    {children}
  </div>
);

// ── Main component ────────────────────────────────────────────────────────────

export const VCChangesPane = ({ projectPath }: VCChangesPaneProps) => {
  const { status, refresh } = useVersionControl();
  const [committing, setCommitting] = useState(false);
  const [showCommitModal, setShowCommitModal] = useState(false);
  const [search, setSearch] = useState("");

  const [expandedDiff, setExpandedDiff] = useState<string | null>(null);
  const [expandedSkill, setExpandedSkill] = useState<string | null>(null);

  const [localsPromptDismissed, setLocalsPromptDismissed] = useState(false);
  const [strydeDecided, setStrydeDecided] = useState(false);

  if (!status) return null;

  const { changes, gitignore } = status;
  const grouped = groupChanges(changes);

  const searchLower = search.toLowerCase();
  const filteredClaude =
    !grouped.claude
      ? null
      : search === "" || "claude.md".includes(searchLower)
        ? grouped.claude
        : null;
  const filteredAgents = grouped.agents.filter(
    (a) => search === "" || a.name.toLowerCase().includes(searchLower),
  );
  const filteredSkills = grouped.skills.filter(
    (s) => search === "" || s.name.toLowerCase().includes(searchLower),
  );

  const count = (filteredClaude ? 1 : 0) + filteredAgents.length + filteredSkills.length;
  const totalCount = (grouped.claude ? 1 : 0) + grouped.agents.length + grouped.skills.length;
  const hasChanges = totalCount > 0;

  const toggleDiff = (key: string) =>
    setExpandedDiff((prev) => (prev === key ? null : key));

  const handleCommit = async (message: string) => {
    if (!message.trim() || !hasChanges || committing) return;
    setCommitting(true);
    try {
      await postVcCommit(projectPath, message.trim());
      setShowCommitModal(false);
      setExpandedDiff(null);
      setExpandedSkill(null);
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

  const showLocalsPrompt = !gitignore.localsProtected && !localsPromptDismissed;
  const showStrydePrompt = !gitignore.strydeIgnored && !strydeDecided;

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-(--bg-base)">

      {showCommitModal && (
        <CommitModal
          count={totalCount}
          committing={committing}
          onCommit={handleCommit}
          onClose={() => setShowCommitModal(false)}
        />
      )}

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
      <div className="shrink-0 w-full px-14 pt-16 pb-6">
        <div className="flex items-center justify-between mb-10">
          <h1 className="font-['Bricolage_Grotesque',sans-serif] text-[40px] font-bold text-(--text-primary) tracking-[-0.03em] leading-[1.05] m-0">
            Version Control
          </h1>
          {hasChanges && (
            <button
              onClick={() => setShowCommitModal(true)}
              className="flex items-center gap-1.75 px-4 py-2 rounded-lg border-none bg-white text-gray-900 text-[14px] font-semibold cursor-pointer shrink-0 transition-all duration-150 hover:bg-white/90"
            >
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M6.5 1.5V11.5M1.5 6.5H11.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
              Create commit
            </button>
          )}
        </div>
        <div className="relative mb-4">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-(--text-muted) flex items-center pointer-events-none">
            <SearchIcon />
          </span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search changes…"
            className="w-full h-11 pl-10 pr-3.5 bg-(--bg-surface) border border-(--border-subtle) rounded-2.5 text-[15px] text-(--text-primary) outline-none box-border transition-colors duration-120 focus:border-(--border-default)"
          />
        </div>
      </div>

      {/* ── Changes list (scrollable) ────────────────────────────────── */}
      <div className="flex-1 min-h-0 overflow-y-auto px-14 pt-2 pb-6 flex flex-col gap-1">
        {hasChanges ? (
          <>
            <div className="mb-3 px-2">
              <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-(--text-muted)">
                Changes ({count})
              </span>
            </div>

            {/* CLAUDE.md */}
            {filteredClaude && (() => {
              const diffKey = "claude";
              const isExpanded = expandedDiff === diffKey;
              return (
                <div key="claude" className="flex flex-col">
                  <ChangeRow>
                    <span className="shrink-0 w-4 h-4 text-(--text-muted) flex items-center justify-center">
                      <FileIcon />
                    </span>
                    <span className="flex-1 min-w-0 font-medium text-[13px] text-(--text-primary) truncate">
                      CLAUDE.md
                    </span>
                    <DiffButton expanded={isExpanded} onToggle={() => toggleDiff(diffKey)} />
                    <StatusLetter status={filteredClaude.status} />
                  </ChangeRow>
                  {isExpanded && (
                    <div className="mt-1.5 mb-1">
                      <VCDiffViewer
                        projectPath={projectPath}
                        filePath="CLAUDE.md"
                        hash="WORKDIR"
                        onClose={() => setExpandedDiff(null)}
                      />
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Agents */}
            {filteredAgents.map(({ name, file, status: st }) => {
              const diffKey = `agent:${name}`;
              const isExpanded = expandedDiff === diffKey;
              return (
                <div key={diffKey} className="flex flex-col">
                  <ChangeRow>
                    <span className="shrink-0 w-4 h-4 text-(--text-muted) flex items-center justify-center">
                      <AgentIcon />
                    </span>
                    <span className="flex-1 min-w-0 font-medium text-[13px] text-(--text-primary) truncate">
                      {name}
                    </span>
                    <DiffButton expanded={isExpanded} onToggle={() => toggleDiff(diffKey)} />
                    <StatusLetter status={st} />
                  </ChangeRow>
                  {isExpanded && (
                    <div className="mt-1.5 mb-1">
                      <VCDiffViewer
                        projectPath={projectPath}
                        filePath={file}
                        hash="WORKDIR"
                        onClose={() => setExpandedDiff(null)}
                      />
                    </div>
                  )}
                </div>
              );
            })}

            {/* Skills */}
            {filteredSkills.map(({ name, status: st, files }) => {
              const isSkillExpanded = expandedSkill === name;
              return (
                <div key={`skill:${name}`} className="flex flex-col gap-0.5">
                  <ChangeRow>
                    <span className="shrink-0 w-4 h-4 text-(--text-muted) flex items-center justify-center">
                      <SkillIcon />
                    </span>
                    <span className="flex-1 min-w-0 font-medium text-[13px] text-(--text-primary) truncate">
                      {name}
                    </span>
                    <button
                      onClick={() =>
                        setExpandedSkill((prev) => (prev === name ? null : name))
                      }
                      className="shrink-0 text-[12px] font-medium text-(--accent) bg-transparent border-none cursor-pointer px-2 py-1 rounded hover:bg-(--accent)/8 transition-colors duration-150"
                    >
                      {isSkillExpanded ? "Hide files" : `${files.length} file${files.length !== 1 ? "s" : ""}`}
                    </button>
                    <StatusLetter status={st} />
                  </ChangeRow>

                  {isSkillExpanded && (
                    <div className="ml-4 flex flex-col gap-0.5 mt-0.5">
                      {files.map(({ file, shortName, status: fst }) => {
                        const diffKey = `skill:${name}:${file}`;
                        const isExpanded = expandedDiff === diffKey;
                        return (
                          <div key={diffKey} className="flex flex-col">
                            <div className="flex items-center gap-3 px-4 py-2 rounded-lg border border-white/5 bg-white/1.5">
                              <StatusLetter status={fst} />
                              <span className="flex-1 min-w-0 font-['Fira_Code',monospace] text-[12px] text-(--text-secondary) truncate">
                                {shortName}
                              </span>
                              <DiffButton
                                expanded={isExpanded}
                                onToggle={() => toggleDiff(diffKey)}
                              />
                            </div>
                            {isExpanded && (
                              <div className="mt-1.5 mb-1">
                                <VCDiffViewer
                                  projectPath={projectPath}
                                  filePath={file}
                                  hash="WORKDIR"
                                  onClose={() => setExpandedDiff(null)}
                                />
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </>
        ) : (
          <div className="flex items-center gap-2 text-(--text-muted) text-[14px] px-2 py-4">
            <span className="text-emerald-400">✓</span>
            <span>No changes to commit</span>
          </div>
        )}
      </div>
    </div>
  );
};
