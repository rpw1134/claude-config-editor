import type { AuthType } from "../../../lib/mcp";

interface FieldProps {
  label: string;
  children: React.ReactNode;
}

const Field = ({ label, children }: FieldProps) => (
  <div>
    <label className="block text-[11px] font-medium text-(--text-muted) tracking-widest uppercase mb-3">
      {label}
    </label>
    {children}
  </div>
);

const inputClass = [
  'w-full px-4 py-3 rounded-xl text-[14px] font-["Fira_Code",monospace]',
  "bg-(--bg-elevated) text-(--text-primary) outline-none transition-colors duration-150 box-border",
  "border border-(--border-subtle) focus:border-(--accent)",
].join(" ");

const textareaClass = [inputClass, "resize-none leading-relaxed"].join(" ");

interface ConfigureTabProps {
  serverType: "stdio" | "http";
  // stdio
  command: string;
  onCommandChange: (v: string) => void;
  argsRaw: string;
  onArgsChange: (v: string) => void;
  envRaw: string;
  onEnvChange: (v: string) => void;
  // http
  url: string;
  onUrlChange: (v: string) => void;
  authType: AuthType;
  onAuthTypeChange: (v: AuthType) => void;
  token: string;
  onTokenChange: (v: string) => void;
}

export const ConfigureTab = ({
  serverType,
  command,
  onCommandChange,
  argsRaw,
  onArgsChange,
  envRaw,
  onEnvChange,
  url,
  onUrlChange,
  authType,
  onAuthTypeChange,
  token,
  onTokenChange,
}: ConfigureTabProps) => (
  <div className="flex-1 overflow-y-auto px-8 py-7">
    <div className="flex flex-col gap-6">
      {serverType === "stdio" ? (
        <>
          <Field label="Command">
            <input
              type="text"
              value={command}
              onChange={(e) => onCommandChange(e.target.value)}
              placeholder="e.g. npx"
              className={inputClass}
            />
          </Field>
          <Field label="Arguments (one per line)">
            <textarea
              rows={5}
              value={argsRaw}
              onChange={(e) => onArgsChange(e.target.value)}
              placeholder={"-y\n@modelcontextprotocol/server-filesystem\n/"}
              className={textareaClass}
            />
          </Field>
          <Field label="Environment Variables (KEY=value, one per line)">
            <textarea
              rows={4}
              value={envRaw}
              onChange={(e) => onEnvChange(e.target.value)}
              placeholder="API_KEY=your-key-here"
              className={textareaClass}
            />
          </Field>
        </>
      ) : (
        <>
          <Field label="URL">
            <input
              type="text"
              value={url}
              onChange={(e) => onUrlChange(e.target.value)}
              placeholder="https://example.com/mcp"
              className={inputClass}
            />
          </Field>
          <Field label="Authentication">
            <select
              value={authType}
              onChange={(e) => {
                onAuthTypeChange(e.target.value as AuthType);
                onTokenChange("");
              }}
              className={[inputClass, "appearance-none cursor-pointer"].join(
                " ",
              )}
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
                placeholder={
                  authType === "bearer" ? "your-bearer-token" : "your-api-key"
                }
                className={inputClass}
              />
            </Field>
          )}
        </>
      )}
    </div>
  </div>
);
