import { useEffect, useRef, useState } from "react";
import { createMcpServer } from "../../lib/api";

// ── Types ─────────────────────────────────────────────────────────────────────

type ServerType = "stdio" | "http";
type AuthType = "none" | "bearer" | "api-key";
type Step = 1 | 2 | 3 | 4;
type Mode = "guided" | "json";

// ── Icons ─────────────────────────────────────────────────────────────────────

const CloseIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
    <path d="M1.293 1.293a1 1 0 0 1 1.414 0L7 5.586l4.293-4.293a1 1 0 1 1 1.414 1.414L8.414 7l4.293 4.293a1 1 0 0 1-1.414 1.414L7 8.414l-4.293 4.293a1 1 0 0 1-1.414-1.414L5.586 7 1.293 2.707a1 1 0 0 1 0-1.414z" />
  </svg>
);

// ── Helpers ───────────────────────────────────────────────────────────────────

const NAME_PATTERN = /^[a-zA-Z0-9_-]+$/;

function parseLines(raw: string): string[] {
  return raw
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
}

function parseEnv(raw: string): Record<string, string> {
  const result: Record<string, string> = {};
  for (const line of parseLines(raw)) {
    const eqIdx = line.indexOf("=");
    if (eqIdx === -1) continue;
    const key = line.slice(0, eqIdx).trim();
    const value = line.slice(eqIdx + 1).trim();
    if (key) result[key] = value;
  }
  return result;
}

function buildJson(
  serverType: ServerType,
  command: string,
  argsRaw: string,
  envRaw: string,
  url: string,
  authType: AuthType,
  token: string,
): object {
  if (serverType === "stdio") {
    const args = parseLines(argsRaw);
    const env = parseEnv(envRaw);
    const obj: Record<string, unknown> = { command: command.trim() };
    if (args.length) obj.args = args;
    if (Object.keys(env).length) obj.env = env;
    return obj;
  }

  // http
  const obj: Record<string, unknown> = { type: "http", url: url.trim() };
  if (authType === "bearer" && token.trim()) {
    obj.headers = { Authorization: `Bearer ${token.trim()}` };
  } else if (authType === "api-key" && token.trim()) {
    obj.headers = { "x-api-key": token.trim() };
  }
  return obj;
}

// ── Shared field components ───────────────────────────────────────────────────

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

const textareaClass = [
  inputClass,
  "resize-none leading-relaxed",
].join(" ");

// ── TypeOption ────────────────────────────────────────────────────────────────

interface TypeOptionProps {
  id: ServerType;
  selected: ServerType;
  onSelect: (id: ServerType) => void;
  title: string;
  description: string;
}

const TypeOption = ({
  id,
  selected,
  onSelect,
  title,
  description,
}: TypeOptionProps) => {
  const isActive = selected === id;
  return (
    <button
      type="button"
      onClick={() => onSelect(id)}
      className={[
        "w-full text-left px-5 py-4 rounded-xl border transition-colors duration-150 cursor-pointer",
        isActive
          ? "bg-(--accent-dim) border-(--accent)"
          : "bg-(--bg-elevated) border-(--border-subtle) hover:border-(--border-default)",
      ].join(" ")}
    >
      <div className="flex items-center gap-3 mb-1">
        <div
          className={[
            "w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0",
            isActive ? "border-(--accent)" : "border-(--border-default)",
          ].join(" ")}
        >
          {isActive && (
            <div className="w-2 h-2 rounded-full bg-(--accent)" />
          )}
        </div>
        <span
          className={[
            "text-[14px] font-semibold",
            isActive ? "text-(--text-primary)" : "text-(--text-secondary)",
          ].join(" ")}
        >
          {title}
        </span>
      </div>
      <p className="text-[12px] text-(--text-muted) leading-relaxed pl-7">
        {description}
      </p>
    </button>
  );
};

// ── DiscardModal ──────────────────────────────────────────────────────────────

