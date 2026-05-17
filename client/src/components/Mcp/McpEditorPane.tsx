import { useEffect, useState } from "react";
import {
  fetchMcpServerContent,
  updateMcpServerContent,
  deleteMcpServer,
} from "../../lib/api";
import { Editor } from "../Editor/Editor";

// ── Types ─────────────────────────────────────────────────────────────────────

type TabId = "configure" | "json";
type AuthType = "none" | "bearer" | "api-key";

// ── Helpers ───────────────────────────────────────────────────────────────────

function detectAuthType(headers: Record<string, string> | undefined): AuthType {
  if (!headers) return "none";
  if ("Authorization" in headers) return "bearer";
  if ("x-api-key" in headers) return "api-key";
  return "none";
}

function extractToken(
  headers: Record<string, string> | undefined,
  authType: AuthType,
): string {
  if (!headers) return "";
  if (authType === "bearer") {
    const val = headers["Authorization"] ?? "";
    return val.startsWith("Bearer ") ? val.slice(7) : val;
  }
  if (authType === "api-key") return headers["x-api-key"] ?? "";
  return "";
}

function buildStdioJson(
  command: string,
  argsRaw: string,
  envRaw: string,
): string {
  const args = argsRaw
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  const env = parseEnv(envRaw);
  const obj: Record<string, unknown> = { command: command.trim() };
  if (args.length) obj.args = args;
  if (Object.keys(env).length) obj.env = env;
  return JSON.stringify(obj, null, 2);
}

function buildHttpJson(
  url: string,
  authType: AuthType,
  token: string,
): string {
  const obj: Record<string, unknown> = { type: "http", url: url.trim() };
  if (authType === "bearer" && token.trim()) {
    obj.headers = { Authorization: `Bearer ${token.trim()}` };
  } else if (authType === "api-key" && token.trim()) {
    obj.headers = { "x-api-key": token.trim() };
  }
  return JSON.stringify(obj, null, 2);
}

function parseEnv(raw: string): Record<string, string> {
  const result: Record<string, string> = {};
  for (const line of raw
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)) {
    const eqIdx = line.indexOf("=");
    if (eqIdx === -1) continue;
    const key = line.slice(0, eqIdx).trim();
    const value = line.slice(eqIdx + 1).trim();
    if (key) result[key] = value;
  }
  return result;
}

function envToRaw(env: Record<string, string>): string {
  return Object.entries(env)
    .map(([k, v]) => `${k}=${v}`)
    .join("\n");
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

const textareaClass = [inputClass, "resize-none leading-relaxed"].join(" ");

// ── TabButton ─────────────────────────────────────────────────────────────────

interface TabButtonProps {
  id: TabId;
  label: string;
  active: TabId;
  onClick: (id: TabId) => void;
}

const TabButton = ({ id, label, active, onClick }: TabButtonProps) => {
  const isActive = active === id;
  return (
    <button
      type="button"
      onClick={() => onClick(id)}
      className={[
        "pt-4 pb-3.5 px-3 bg-transparent border-none relative transition-colors duration-150 text-[14px]",
        isActive
          ? "cursor-default font-semibold text-(--text-primary) after:absolute after:bottom-0 after:left-0 after:right-0 after:h-px after:bg-(--accent)"
          : "cursor-pointer text-(--text-secondary) hover:text-(--text-primary)",
      ].join(" ")}
    >
      {label}
    </button>
  );
};

// ── ConfigureTab ──────────────────────────────────────────────────────────────

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
  // save
  onSave: () => void;
  saving: boolean;
  saveError: string | null;
}

const ConfigureTab = ({
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
  onSave,
  saving,
  saveError,
}: ConfigureTabProps) => (
  <div className="flex-1 overflow-y-auto px-8 py-7">
    <div className="max-w-xl flex flex-col gap-6">
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

      {saveError && (
        <p className="text-[12px] text-(--error) font-['Fira_Code',monospace]">
          {saveError}
        </p>
      )}

      <div>
        <button
          type="button"
          onClick={onSave}
          disabled={saving}
          className={[
            "px-5 py-2.5 rounded-xl text-[14px] font-semibold transition-colors duration-150",
            !saving
              ? "bg-(--accent) text-white cursor-pointer hover:bg-(--accent-hover) border-none"
              : "bg-(--bg-elevated) text-(--text-muted) border border-(--border-subtle) cursor-not-allowed",
          ].join(" ")}
        >
          {saving ? "Saving…" : "Save"}
        </button>
      </div>
    </div>
  </div>
);

