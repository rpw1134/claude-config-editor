import type { SkillFrontmatter } from "../../../lib/frontmatter";
import { FieldHelp } from "../../Shared/forms/FieldHelp";
import { fieldInput, fieldLabel } from "../../Shared/forms/styles";

interface IdentityTabProps {
  fm: SkillFrontmatter;
  onFieldChange: <K extends keyof SkillFrontmatter>(
    key: K,
    value: SkillFrontmatter[K],
  ) => void;
  disabled?: boolean;
}

export const IdentityTab = ({
  fm,
  onFieldChange,
  disabled,
}: IdentityTabProps) => (
  <div className="px-7 py-8 flex flex-col gap-6 overflow-y-auto h-full">
    <div>
      <h2 className="m-0 mb-1 text-2xl font-['Bricolage_Grotesque',sans-serif] font-bold tracking-[-0.015em] text-(--text-primary)">
        Identity
      </h2>
      <p className="m-0 text-[13px] text-(--text-secondary)">
        Name, description, and invocation trigger for this skill.
      </p>
    </div>

    <div className="flex flex-col gap-5">
      <div>
        <label className={fieldLabel}>
          Name
          <FieldHelp text="The skill's slug identifier. Used as /skill-name when invoked by users." />
        </label>
        <input
          type="text"
          value={fm.name ?? ""}
          onChange={(e) => onFieldChange("name", e.target.value || undefined)}
          disabled={disabled}
          placeholder="my-skill"
          className={fieldInput}
        />
      </div>

      <div>
        <label className={fieldLabel}>
          Description
          <FieldHelp text="Describes what this skill does. Shown in the skill list and used by Claude Code to decide when to invoke it." />
        </label>
        <textarea
          rows={4}
          value={fm.description ?? ""}
          onChange={(e) =>
            onFieldChange("description", e.target.value || undefined)
          }
          disabled={disabled}
          placeholder="What this skill does…"
          className={fieldInput + " resize-none leading-relaxed"}
        />
      </div>

      <div>
        <label className={fieldLabel}>
          When to use
          <FieldHelp text="Tell Claude Code precisely when it should invoke this skill. The more specific, the better routing decisions Claude makes." />
        </label>
        <textarea
          rows={4}
          value={fm.when_to_use ?? ""}
          onChange={(e) =>
            onFieldChange("when_to_use", e.target.value || undefined)
          }
          disabled={disabled}
          placeholder="Describe the exact conditions that should trigger this skill…"
          className={fieldInput + " resize-none leading-relaxed"}
        />
      </div>
    </div>
  </div>
);
