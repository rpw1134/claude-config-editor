import type { SkillFrontmatter } from "../../../lib/frontmatter";
import { FieldHelp } from "../../Shared/forms/FieldHelp";
import { ModelSelect } from "../../Shared/forms/ModelSelect";
import { TagInput } from "../../Shared/forms/TagInput";
import { Toggle } from "../../Shared/forms/Toggle";
import {
  clusterLabel,
  fieldInput,
  fieldLabel,
} from "../../Shared/forms/styles";

interface SkillSettingsTabProps {
  fm: SkillFrontmatter;
  onFieldChange: <K extends keyof SkillFrontmatter>(
    key: K,
    value: SkillFrontmatter[K],
  ) => void;
  onDelete: () => void;
  deleteStatus: "idle" | "confirm" | "deleting" | "error";
  disabled?: boolean;
}

export const SkillSettingsTab = ({
  fm,
  onFieldChange,
  onDelete,
  deleteStatus,
  disabled,
}: SkillSettingsTabProps) => (
  <div className="px-7 py-8 flex flex-col gap-8 overflow-y-auto h-full">
    <div>
      <h2 className="m-0 mb-1 text-2xl font-['Bricolage_Grotesque',sans-serif] font-bold tracking-[-0.015em] text-(--text-primary)">
        Settings
      </h2>
      <p className="m-0 text-[13px] text-(--text-secondary)">
        Invocation behavior, model, and tool access for this skill.
      </p>
    </div>

    <div>
      <p className={clusterLabel}>Invocation</p>
      <div className="flex flex-col gap-4">
        <div>
          <label className={fieldLabel}>
            Argument hint
            <FieldHelp text="Shown to the user when they invoke the skill. Describes what arguments to pass." />
          </label>
          <input
            type="text"
            value={fm["argument-hint"] ?? ""}
            onChange={(e) =>
              onFieldChange("argument-hint", e.target.value || undefined)
            }
            disabled={disabled}
            placeholder="e.g. file path to analyze"
            className={fieldInput}
          />
        </div>

        <div>
          <label className={fieldLabel}>User-invocable</label>
          <div className="flex items-center gap-3 mt-1">
            <Toggle
              checked={fm["user-invocable"] ?? false}
              onChange={(v) => onFieldChange("user-invocable", v || undefined)}
              disabled={disabled}
            />
            <span className="text-[13px] text-(--text-secondary)">
              Invocable by user with /skill-name
            </span>
          </div>
        </div>

        <div>
          <label className={fieldLabel}>Disable model invocation</label>
          <div className="flex items-center gap-3 mt-1">
            <Toggle
              checked={fm["disable-model-invocation"] ?? false}
              onChange={(v) =>
                onFieldChange("disable-model-invocation", v || undefined)
              }
              disabled={disabled}
            />
            <span className="text-[13px] text-(--text-secondary)">
              Disable model invocation (run as script only)
            </span>
          </div>
        </div>

        <div>
          <label className={fieldLabel}>
            Context
            <FieldHelp text="fork creates a new context window isolated from the parent session." />
          </label>
          <select
            value={fm.context ?? ""}
            onChange={(e) =>
              onFieldChange("context", e.target.value || undefined)
            }
            disabled={disabled}
            className={fieldInput}
          >
            <option value="">Default</option>
            <option value="fork">fork</option>
          </select>
        </div>
      </div>
    </div>

    <div>
      <p className={clusterLabel}>Model</p>
      <div className="flex flex-col gap-4">
        <div>
          <label className={fieldLabel}>
            Model
            <FieldHelp text="Which Claude model this skill runs on. Inherit uses the parent session's model." />
          </label>
          <ModelSelect
            value={fm.model}
            onChange={(v) => onFieldChange("model", v)}
            disabled={disabled}
          />
        </div>

        <div>
          <label className={fieldLabel}>
            Effort
            <FieldHelp text="Thinking budget for the model. Higher effort = more reasoning = slower and more expensive." />
          </label>
          <select
            value={fm.effort ?? ""}
            onChange={(e) =>
              onFieldChange("effort", e.target.value || undefined)
            }
            disabled={disabled}
            className={fieldInput}
          >
            <option value=""></option>
            <option value="low">low</option>
            <option value="medium">medium</option>
            <option value="high">high</option>
            <option value="xhigh">xhigh</option>
            <option value="max">max</option>
          </select>
        </div>
      </div>
    </div>

    <div>
      <p className={clusterLabel}>Tools</p>
      <div>
        <label className={fieldLabel}>
          Allowed tools
          <FieldHelp text="Allowlist of tools this skill can use. Leave empty to inherit the default tool set." />
        </label>
        <TagInput
          value={fm["allowed-tools"] ?? []}
          onChange={(v) =>
            onFieldChange("allowed-tools", v.length > 0 ? v : undefined)
          }
          placeholder="Add tool…"
          disabled={disabled}
        />
      </div>
    </div>

    <div className="border border-red-500/30 rounded-xl p-5">
      <div className="mb-3">
        <p className="m-0 mb-1 text-[13px] font-semibold text-red-400">
          &#9888; Danger Zone
        </p>
        <p className="m-0 text-[12px] text-(--text-muted)">
          Permanent actions that cannot be undone.
        </p>
      </div>
      <button
        type="button"
        onClick={onDelete}
        disabled={deleteStatus === "deleting"}
        className={[
          "text-[13px] font-medium px-3 py-1.5 rounded-lg border transition-colors duration-150 cursor-pointer",
          deleteStatus === "confirm"
            ? "bg-red-500/20 border-red-500/50 text-red-300 hover:bg-red-500/30"
            : deleteStatus === "deleting"
              ? "bg-transparent border-red-500/20 text-red-500/50 cursor-not-allowed"
              : "bg-transparent border-red-500/30 text-red-400 hover:bg-red-500/10",
        ].join(" ")}
      >
        {deleteStatus === "confirm"
          ? "Are you sure? Click again to confirm."
          : deleteStatus === "deleting"
            ? "Deleting…"
            : "Delete skill"}
      </button>
    </div>
  </div>
);
