import { useCallback, useEffect, useState } from "react";
import { useBlocker } from "react-router-dom";
import {
  fetchMcpServerContent,
  updateMcpServerContent,
  deleteMcpServer,
} from "../../lib/api";
import { Editor } from "../Editor/Editor";

// ── Types ─────────────────────────────────────────────────────────────────────

type TabId = "configure" | "json" | "settings";
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
  const [savedJson, setSavedJson] = useState("{}");

  // Configure tab state
  const [serverType, setServerType] = useState<"stdio" | "http">("stdio");
  const [command, setCommand] = useState("");
  const [argsRaw, setArgsRaw] = useState("");
  const [envRaw, setEnvRaw] = useState("");
  const [url, setUrl] = useState("");
  const [authType, setAuthType] = useState<AuthType>("none");
  const [token, setToken] = useState("");
  const [configDirty, setConfigDirty] = useState(false);

  // Dirty-aware configure field setters
  const setCommandDirty = (v: string) => { setCommand(v); setConfigDirty(true); };
  const setArgsRawDirty = (v: string) => { setArgsRaw(v); setConfigDirty(true); };
  const setEnvRawDirty = (v: string) => { setEnvRaw(v); setConfigDirty(true); };
  const setUrlDirty = (v: string) => { setUrl(v); setConfigDirty(true); };
  const setAuthTypeDirty = (v: AuthType) => { setAuthType(v); setConfigDirty(true); };
  const setTokenDirty = (v: string) => { setToken(v); setConfigDirty(true); };

  // Derived dirty state
  const dirty = configDirty || rawJson !== savedJson;

  // Block router navigation when there are unsaved changes
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      dirty && currentLocation.pathname !== nextLocation.pathname,
  );
  useEffect(() => {
    if (!dirty && blocker.state === "blocked") blocker.proceed();
  }, [dirty, blocker]);

  // Save / delete state
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // ── Load ───────────────────────────────────────────────────────────────────

  useEffect(() => {
    setLoading(true);
    setLoadError(null);

    fetchMcpServerContent(projectPath, name)
      .then((content) => {
        setRawJson(content);
        setSavedJson(content);
        setConfigDirty(false);
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
    setActiveTab(tab);
  };

  // ── Save ──────────────────────────────────────────────────────────────────

  const handleConfigureSave = useCallback(async () => {
    if (saving) return;
    setSaving(true);
    const content =
      serverType === "stdio"
        ? buildStdioJson(command, argsRaw, envRaw)
        : buildHttpJson(url, authType, token);
    try {
      await updateMcpServerContent(projectPath, name, content);
      setRawJson(content);
      setSavedJson(content);
      setConfigDirty(false);
    } catch {
      // save failed — dirty state preserved so user can retry
    } finally {
      setSaving(false);
    }
  }, [saving, serverType, command, argsRaw, envRaw, url, authType, token, projectPath, name]);

  const handleJsonSave = useCallback(async () => {
    if (saving) return;
    setSaving(true);
    try {
      await updateMcpServerContent(projectPath, name, rawJson);
      setSavedJson(rawJson);
      setConfigDirty(false);
    } catch {
      // save failed — dirty state preserved so user can retry
    } finally {
      setSaving(false);
    }
  }, [saving, projectPath, name, rawJson]);

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

  // ── Cmd+S keyboard shortcut ───────────────────────────────────────────────

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        if (!dirty || saving || activeTab === "settings") return;
        if (activeTab === "configure") handleConfigureSave();
        else handleJsonSave();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [dirty, saving, activeTab, handleConfigureSave, handleJsonSave]);

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
      {blocker.state === "blocked" && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
          onClick={() => blocker.reset()}
        >
          <div
            className="bg-(--bg-surface) rounded-4.5 border border-(--border-subtle) p-8 max-w-90 w-full mx-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="m-0 mb-2 text-[20px] font-bold text-(--text-primary)">
              Unsaved changes
            </h2>
            <p className="m-0 mb-6 text-[14px] text-(--text-secondary)">
              Leave without saving? Your changes will be lost.
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={() => blocker.proceed()}
                className="px-5 py-2.5 rounded-2.5 text-[14px] font-medium text-white bg-(--error) border-none cursor-pointer transition-colors duration-150"
              >
                Leave
              </button>
              <button
                onClick={() => blocker.reset()}
                className="text-[14px] text-(--text-muted) bg-transparent border-none cursor-pointer transition-colors duration-150 hover:text-(--text-secondary)"
              >
                Keep editing
              </button>
            </div>
          </div>
        </div>
      )}
      <div className="shrink-0 flex items-stretch justify-between border-b border-(--border-faint) px-4">
        <div className="flex items-stretch gap-1">
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-1.5 pt-6 pb-5 text-[14px] text-(--text-secondary) hover:text-(--text-primary) bg-transparent border-none cursor-pointer transition-colors duration-150 pr-3 mr-2 border-r border-(--border-subtle)"
          >
            <ChevronLeftIcon /> Back
          </button>
          <TabButton id="configure" label="Configure" active={activeTab} onClick={handleTabChange} />
          <TabButton id="json" label="JSON" active={activeTab} onClick={handleTabChange} />
          <TabButton id="settings" label="Settings" active={activeTab} onClick={handleTabChange} />
        </div>

        <div className="flex items-center gap-3">
          <span className='font-["Fira_Code",monospace] text-[11px] text-(--text-muted) truncate max-w-48 hidden sm:block'>
            ~/.claude/mcpServers/{name}
          </span>
          {activeTab !== "settings" && (
            <button
              type="button"
              onClick={(!dirty || saving) ? undefined : (activeTab === "configure" ? handleConfigureSave : handleJsonSave)}
              disabled={!dirty || saving}
              className={[
                "text-[13px] font-medium px-3 py-1 rounded-lg border-none transition-colors duration-150",
                (!dirty || saving)
                  ? "bg-(--bg-surface) text-(--text-muted) opacity-50 cursor-not-allowed"
                  : "bg-(--accent) text-white cursor-pointer hover:bg-(--accent-hover)",
              ].join(" ")}
            >
              {saving ? "Saving…" : dirty ? "Save" : "Up to date"}
            </button>
          )}
        </div>
      </div>

      {/* Tab content */}
      {activeTab === "configure" && (
        <ConfigureTab
          serverType={serverType}
          command={command}
          onCommandChange={setCommandDirty}
          argsRaw={argsRaw}
          onArgsChange={setArgsRawDirty}
          envRaw={envRaw}
          onEnvChange={setEnvRawDirty}
          url={url}
          onUrlChange={setUrlDirty}
          authType={authType}
          onAuthTypeChange={setAuthTypeDirty}
          token={token}
          onTokenChange={setTokenDirty}
        />
      )}

      {activeTab === "settings" && (
        <div className="flex-1 min-h-0 overflow-y-auto px-8 py-8 flex flex-col gap-8">
          <div>
            <h2 className='m-0 mb-1 text-2xl font-["Bricolage_Grotesque",sans-serif] font-bold tracking-[-0.015em] text-(--text-primary)'>
              Settings
            </h2>
            <p className="m-0 text-[13px] text-(--text-secondary)">
              Manage this MCP server configuration.
            </p>
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
              onClick={handleDeleteClick}
              disabled={deleting}
              onBlur={() => setDeleteConfirm(false)}
              className={[
                "text-[13px] font-medium px-3 py-1.5 rounded-lg border transition-colors duration-150 cursor-pointer",
                deleteConfirm
                  ? "bg-red-500/20 border-red-500/50 text-red-300 hover:bg-red-500/30"
                  : deleting
                    ? "bg-transparent border-red-500/20 text-red-500/50 cursor-not-allowed"
                    : "bg-transparent border-red-500/30 text-red-400 hover:bg-red-500/10",
              ].join(" ")}
            >
              {deleting
                ? "Deleting…"
                : deleteConfirm
                  ? "Are you sure? Click again to confirm."
                  : "Delete server"}
            </button>
          </div>
        </div>
      )}

      {activeTab === "json" && (
        <div className="flex flex-col flex-1 min-h-0">
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
