import { useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ProjectPicker } from "../Shared/ProjectPicker";
import { NavButton } from "./NavButton";
import { CreateNewDropdown } from "./CreateNewDropdown";
import { CollapsedCreateMenu } from "./CollapsedCreateMenu";
import {
  DocumentIcon,
  AgentIcon,
  SkillIcon,
  McpIcon,
  HooksIcon,
  PlusIcon,
  SettingsIcon,
  SidebarCloseIcon,
  StrydeLogoIcon,
} from "../Icons";
import type { RecentItem } from "../../hooks/useRecents";

// ── Type label helpers ────────────────────────────────────────────────────────

function recentTypeLabel(type: RecentItem["type"]): string {
  if (type === "agent") return "Agent";
  if (type === "skill") return "Skill";
  return "MCP";
}

function recentTypeIcon(type: RecentItem["type"]) {
  if (type === "agent") return <AgentIcon />;
  if (type === "skill") return <SkillIcon />;
  return <McpIcon />;
}

// ── Sidebar ────────────────────────────────────────────────────────────────────

interface SidebarProps {
  selectedProjectPath: string | null;
  onProjectSelect: (path: string) => void;
  collapsed: boolean;
  onToggleCollapsed: () => void;
  recents: RecentItem[];
  onRecentClick: (item: RecentItem) => void;
  onCreateNew: (type: "agent" | "skill" | "mcp-server" | "project") => void;
  projectsRefreshKey?: number;
}

