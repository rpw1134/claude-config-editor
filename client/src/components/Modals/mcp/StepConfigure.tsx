import type { AuthType } from "../../../lib/mcp";
import { Field } from "./shared";
import { inputClass, textareaClass } from "./styles";

export interface StepConfigureProps {
  serverType: "stdio" | "http";
  // stdio
  command: string;
  onCommandChange: (val: string) => void;
  argsRaw: string;
  onArgsRawChange: (val: string) => void;
  envRaw: string;
  onEnvRawChange: (val: string) => void;
  // http
  url: string;
  onUrlChange: (val: string) => void;
  authType: AuthType;
  onAuthTypeChange: (val: AuthType) => void;
  token: string;
  onTokenChange: (val: string) => void;
  onContinue: () => void;
  onBack: () => void;
}

export const StepConfigure = ({
  serverType,
  command,
  onCommandChange,
  argsRaw,
  onArgsRawChange,
  envRaw,
  onEnvRawChange,
  url,
  onUrlChange,
  authType,
  onAuthTypeChange,
  token,
  onTokenChange,
  onContinue,
  onBack,
}: StepConfigureProps) => {
  const tokenPlaceholder =
    authType === "bearer" ? "your-bearer-token" : "your-api-key";

  if (serverType === "stdio") {
    return (
      <div className="flex flex-col gap-5">
        <Field label="Command">
          <input
            type="text"
            value={command}
            onChange={(e) => onCommandChange(e.target.value)}
            placeholder="e.g. npx"
            className={inputClass}
            autoFocus
          />
        </Field>
        <Field label="Arguments (one per line)">
          <textarea
            rows={4}
            value={argsRaw}
            onChange={(e) => onArgsRawChange(e.target.value)}
            placeholder={"-y\n@modelcontextprotocol/server-filesystem\n/"}
            className={textareaClass}
          />
        </Field>
        <Field label="Environment Variables (optional, KEY=value)">
          <textarea
            rows={3}
            value={envRaw}
            onChange={(e) => onEnvRawChange(e.target.value)}
            placeholder={"API_KEY=your-key-here"}
            className={textareaClass}
          />
        </Field>
        <div className="flex gap-3 mt-1">
          <button
            type="button"
            onClick={onBack}
            className="px-5 py-3 rounded-xl text-[14px] font-medium text-(--text-muted) bg-(--bg-elevated) border border-(--border-subtle) cursor-pointer hover:text-(--text-secondary) hover:border-(--border-default) transition-colors duration-150"
          >
            ← Back
          </button>
          <button
            type="button"
            onClick={onContinue}
            disabled={!command.trim()}
            className={[
              "flex-1 py-3 rounded-xl text-[14px] font-semibold transition-colors duration-150",
              command.trim()
                ? "border border-(--border-subtle) bg-(--bg-elevated) text-(--text-primary) font-semibold cursor-pointer hover:bg-(--bg-hover)"
                : "bg-(--bg-elevated) text-(--text-muted) border border-(--border-subtle) cursor-not-allowed",
            ].join(" ")}
          >
            Review →
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <Field label="URL">
        <input
          type="text"
          value={url}
          onChange={(e) => onUrlChange(e.target.value)}
          placeholder="https://example.com/mcp"
          className={inputClass}
          autoFocus
        />
      </Field>
      <Field label="Authentication">
        <select
          value={authType}
          onChange={(e) => {
            onAuthTypeChange(e.target.value as AuthType);
            onTokenChange("");
          }}
          className={[inputClass, "appearance-none cursor-pointer"].join(" ")}
        >
          <option value="none">None</option>
          <option value="bearer">Bearer Token</option>
          <option value="api-key">API Key Header</option>
        </select>
      </Field>
      {authType !== "none" && (
        <Field label={authType === "bearer" ? "Bearer Token" : "API Key"}>
          <input
            type="text"
            value={token}
            onChange={(e) => onTokenChange(e.target.value)}
            placeholder={tokenPlaceholder}
            className={inputClass}
          />
        </Field>
      )}
      <div className="flex gap-3 mt-1">
        <button
          type="button"
          onClick={onBack}
          className="px-5 py-3 rounded-xl text-[14px] font-medium text-(--text-muted) bg-(--bg-elevated) border border-(--border-subtle) cursor-pointer hover:text-(--text-secondary) hover:border-(--border-default) transition-colors duration-150"
        >
          ← Back
        </button>
        <button
          type="button"
          onClick={onContinue}
          disabled={!url.trim()}
          className={[
            "flex-1 py-3 rounded-xl text-[14px] font-semibold transition-colors duration-150",
            url.trim()
              ? "border border-(--border-subtle) bg-(--bg-elevated) text-(--text-primary) font-semibold cursor-pointer hover:bg-(--bg-hover)"
              : "bg-(--bg-elevated) text-(--text-muted) border border-(--border-subtle) cursor-not-allowed",
          ].join(" ")}
        >
          Review →
        </button>
      </div>
    </div>
  );
};