const DiscardModal = ({
  onConfirm,
  onCancel,
}: {
  onConfirm: () => void;
  onCancel: () => void;
}) => {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onCancel]);

  return (
    <div
      className="fixed inset-0 z-60 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={onCancel}
    >
      <div
        className="bg-(--bg-surface) rounded-4.5 border border-(--border-subtle) p-8 max-w-90 w-full mx-4 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="m-0 mb-2 text-[20px] font-bold text-(--text-primary)">
          Discard this server?
        </h2>
        <p className="m-0 mb-6 text-[14px] text-(--text-secondary)">
          You'll lose everything you've entered so far.
        </p>
        <div className="flex items-center gap-3">
          <button
            onClick={onConfirm}
            className="px-5 py-2.5 rounded-2.5 text-[14px] font-medium text-white bg-(--error) border-none cursor-pointer transition-colors duration-150"
          >
            Discard
          </button>
          <button
            onClick={onCancel}
            className="text-[14px] text-(--text-muted) bg-transparent border-none cursor-pointer transition-colors duration-150 hover:text-(--text-secondary)"
          >
            Keep editing
          </button>
        </div>
      </div>
    </div>
  );
};

// ── McpCreateModal ─────────────────────────────────────────────────────────────

export interface McpCreateModalProps {
  projectPath: string;
  onSuccess: (name: string) => void;
  onClose: () => void;
}

