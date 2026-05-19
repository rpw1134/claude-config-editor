import { Outlet } from "react-router-dom";
import { useShell } from "../../contexts/ShellContext";
import { Sidebar } from "./Sidebar";
import type { RecentItem } from "../../hooks/useRecents";

interface ShellProps {
  selectedProjectPath: string | null;
  onProjectSelect: (path: string) => void;
  recents: RecentItem[];
  onRecentClick: (item: RecentItem) => void;
  onCreateNew: (type: "agent" | "skill" | "mcp-server" | "project") => void;
  sidebarCollapsed: boolean;
  onToggleCollapsed: () => void;
  projectsRefreshKey: number;
  children: React.ReactNode;
}

const Shell = ({
  selectedProjectPath,
  onProjectSelect,
  recents,
  onRecentClick,
  onCreateNew,
  sidebarCollapsed,
  onToggleCollapsed,
  projectsRefreshKey,
  children,
}: ShellProps) => (
  <div className="flex h-screen bg-(--bg-base) text-white overflow-hidden">
    <Sidebar
      selectedProjectPath={selectedProjectPath}
      onProjectSelect={onProjectSelect}
      collapsed={sidebarCollapsed}
      onToggleCollapsed={onToggleCollapsed}
      recents={recents}
      onRecentClick={onRecentClick}
      onCreateNew={onCreateNew}
      projectsRefreshKey={projectsRefreshKey}
    />
    <main className="flex flex-1 overflow-hidden">{children}</main>
  </div>
);

export const LayoutRoute = () => {
  const ctx = useShell();
  return (
    <Shell
      selectedProjectPath={ctx.selectedProjectPath}
      onProjectSelect={ctx.onProjectSelect}
      recents={ctx.recents}
      onRecentClick={ctx.onRecentClick}
      onCreateNew={ctx.onCreateNew}
      sidebarCollapsed={ctx.sidebarCollapsed}
      onToggleCollapsed={ctx.onToggleCollapsed}
      projectsRefreshKey={ctx.projectsRefreshKey}
    >
      <Outlet />
    </Shell>
  );
};
