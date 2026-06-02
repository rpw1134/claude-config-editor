import { useCallback, useEffect, useState } from "react";
import {
  fetchMcpServerContent,
  updateMcpServerContent,
  deleteMcpServer,
} from "../lib/api";
import {
  type AuthType,
  detectAuthType,
  extractToken,
  buildStdioJson,
  buildHttpJson,
  envToRaw,
} from "../lib/mcp";
import { useVersionControl } from "../contexts/VersionControlContext";

type TabId = "configure" | "json" | "settings";

export function useMcpEditor(name: string, projectPath: string, onDeleted: () => void) {
  const { refresh: refreshVc } = useVersionControl();
  const [activeTab, setActiveTab] = useState<TabId>("configure");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Raw JSON state (for JSON tab)
  const [rawJson, setRawJson] = useState("{}");
  const [savedJson, setSavedJson] = useState("{}");
  // True only when the user has actually typed in the JSON editor (not when
  // handleTabChange syncs the configured form values into rawJson).
  const [jsonEdited, setJsonEdited] = useState(false);

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

  // Derived dirty state — jsonEdited only flips true when the user actually
  // types in the JSON editor; tab-switching sync (handleTabChange) does not count.
  const dirty = configDirty || jsonEdited;

  // Save / delete state
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // ── Load ───────────────────────────────────────────────────────────────────

  useEffect(() => {
    fetchMcpServerContent(projectPath, name)
      .then((content) => {
        setRawJson(content);
        setSavedJson(content);
        setConfigDirty(false);
        setJsonEdited(false);
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

  // ── Sync raw JSON when switching tabs ────────────────────────────────────

  const handleTabChange = (tab: TabId) => {
    if (tab === "json" && activeTab === "configure") {
      const next =
        serverType === "stdio"
          ? buildStdioJson(command, argsRaw, envRaw)
          : buildHttpJson(url, authType, token);
      setRawJson(next);
    }
    if (tab === "configure" && activeTab === "json") {
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
      setJsonEdited(false);
      refreshVc();
    } catch {
      // save failed — dirty state preserved so user can retry
    } finally {
      setSaving(false);
    }
  }, [saving, serverType, command, argsRaw, envRaw, url, authType, token, projectPath, name, refreshVc]);

  const handleJsonSave = useCallback(async () => {
    if (saving) return;
    setSaving(true);
    try {
      await updateMcpServerContent(projectPath, name, rawJson);
      setSavedJson(rawJson);
      setConfigDirty(false);
      setJsonEdited(false);
      refreshVc();
    } catch {
      // save failed — dirty state preserved so user can retry
    } finally {
      setSaving(false);
    }
  }, [saving, projectPath, name, rawJson, refreshVc]);

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
        if (activeTab === "configure") void handleConfigureSave();
        else void handleJsonSave();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [dirty, saving, activeTab, handleConfigureSave, handleJsonSave]);

  return {
    loading,
    loadError,
    activeTab,
    setActiveTab: handleTabChange,
    // configure form values
    serverType,
    command,
    argsRaw,
    envRaw,
    url,
    authType,
    token,
    // dirty-aware setters
    setCommandDirty,
    setArgsRawDirty,
    setEnvRawDirty,
    setUrlDirty,
    setAuthTypeDirty,
    setTokenDirty,
    setServerType,
    // json
    rawJson,
    setRawJson,
    setRawJsonDirty: (v: string) => { setRawJson(v); setJsonEdited(true); },
    // status
    dirty,
    saving,
    // handlers
    handleConfigureSave,
    handleJsonSave,
    // delete
    deleteConfirm,
    setDeleteConfirm,
    deleting,
    handleDeleteClick,
  };
}
