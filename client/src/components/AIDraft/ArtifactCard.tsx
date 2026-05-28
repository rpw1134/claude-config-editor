import { useState } from "react";
import type { Artifact } from "../../types/aiDraft";
import { useAIDraft } from "../../contexts/AIDraftContext";
import { parseFrontmatter, parseSkillFrontmatter } from "../../lib/frontmatter";

// ── Type config ───────────────────────────────────────────────────────────────

const TYPE_CONFIG = {
  agent: {
    label: "Agent",
    color: "#9A73FF",
    bg: "rgba(124,77,255,0.10)",
    border: "rgba(124,77,255,0.22)",
    bar: "#7C4DFF",
    headerGlow: "rgba(124,77,255,0.08)",
    bodyLabel: "System Prompt",
  },
  skill: {
    label: "Skill",
    color: "#FCD34D",
    bg: "rgba(245,158,11,0.10)",
    border: "rgba(245,158,11,0.22)",
    bar: "#F59E0B",
    headerGlow: "rgba(245,158,11,0.08)",
    bodyLabel: "Instructions",
  },
  "claude-md": {
    label: "CLAUDE.md",
    color: "#00E5FF",
    bg: "rgba(0,229,255,0.10)",
    border: "rgba(0,229,255,0.22)",
    bar: "#00E5FF",
    headerGlow: "rgba(0,229,255,0.08)",
    bodyLabel: "Content",
  },
} as const;

// ── Field categories ──────────────────────────────────────────────────────────

const TOOL_KEYS = new Set(["tools", "disallowedTools", "allowed-tools", "mcpServers"]);
const HEADER_SKIP = new Set(["name", "description"]);
// Rendered as dedicated sections, not inline config rows
const DEDICATED_SECTION_KEYS = new Set(["when_to_use"]);

const FIELD_LABELS: Record<string, string> = {
  model: "Model",
  effort: "Effort",
  maxTurns: "Max Turns",
  permissionMode: "Permissions",
  background: "Background",
  isolation: "Isolation",
  color: "Color",
  memory: "Memory",
  initialPrompt: "Initial Prompt",
  tools: "Allowed Tools",
  disallowedTools: "Blocked Tools",
  "allowed-tools": "Allowed Tools",
  mcpServers: "MCP Servers",
  "argument-hint": "Argument Hint",
  "user-invocable": "User Invocable",
  "disable-model-invocation": "No AI Model",
  author: "Author",
  tags: "Tags",
  context: "Context",
  when_to_use: "When to Use",
};

// ── Field parsing ─────────────────────────────────────────────────────────────

interface ParsedField {
  key: string;
  label: string;
  value: unknown;
  isArray: boolean;
  isLong: boolean;
}

function isEmpty(v: unknown): boolean {
  if (v === undefined || v === null || v === "") return true;
  if (Array.isArray(v) && v.length === 0) return true;
  return false;
}

function formatScalar(v: unknown): string {
  if (typeof v === "boolean") return v ? "Yes" : "No";
  return String(v);
}

function parseField(key: string, value: unknown): ParsedField {
  const isArray = Array.isArray(value) && (value as unknown[]).length > 0;
  const scalar = isArray ? "" : formatScalar(value);
  return {
    key,
    label: FIELD_LABELS[key] ?? key.replace(/[-_]/g, " "),
    value,
    isArray,
    isLong: !isArray && scalar.length > 50,
  };
}

// ── Section label ─────────────────────────────────────────────────────────────

const SectionLabel = ({ label }: { label: string }) => (
  <div className="flex items-center gap-3 mb-3.5">
    <span className="text-[10.5px] font-bold uppercase tracking-[0.13em] text-(--text-muted) shrink-0 select-none">
      {label}
    </span>
    <div className="flex-1 h-px bg-(--border-faint)" />
  </div>
);

// ── Inline config field ───────────────────────────────────────────────────────

const InlineField = ({ label, value, isLong }: { label: string; value: string; isLong: boolean }) => {
  if (isLong) {
    return (
      <div className="py-3 border-b border-(--border-faint) last:border-b-0">
        <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-(--text-muted) mb-1.5">
          {label}
        </div>
        <p className="m-0 text-[13px] text-(--text-secondary) leading-[1.6] wrap-break-word">{value}</p>
      </div>
    );
  }
  return (
    <div className="flex items-baseline gap-4 py-3 border-b border-(--border-faint) last:border-b-0">
      <span className="w-27 shrink-0 text-[12px] text-(--text-muted)">{label}</span>
      <span className="flex-1 text-[13px] text-(--text-primary) font-medium wrap-break-word">{value}</span>
    </div>
  );
};

// ── Tool chip list ────────────────────────────────────────────────────────────

const ToolField = ({ label, items }: { label: string; items: string[] }) => (
  <div className="py-3 border-b border-(--border-faint) last:border-b-0">
    <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-(--text-muted) mb-2">
      {label}
    </div>
    <div className="flex flex-wrap gap-1.5">
      {items.map((item) => (
        <span
          key={item}
          className="font-['Fira_Code',monospace] text-[11.5px] px-2 py-0.75 rounded-md bg-(--bg-base) border border-(--border-subtle) text-(--text-secondary)"
        >
          {item}
        </span>
      ))}
    </div>
  </div>
);

