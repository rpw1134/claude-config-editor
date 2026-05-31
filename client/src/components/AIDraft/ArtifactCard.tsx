import { useState, type ReactNode } from "react";
import type { Artifact } from "../../types/aiDraft";
import { useAIDraft } from "../../contexts/AIDraftContext";
import { parseFrontmatter, parseSkillFrontmatter } from "../../lib/frontmatter";
import { renderMarkdown } from "../../lib/markdown";
import { DiscardModal } from "../Shared/DiscardModal";

// ── Type config ───────────────────────────────────────────────────────────────

const BODY_LABELS: Partial<Record<Artifact["type"], string>> = {
  agent: "System Prompt",
  skill: "Instructions",
  "claude-md": "Content",
};

// ── Field labels ──────────────────────────────────────────────────────────────

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

// ── Helpers ───────────────────────────────────────────────────────────────────

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

// ── PropertyCard ──────────────────────────────────────────────────────────────

interface PropertyCardProps {
  label: string;
  children: ReactNode;
}

const PropertyCard = ({ label, children }: PropertyCardProps) => (
  <div className="border border-(--border-subtle) rounded-lg overflow-hidden">
    <div className="px-3.5 py-2 border-b border-(--border-faint) bg-(--bg-elevated)">
      <span className="text-[11px] font-semibold uppercase tracking-wider text-(--text-muted)">{label}</span>
    </div>
    {children}
  </div>
);

// ── LinkCard body ─────────────────────────────────────────────────────────────

const LinkBody = ({ content }: { content: string }) => {
  const lines = content.trim().split("\n");
  const fields: Record<string, string> = {};
  for (const line of lines) {
    const idx = line.indexOf(":");
    if (idx !== -1) {
      fields[line.slice(0, idx).trim()] = line.slice(idx + 1).trim();
    }
  }
  const agent = fields.agent ?? "—";
  const skill = fields.skill ?? "—";
  const trigger = fields.trigger ?? fields.when ?? "—";

  return (
    <div className="px-5 pt-6 pb-4 flex flex-col gap-4">
      <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-(--bg-elevated) border border-(--border-subtle)">
        <span className="text-[13px] text-(--text-muted) font-medium min-w-14">Agent</span>
        <span className="text-[14px] font-semibold text-(--text-primary)">{agent}</span>
      </div>
      <div className="flex items-center justify-center text-(--text-muted) text-[20px] select-none">→</div>
      <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-(--bg-elevated) border border-(--border-subtle)">
        <span className="text-[13px] text-(--text-muted) font-medium min-w-14">Skill</span>
        <span className="text-[14px] font-semibold text-(--text-primary)">{skill}</span>
      </div>
      {trigger !== "—" && (
        <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-(--bg-elevated) border border-(--border-subtle)">
          <span className="text-[13px] text-(--text-muted) font-medium min-w-14 pt-0.5">Trigger</span>
          <span className="text-[14px] text-(--text-secondary) leading-snug">{trigger}</span>
        </div>
      )}
    </div>
  );
};

// ── JSON body (for mcp + hook) ────────────────────────────────────────────────

