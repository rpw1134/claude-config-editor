import type { AgentFrontmatter } from "../../../lib/frontmatter";
import { FieldHelp } from "../../Shared/forms/FieldHelp";
import { ModelSelect } from "../../Shared/forms/ModelSelect";
import { TagInput } from "../../Shared/forms/TagInput";
import { Toggle } from "../../Shared/forms/Toggle";
import {
  clusterLabel,
  fieldInput,
  fieldLabel,
} from "../../Shared/forms/styles";

interface SettingsTabProps {
  fm: AgentFrontmatter;
  onFieldChange: <K extends keyof AgentFrontmatter>(
    key: K,
    value: AgentFrontmatter[K],
  ) => void;
  onDelete: () => void;
  deleteStatus: "idle" | "confirm" | "deleting" | "error";
  disabled?: boolean;
}

export const SettingsTab = ({
  fm,
  onFieldChange,
  onDelete,
  deleteStatus,
  disabled,
}: SettingsTabProps) => (
  <div className="px-7 py-8 flex flex-col gap-8 overflow-y-auto h-full">
    <div>
      <h2 className="m-0 mb-1 text-2xl font-['Bricolage_Grotesque',sans-serif] font-bold tracking-[-0.015em] text-(--text-primary)">
        Settings &amp; Config
      </h2>
      <p className="m-0 text-[13px] text-(--text-secondary)">
        Runtime behavior, permissions, and tool access for this agent.
      </p>
    </div>

    <div>
      <p className={clusterLabel}>Behavior</p>
      <div className="flex flex-col gap-4">
        <div>
          <label className={fieldLabel}>
            Model
            <FieldHelp text="Which Claude model this agent runs on. Inherit means the parent session's model is used." />
          </label>
          <ModelSelect
            value={fm.model}
            onChange={(v) => onFieldChange("model", v)}
            disabled={disabled}
          />
        </div>

        <div>
          <label className={fieldLabel}>
            Max Turns
            <FieldHelp text="Maximum number of back-and-forth turns before the agent stops. Leave blank for unlimited." />
          </label>
          <input
            type="number"
            min={1}
            value={fm.maxTurns ?? ""}
            onChange={(e) => {
              const v = e.target.value;
              onFieldChange(
                "maxTurns",
                v === "" ? undefined : Math.max(1, parseInt(v, 10)),
              );
            }}
            disabled={disabled}
            placeholder="Unlimited"
            className={fieldInput}
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

        <div>
          <label className={fieldLabel}>
            Background
            <FieldHelp text="When enabled, the agent runs as a detached background task rather than blocking the current session." />
          </label>
          <div className="flex items-center gap-3 mt-1">
            <Toggle
              checked={fm.background ?? false}
              onChange={(v) => onFieldChange("background", v || undefined)}
              disabled={disabled}
            />
            <span className="text-[13px] text-(--text-secondary)">
              Run as a background task
            </span>
          </div>
        </div>
      </div>
    </div>

    <div>
      <p className={clusterLabel}>Permissions</p>
      <div className="flex flex-col gap-4">
        <div>
          <label className={fieldLabel}>
            Permission Mode
            <FieldHelp text="Controls what actions the agent can take without asking for confirmation." />
          </label>
          <select
            value={fm.permissionMode ?? ""}
            onChange={(e) =>
              onFieldChange("permissionMode", e.target.value || undefined)
            }
            disabled={disabled}
            className={fieldInput}
          >
            <option value=""></option>
            <option value="default">default</option>
            <option value="acceptEdits">acceptEdits</option>
            <option value="auto">auto</option>
            <option value="dontAsk">dontAsk</option>
            <option value="bypassPermissions">bypassPermissions</option>
            <option value="plan">plan</option>
          </select>
        </div>

        <div>
          <label className={fieldLabel}>
            Isolation
            <FieldHelp text="worktree creates a clean git working tree so the agent's changes don't affect your branch." />
          </label>
          <select
            value={fm.isolation ?? ""}
            onChange={(e) =>
              onFieldChange("isolation", e.target.value || undefined)
            }
            disabled={disabled}
            className={fieldInput}
          >
            <option value=""></option>
            <option value="worktree">worktree</option>
          </select>
        </div>
      </div>
    </div>

    <div>
      <p className={clusterLabel}>Content</p>
      <div className="flex flex-col gap-4">
        <div>
          <label className={fieldLabel}>
            Tools
            <FieldHelp text="Allowlist of tools this agent can use. Leave empty to allow all tools." />
          </label>
          <TagInput
            value={fm.tools ?? []}
            onChange={(v) =>
              onFieldChange("tools", v.length > 0 ? v : undefined)
            }
            placeholder="Add tool…"
            disabled={disabled}
          />
        </div>

        <div>
          <label className={fieldLabel}>
            Disallowed Tools
            <FieldHelp text="Tools explicitly blocked for this agent, even if they'd otherwise be available." />
          </label>
          <TagInput
            value={fm.disallowedTools ?? []}
            onChange={(v) =>
              onFieldChange("disallowedTools", v.length > 0 ? v : undefined)
            }
            placeholder="Add tool…"
            disabled={disabled}
          />
        </div>

        <div>
          <label className={fieldLabel}>
            Initial Prompt
            <FieldHelp text="A prompt injected at the start of every run, before the user's message." />
          </label>
          <textarea
            rows={3}
            value={fm.initialPrompt ?? ""}
            onChange={(e) =>
              onFieldChange("initialPrompt", e.target.value || undefined)
            }
            disabled={disabled}
            placeholder="Prompt sent at the start of each run…"
            className={fieldInput + " resize-none leading-relaxed"}
          />
        </div>

        <div>
          <label className={fieldLabel}>
            MCP Servers
            <FieldHelp text="MCP server names this agent has access to." />
          </label>
          <TagInput
            value={fm.mcpServers ?? []}
            onChange={(v) =>
              onFieldChange("mcpServers", v.length > 0 ? v : undefined)
            }
            placeholder="Add server…"
            disabled={disabled}
          />
        </div>

        <div>
          <label className={fieldLabel}>
            Memory
            <FieldHelp text="Which memory scope the agent reads from and writes to." />
          </label>
          <select
            value={fm.memory ?? ""}
            onChange={(e) =>
              onFieldChange("memory", e.target.value || undefined)
            }
            disabled={disabled}
            className={fieldInput}
          >
            <option value=""></option>
            <option value="user">user</option>
            <option value="project">project</option>
            <option value="local">local</option>
          </select>
        </div>
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
            : "Delete agent"}
      </button>
    </div>
  </div>
);