export const McpCreateModal = ({
  projectPath,
  onSuccess,
  onClose,
}: McpCreateModalProps) => {
  const [step, setStep] = useState<Step>(1);
  const [mode, setMode] = useState<Mode>("guided");
  const [name, setName] = useState("");
  const [nameError, setNameError] = useState<string | null>(null);
  const [serverType, setServerType] = useState<ServerType>("stdio");
  const [rawJson, setRawJson] = useState("{\n  \n}");

  // stdio fields
  const [command, setCommand] = useState("");
  const [argsRaw, setArgsRaw] = useState("");
  const [envRaw, setEnvRaw] = useState("");

  // http fields
  const [url, setUrl] = useState("");
  const [authType, setAuthType] = useState<AuthType>("none");
  const [token, setToken] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);

  const hasData = name !== "" || step > 1;

  const handleClose = () => {
    if (hasData) {
      setShowDiscardConfirm(true);
    } else {
      onClose();
    }
  };

  const nameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    nameInputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (showDiscardConfirm) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showDiscardConfirm, hasData]);

  // ── Step navigation ──────────────────────────────────────────────────────────

  const handleStep1Continue = (nextMode?: Mode) => {
    const trimmed = name.trim();
    if (!trimmed) {
      setNameError("Name is required.");
      return;
    }
    if (!NAME_PATTERN.test(trimmed)) {
      setNameError("Only letters, numbers, hyphens, and underscores allowed.");
      return;
    }
    setNameError(null);
    if (nextMode) setMode(nextMode);
    setStep(2);
  };

  const handleStep2Continue = () => setStep(3);
  const handleStep3Continue = () => setStep(4);

  const handleBack = () => {
    if (step === 2 && mode === "json") {
      setMode("guided");
      setStep(1);
    } else {
      setStep((s) => (s - 1) as Step);
    }
  };

  // ── Submit ───────────────────────────────────────────────────────────────────

  const handleCreate = async () => {
    if (submitting) return;
    setSubmitting(true);
    setSubmitError(null);

    const content = mode === "json"
      ? rawJson
      : JSON.stringify(
          buildJson(serverType, command, argsRaw, envRaw, url, authType, token),
          null,
          2,
        );

    try {
      await createMcpServer(projectPath, name.trim(), content);
      onSuccess(name.trim());
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : "Something went wrong.",
      );
      setSubmitting(false);
    }
  };

  // ── Derived ──────────────────────────────────────────────────────────────────

  const previewJson = JSON.stringify(
    buildJson(serverType, command, argsRaw, envRaw, url, authType, token),
    null,
    2,
  );

  const tokenPlaceholder =
    authType === "bearer" ? "your-bearer-token" : "your-api-key";

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-md mx-4 bg-(--bg-surface) border border-(--border-subtle) rounded-2xl p-8 shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between mb-1">
          <div className="flex-1 min-w-0 pr-4">
            <span className="block text-[11px] font-medium text-(--text-muted) tracking-widest uppercase mb-2">
              {mode === "json" ? `${step === 1 ? 1 : 2} / 2` : `${step} / 4`}
            </span>
            <h2 className='text-[22px] font-semibold text-(--text-primary) leading-tight font-["Bricolage_Grotesque",sans-serif] m-0'>
              {step === 1 && "New MCP Server"}
              {step === 2 && mode === "json" && "JSON Configuration"}
              {step === 2 && mode === "guided" && "Server Type"}
              {step === 3 && (serverType === "stdio" ? "Command" : "Connection")}
              {step === 4 && "Review"}
            </h2>
            <p className="mt-2 text-[13px] text-(--text-muted) leading-relaxed">
              {step === 1 && "Give your server a name — you can rename it later."}
              {step === 2 && mode === "json" && "Paste or type the server configuration JSON directly."}
              {step === 2 && mode === "guided" && "How does Claude connect to this server?"}
              {step === 3 && serverType === "stdio" && "Configure the command that starts your server."}
              {step === 3 && serverType === "http" && "Configure the remote server connection."}
              {step === 4 && "Review the generated configuration before saving."}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 w-8 h-8 flex items-center justify-center rounded-lg text-(--text-muted) hover:text-(--text-primary) hover:bg-(--bg-elevated) transition-colors duration-150 cursor-pointer border-none bg-transparent"
            aria-label="Close"
          >
            <CloseIcon />
          </button>
        </div>

        <div className="border-t border-(--border-subtle) my-6" />

        {/* Step 1: Name */}
        {step === 1 && (
          <div>
            <Field label="Name">
              <input
                ref={nameInputRef}
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (nameError) setNameError(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleStep1Continue();
                }}
                placeholder="e.g. filesystem"
                className={[
                  inputClass,
                  nameError ? "border-(--error)" : "",
                ].join(" ")}
              />
            </Field>
            {nameError && (
              <p className="mt-2 text-[12px] text-(--error) font-['Fira_Code',monospace]">
                {nameError}
              </p>
            )}
            <button
              type="button"
              onClick={() => handleStep1Continue()}
              disabled={!name.trim()}
              className={[
                "w-full mt-6 py-3 rounded-xl text-[14px] font-semibold transition-colors duration-150",
                name.trim()
                  ? "bg-(--accent) text-white cursor-pointer hover:bg-(--accent-hover) border-none"
                  : "bg-(--bg-elevated) text-(--text-muted) border border-(--border-subtle) cursor-not-allowed",
              ].join(" ")}
            >
              Continue →
            </button>
            {NAME_PATTERN.test(name.trim()) && (
              <button
                type="button"
                onClick={() => handleStep1Continue("json")}
                className="w-full mt-3 text-[13px] text-(--text-muted) hover:text-(--text-secondary) bg-transparent border-none cursor-pointer transition-colors duration-150"
              >
                Or work directly with JSON →
              </button>
            )}
          </div>
        )}

        {/* Step 2 (JSON mode): raw JSON editor */}
        {step === 2 && mode === "json" && (
          <div className="flex flex-col gap-5">
            <Field label="Configuration JSON">
              <textarea
                rows={10}
                value={rawJson}
                onChange={(e) => setRawJson(e.target.value)}
                placeholder={'{\n  "command": "npx",\n  "args": ["-y", "@modelcontextprotocol/server-filesystem", "/"]\n}'}
                className={textareaClass}
                autoFocus
                spellCheck={false}
              />
            </Field>
            {submitError && (
              <p className="text-[12px] text-(--error) font-['Fira_Code',monospace]">
                {submitError}
              </p>
            )}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleBack}
                className="px-5 py-3 rounded-xl text-[14px] font-medium text-(--text-muted) bg-(--bg-elevated) border border-(--border-subtle) cursor-pointer hover:text-(--text-secondary) hover:border-(--border-default) transition-colors duration-150"
              >
                ← Back
              </button>
              <button
                type="button"
                onClick={handleCreate}
                disabled={!rawJson.trim() || submitting}
                className={[
                  "flex-1 py-3 rounded-xl text-[14px] font-semibold transition-colors duration-150",
                  rawJson.trim() && !submitting
                    ? "bg-(--accent) text-white cursor-pointer hover:bg-(--accent-hover) border-none"
                    : "bg-(--bg-elevated) text-(--text-muted) border border-(--border-subtle) cursor-not-allowed",
                ].join(" ")}
              >
                {submitting ? "Creating…" : "Create Server"}
              </button>
            </div>
          </div>
        )}

        {/* Step 2 (guided mode): Type */}
        {step === 2 && mode === "guided" && (
          <div>
            <div className="flex flex-col gap-3">
              <TypeOption
                id="stdio"
                selected={serverType}
                onSelect={setServerType}
                title="Standard I/O (local process)"
                description="Runs a local command as a subprocess."
              />
              <TypeOption
                id="http"
                selected={serverType}
                onSelect={setServerType}
                title="HTTP / SSE (remote server)"
                description="Connects to a remote server via URL."
              />
            </div>
            <div className="flex gap-3 mt-6">
              <button
                type="button"
                onClick={handleBack}
                className="px-5 py-3 rounded-xl text-[14px] font-medium text-(--text-muted) bg-(--bg-elevated) border border-(--border-subtle) cursor-pointer hover:text-(--text-secondary) hover:border-(--border-default) transition-colors duration-150"
              >
                ← Back
              </button>
              <button
                type="button"
                onClick={handleStep2Continue}
                className="flex-1 py-3 rounded-xl text-[14px] font-semibold bg-(--accent) text-white cursor-pointer hover:bg-(--accent-hover) border-none transition-colors duration-150"
              >
                Continue →
              </button>
            </div>
          </div>
        )}

        {/* Step 3a: stdio — Command */}
        {step === 3 && serverType === "stdio" && (
          <div className="flex flex-col gap-5">
            <Field label="Command">
              <input
                type="text"
                value={command}
                onChange={(e) => setCommand(e.target.value)}
                placeholder="e.g. npx"
                className={inputClass}
                autoFocus
              />
            </Field>
            <Field label="Arguments (one per line)">
              <textarea
                rows={4}
                value={argsRaw}
                onChange={(e) => setArgsRaw(e.target.value)}
                placeholder={"-y\n@modelcontextprotocol/server-filesystem\n/"}
                className={textareaClass}
              />
            </Field>
            <Field label="Environment Variables (optional, KEY=value)">
              <textarea
                rows={3}
                value={envRaw}
                onChange={(e) => setEnvRaw(e.target.value)}
                placeholder={"API_KEY=your-key-here"}
                className={textareaClass}
              />
            </Field>
            <div className="flex gap-3 mt-1">
              <button
                type="button"
                onClick={handleBack}
                className="px-5 py-3 rounded-xl text-[14px] font-medium text-(--text-muted) bg-(--bg-elevated) border border-(--border-subtle) cursor-pointer hover:text-(--text-secondary) hover:border-(--border-default) transition-colors duration-150"
              >
                ← Back
              </button>
              <button
                type="button"
                onClick={handleStep3Continue}
                disabled={!command.trim()}
                className={[
                  "flex-1 py-3 rounded-xl text-[14px] font-semibold transition-colors duration-150",
                  command.trim()
                    ? "bg-(--accent) text-white cursor-pointer hover:bg-(--accent-hover) border-none"
                    : "bg-(--bg-elevated) text-(--text-muted) border border-(--border-subtle) cursor-not-allowed",
                ].join(" ")}
              >
                Review →
              </button>
            </div>
          </div>
        )}

        {/* Step 3b: http — Connection */}
        {step === 3 && serverType === "http" && (
          <div className="flex flex-col gap-5">
            <Field label="URL">
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com/mcp"
                className={inputClass}
                autoFocus
              />
            </Field>
            <Field label="Authentication">
              <select
                value={authType}
                onChange={(e) => {
                  setAuthType(e.target.value as AuthType);
                  setToken("");
                }}
                className={[
                  inputClass,
                  "appearance-none cursor-pointer",
                ].join(" ")}
              >
                <option value="none">None</option>
                <option value="bearer">Bearer Token</option>
                <option value="api-key">API Key Header</option>
              </select>
            </Field>
            {authType !== "none" && (
              <Field
                label={authType === "bearer" ? "Bearer Token" : "API Key"}
              >
                <input
                  type="text"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  placeholder={tokenPlaceholder}
                  className={inputClass}
                />
              </Field>
            )}
            <div className="flex gap-3 mt-1">
              <button
                type="button"
                onClick={handleBack}
                className="px-5 py-3 rounded-xl text-[14px] font-medium text-(--text-muted) bg-(--bg-elevated) border border-(--border-subtle) cursor-pointer hover:text-(--text-secondary) hover:border-(--border-default) transition-colors duration-150"
              >
                ← Back
              </button>
              <button
                type="button"
                onClick={handleStep3Continue}
                disabled={!url.trim()}
                className={[
                  "flex-1 py-3 rounded-xl text-[14px] font-semibold transition-colors duration-150",
                  url.trim()
                    ? "bg-(--accent) text-white cursor-pointer hover:bg-(--accent-hover) border-none"
                    : "bg-(--bg-elevated) text-(--text-muted) border border-(--border-subtle) cursor-not-allowed",
                ].join(" ")}
              >
                Review →
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Review */}
        {step === 4 && (
          <div>
            <div className="mb-5">
              <p className="text-[11px] font-medium text-(--text-muted) tracking-widest uppercase mb-3">
                Configuration for{" "}
                <span className='font-["Fira_Code",monospace] normal-case tracking-normal text-(--text-secondary)'>
                  {name.trim()}
                </span>
              </p>
              <pre
                className={[
                  'font-["Fira_Code",monospace] text-[12px] text-(--text-primary) leading-relaxed',
                  "bg-(--bg-elevated) border border-(--border-faint) rounded-xl px-5 py-4",
                  "overflow-y-auto max-h-48 whitespace-pre-wrap break-all",
                ].join(" ")}
              >
                {previewJson}
              </pre>
            </div>

            {submitError && (
              <p className="mb-4 text-[12px] text-(--error) font-['Fira_Code',monospace]">
                {submitError}
              </p>
            )}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleBack}
                disabled={submitting}
                className="px-5 py-3 rounded-xl text-[14px] font-medium text-(--text-muted) bg-(--bg-elevated) border border-(--border-subtle) cursor-pointer hover:text-(--text-secondary) hover:border-(--border-default) transition-colors duration-150"
              >
                ← Back
              </button>
              <button
                type="button"
                onClick={handleCreate}
                disabled={submitting}
                className={[
                  "flex-1 py-3 rounded-xl text-[14px] font-semibold transition-colors duration-150",
                  !submitting
                    ? "bg-(--accent) text-white cursor-pointer hover:bg-(--accent-hover) border-none"
                    : "bg-(--bg-elevated) text-(--text-muted) border border-(--border-subtle) cursor-not-allowed",
                ].join(" ")}
              >
                {submitting ? "Creating…" : "Create Server"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