const JsonBody = ({ content, fields }: { content: string; fields: Record<string, string> }) => {
  let parsed: Record<string, unknown> = {};
  try { parsed = JSON.parse(content) as Record<string, unknown>; } catch { /* raw fallback */ }

  const rows = Object.entries(parsed).map(([k, v]) => ({
    label: fields[k] ?? k.replace(/[-_]/g, " "),
    value: typeof v === "object" ? JSON.stringify(v, null, 2) : String(v),
  }));

  if (rows.length === 0) {
    return (
      <pre className="px-5 py-4 text-[13px] text-(--text-secondary) font-mono whitespace-pre-wrap leading-relaxed">
        {content}
      </pre>
    );
  }

  return (
    <div className="px-5 pt-5 pb-4 flex flex-col gap-3">
      <PropertyCard label="Configuration">
        <div className="divide-y divide-(--border-faint)">
          {rows.map(({ label, value }) => (
            <div key={label} className="flex items-start gap-4 px-3.5 py-2.5">
              <span className="w-27 shrink-0 text-[12px] text-(--text-muted) capitalize">{label}</span>
              <span className="flex-1 text-[13px] font-mono text-(--text-primary) leading-snug wrap-break-word min-w-0 whitespace-pre-wrap">{value}</span>
            </div>
          ))}
        </div>
      </PropertyCard>
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
  const [confirmDiscard, setConfirmDiscard] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try { await saveArtifact(artifact.id); } finally { setSaving(false); }
  };

  // ── Link type ──────────────────────────────────────────────────────────────
  if (artifact.type === "link") {
    return (
      <div className="flex flex-col h-full min-h-0">
        <div className="flex-1 min-h-0 overflow-y-auto">
          <div className="px-5 pt-6 pb-2 flex flex-col gap-1">
            <h2 className='m-0 font-["Bricolage_Grotesque",sans-serif] font-bold text-[26px] text-(--text-primary) leading-[1.15] tracking-[-0.03em]'>
              {artifact.name}
            </h2>
            <p className="m-0 text-[13px] text-(--text-muted)">Session link</p>
          </div>
          <LinkBody content={artifact.content} />
        </div>
        <div className="shrink-0 px-5 py-3.5 border-t border-(--border-faint) flex items-center justify-between">
          {artifact.saved ? (
            <span className="text-[13px] text-(--text-muted) opacity-60">Linked</span>
          ) : (
            <button
              onClick={handleSave}
              disabled={saving}
              className="text-[13px] font-semibold text-(--accent) bg-transparent border-none cursor-pointer hover:bg-(--accent)/8 px-3 py-1.5 rounded-lg transition-colors duration-150 disabled:opacity-50"
            >
              {saving ? "Saving…" : "Confirm link"}
            </button>
          )}
          {!artifact.saved && (
            <button
              onClick={() => setConfirmDiscard(true)}
              className="text-[13px] text-(--text-muted) hover:text-(--text-primary) bg-transparent border-none cursor-pointer px-3 py-1.5 rounded-lg transition-colors duration-150"
            >
              Discard
            </button>
          )}
        </div>
        {confirmDiscard && (
          <DiscardModal
            title="Discard link?"
            message="This will remove the link from your session."
            confirmLabel="Discard"
            onConfirm={() => { discardArtifact(artifact.id); setConfirmDiscard(false); }}
            onCancel={() => setConfirmDiscard(false)}
          />
        )}
      </div>
    );
  }

  // ── MCP type ───────────────────────────────────────────────────────────────
  if (artifact.type === "mcp") {
    const mcpFields: Record<string, string> = {
      type: "Type",
      command: "Command",
      args: "Arguments",
      url: "URL",
      env: "Environment",
    };
    return (
      <div className="flex flex-col h-full min-h-0">
        <div className="flex-1 min-h-0 overflow-y-auto">
          <div className="px-5 pt-6 pb-2 flex flex-col gap-1">
            <h2 className='m-0 font-["Bricolage_Grotesque",sans-serif] font-bold text-[26px] text-(--text-primary) leading-[1.15] tracking-[-0.03em]'>
              {artifact.name}
            </h2>
            <p className="m-0 text-[13px] text-(--text-muted)">MCP server</p>
          </div>
          <JsonBody content={artifact.content} fields={mcpFields} />
        </div>
        <div className="shrink-0 px-5 py-3.5 border-t border-(--border-faint) flex items-center justify-between">
          {artifact.saved ? (
            <button disabled className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-(--text-muted) opacity-60 bg-transparent border-none cursor-not-allowed px-3 py-1.5 rounded-lg">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M2 6L5 9L10 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Saved
            </button>
          ) : (
            <button onClick={handleSave} disabled={saving} className="text-[13px] font-semibold text-(--accent) bg-transparent border-none cursor-pointer hover:bg-(--accent)/8 px-3 py-1.5 rounded-lg transition-colors duration-150 disabled:opacity-50">
              {saving ? "Saving…" : "Save to project"}
            </button>
          )}
          {!artifact.saved && (
            <button onClick={() => setConfirmDiscard(true)} className="text-[13px] text-(--text-muted) hover:text-(--text-primary) bg-transparent border-none cursor-pointer px-3 py-1.5 rounded-lg transition-colors duration-150">
              Discard
            </button>
          )}
        </div>
        {confirmDiscard && (
          <DiscardModal
            title="Discard MCP server?"
            message="This will remove the draft from your session."
            confirmLabel="Discard"
            onConfirm={() => { discardArtifact(artifact.id); setConfirmDiscard(false); }}
            onCancel={() => setConfirmDiscard(false)}
          />
        )}
      </div>
    );
  }

  // ── Hook type ──────────────────────────────────────────────────────────────
  if (artifact.type === "hook") {
    return (
      <div className="flex flex-col h-full min-h-0">
        <div className="flex-1 min-h-0 overflow-y-auto">
          <div className="px-5 pt-6 pb-2 flex flex-col gap-1">
            <h2 className='m-0 font-["Bricolage_Grotesque",sans-serif] font-bold text-[26px] text-(--text-primary) leading-[1.15] tracking-[-0.03em]'>
              {artifact.name}
            </h2>
            <p className="m-0 text-[13px] text-(--text-muted)">Hook</p>
          </div>
          <JsonBody content={artifact.content} fields={{}} />
        </div>
        <div className="shrink-0 px-5 py-3.5 border-t border-(--border-faint) flex items-center justify-between">
          {artifact.saved ? (
            <button disabled className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-(--text-muted) opacity-60 bg-transparent border-none cursor-not-allowed px-3 py-1.5 rounded-lg">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M2 6L5 9L10 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Saved
            </button>
          ) : (
            <button onClick={handleSave} disabled={saving} className="text-[13px] font-semibold text-(--accent) bg-transparent border-none cursor-pointer hover:bg-(--accent)/8 px-3 py-1.5 rounded-lg transition-colors duration-150 disabled:opacity-50">
              {saving ? "Saving…" : "Save to project"}
            </button>
          )}
          {!artifact.saved && (
            <button onClick={() => setConfirmDiscard(true)} className="text-[13px] text-(--text-muted) hover:text-(--text-primary) bg-transparent border-none cursor-pointer px-3 py-1.5 rounded-lg transition-colors duration-150">
              Discard
            </button>
          )}
        </div>
        {confirmDiscard && (
          <DiscardModal
            title="Discard hook?"
            message="This will remove the draft from your session."
            confirmLabel="Discard"
            onConfirm={() => { discardArtifact(artifact.id); setConfirmDiscard(false); }}
            onCancel={() => setConfirmDiscard(false)}
          />
        )}
      </div>
    );
  }

  // ── Agent / Skill / CLAUDE.md ──────────────────────────────────────────────
  const bodyLabel = BODY_LABELS[artifact.type] ?? "Content";
  const parsed =
    artifact.type === "skill"
      ? parseSkillFrontmatter(artifact.content)
      : parseFrontmatter(artifact.content);
  const { frontmatter, body } = parsed;
  const fm = frontmatter as Record<string, unknown>;

  const displayName = fm.name ? String(fm.name) : artifact.name;
  const description = fm.description ? String(fm.description) : null;
  const whenToUse = !isEmpty(fm.when_to_use) ? String(fm.when_to_use) : null;

  const configFields: { key: string; label: string; value: string }[] = [];
  for (const [key, value] of Object.entries(fm)) {
    if (HEADER_SKIP.has(key) || DEDICATED_SECTION_KEYS.has(key) || isEmpty(value)) continue;
    configFields.push({
      key,
      label: FIELD_LABELS[key] ?? key.replace(/[-_]/g, " "),
      value: toDisplayValue(value),
    });
  }

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="flex-1 min-h-0 overflow-y-auto">
        <div className="px-5 pt-6 pb-6 flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <h2 className='m-0 font-["Bricolage_Grotesque",sans-serif] font-bold text-[26px] text-(--text-primary) leading-[1.15] tracking-[-0.03em]'>
              {displayName}
            </h2>
            {description && (
              <p className="m-0 text-[14px] text-(--text-secondary) leading-[1.55]">{description}</p>
            )}
          </div>

          {whenToUse && (
            <PropertyCard label="When to Use">
              <p className="m-0 px-3.5 py-3 text-[14px] text-(--text-secondary) leading-[1.65]">{whenToUse}</p>
            </PropertyCard>
          )}

          {configFields.length > 0 && (
            <PropertyCard label="Configuration">
              <div className="divide-y divide-(--border-faint)">
                {configFields.map(({ key, label, value }) => (
                  <div key={key} className="flex items-baseline gap-4 px-3.5 py-2.5">
                    <span className="w-27 shrink-0 text-[12px] text-(--text-muted)">{label}</span>
                    <span className="flex-1 text-[14px] font-medium text-(--text-primary) leading-snug wrap-break-word min-w-0">{value}</span>
                  </div>
                ))}
              </div>
            </PropertyCard>
          )}

          {body && (
            <div className="flex flex-col gap-2 mt-2">
              <h3 className="m-0 text-[17px] font-semibold text-(--text-primary)">{bodyLabel}</h3>
              <div className="bg-(--bg-elevated) border border-(--border-subtle) rounded-lg px-4 pt-3 pb-4">
                <div
                  className="artifact-body"
                  dangerouslySetInnerHTML={{ __html: renderMarkdown(body.trim()) }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="shrink-0 px-5 py-3.5 border-t border-(--border-faint) flex items-center justify-between">
        {artifact.saved ? (
          <button disabled className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-(--text-muted) opacity-60 bg-transparent border-none cursor-not-allowed px-3 py-1.5 rounded-lg">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M2 6L5 9L10 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Saved
          </button>
        ) : (
          <button
            onClick={handleSave}
            disabled={saving}
            className="text-[13px] font-semibold text-(--accent) bg-transparent border-none cursor-pointer hover:bg-(--accent)/8 px-3 py-1.5 rounded-lg transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? "Saving…" : "Save to project"}
          </button>
        )}
        {!artifact.saved && (
          <button
            onClick={() => setConfirmDiscard(true)}
            className="text-[13px] text-(--text-muted) hover:text-(--text-primary) bg-transparent border-none cursor-pointer px-3 py-1.5 rounded-lg transition-colors duration-150"
          >
            Discard
          </button>
        )}
      </div>

      {confirmDiscard && (
        <DiscardModal
          title="Discard draft?"
          message="This will permanently remove the draft from your session."
          confirmLabel="Discard"
          onConfirm={() => { discardArtifact(artifact.id); setConfirmDiscard(false); }}
          onCancel={() => setConfirmDiscard(false)}
        />
      )}
    </div>
  );
};
