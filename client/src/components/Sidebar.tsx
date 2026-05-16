import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ProjectPicker } from "./ProjectPicker";
import type { RecentItem } from "../hooks/useRecents";

// ── Collapsed create menu ─────────────────────────────────────────────────────

interface CollapsedCreateMenuProps {
  x: number;
  y: number;
  onSelect: (type: "agent" | "skill" | "mcp-server") => void;
  onClose: () => void;
}

const CollapsedCreateMenu = ({
  x,
  y,
  onSelect,
  onClose,
}: CollapsedCreateMenuProps) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    const t = setTimeout(
      () => document.addEventListener("mousedown", handler),
      50,
    );
    return () => {
      clearTimeout(t);
      document.removeEventListener("mousedown", handler);
    };
  }, [onClose]);

  const options: {
    type: "agent" | "skill" | "mcp-server";
    label: string;
    icon: React.ReactNode;
  }[] = [
    { type: "agent", label: "Agent", icon: <AgentIcon /> },
    { type: "skill", label: "Skill", icon: <SkillIcon /> },
    { type: "mcp-server", label: "MCP Server", icon: <McpIcon /> },
  ];

  return (
    <div
      ref={ref}
      className="fixed z-50 bg-(--bg-elevated) border border-(--border-default) rounded-lg overflow-hidden shadow-[0_4px_24px_rgba(0,0,0,0.4)]"
      style={{ top: y, left: x }}
    >
      {options.map(({ type, label, icon }) => (
        <button
          key={type}
          onClick={() => {
            onSelect(type);
            onClose();
          }}
          className="w-full flex items-center gap-2.5 px-3.5 py-2.25 text-left text-[14px] font-medium text-(--text-secondary) bg-transparent border-none cursor-pointer transition-colors duration-150 hover:bg-(--bg-hover) hover:text-(--text-primary)"
        >
          <span className="text-(--text-muted)">{icon}</span>
          {label}
        </button>
      ))}
    </div>
  );
};

// ── Icons ─────────────────────────────────────────────────────────────────────

const DocumentIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 15 15"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M3 2.5C3 1.67 3.67 1 4.5 1H9L12 4V12.5C12 13.33 11.33 14 10.5 14H4.5C3.67 14 3 13.33 3 12.5V2.5Z"
      stroke="currentColor"
      strokeWidth="1.2"
      fill="none"
    />
    <path
      d="M9 1V4H12"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
    <path
      d="M5.5 7H9.5M5.5 9.5H9.5"
      stroke="currentColor"
      strokeWidth="1.1"
      strokeLinecap="round"
    />
  </svg>
);

const AgentIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 15 15"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <circle
      cx="7.5"
      cy="5"
      r="3"
      stroke="currentColor"
      strokeWidth="1.2"
      fill="none"
    />
    <path
      d="M2 13C2 10.24 4.46 8 7.5 8C10.54 8 13 10.24 13 13"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinecap="round"
      fill="none"
    />
  </svg>
);

const SkillIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 15 15"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M7.5 1L9.18 5.27L13.5 5.64L10.35 8.38L11.35 12.59L7.5 10.2L3.65 12.59L4.65 8.38L1.5 5.64L5.82 5.27L7.5 1Z"
      stroke="currentColor"
      strokeWidth="1.2"
      fill="none"
      strokeLinejoin="round"
    />
  </svg>
);

const McpIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 15 15"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect
      x="1"
      y="1"
      width="13"
      height="13"
      rx="2"
      stroke="currentColor"
      strokeWidth="1.2"
      fill="none"
    />
    <path
      d="M4 7.5H11M7.5 4V11"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinecap="round"
    />
  </svg>
);

const PluginIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 15 15"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* body */}
    <rect
      x="2"
      y="5"
      width="8"
      height="8"
      rx="1.5"
      stroke="currentColor"
      strokeWidth="1.2"
      fill="none"
    />
    {/* top tab */}
    <path
      d="M5.5 5V3.5C5.5 2.67 6.17 2 7 2C7.83 2 8.5 2.67 8.5 3.5V5"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinecap="round"
      fill="none"
    />
    {/* right tab */}
    <path
      d="M10 8.5H11.5C12.33 8.5 13 7.83 13 7C13 6.17 12.33 5.5 11.5 5.5H10"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinecap="round"
      fill="none"
    />
  </svg>
);

const PlusIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 13 13"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M6.5 1.5V11.5M1.5 6.5H11.5"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
    />
  </svg>
);

const ChevronIcon = ({
  direction = "left",
}: {
  direction?: "left" | "right";
}) => (
  <svg
    width="12"
    height="12"
    viewBox="0 0 12 12"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={direction === "right" ? "rotate-180" : undefined}
  >
    <path
      d="M7.5 2L4 6L7.5 10"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

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

// ── Create New dropdown ───────────────────────────────────────────────────────

interface CreateNewDropdownProps {
  onSelect: (type: "agent" | "skill" | "mcp-server") => void;
  onClose: () => void;
}

const CreateNewDropdown = ({ onSelect, onClose }: CreateNewDropdownProps) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    const t = setTimeout(
      () => document.addEventListener("mousedown", handler),
      50,
    );
    return () => {
      clearTimeout(t);
      document.removeEventListener("mousedown", handler);
    };
  }, [onClose]);

  const options: {
    type: "agent" | "skill" | "mcp-server";
    label: string;
    icon: React.ReactNode;
  }[] = [
    { type: "agent", label: "Agent", icon: <AgentIcon /> },
    { type: "skill", label: "Skill", icon: <SkillIcon /> },
    { type: "mcp-server", label: "MCP Server", icon: <McpIcon /> },
  ];

  return (
    <div
      ref={ref}
      className="absolute top-full left-0 right-0 mt-1.5 z-30 bg-(--bg-elevated) border border-(--border-default) rounded-lg overflow-hidden shadow-[0_4px_24px_rgba(0,0,0,0.4)]"
    >
      {options.map(({ type, label, icon }) => (
        <button
          key={type}
          onClick={() => {
            onSelect(type);
            onClose();
          }}
          className="w-full flex items-center gap-2.5 px-3.5 py-2.25 text-left text-[14px] font-medium text-(--text-secondary) bg-transparent border-none cursor-pointer transition-colors duration-150 hover:bg-(--bg-hover) hover:text-(--text-primary)"
        >
          <span className="text-(--text-muted)">{icon}</span>
          {label}
        </button>
      ))}
    </div>
  );
};

// ── Nav button ────────────────────────────────────────────────────────────────

interface NavButtonProps {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  disabled?: boolean;
  collapsed: boolean;
  onClick: () => void;
}

const NavButton = ({
  icon,
  label,
  active,
  disabled = false,
  collapsed,
  onClick,
}: NavButtonProps) => (
  <button
    onClick={onClick}
    disabled={disabled}
    title={collapsed ? label : undefined}
    className={[
      "w-full flex items-center rounded-md text-left text-[14px] font-medium min-h-10 py-2 border-none transition-all duration-150",
      collapsed
        ? "justify-center px-0 border-l-0"
        : "gap-2.5 px-2 border-l-[3px]",
      active
        ? "bg-(--bg-elevated) text-(--text-primary) border-l-(--accent)"
        : disabled
          ? "bg-transparent text-(--text-muted) border-l-transparent cursor-not-allowed"
          : "bg-transparent text-(--text-secondary) border-l-transparent cursor-pointer hover:bg-(--bg-hover) hover:text-(--text-primary)",
    ].join(" ")}
  >
    <span
      className={[
        "w-5 h-5 shrink-0 flex items-center justify-center transition-colors duration-150",
        disabled
          ? "text-(--text-muted)"
          : active
            ? "text-(--accent)"
            : "text-(--text-secondary)",
      ].join(" ")}
    >
      {icon}
    </span>
    <span
      className="overflow-hidden whitespace-nowrap"
      style={{
        opacity: collapsed ? 0 : 1,
        maxWidth: collapsed ? 0 : 200,
        transition: "opacity 150ms ease, max-width 200ms ease 50ms",
      }}
    >
      {label}
    </span>
  </button>
);

// ── Sidebar ────────────────────────────────────────────────────────────────────

interface SidebarProps {
  selectedProjectPath: string | null;
  onProjectSelect: (path: string) => void;
  collapsed: boolean;
  onToggleCollapsed: () => void;
  recents: RecentItem[];
  onRecentClick: (item: RecentItem) => void;
  onCreateNew: (type: "agent" | "skill" | "mcp-server") => void;
}

