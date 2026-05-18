import { createContext, useContext } from "react";
import type { RecentItem } from "../hooks/useRecents";

export interface ShellContextValue {
  selectedProjectPath: string | null;
  onProjectSelect: (path: string) => void;
  recents: RecentItem[];
  onRecentClick: (item: RecentItem) => void;
  addToRecents: (type: RecentItem["type"], name: string) => void;
  removeFromRecents: (type: RecentItem["type"], name: string) => void;
  onCreateNew: (type: "agent" | "skill" | "mcp-server" | "project") => void;
  sidebarCollapsed: boolean;
  onToggleCollapsed: () => void;
  agentsRefreshKey: number;
  skillsRefreshKey: number;
  mcpRefreshKey: number;
  projectsRefreshKey: number;
  onBumpAgentsRefresh: () => void;
  onBumpSkillsRefresh: () => void;
  onBumpMcpRefresh: () => void;
  onBumpProjectsRefresh: () => void;
  showToast: (message: string) => void;
}

export const ShellContext = createContext<ShellContextValue | null>(null);

export const useShell = (): ShellContextValue => {
  const ctx = useContext(ShellContext);
  if (!ctx)
    throw new Error("useShell must be used inside ShellContext.Provider");
  return ctx;
};
