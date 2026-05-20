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

// ── Helpers ───────────────────────────────────────────────────────────────────

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

function skillFileShortName(file: string, skillName: string): string {
  // e.g. "skills/my-skill/SKILL.md" → "SKILL.md"
  // e.g. "skills/my-skill/scripts/foo.sh" → "scripts/foo.sh"
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
    // settings.json and everything else: ignored
  }

  const skills: GroupedChanges["skills"] = Array.from(skillMap.entries()).map(
    ([name, { files }]) => {
      // Bubble up worst status: M > A > ??
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

function totalCount(g: GroupedChanges): number {
  return (g.claude ? 1 : 0) + g.agents.length + g.skills.length;
}

// ── Sub-components ────────────────────────────────────────────────────────────

const StatusDot = ({ status }: { status: ChangeStatus }) => (
  <span
    className={`shrink-0 w-1.5 h-1.5 rounded-full ${status === "M" ? "bg-amber-400" : "bg-emerald-400"}`}
    title={status === "M" ? "Modified" : status === "A" ? "Added" : "Untracked"}
  />
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

const TypeBadge = ({ label }: { label: string }) => (
  <span className="shrink-0 text-[10px] font-semibold uppercase tracking-widest text-(--text-muted) px-1.5 py-0.5 rounded bg-white/5 border border-white/8">
    {label}
  </span>
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

// ── Row components ────────────────────────────────────────────────────────────

const ChangeRow = ({
  children,
}: {
  children: React.ReactNode;
}) => (
  <div className="flex items-center gap-3 px-4 py-2.5 rounded-lg border border-white/7 bg-white/2.5">
    {children}
  </div>
);

// ── Main component ────────────────────────────────────────────────────────────

export const VCChangesPane = ({ projectPath }: VCChangesPaneProps) => {
  const { status, refresh } = useVersionControl();
  const [commitMessage, setCommitMessage] = useState("");
  const [committing, setCommitting] = useState(false);

  // expandedDiff: "agent:name", "claude", "skill:name:file"
  const [expandedDiff, setExpandedDiff] = useState<string | null>(null);
  // expandedSkill: skill name whose file list is shown
  const [expandedSkill, setExpandedSkill] = useState<string | null>(null);

  const [localsPromptDismissed, setLocalsPromptDismissed] = useState(false);
  const [strydeDecided, setStrydeDecided] = useState(false);

  if (!status) return null;

  const { changes, gitignore } = status;
  const grouped = groupChanges(changes);
  const count = totalCount(grouped);
  const hasChanges = count > 0;

  const toggleDiff = (key: string) =>
    setExpandedDiff((prev) => (prev === key ? null : key));

  const handleCommit = async () => {
    if (!commitMessage.trim() || !hasChanges || committing) return;
    setCommitting(true);
    try {
      await postVcCommit(projectPath, commitMessage.trim());
      setCommitMessage("");
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
                Changes ({count})
              </span>
            </div>

            {/* CLAUDE.md */}
            {grouped.claude && (() => {
              const diffKey = "claude";
              const isExpanded = expandedDiff === diffKey;
              return (
                <div key="claude" className="flex flex-col">
                  <ChangeRow>
                    <StatusDot status={grouped.claude.status} />
                    <span className="flex-1 min-w-0 font-medium text-[13px] text-(--text-primary) truncate">
                      CLAUDE.md
                    </span>
                    <TypeBadge label="project" />
                    <DiffButton expanded={isExpanded} onToggle={() => toggleDiff(diffKey)} />
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
            {grouped.agents.map(({ name, file, status: st }) => {
              const diffKey = `agent:${name}`;
              const isExpanded = expandedDiff === diffKey;
              return (
                <div key={diffKey} className="flex flex-col">
                  <ChangeRow>
                    <StatusDot status={st} />
                    <span className="flex-1 min-w-0 font-medium text-[13px] text-(--text-primary) truncate">
                      {name}
                    </span>
                    <TypeBadge label="agent" />
                    <DiffButton expanded={isExpanded} onToggle={() => toggleDiff(diffKey)} />
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
            {grouped.skills.map(({ name, status: st, files }) => {
              const isSkillExpanded = expandedSkill === name;
              return (
                <div key={`skill:${name}`} className="flex flex-col gap-0.5">
                  <ChangeRow>
                    <StatusDot status={st} />
                    <span className="flex-1 min-w-0 font-medium text-[13px] text-(--text-primary) truncate">
                      {name}
                    </span>
                    <TypeBadge label="skill" />
                    <button
                      onClick={() =>
                        setExpandedSkill((prev) => (prev === name ? null : name))
                      }
                      className="shrink-0 text-[12px] font-medium text-(--accent) bg-transparent border-none cursor-pointer px-2 py-1 rounded hover:bg-(--accent)/8 transition-colors duration-150"
                    >
                      {isSkillExpanded ? "Hide files" : `${files.length} file${files.length !== 1 ? "s" : ""}`}
                    </button>
                  </ChangeRow>

                  {isSkillExpanded && (
                    <div className="ml-4 flex flex-col gap-0.5 mt-0.5">
                      {files.map(({ file, shortName, status: fst }) => {
                        const diffKey = `skill:${name}:${file}`;
                        const isExpanded = expandedDiff === diffKey;
                        return (
                          <div key={diffKey} className="flex flex-col">
                            <div className="flex items-center gap-3 px-4 py-2 rounded-lg border border-white/5 bg-white/1.5">
                              <StatusDot status={fst} />
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
