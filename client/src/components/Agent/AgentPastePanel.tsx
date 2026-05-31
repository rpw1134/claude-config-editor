import { useRef, useState } from "react";
import { parseFrontmatter } from "../../lib/frontmatter";
import { validateName } from "../../lib/validation";
import { createAgent } from "../../lib/api";

interface AgentPastePanelProps {
  projectPath: string;
  onCreated: (name: string) => void;
}

export const AgentPastePanel = ({
  projectPath,
  onCreated,
}: AgentPastePanelProps) => {
  const [content, setContent] = useState("");
  const [nameOverride, setNameOverride] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const parsed = parseFrontmatter(content);
  const parsedName = parsed.frontmatter.name?.trim() ?? "";
  const effectiveName = nameOverride.trim() || parsedName;
  const nameError = content.trim() ? validateName(effectiveName) : null;
  const canSubmit =
    content.trim().length > 0 &&
    effectiveName.length > 0 &&
    nameError === null &&
    !submitting;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);
    try {
      await createAgent(projectPath, effectiveName, content);
      onCreated(effectiveName);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5 w-full max-w-[520px]">
      <div>
        <h1 className="m-0 mb-3 text-4xl font-['Bricolage_Grotesque',sans-serif] font-bold tracking-[-0.02em] leading-[1.1] text-(--text-primary)">
          Paste agent definition
        </h1>
        <p className="m-0 text-[14px] text-(--text-secondary) leading-[1.55]">
          Paste an existing agent <code className="font-['Fira_Code',monospace] text-[13px] bg-(--bg-hover) border border-(--border-subtle) rounded px-1 py-px">.md</code> file. The name is read from the frontmatter.
        </p>
      </div>

      <div>
        <label className="block text-[11px] font-medium text-(--text-muted) tracking-widest uppercase mb-2">
          File content
        </label>
        <textarea
          ref={textareaRef}
          rows={12}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          disabled={submitting}
          placeholder={"---\nname: my-agent\ndescription: What this agent does\n---\n\nYour system prompt here."}
          className={[
            'w-full font-["Fira_Code",monospace] text-[13px] text-(--text-primary)',
            "bg-(--bg-surface) rounded-3.5 px-4 py-3 resize-none outline-none transition-colors leading-relaxed box-border",
            "border border-(--border-subtle) focus:border-(--accent)",
          ].join(" ")}
        />
      </div>

      <div>
        <label className="block text-[11px] font-medium text-(--text-muted) tracking-widest uppercase mb-2">
          Name
        </label>
        <input
          type="text"
          value={nameOverride || parsedName}
          onChange={(e) => setNameOverride(e.target.value)}
          disabled={submitting}
          placeholder={parsedName || "extracted from frontmatter"}
          className={[
            'w-full px-4 py-3 rounded-3.5 text-[16px] font-["Fira_Code",monospace]',
            "bg-(--bg-surface) text-(--text-primary) outline-none transition-colors duration-150 box-border",
            nameError
              ? "border border-[rgba(248,113,113,0.5)]"
              : "border border-(--border-subtle) focus:border-(--accent)",
          ].join(" ")}
        />
        {nameError && content.trim() && (
          <p className="mt-2 text-[13px] text-(--error) font-['Fira_Code',monospace]">
            {nameError}
          </p>
        )}
      </div>

      {error && (
        <p className="text-[13px] text-(--error) font-['Fira_Code',monospace] m-0">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={!canSubmit}
        className={[
          "w-full py-3 rounded-2.5 text-[15px] font-semibold transition-colors duration-150",
          canSubmit
            ? "border border-(--border-subtle) bg-(--bg-elevated) text-(--text-primary) cursor-pointer hover:bg-(--bg-hover)"
            : "bg-(--bg-elevated) text-(--text-muted) border border-(--border-subtle) cursor-not-allowed",
        ].join(" ")}
      >
        {submitting ? "Creating…" : "Create Agent"}
      </button>
    </form>
  );
};