export const Sidebar = ({
  selectedProjectPath,
  onProjectSelect,
  collapsed,
  onToggleCollapsed,
  recents,
  onRecentClick,
  onCreateNew,
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
    if (pathname.startsWith(`${base}/plugins`)) return "plugins";
    if (pathname.startsWith(`${base}/claude-md`)) return "claude-md";
    return "welcome";
  })();

  const navigateTo = (tab: string) => {
    if (!selectedProjectPath) return;
    const base = `/${encodeURIComponent(selectedProjectPath)}`;
    if (tab === "claude-md") navigate(`${base}/claude-md`);
    else if (tab === "agents") navigate(`${base}/agents`);
    else if (tab === "skills") navigate(`${base}/skills`);
    else if (tab === "mcp-servers") navigate(`${base}/mcp`);
    else if (tab === "plugins") navigate(`${base}/plugins`);
    else navigate(base);
  };

  return (
    <aside
      className="shrink-0 flex flex-col bg-(--bg-sidebar) border-r border-(--border-faint) h-full overflow-hidden transition-[width] duration-250 ease-in-out"
      style={{ width: collapsed ? 52 : 260 }}
    >
      {/* App header */}
      <div className="pt-4 pb-3 border-b border-(--border-faint) shrink-0 flex items-center min-h-14.25 pl-2.5 pr-3 gap-2.5">
        <button
          onClick={onToggleCollapsed}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="w-8 h-8 rounded-lg bg-(--accent) flex items-center justify-center border-none cursor-pointer transition-colors duration-150 hover:bg-(--accent-hover) shrink-0"
        >
          <span className="text-[13px] font-bold text-white leading-none">
            C
          </span>
        </button>
        <div
          className="flex-1 min-w-0 overflow-hidden"
          style={{
            opacity: collapsed ? 0 : 1,
            maxWidth: collapsed ? 0 : 300,
            transition: "opacity 150ms ease, max-width 200ms ease 50ms",
          }}
        >
          <p className="text-[14px] font-semibold text-(--text-primary) leading-[1.2] whitespace-nowrap">
            Config Studio
          </p>
          <p className="text-[12px] text-(--text-muted) font-['Fira_Code',monospace] leading-[1.2] mt-0.5 whitespace-nowrap">
            ~/.claude/
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
            transition: "opacity 150ms ease, width 200ms ease 50ms",
          }}
        >
          <ChevronIcon direction="left" />
        </button>
      </div>

      {/* Project picker — hidden when collapsed */}
      <div
        className="shrink-0 overflow-hidden"
        style={{
          opacity: collapsed ? 0 : 1,
          maxHeight: collapsed ? 0 : 80,
          pointerEvents: collapsed ? "none" : "auto",
          transition: "opacity 150ms ease, max-height 200ms ease 50ms",
        }}
      >
        <ProjectPicker
          selectedPath={selectedProjectPath}
          onSelect={onProjectSelect}
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
              collapsed ? "justify-center px-0" : "gap-2.5 px-2",
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
                transition: "opacity 150ms ease, max-width 200ms ease 50ms",
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
          icon={<PluginIcon />}
          label="Plugins"
          active={activeTab === "plugins"}
          disabled={!hasProject}
          collapsed={collapsed}
          onClick={() => navigateTo("plugins")}
        />
      </div>

      {/* Recents — hidden when collapsed */}
      {hasProject && recents.length > 0 && (
        <div
          className="flex-1 min-h-0 overflow-hidden"
          style={{
            opacity: collapsed ? 0 : 1,
            pointerEvents: collapsed ? "none" : "auto",
            transition: "opacity 150ms ease",
          }}
        >
          <div className="mx-3 my-4 border-t border-(--border-faint) shrink-0" />
          <div className="overflow-y-auto h-full pb-2">
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

      {/* Bottom */}
      <div className="px-3 pt-3 pb-4 border-t border-(--border-faint) shrink-0">
        <p
          className="px-2 text-[11px] font-['Fira_Code',monospace] text-(--text-muted) overflow-hidden whitespace-nowrap"
          style={{
            opacity: collapsed ? 0 : 0.6,
            transition: "opacity 150ms ease",
          }}
        >
          v0.1.0-pre
        </p>
      </div>
    </aside>
  );
};
