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
  refresh: () => void;
  // Per-item status for landing-page dots
  getItemStatus: (
    type: "agent" | "skill" | "mcp" | "hooks",
    name?: string,
  ) => ChangeStatus | null;
  // Dirty tracking for MCP/hooks (can't be derived from git alone)
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

export function VersionControlProvider({
  projectPath,
  vcRefreshKey,
  children,
}: VersionControlProviderProps) {
  const [status, setStatus] = useState<VCStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
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
      setStatus(result);
      const hasSettingsChange = result.changes.some((c: ChangeEntry) =>
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

  // Fetch on mount, projectPath change, vcRefreshKey change
  useEffect(() => {
    fetchStatus();
  }, [fetchStatus, vcRefreshKey]);

  // Fetch on window focus
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
