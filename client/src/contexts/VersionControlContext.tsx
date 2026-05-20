import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import type { ChangeEntry, VCStatus } from "../lib/api";
import { fetchVcStatus } from "../lib/api";

type ChangeStatus = "M" | "A" | "??";

interface VersionControlContextValue {
  status: VCStatus | null;
  changeCount: number;
  isLoading: boolean;
  // Increments after each successful status fetch — use as dep in history tabs
  historyKey: number;
  refresh: () => void;
  getItemStatus: (
    type: "agent" | "skill" | "mcp" | "hooks",
    name?: string,
  ) => ChangeStatus | null;
  markMcpDirty: (key: string) => void;
  markHooksDirty: (eventName: string) => void;
}

export const VersionControlContext =
  createContext<VersionControlContextValue | null>(null);

export const useVersionControl = (): VersionControlContextValue => {
  const ctx = useContext(VersionControlContext);
  if (!ctx)
    throw new Error(
      "useVersionControl must be used inside VersionControlContext.Provider",
    );
  return ctx;
};

interface VersionControlProviderProps {
  projectPath: string | null;
  vcRefreshKey: number;
  children: React.ReactNode;
}

// Returns the prefix to strip from repoRoot-relative paths to get configDir-relative paths.
// e.g. for per-project repos: ".claude/"  for global: ""
function computeConfigPrefix(repoRoot: string | null, configDir: string): string {
  if (!repoRoot || configDir === repoRoot) return "";
  if (configDir.startsWith(repoRoot + "/")) {
    return configDir.slice(repoRoot.length + 1) + "/";
  }
  return "";
}

export function VersionControlProvider({
  projectPath,
  vcRefreshKey,
  children,
}: VersionControlProviderProps) {
  const [status, setStatus] = useState<VCStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [historyKey, setHistoryKey] = useState(0);
  const [mcpDirty, setMcpDirty] = useState<Set<string>>(new Set());
  const [hooksDirty, setHooksDirty] = useState<Set<string>>(new Set());

  const fetchStatus = useCallback(async () => {
    if (!projectPath) {
      setStatus(null);
      return;
    }
    setIsLoading(true);
    try {
      const result = await fetchVcStatus(projectPath);

      // Normalize change file paths from repoRoot-relative to configDir-relative
      // so all downstream code uses consistent, prefix-free paths.
      const prefix = computeConfigPrefix(result.repoRoot, result.configDir);
      const normalizedChanges = result.changes.map((c: ChangeEntry) => ({
        ...c,
        file: prefix && c.file.startsWith(prefix) ? c.file.slice(prefix.length) : c.file,
      }));
      const normalizedResult = { ...result, changes: normalizedChanges };

      setStatus(normalizedResult);
      setHistoryKey((k) => k + 1);

      const hasSettingsChange = normalizedChanges.some((c: ChangeEntry) =>
        c.file.includes("settings.json"),
      );
      if (!hasSettingsChange) {
        setMcpDirty(new Set());
        setHooksDirty(new Set());
      }
    } catch {
      setStatus(null);
    } finally {
      setIsLoading(false);
    }
  }, [projectPath]);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus, vcRefreshKey]);

  useEffect(() => {
    const handleFocus = () => fetchStatus();
    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [fetchStatus]);

  const refresh = useCallback(() => {
    fetchStatus();
  }, [fetchStatus]);

  const getItemStatus = useCallback(
    (
      type: "agent" | "skill" | "mcp" | "hooks",
      name?: string,
    ): ChangeStatus | null => {
      if (!status) return null;

      // Changes are already normalized to configDir-relative paths.
      if (type === "agent") {
        if (!name) return null;
        const entry = status.changes.find(
          (c: ChangeEntry) => c.file === `agents/${name}.md`,
        );
        return entry ? (entry.status as ChangeStatus) : null;
      }

      if (type === "skill") {
        if (!name) return null;
        const entry = status.changes.find((c: ChangeEntry) =>
          c.file.startsWith(`skills/${name}/`),
        );
        return entry ? (entry.status as ChangeStatus) : null;
      }

      if (type === "mcp") {
        if (!name) return null;
        const hasSettings = status.changes.some((c: ChangeEntry) =>
          c.file.includes("settings.json"),
        );
        return mcpDirty.has(name) && hasSettings ? "M" : null;
      }

      if (type === "hooks") {
        if (!name) return null;
        const hasSettings = status.changes.some((c: ChangeEntry) =>
          c.file.includes("settings.json"),
        );
        return hooksDirty.has(name) && hasSettings ? "M" : null;
      }

      return null;
    },
    [status, mcpDirty, hooksDirty],
  );

  const markMcpDirty = useCallback((key: string) => {
    setMcpDirty((prev) => new Set(prev).add(key));
  }, []);

  const markHooksDirty = useCallback((eventName: string) => {
    setHooksDirty((prev) => new Set(prev).add(eventName));
  }, []);

  const value: VersionControlContextValue = {
    status,
    changeCount: status?.changes.length ?? 0,
    isLoading,
    historyKey,
    refresh,
    getItemStatus,
    markMcpDirty,
    markHooksDirty,
  };

  return (
    <VersionControlContext.Provider value={value}>
      {children}
    </VersionControlContext.Provider>
  );
}
