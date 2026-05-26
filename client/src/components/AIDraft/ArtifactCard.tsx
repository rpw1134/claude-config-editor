import { useState } from "react";
import type { Artifact } from "../../types/aiDraft";
import { useAIDraft } from "../../contexts/AIDraftContext";
import { parseFrontmatter, parseSkillFrontmatter } from "../../lib/frontmatter";

// ── Type badge ────────────────────────────────────────────────────────────────

const TYPE_COLORS: Record<Artifact["type"], string> = {
  agent: "bg-violet-500/15 text-violet-400 border-violet-500/20",
  skill: "bg-amber-500/15 text-amber-400 border-amber-500/20",
  "claude-md": "bg-sky-500/15 text-sky-400 border-sky-500/20",
};

const TYPE_LABELS: Record<Artifact["type"], string> = {
  agent: "Agent",
  skill: "Skill",
  "claude-md": "CLAUDE.md",
};

interface TypeBadgeProps {
  type: Artifact["type"];
}

const TypeBadge = ({ type }: TypeBadgeProps) => (
  <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold border ${TYPE_COLORS[type]}`}>
    {TYPE_LABELS[type]}
  </span>
);

// ── Field definitions ─────────────────────────────────────────────────────────

const AGENT_FIELDS: Array<{ key: string; label: string }> = [
  { key: "name", label: "Name" },
  { key: "description", label: "Description" },
  { key: "model", label: "Model" },
  { key: "tools", label: "Tools" },
];

const SKILL_FIELDS: Array<{ key: string; label: string }> = [
  { key: "name", label: "Name" },
  { key: "description", label: "Description" },
  { key: "author", label: "Author" },
  { key: "tags", label: "Tags" },
];

function fieldsForType(type: Artifact["type"]) {
  if (type === "agent") return AGENT_FIELDS;
  if (type === "skill") return SKILL_FIELDS;
  return null; // claude-md has no frontmatter
}

function bodyLabelForType(type: Artifact["type"]): string {
  if (type === "agent") return "System Prompt";
  if (type === "skill") return "Instructions";
  return "Content";
}

// ── Field row ─────────────────────────────────────────────────────────────────

interface FieldRowProps {
  label: string;
  value: unknown;
}

const FieldRow = ({ label, value }: FieldRowProps) => {
  const display = Array.isArray(value)
    ? value.join(", ")
    : value != null && value !== ""
      ? String(value)
      : null;

  return (
    <div className="flex flex-col gap-1">
      <span className="text-[11px] font-semibold uppercase tracking-widest text-(--text-muted)">
        {label}
      </span>
      {display ? (
        <span className="text-[13px] text-(--text-primary) wrap-break-word">{display}</span>
      ) : (
        <span className="text-[13px] text-(--text-muted) italic">—</span>
      )}
    </div>
  );
};

// ── ArtifactCard ──────────────────────────────────────────────────────────────

interface ArtifactCardProps {
  artifact: Artifact;
}

export const ArtifactCard = ({ artifact }: ArtifactCardProps) => {
  const { saveArtifact, discardArtifact } = useAIDraft();
  const [tab, setTab] = useState<"preview" | "fields">("preview");
  const [saving, setSaving] = useState(false);

  const parsed = artifact.type === "skill"
    ? parseSkillFrontmatter(artifact.content)
    : parseFrontmatter(artifact.content);
  const { frontmatter, body } = parsed;
  const fields = fieldsForType(artifact.type);

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
      <div className="shrink-0 px-4 pt-4 pb-3 border-b border-(--border-faint)">
        <div className="flex items-center gap-2 mb-1.5">
          <TypeBadge type={artifact.type} />
          {artifact.saved && (
            <span className="inline-flex items-center gap-1 text-[11px] text-green-400 font-semibold">
              <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                <path d="M2 6L5 9L10 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Saved
            </span>
          )}
          {artifact.discarded && (
            <span className="text-[11px] text-(--text-muted) font-semibold">
              Discarded
            </span>
          )}
        </div>
        <h3 className='m-0 text-[15px] font-["Bricolage_Grotesque",sans-serif] font-semibold text-(--text-primary) leading-snug'>
          {(frontmatter as Record<string, unknown>).name ? String((frontmatter as Record<string, unknown>).name) : artifact.name}
        </h3>
      </div>

      {/* Tab switcher */}
      <div className="shrink-0 flex border-b border-(--border-faint)">
        {(["preview", "fields"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={[
              "flex-1 py-2.5 text-[13px] font-medium border-none bg-transparent cursor-pointer transition-colors duration-150 capitalize relative",
              tab === t
                ? "text-(--text-primary) after:absolute after:bottom-0 after:left-0 after:right-0 after:h-px after:bg-(--accent)"
                : "text-(--text-secondary) hover:text-(--text-primary)",
            ].join(" ")}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Tab content — scrollable */}
      <div className="flex-1 min-h-0 overflow-y-auto p-4">
        {tab === "preview" && (
          <pre className="m-0 text-[12px] font-['Fira_Code',monospace] text-(--text-secondary) bg-(--bg-base) rounded-lg p-4 whitespace-pre-wrap wrap-break-word leading-relaxed">
            {artifact.content}
          </pre>
        )}

        {tab === "fields" && (
          <>
            {fields === null ? (
              // claude-md has no frontmatter
              <div className="flex flex-col gap-2">
                <p className="text-[13px] text-(--text-muted) leading-relaxed">
                  CLAUDE.md is a plain markdown file — use the Preview tab to read the full content.
                </p>
                {body && (
                  <pre className="m-0 text-[12px] font-['Fira_Code',monospace] text-(--text-secondary) bg-(--bg-base) rounded-lg p-4 whitespace-pre-wrap wrap-break-word leading-relaxed mt-2">
                    {body}
                  </pre>
                )}
              </div>
            ) : (
              <div className="flex flex-col gap-5">
                {fields.map(({ key, label }) => (
                  <FieldRow key={key} label={label} value={(frontmatter as Record<string, unknown>)[key] ?? ""} />
                ))}
                {body && (
                  <div className="flex flex-col gap-1">
                    <span className="text-[11px] font-semibold uppercase tracking-widest text-(--text-muted)">
                      {bodyLabelForType(artifact.type)}
                    </span>
                    <p className="m-0 text-[13px] text-(--text-secondary) leading-relaxed whitespace-pre-wrap wrap-break-word">
                      {body}
                    </p>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Footer actions */}
      {!artifact.saved && !artifact.discarded && (
        <div className="shrink-0 px-4 py-3 border-t border-(--border-faint) flex items-center gap-3">
          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-(--accent) text-black rounded-lg px-4 py-2 text-[13px] font-semibold hover:opacity-90 transition-opacity duration-150 cursor-pointer disabled:opacity-60 border-none"
          >
            {saving ? "Saving…" : "Save to project"}
          </button>
          <button
            onClick={() => discardArtifact(artifact.id)}
            className="text-red-400/70 text-[13px] hover:text-red-400 bg-transparent border-none cursor-pointer transition-colors duration-150"
          >
            Discard
          </button>
        </div>
      )}
    </div>
  );
};
