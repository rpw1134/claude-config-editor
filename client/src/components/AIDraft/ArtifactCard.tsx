import { useState } from "react";
import type { Artifact } from "../../types/aiDraft";
import { useAIDraft } from "../../contexts/AIDraftContext";

// ── Frontmatter parser ────────────────────────────────────────────────────────

function parseFrontmatter(content: string): { frontmatter: Record<string, string>; body: string } {
  const parts = content.split("---").filter((p) => p.trim().length > 0);
  if (parts.length < 1) return { frontmatter: {}, body: content };
  const fmRaw = parts[0];
  const body = parts.slice(1).join("---").trim();
  const frontmatter: Record<string, string> = {};
  for (const line of fmRaw.split("\n")) {
    const colon = line.indexOf(": ");
    if (colon === -1) continue;
    const key = line.slice(0, colon).trim();
    const val = line.slice(colon + 2).trim().replace(/^["']|["']$/g, "");
    if (key) frontmatter[key] = val;
  }
  return { frontmatter, body };
}

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

// ── Fields tab content ────────────────────────────────────────────────────────

const AGENT_FIELDS = ["name", "description", "model", "tools"];
const SKILL_FIELDS = ["name", "description", "tags", "version"];
const CLAUDE_FIELDS = ["project", "description"];

function fieldsForType(type: Artifact["type"]): string[] {
  if (type === "agent") return AGENT_FIELDS;
  if (type === "skill") return SKILL_FIELDS;
  return CLAUDE_FIELDS;
}

interface FieldRowProps {
  label: string;
  value: string;
}

const FieldRow = ({ label, value }: FieldRowProps) => (
  <div className="flex flex-col gap-0.5">
    <span className="text-[11px] font-semibold uppercase tracking-[0.1em] text-(--text-muted)">
      {label}
    </span>
    <span className="text-[13px] text-(--text-primary) break-words">
      {value || <span className="text-(--text-muted) italic">—</span>}
    </span>
  </div>
);

// ── ArtifactCard ──────────────────────────────────────────────────────────────

interface ArtifactCardProps {
  artifact: Artifact;
}

export const ArtifactCard = ({ artifact }: ArtifactCardProps) => {
  const { saveArtifact, discardArtifact } = useAIDraft();
  const [tab, setTab] = useState<"preview" | "fields">("preview");
  const [saving, setSaving] = useState(false);

  const { frontmatter, body } = parseFrontmatter(artifact.content);
  const fieldKeys = fieldsForType(artifact.type);

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
            <span className="text-[11px] text-(--text-muted) font-semibold line-through">
              Discarded
            </span>
          )}
        </div>
        <h3 className='m-0 text-[15px] font-["Bricolage_Grotesque",sans-serif] font-semibold text-(--text-primary) leading-snug'>
          {artifact.name}
        </h3>
      </div>

      {/* Tab switcher */}
      <div className="shrink-0 flex border-b border-(--border-faint)">
        {(["preview", "fields"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={[
              "flex-1 py-2.5 text-[13px] font-medium border-none bg-transparent cursor-pointer transition-colors duration-150 capitalize",
              tab === t
                ? "text-(--text-primary) border-b-2 border-(--accent) -mb-px"
                : "text-(--text-secondary) hover:text-(--text-primary)",
            ].join(" ")}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 min-h-0 overflow-y-auto p-4">
        {tab === "preview" && (
          <pre className="m-0 text-[12px] font-['Fira_Code',monospace] text-(--text-secondary) bg-(--bg-base) rounded-lg p-4 overflow-auto whitespace-pre-wrap break-words leading-relaxed">
            {artifact.content}
          </pre>
        )}
        {tab === "fields" && (
          <div className="flex flex-col gap-4">
            {fieldKeys.map((key) => (
              <FieldRow
                key={key}
                label={key}
                value={frontmatter[key] ?? ""}
              />
            ))}
            {body && (
              <div className="flex flex-col gap-0.5">
                <span className="text-[11px] font-semibold uppercase tracking-[0.1em] text-(--text-muted)">
                  Body
                </span>
                <p className="m-0 text-[13px] text-(--text-secondary) leading-relaxed whitespace-pre-wrap">
                  {body.slice(0, 300)}{body.length > 300 ? "…" : ""}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer actions */}
      {!artifact.saved && !artifact.discarded && (
        <div className="shrink-0 px-4 py-3 border-t border-(--border-faint) flex items-center gap-3">
          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-(--accent) text-white rounded-lg px-4 py-2 text-[13px] font-semibold hover:opacity-90 transition-opacity duration-150 cursor-pointer disabled:opacity-60 border-none"
          >
            {saving ? "Saving…" : "Save to project"}
          </button>
          <button
            onClick={() => discardArtifact(artifact.id)}
            className="text-(--text-muted) text-[13px] hover:text-(--text-primary) bg-transparent border-none cursor-pointer transition-colors duration-150"
          >
            Discard
          </button>
        </div>
      )}
    </div>
  );
};