// ── ArtifactCard ──────────────────────────────────────────────────────────────

interface ArtifactCardProps {
  artifact: Artifact;
}

export const ArtifactCard = ({ artifact }: ArtifactCardProps) => {
  const { saveArtifact, discardArtifact } = useAIDraft();
  const [saving, setSaving] = useState(false);

  const config = TYPE_CONFIG[artifact.type];

  const parsed =
    artifact.type === "skill"
      ? parseSkillFrontmatter(artifact.content)
      : parseFrontmatter(artifact.content);
  const { frontmatter, body } = parsed;
  const fm = frontmatter as Record<string, unknown>;

  const displayName = fm.name ? String(fm.name) : artifact.name;
  const description = fm.description ? String(fm.description) : null;
  const whenToUse = !isEmpty(fm.when_to_use) ? String(fm.when_to_use) : null;

  // Split fields into buckets: scalar config, tool arrays
  const configFields: ParsedField[] = [];
  const toolFields: ParsedField[] = [];

  for (const [key, value] of Object.entries(fm)) {
    if (HEADER_SKIP.has(key) || DEDICATED_SECTION_KEYS.has(key) || isEmpty(value)) continue;
    const f = parseField(key, value);
    if (TOOL_KEYS.has(key)) toolFields.push(f);
    else configFields.push(f);
  }

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveArtifact(artifact.id);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={`flex flex-col h-full min-h-0 ${artifact.discarded ? "opacity-40" : ""}`}>

      {/* Type-colored accent bar */}
      <div className="h-0.75 shrink-0" style={{ background: config.bar }} />

      {/* Header — subtle type-tinted background */}
      <div
        className="shrink-0 px-5 pt-5 pb-5 border-b border-(--border-faint)"
        style={{ background: `linear-gradient(160deg, ${config.headerGlow} 0%, transparent 60%)` }}
      >
        {/* Type badge + status */}
        <div className="flex items-center gap-2 mb-3.5">
          <span
            className="inline-flex items-center px-2.5 py-0.75 rounded-md text-[11px] font-bold tracking-wide border"
            style={{ color: config.color, background: config.bg, borderColor: config.border }}
          >
            {config.label}
          </span>
          {artifact.saved && (
            <span className="inline-flex items-center gap-1.5 text-[11.5px] font-semibold text-green-400">
              <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                <path d="M2 6L5 9L10 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Saved
            </span>
          )}
          {artifact.discarded && (
            <span className="text-[11px] font-semibold text-(--text-muted)">Discarded</span>
          )}
        </div>

        {/* Name */}
        <h2 className='m-0 font-["Bricolage_Grotesque",sans-serif] font-bold text-[22px] text-(--text-primary) leading-tight tracking-[-0.03em]'>
          {displayName}
        </h2>

        {/* Description */}
        {description && (
          <p className="mt-2 mb-0 text-[13.5px] text-(--text-secondary) leading-[1.55]">
            {description}
          </p>
        )}
      </div>

      {/* Scrollable body */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        <div className="px-5 py-5 flex flex-col gap-6">

          {/* When to Use — skill-specific, gets its own section */}
          {whenToUse && (
            <div>
              <SectionLabel label="When to Use" />
              <p className="m-0 text-[13px] text-(--text-secondary) leading-[1.65] wrap-break-word">
                {whenToUse}
              </p>
            </div>
          )}

          {/* Scalar config fields */}
          {configFields.length > 0 && (
            <div>
              <SectionLabel label="Configuration" />
              <div>
                {configFields.map((f) => (
                  <InlineField
                    key={f.key}
                    label={f.label}
                    value={formatScalar(f.value)}
                    isLong={f.isLong}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Tool arrays */}
          {toolFields.length > 0 && (
            <div>
              <SectionLabel label="Tools" />
              <div>
                {toolFields.map((f) => (
                  <ToolField
                    key={f.key}
                    label={f.label}
                    items={(f.value as unknown[]).map(String).filter(Boolean)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Body content */}
          {body && (
            <div>
              <SectionLabel label={config.bodyLabel} />
              <p className="m-0 text-[13px] text-(--text-secondary) leading-[1.72] whitespace-pre-wrap wrap-break-word">
                {body}
              </p>
            </div>
          )}

        </div>
      </div>

      {/* Footer */}
      {!artifact.saved && !artifact.discarded && (
        <div className="shrink-0 px-5 py-4 border-t border-(--border-faint) flex items-center gap-2">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 py-2.5 rounded-xl text-[13.5px] font-bold cursor-pointer border-none transition-all duration-150 disabled:opacity-60 hover:brightness-110 active:scale-[0.98]"
            style={{ background: config.bg, color: config.color, boxShadow: `inset 0 0 0 1px ${config.border}` }}
          >
            {saving ? "Saving…" : "Save to project"}
          </button>
          <button
            onClick={() => discardArtifact(artifact.id)}
            className="py-2.5 px-4 text-[13px] font-medium text-(--text-muted) hover:text-red-400 bg-transparent border border-(--border-faint) hover:border-red-400/30 rounded-xl cursor-pointer transition-all duration-150"
          >
            Discard
          </button>
        </div>
      )}

    </div>
  );
};
