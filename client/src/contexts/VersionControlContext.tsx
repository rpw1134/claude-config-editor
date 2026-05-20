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
  // Count of tracked changes (agents, skills, CLAUDE.md only — not settings.json)
  changeCount: number;
  isLoading: boolean;
  // Increments after each successful status fetch — use as dep in history tabs
  historyKey: number;
  refresh: () => void;
  getItemStatus: (
    type: "agent" | "skill",
    name: string,
  ) => ChangeStatus | null;
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

function isTrackedChange(file: string): boolean {
  return (
    file === "CLAUDE.md" ||
    file.startsWith("agents/") ||
    file.startsWith("skills/")
  );
}

export function VersionControlProvider({
  projectPath,
  vcRefreshKey,
  children,
}: VersionControlProviderProps) {
  const [status, setStatus] = useState<VCStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [historyKey, setHistoryKey] = useState(0);

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
    (type: "agent" | "skill", name: string): ChangeStatus | null => {
      if (!status) return null;

      if (type === "agent") {
        const entry = status.changes.find(
          (c: ChangeEntry) => c.file === `agents/${name}.md`,
        );
        return entry ? (entry.status as ChangeStatus) : null;
      }

      if (type === "skill") {
        const entry = status.changes.find((c: ChangeEntry) =>
          c.file.startsWith(`skills/${name}/`),
        );
        return entry ? (entry.status as ChangeStatus) : null;
      }

      return null;
    },
    [status],
  );

  // Only count tracked changes (agents, skills, CLAUDE.md) in the sidebar badge
  const changeCount = status?.changes.filter((c) => isTrackedChange(c.file)).length ?? 0;

  const value: VersionControlContextValue = {
    status,
    changeCount,
    isLoading,
    historyKey,
    refresh,
    getItemStatus,
  };

  return (
    <VersionControlContext.Provider value={value}>
      {children}
    </VersionControlContext.Provider>
  );
}
