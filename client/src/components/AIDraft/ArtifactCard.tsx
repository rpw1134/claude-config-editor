import { useState } from "react";
import type { Artifact } from "../../types/aiDraft";
import { useAIDraft } from "../../contexts/AIDraftContext";
import { parseFrontmatter, parseSkillFrontmatter } from "../../lib/frontmatter";
import { renderMarkdown } from "../../lib/markdown";

// ── Type config ───────────────────────────────────────────────────────────────

const TYPE_CONFIG = {
  agent: { bodyLabel: "System Prompt" },
  skill: { bodyLabel: "Instructions" },
  "claude-md": { bodyLabel: "Content" },
} as const;

// ── Field categories ──────────────────────────────────────────────────────────

const HEADER_SKIP = new Set(["name", "description"]);
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
  displayValue: string;
  isLong: boolean;
}

function isEmpty(v: unknown): boolean {
  if (v === undefined || v === null || v === "") return true;
  if (Array.isArray(v) && v.length === 0) return true;
  return false;
}

function toDisplayValue(value: unknown): string {
  if (Array.isArray(value)) return (value as unknown[]).map(String).join(", ");
  if (typeof value === "boolean") return value ? "Yes" : "No";
  return String(value);
}

function parseField(key: string, value: unknown): ParsedField {
  const displayValue = toDisplayValue(value);
  return {
    key,
    label: FIELD_LABELS[key] ?? key.replace(/[-_]/g, " "),
    displayValue,
    isLong: displayValue.length > 50,
  };
}

// ── Section label ─────────────────────────────────────────────────────────────

const SectionLabel = ({ label }: { label: string }) => (
  <div className="flex items-center gap-3 mb-3.5">
    <span className="text-[10px] font-bold uppercase tracking-widest text-(--text-muted) shrink-0 select-none">
      {label}
    </span>
    <div className="flex-1 h-px bg-(--border-faint)" />
  </div>
);

// ── Config field row ──────────────────────────────────────────────────────────

const FieldRow = ({ label, value, isLong }: { label: string; value: string; isLong: boolean }) => {
  if (isLong) {
    return (
      <div className="py-3 border-b border-(--border-faint) last:border-b-0">
        <div className="text-[11px] text-(--text-muted) mb-1">{label}</div>
        <p className="m-0 text-[13px] text-(--text-primary) font-medium leading-[1.6] wrap-break-word">{value}</p>
      </div>
    );
  }
  return (
    <div className="flex items-baseline gap-4 py-2.5 border-b border-(--border-faint) last:border-b-0">
      <span className="w-28 shrink-0 text-[11.5px] text-(--text-muted)">{label}</span>
      <span className="flex-1 text-[13px] font-semibold text-(--text-primary) wrap-break-word">{value}</span>
    </div>
  );
};

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

  const configFields: ParsedField[] = [];
  for (const [key, value] of Object.entries(fm)) {
    if (HEADER_SKIP.has(key) || DEDICATED_SECTION_KEYS.has(key) || isEmpty(value)) continue;
    configFields.push(parseField(key, value));
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

      {/* Header */}
      <div className="shrink-0 px-5 pt-5 pb-4">
        <h2 className='m-0 mb-1.5 font-["Bricolage_Grotesque",sans-serif] font-bold text-[22px] text-(--text-primary) leading-tight tracking-[-0.03em]'>
          {displayName}
        </h2>

        {description && (
          <p className="mt-0 mb-0 text-[13px] text-(--text-muted) leading-[1.55]">
            {description}
          </p>
        )}

        {artifact.saved && (
          <p className="mt-2 mb-0 text-[11.5px] text-(--text-muted) flex items-center gap-1">
            <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
              <path d="M2 6L5 9L10 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Saved
          </p>
        )}
        {artifact.discarded && (
          <p className="mt-2 mb-0 text-[11.5px] text-(--text-muted)">Discarded</p>
        )}
      </div>

      {/* Scrollable body */}
      <div className="flex-1 min-h-0 overflow-y-auto border-t border-(--border-faint)">
        <div className="px-5 py-5 flex flex-col gap-6">

          {whenToUse && (
            <div>
              <SectionLabel label="When to Use" />
              <p className="m-0 text-[13px] text-(--text-muted) leading-[1.65] wrap-break-word">
                {whenToUse}
              </p>
            </div>
          )}

          {configFields.length > 0 && (
            <div>
              <SectionLabel label="Configuration" />
              <div>
                {configFields.map((f) => (
                  <FieldRow key={f.key} label={f.label} value={f.displayValue} isLong={f.isLong} />
                ))}
              </div>
            </div>
          )}

          {body && (
            <div>
              <SectionLabel label={config.bodyLabel} />
              <div
                className="text-[13px] text-(--text-muted) leading-[1.72] prose-sm"
                dangerouslySetInnerHTML={{ __html: renderMarkdown(body) }}
              />
            </div>
          )}

        </div>
      </div>

      {/* Footer */}
      {!artifact.saved && !artifact.discarded && (
        <div className="shrink-0 px-5 py-4 border-t border-(--border-faint) flex items-center justify-between">
          <button
            onClick={handleSave}
            disabled={saving}
            className="text-[13px] font-semibold text-(--accent) bg-transparent border-none cursor-pointer hover:bg-(--accent)/8 px-3 py-1.5 rounded-lg transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? "Saving…" : "Save to project"}
          </button>
          <button
            onClick={() => discardArtifact(artifact.id)}
            className="text-[13px] text-(--text-muted) hover:text-(--text-primary) bg-transparent border-none cursor-pointer px-3 py-1.5 rounded-lg transition-colors duration-150"
          >
            Discard
          </button>
        </div>
      )}

    </div>
  );
};