// ── Icons ─────────────────────────────────────────────────────────────────────

const ChevronLeftIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <path d="M9 2L4 7L9 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// ── McpEditorPane ─────────────────────────────────────────────────────────────

export interface McpEditorPaneProps {
  name: string;
  projectPath: string;
  onBack: () => void;
  onDeleted: () => void;
}

export const McpEditorPane = ({
  name,
  projectPath,
  onBack,
  onDeleted,
}: McpEditorPaneProps) => {
  const [activeTab, setActiveTab] = useState<TabId>("configure");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Raw JSON state (for JSON tab)
  const [rawJson, setRawJson] = useState("{}");

  // Configure tab state
  const [serverType, setServerType] = useState<"stdio" | "http">("stdio");
  const [command, setCommand] = useState("");
  const [argsRaw, setArgsRaw] = useState("");
  const [envRaw, setEnvRaw] = useState("");
  const [url, setUrl] = useState("");
  const [authType, setAuthType] = useState<AuthType>("none");
  const [token, setToken] = useState("");

  // Save / delete state
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // ── Load ───────────────────────────────────────────────────────────────────

  useEffect(() => {
    setLoading(true);
    setLoadError(null);

    fetchMcpServerContent(projectPath, name)
      .then((content) => {
        setRawJson(content);
        try {
          const parsed = JSON.parse(content);
          if ("command" in parsed) {
            setServerType("stdio");
            setCommand(parsed.command ?? "");
            setArgsRaw((parsed.args ?? []).join("\n"));
            setEnvRaw(envToRaw(parsed.env ?? {}));
          } else if ("url" in parsed) {
            setServerType("http");
            setUrl(parsed.url ?? "");
            const detected = detectAuthType(parsed.headers);
            setAuthType(detected);
            setToken(extractToken(parsed.headers, detected));
          }
        } catch {
          // Unparseable JSON — show JSON tab by default
          setActiveTab("json");
        }
      })
      .catch((err) => {
        setLoadError(
          err instanceof Error ? err.message : "Failed to load server.",
        );
      })
      .finally(() => setLoading(false));
  }, [projectPath, name]);

  // ── Sync raw JSON when switching to JSON tab ──────────────────────────────

  const handleTabChange = (tab: TabId) => {
    if (tab === "json" && activeTab === "configure") {
      // Serialize configure form → JSON
      const next =
        serverType === "stdio"
          ? buildStdioJson(command, argsRaw, envRaw)
          : buildHttpJson(url, authType, token);
      setRawJson(next);
    }
    if (tab === "configure" && activeTab === "json") {
      // Try to parse JSON → configure form
      try {
        const parsed = JSON.parse(rawJson);
        if ("command" in parsed) {
          setServerType("stdio");
          setCommand(parsed.command ?? "");
          setArgsRaw((parsed.args ?? []).join("\n"));
          setEnvRaw(envToRaw(parsed.env ?? {}));
        } else if ("url" in parsed) {
          setServerType("http");
          setUrl(parsed.url ?? "");
          const detected = detectAuthType(parsed.headers);
          setAuthType(detected);
          setToken(extractToken(parsed.headers, detected));
        }
      } catch {
        // Keep configure form as-is if JSON is invalid
      }
    }
    setSaveError(null);
    setActiveTab(tab);
  };

  // ── Save ──────────────────────────────────────────────────────────────────

  const handleConfigureSave = async () => {
    if (saving) return;
    setSaving(true);
    setSaveError(null);
    const content =
      serverType === "stdio"
        ? buildStdioJson(command, argsRaw, envRaw)
        : buildHttpJson(url, authType, token);
    try {
      await updateMcpServerContent(projectPath, name, content);
      setRawJson(content);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Save failed.");
    } finally {
      setSaving(false);
    }
  };

  const handleJsonSave = async () => {
    if (saving) return;
    setSaving(true);
    setSaveError(null);
    try {
      await updateMcpServerContent(projectPath, name, rawJson);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Save failed.");
    } finally {
      setSaving(false);
    }
  };

  // ── Delete ────────────────────────────────────────────────────────────────

  const handleDeleteClick = async () => {
    if (!deleteConfirm) {
      setDeleteConfirm(true);
      return;
    }
    setDeleting(true);
    try {
      await deleteMcpServer(projectPath, name);
      onDeleted();
    } catch {
      setDeleting(false);
      setDeleteConfirm(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-(--bg-base)">
        <span className="text-[13px] text-(--text-muted)">Loading…</span>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="flex-1 flex items-center justify-center bg-(--bg-base)">
        <span className="text-[13px] text-(--error) font-['Fira_Code',monospace]">
          {loadError}
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 min-h-0 bg-(--bg-base)">
      {/* Header bar: back + file path + save */}
      <div className="shrink-0 flex items-center gap-2 px-4 py-2.5 border-b border-(--border-faint) bg-(--bg-base)">
        <button
          type="button"
          onClick={onBack}
          className="shrink-0 w-7 h-7 flex items-center justify-center rounded-md text-(--text-muted) hover:text-(--text-primary) hover:bg-(--bg-elevated) transition-colors duration-150 border-none bg-transparent cursor-pointer"
          aria-label="Back"
        >
          <ChevronLeftIcon />
        </button>
        <span className='font-["Fira_Code",monospace] text-[11px] text-(--text-muted) truncate flex-1 hidden sm:block'>
          ~/.claude/mcpServers/{name}
        </span>
        <button
          type="button"
          onClick={activeTab === "configure" ? handleConfigureSave : handleJsonSave}
          disabled={saving}
          className={[
            "text-[13px] px-3 py-1 rounded-md border-none transition-colors duration-150 shrink-0",
            saving
              ? "bg-(--bg-surface) text-(--text-muted) opacity-50 cursor-not-allowed"
              : "bg-(--accent) cursor-pointer text-white hover:bg-(--accent-hover)",
          ].join(" ")}
        >
          {saving ? "Saving…" : "Save"}
        </button>
      </div>

      {/* Name + Delete */}
      <div className="px-8 pt-6 pb-0 shrink-0">
        <div className="flex items-start justify-between">
          <h1 className='font-["Bricolage_Grotesque",sans-serif] text-[22px] font-bold text-(--text-primary) leading-tight m-0'>
            {name}
          </h1>
          <button
            type="button"
            onClick={handleDeleteClick}
            disabled={deleting}
            onBlur={() => setDeleteConfirm(false)}
            className={[
              "text-[13px] px-3 py-1.5 rounded-lg border transition-colors duration-150 cursor-pointer",
              deleteConfirm
                ? "bg-(--error) text-white border-transparent hover:opacity-90"
                : "bg-transparent text-(--text-muted) border-(--border-subtle) hover:text-(--error) hover:border-(--error)",
            ].join(" ")}
          >
            {deleting
              ? "Deleting…"
              : deleteConfirm
                ? "Are you sure?"
                : "Delete"}
          </button>
        </div>

        {/* Tab bar */}
        <div className="flex items-stretch gap-1 mt-4 border-b border-(--border-faint)">
          <TabButton
            id="configure"
            label="Configure"
            active={activeTab}
            onClick={handleTabChange}
          />
          <TabButton
            id="json"
            label="JSON"
            active={activeTab}
            onClick={handleTabChange}
          />
        </div>
      </div>

      {/* Tab content */}
      {activeTab === "configure" && (
        <ConfigureTab
          serverType={serverType}
          command={command}
          onCommandChange={setCommand}
          argsRaw={argsRaw}
          onArgsChange={setArgsRaw}
          envRaw={envRaw}
          onEnvChange={setEnvRaw}
          url={url}
          onUrlChange={setUrl}
          authType={authType}
          onAuthTypeChange={setAuthType}
          token={token}
          onTokenChange={setToken}
          onSave={handleConfigureSave}
          saving={saving}
          saveError={saveError}
        />
      )}

      {activeTab === "json" && (
        <div className="flex flex-col flex-1 min-h-0">
          <div className="flex items-center justify-between px-8 pt-5 pb-3 shrink-0">
            {saveError && (
              <p className="text-[12px] text-(--error) font-['Fira_Code',monospace]">
                {saveError}
              </p>
            )}
            <div className="ml-auto">
              <button
                type="button"
                onClick={handleJsonSave}
                disabled={saving}
                className={[
                  "text-[13px] px-3 py-1 rounded-md border-none transition-colors duration-150",
                  !saving
                    ? "bg-(--accent) cursor-pointer text-white hover:bg-(--accent-hover)"
                    : "bg-(--bg-surface) text-(--text-muted) opacity-50 cursor-not-allowed",
                ].join(" ")}
              >
                {saving ? "Saving…" : "Save"}
              </button>
            </div>
          </div>
          <div className="flex-1 min-h-0">
            <Editor
              value={rawJson}
              onChange={setRawJson}
              language="json"
            />
          </div>
        </div>
      )}
    </div>
  );
};