export const Sidebar = ({
  selectedProjectPath,
  onProjectSelect,
  collapsed,
  onToggleCollapsed,
  recents,
  onRecentClick,
  onCreateNew,
  projectsRefreshKey,
}: SidebarProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [createDropdownOpen, setCreateDropdownOpen] = useState(false);
  const [collapsedMenuPos, setCollapsedMenuPos] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const createButtonRef = useRef<HTMLButtonElement>(null);
  const hasProject = selectedProjectPath !== null;

  const encodedProject = selectedProjectPath
    ? encodeURIComponent(selectedProjectPath)
    : "";
  const pathname = location.pathname;

  const activeTab = (() => {
    if (!encodedProject) return "welcome";
    const base = `/${encodedProject}`;
    if (pathname === base || pathname === base + "/") return "welcome";
    if (pathname.startsWith(`${base}/agents`)) return "agents";
    if (pathname.startsWith(`${base}/skills`)) return "skills";
    if (pathname.startsWith(`${base}/mcp`)) return "mcp-servers";
    if (pathname.startsWith(`${base}/hooks`)) return "hooks";
    if (pathname.startsWith(`${base}/claude-md`)) return "claude-md";
    if (pathname.startsWith(`${base}/settings`)) return "settings";
    return "welcome";
  })();

  const navigateTo = (tab: string) => {
    if (!selectedProjectPath) return;
    const base = `/${encodeURIComponent(selectedProjectPath)}`;
    if (tab === "claude-md") navigate(`${base}/claude-md`);
    else if (tab === "agents") navigate(`${base}/agents`);
    else if (tab === "skills") navigate(`${base}/skills`);
    else if (tab === "mcp-servers") navigate(`${base}/mcp`);
    else if (tab === "hooks") navigate(`${base}/hooks`);
    else if (tab === "settings") navigate(`${base}/settings`);
    else navigate(base);
  };

  return (
    <aside
      className="shrink-0 flex flex-col bg-(--bg-sidebar) border-r border-(--border-faint) h-full overflow-hidden transition-[width] duration-250 ease-in-out"
      style={{ width: collapsed ? 52 : 260 }}
    >
      {/* App header */}
      <div className={`pt-4 pb-3 border-b border-(--border-faint) shrink-0 flex items-center min-h-17 gap-2.5 ${collapsed ? "justify-center px-0" : "pl-2.5 pr-3"}`}>
        <div className="relative group shrink-0">
          <button
            onClick={onToggleCollapsed}
            className="w-10 h-10 rounded-lg bg-transparent flex items-center justify-center border-none cursor-pointer"
          >
            <StrydeLogoIcon size={28} />
          </button>
          <span className="pointer-events-none absolute left-full top-1/2 -translate-y-1/2 ml-2.5 px-2 py-1 rounded-md text-[11px] font-medium whitespace-nowrap bg-(--bg-elevated) border border-(--border-subtle) text-(--text-secondary) opacity-0 group-hover:opacity-100 transition-opacity duration-75">
            {collapsed ? "Open sidebar" : "Close sidebar"}
          </span>
        </div>
        <div
          className="flex-1 min-w-0 overflow-hidden"
          style={{
            opacity: collapsed ? 0 : 1,
            maxWidth: collapsed ? 0 : 300,
            transition: "opacity 100ms ease, max-width 200ms ease 100ms",
          }}
        >
          <p className="text-[20px] font-semibold font-['Bricolage_Grotesque',sans-serif] text-(--text-primary) leading-[1.2] whitespace-nowrap">
            Stryde
          </p>
        </div>
        <button
          onClick={onToggleCollapsed}
          title="Collapse sidebar"
          className="shrink-0 text-(--text-muted) bg-transparent border-none cursor-pointer p-1 rounded flex items-center transition-all duration-200 hover:text-(--text-secondary)"
          style={{
            opacity: collapsed ? 0 : 1,
            pointerEvents: collapsed ? "none" : "auto",
            width: collapsed ? 0 : undefined,
            transition: "opacity 100ms ease, width 200ms ease 100ms",
          }}
        >
          <SidebarCloseIcon />
        </button>
      </div>

      {/* Project picker — hidden when collapsed */}
      <div
        className="shrink-0 overflow-hidden"
        style={{
          opacity: collapsed ? 0 : 1,
          maxHeight: collapsed ? 0 : 80,
          pointerEvents: collapsed ? "none" : "auto",
          transition: "opacity 100ms ease, max-height 200ms ease 100ms",
        }}
      >
        <ProjectPicker
          selectedPath={selectedProjectPath}
          onSelect={onProjectSelect}
          onNew={() => onCreateNew("project")}
          refreshKey={projectsRefreshKey}
        />
      </div>

      {/* Nav area */}
      <div className="px-2 pt-3 shrink-0 flex flex-col gap-0.5">
        {/* Create New button */}
        <div className="relative mb-1.5">
          <button
            ref={createButtonRef}
            onMouseDown={(e) => {
              if (!hasProject) return;
              e.preventDefault();
              e.stopPropagation();
              if (collapsed) {
                if (collapsedMenuPos) {
                  setCollapsedMenuPos(null);
                } else {
                  setCollapsedMenuPos({ x: e.clientX, y: e.clientY });
                }
              } else {
                setCreateDropdownOpen((v) => !v);
              }
            }}
            onKeyDown={(e) => {
              if (!hasProject) return;
              if (e.key !== "Enter" && e.key !== " ") return;
              e.preventDefault();
              if (collapsed) {
                if (collapsedMenuPos) {
                  setCollapsedMenuPos(null);
                } else {
                  const rect = createButtonRef.current?.getBoundingClientRect();
                  if (rect) {
                    setCollapsedMenuPos({ x: rect.left, y: rect.bottom });
                  } else {
                    setCollapsedMenuPos({ x: 0, y: 0 });
                  }
                }
              } else {
                setCreateDropdownOpen((v) => !v);
              }
            }}
            disabled={!hasProject}
            title="Create New"
            className={[
              "w-full flex items-center py-1.75 rounded-lg text-left text-[14px] font-medium min-h-8.5 border-none transition-colors duration-150 group",
              "gap-2.5 px-2",
              hasProject
                ? "bg-transparent text-(--text-secondary) cursor-pointer hover:bg-(--bg-hover) hover:text-(--text-primary)"
                : "bg-(--bg-surface) text-(--text-muted) cursor-not-allowed border border-(--border-faint) opacity-50",
            ].join(" ")}
          >
            <span className="w-5 h-5 shrink-0 flex items-center justify-center text-(--text-secondary) group-hover:text-(--text-primary)">
              <PlusIcon />
            </span>
            <span
              className="overflow-hidden whitespace-nowrap flex items-center gap-2"
              style={{
                opacity: collapsed ? 0 : 1,
                maxWidth: collapsed ? 0 : 200,
                transition: "opacity 100ms ease, max-width 200ms ease 100ms",
              }}
            >
              Create New
              <span
                className={[
                  "ml-auto transition-transform duration-150 opacity-70",
                  createDropdownOpen ? "rotate-180" : "",
                ].join(" ")}
              >
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                  <path
                    d="M2 3.5L5 6.5L8 3.5"
                    stroke="currentColor"
                    strokeWidth="1.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
            </span>
          </button>

          {createDropdownOpen && hasProject && !collapsed && (
            <CreateNewDropdown
              onSelect={(type) => {
                onCreateNew(type);
              }}
              onClose={() => setCreateDropdownOpen(false)}
            />
          )}

          {collapsedMenuPos && hasProject && collapsed && (
            <CollapsedCreateMenu
              x={collapsedMenuPos.x}
              y={collapsedMenuPos.y}
              onSelect={(type) => {
                onCreateNew(type);
              }}
              onClose={() => setCollapsedMenuPos(null)}
            />
          )}
        </div>

        <NavButton
          icon={<DocumentIcon />}
          label="CLAUDE.md"
          active={activeTab === "claude-md"}
          disabled={!hasProject}
          collapsed={collapsed}
          onClick={() => navigateTo("claude-md")}
        />
        <NavButton
          icon={<AgentIcon />}
          label="Agents"
          active={activeTab === "agents"}
          disabled={!hasProject}
          collapsed={collapsed}
          onClick={() => navigateTo("agents")}
        />
        <NavButton
          icon={<SkillIcon />}
          label="Skills"
          active={activeTab === "skills"}
          disabled={!hasProject}
          collapsed={collapsed}
          onClick={() => navigateTo("skills")}
        />
        <NavButton
          icon={<McpIcon />}
          label="MCP Servers"
          active={activeTab === "mcp-servers"}
          disabled={!hasProject}
          collapsed={collapsed}
          onClick={() => navigateTo("mcp-servers")}
        />
        <NavButton
          icon={<HooksIcon />}
          label="Hooks"
          active={activeTab === "hooks"}
          disabled={!hasProject}
          collapsed={collapsed}
          onClick={() => navigateTo("hooks")}
        />
      </div>

      {/* Recents — hidden when collapsed */}
      {hasProject && recents.length > 0 && (
        <div
          className="flex-1 min-h-0 flex flex-col overflow-hidden"
          style={{
            opacity: collapsed ? 0 : 1,
            pointerEvents: collapsed ? "none" : "auto",
            transition: "opacity 150ms ease",
          }}
        >
          <div className="mx-3 my-4 border-t border-(--border-faint) shrink-0" />
          <div className="overflow-y-auto flex-1 min-h-0 pb-2">
            <div className="px-4 mb-1.5 min-h-6 flex items-center">
              <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-(--text-muted)">
                Recents
              </span>
            </div>
            <ul className="list-none m-0 p-0">
              {recents.map((item, i) => (
                <li key={`${item.type}:${item.name}:${i}`}>
                  <button
                    onClick={() => onRecentClick(item)}
                    title={`${recentTypeLabel(item.type)} — ${item.name}`}
                    className="w-full text-left px-4 flex items-center gap-2.5 min-h-7.5 bg-transparent border-none cursor-pointer text-(--text-secondary) transition-colors duration-150 hover:bg-(--bg-hover) hover:text-(--text-primary)"
                  >
                    <span className="text-(--text-muted) shrink-0">
                      {recentTypeIcon(item.type)}
                    </span>
                    <span className="text-[12px] font-medium text-(--text-muted) shrink-0">
                      {recentTypeLabel(item.type)}
                    </span>
                    <span className="text-[13px] overflow-hidden text-ellipsis whitespace-nowrap">
                      {item.name}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {(!hasProject || recents.length === 0) && <div className="flex-1" />}

      {/* Bottom — settings */}
      <div className="px-2 pt-2 pb-3 border-t border-(--border-faint) shrink-0">
        <NavButton
          icon={<SettingsIcon />}
          label="Settings"
          active={activeTab === "settings"}
          disabled={!hasProject}
          collapsed={collapsed}
          onClick={() => navigateTo("settings")}
        />
      </div>
    </aside>
  );
};
