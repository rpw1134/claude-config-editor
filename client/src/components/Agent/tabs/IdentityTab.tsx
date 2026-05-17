import type { AgentFrontmatter } from "../../../lib/frontmatter";
import { FieldHelp } from "../../Shared/forms/FieldHelp";
import { ColorPicker } from "../../Shared/forms/ColorPicker";
import { fieldInput, fieldLabel } from "../../Shared/forms/styles";

interface IdentityTabProps {
  fm: AgentFrontmatter;
  onFieldChange: <K extends keyof AgentFrontmatter>(
    key: K,
    value: AgentFrontmatter[K],
  ) => void;
  disabled?: boolean;
}

export const IdentityTab = ({ fm, onFieldChange, disabled }: IdentityTabProps) => (
  <div className="px-7 py-8 flex flex-col gap-6 overflow-y-auto h-full">
    <div>
      <h2 className="m-0 mb-1 text-2xl font-['Bricolage_Grotesque',sans-serif] font-bold tracking-[-0.015em] text-(--text-primary)">
        Identity
      </h2>
      <p className="m-0 text-[13px] text-(--text-secondary)">
        Name, description, and color for this agent.
      </p>
    </div>

    <div className="flex flex-col gap-5">
      <div>
        <label className={fieldLabel}>
          Name
          <FieldHelp text="The agent's slug identifier, used in frontmatter and when Claude Code dispatches to this agent." />
        </label>
        <input
          type="text"
          value={fm.name ?? ""}
          onChange={(e) => onFieldChange("name", e.target.value || undefined)}
          disabled={disabled}
          placeholder="my-agent"
          className={fieldInput}
        />
      </div>

      <div>
        <label className={fieldLabel}>
          Description
          <FieldHelp text="Tells Claude Code when to delegate tasks to this agent. Be specific about the agent's specialty." />
        </label>
        <textarea
          rows={4}
          value={fm.description ?? ""}
          onChange={(e) =>
            onFieldChange("description", e.target.value || undefined)
          }
          disabled={disabled}
          placeholder="When Claude should delegate to this agent…"
          className={fieldInput + " resize-none leading-relaxed"}
        />
      </div>

      <div>
        <label className={fieldLabel}>
          Color
          <FieldHelp text="Visual color tag shown in the sidebar. Purely cosmetic." />
        </label>
        <ColorPicker
          value={fm.color}
          onChange={(v) => onFieldChange("color", v)}
          disabled={disabled}
        />
      </div>
    </div>
  </div>
);
