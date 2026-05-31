import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  fetchAgents,
  fetchSkills,
  fetchMcpServers,
  createAgent,
  createSkill,
} from "../../lib/api";
import {
  AgentIcon,
  GridsIcon,
  McpIcon,
  SkillIcon,
  SearchIcon,
  SidebarCloseIcon,
  SidebarOpenIcon,
} from "../../components/Icons";
import type { GridNode } from "../../types/grids";
import {
  LS_AGENTS_OPEN,
  LS_COLLAPSED,
  LS_SKILLS_OPEN,
  readBool,
} from "./gridSidebarState";

// ── Chevron ───────────────────────────────────────────────────────────────────

const ChevronIcon = ({ open }: { open: boolean }) => (
  <svg
    width="10"
    height="10"
    viewBox="0 0 10 10"
    fill="none"
    className={`text-(--text-muted) transition-transform duration-150 shrink-0 ${open ? "rotate-90" : ""}`}
  >
    <path d="M3 2L7 5L3 8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// ── InlineCreate (name only) ───────────────────────────────────────────────────

interface InlineCreateProps {
  label: string;
  onSubmit: (name: string) => void;
  onCancel: () => void;
}

const InlineCreate = ({ label, onSubmit, onCancel }: InlineCreateProps) => {
  const [value, setValue] = useState("");
  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && value.trim()) onSubmit(value.trim());
    if (e.key === "Escape") onCancel();
  };
  return (
    <div className="flex items-center gap-2 mt-1">
      <input
        autoFocus
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKey}
        placeholder={`${label} name…`}
        className="flex-1 min-w-0 bg-(--bg-surface) border border-(--border-subtle) rounded-lg px-2.5 py-1.5 text-[12px] text-(--text-primary) outline-none focus:border-(--accent) transition-colors duration-120"
      />
      <button
        onClick={() => value.trim() && onSubmit(value.trim())}
        disabled={!value.trim()}
        className="px-2.5 py-1.5 rounded-lg text-[11px] font-semibold bg-(--accent) text-(--bg-base) border-none cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
      >
        Add
      </button>
    </div>
  );
};

// ── HookCreate (name + event + command) ───────────────────────────────────────

const HOOK_EVENTS = ["PreToolUse", "PostToolUse", "PreAgentRun", "PostAgentRun"] as const;
type HookEvent = (typeof HOOK_EVENTS)[number];

interface HookCreateProps {
  onSubmit: (name: string, event: HookEvent, command: string) => void;
  onCancel: () => void;
}

const HookCreate = ({ onSubmit, onCancel }: HookCreateProps) => {
  const [name, setName] = useState("");
  const [event, setEvent] = useState<HookEvent>("PreToolUse");
  const [command, setCommand] = useState("");

  const canSubmit = name.trim() && command.trim();

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") onCancel();
  };

  return (
    <div className="flex flex-col gap-2 mt-1" onKeyDown={handleKey}>
      <input
        autoFocus
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Hook name…"
        className="w-full bg-(--bg-surface) border border-(--border-subtle) rounded-lg px-2.5 py-1.5 text-[12px] text-(--text-primary) outline-none focus:border-(--accent) transition-colors duration-120"
      />
      <select
        value={event}
        onChange={(e) => setEvent(e.target.value as HookEvent)}
        className="w-full bg-(--bg-surface) border border-(--border-subtle) rounded-lg px-2.5 py-1.5 text-[12px] text-(--text-primary) outline-none focus:border-(--accent) transition-colors duration-120"
      >
        {HOOK_EVENTS.map((ev) => (
          <option key={ev} value={ev}>{ev}</option>
        ))}
      </select>
      <input
        value={command}
        onChange={(e) => setCommand(e.target.value)}
        placeholder="Shell command…"
        className="w-full bg-(--bg-surface) border border-(--border-subtle) rounded-lg px-2.5 py-1.5 text-[12px] text-(--text-primary) outline-none focus:border-(--accent) transition-colors duration-120 font-mono"
      />
      <div className="flex gap-2">
        <button
          onClick={onCancel}
          className="flex-1 px-2.5 py-1.5 rounded-lg text-[11px] font-medium text-(--text-secondary) bg-transparent border border-(--border-subtle) cursor-pointer hover:bg-white/5"
        >
          Cancel
        </button>
        <button
          onClick={() => canSubmit && onSubmit(name.trim(), event, command.trim())}
          disabled={!canSubmit}
          className="flex-1 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold bg-(--accent) text-(--bg-base) border-none cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Add
        </button>
      </div>
    </div>
  );
};

// ── DraggableItem — matches canvas node appearance ────────────────────────────

// ── DraggableItem ─────────────────────────────────────────────────────────────

const TYPE_ICON: Partial<Record<GridNode["type"], { icon: React.ReactNode; color: string }>> = {
  agent: {
    color: "text-(--text-muted)",
    icon: <AgentIcon />,
  },
  skill: {
    color: "text-[#a78bfa]",
    icon: <SkillIcon />,
  },
  mcp: {
    color: "text-[#34d399]",
    icon: <McpIcon />,
  },
  knowledge: {
    color: "text-[#818cf8]",
    icon: (
      <svg width="12" height="12" viewBox="0 0 15 15" fill="none">
        <path d="M2 2.5h11M2 5.5h11M2 8.5h7" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
        <rect x="1" y="1" width="13" height="13" rx="2" stroke="currentColor" strokeWidth="1.2" fill="none" />
      </svg>
    ),
  },
};

interface DraggableItemProps {
  name: string;
  type: GridNode["type"];
  extra?: Record<string, unknown>;
}

const DraggableItem = ({ name, type, extra }: DraggableItemProps) => {
  const handleDragStart = (e: React.DragEvent) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    e.dataTransfer.setData("application/grid-node-type", type);
    e.dataTransfer.setData("application/grid-node-name", name);
    e.dataTransfer.setData(
      "application/drag-offset",
      JSON.stringify({ offsetX: e.clientX - rect.left, offsetY: e.clientY - rect.top }),
    );
    if (extra) {
      e.dataTransfer.setData("application/grid-node-extra", JSON.stringify(extra));
    }
    e.dataTransfer.effectAllowed = "copy";
  };

  const { icon, color } = TYPE_ICON[type] ?? { icon: null, color: "text-(--text-muted)" };

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      className="flex items-center gap-2.5 px-3 py-2 rounded-lg cursor-grab active:cursor-grabbing bg-white/3 border border-white/6 hover:bg-white/6 hover:border-white/12 transition-all duration-120 select-none"
    >
      <span className={`shrink-0 ${color}`}>{icon}</span>
      <span className="text-[12px] font-medium text-(--text-secondary) truncate">{name}</span>
    </div>
  );
};

// ── SectionHeader ─────────────────────────────────────────────────────────────

interface NodeSectionProps {
  label: string;
  icon: React.ReactNode;
  open: boolean;
  onToggle: () => void;
  count?: number;
  loading?: boolean;
  children: React.ReactNode;
}

const NodeSection = ({ label, open, onToggle, count, loading, children }: NodeSectionProps) => (
  <div>
    <button
      onClick={onToggle}
      className="w-full flex items-center gap-1.5 mb-1 text-left bg-transparent border-none cursor-pointer"
    >
      <ChevronIcon open={open} />
      <span className="text-[11px] font-semibold text-(--text-secondary) uppercase tracking-widest">
        {label}{" "}
        {!loading && count !== undefined && <span className="opacity-50">({count})</span>}
      </span>
    </button>
    {open && <div className="flex flex-col gap-1.5">{children}</div>}
  </div>
);

const AddButton = ({ label, onClick }: { label: string; onClick: () => void }) => (
  <button
    onClick={onClick}
    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium text-(--text-muted) hover:text-(--text-secondary) bg-transparent border border-dashed border-white/10 hover:border-white/20 cursor-pointer transition-all duration-120 mt-1 w-full"
  >
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
      <path d="M5 1.5V8.5M1.5 5H8.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
    {label}
  </button>
);

// ── GridNodesPanel ─────────────────────────────────────────────────────────────

interface GridNodesPanelProps {
  gridName: string;
  projectPath: string;
  refreshKey: number;
  onAgentCreated: (name: string) => void;
  onSkillCreated: (name: string) => void;
  onCollapsedChange: (collapsed: boolean) => void;
  onBack: () => void;
  collapsed: boolean;
  showToast: (msg: string) => void;
}

export const GridNodesPanel = ({
  gridName,
  projectPath,
  refreshKey,
  onAgentCreated,
  onSkillCreated,
  onCollapsedChange,
  onBack,
  collapsed,
  showToast,
}: GridNodesPanelProps) => {
  const [agentsOpen, setAgentsOpen] = useState(() => readBool(LS_AGENTS_OPEN, true));
  const [skillsOpen, setSkillsOpen] = useState(() => readBool(LS_SKILLS_OPEN, true));
  const [mcpOpen, setMcpOpen] = useState(true);

  const [agents, setAgents] = useState<string[]>([]);
  const [skills, setSkills] = useState<string[]>([]);
  const [mcpServers, setMcpServers] = useState<string[]>([]);

  const [loading, setLoading] = useState(true);
  const [creatingAgent, setCreatingAgent] = useState(false);
  const [creatingSkill, setCreatingSkill] = useState(false);

  const [search, setSearch] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  const toggleBtnRef = useRef<HTMLButtonElement>(null);
  const [tooltipVisible, setTooltipVisible] = useState(false);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  const handleToggleEnter = () => {
    if (toggleBtnRef.current) {
      const rect = toggleBtnRef.current.getBoundingClientRect();
      setTooltipPos({ x: rect.right + 10, y: rect.top + rect.height / 2 });
    }
    setTooltipVisible(true);
  };

  const handleCollapse = (next: boolean) => {
    localStorage.setItem(LS_COLLAPSED, String(next));
    onCollapsedChange(next);
  };

  useEffect(() => {
    let cancelled = false;
    Promise.all([fetchAgents(projectPath), fetchSkills(projectPath), fetchMcpServers(projectPath)])
      .then(([a, s, m]) => {
        if (cancelled) return;
        setAgents(a);
        setSkills(s);
        setMcpServers(m);
        setLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setLoading(false);
      });
    return () => { cancelled = true; };
  }, [projectPath, refreshKey]);

  const handleCreateAgent = async (name: string) => {
    const content = `---\nname: ${name}\ndescription: Agent created from Grids editor.\n---\n\nYou are the ${name} agent.\n`;
    try {
      await createAgent(projectPath, name, content);
      setAgents((prev) => [...prev, name]);
      onAgentCreated(name);
      showToast(`Agent "${name}" created — edit it in the Agents tab`);
    } catch {
      showToast("Failed to create agent");
    }
    setCreatingAgent(false);
  };

  const handleCreateSkill = async (name: string) => {
    const content = `---\nname: ${name}\ndescription: Skill created from Grids editor.\n---\n\n# ${name}\n`;
    try {
      await createSkill(projectPath, name, content);
      setSkills((prev) => [...prev, name]);
      onSkillCreated(name);
      showToast(`Skill "${name}" created — edit it in the Skills tab.`);
    } catch {
      showToast("Failed to create skill");
    }
    setCreatingSkill(false);
  };

const q = search.trim().toLowerCase();
  const filteredAgents = q ? agents.filter((n) => n.toLowerCase().includes(q)) : agents;
  const filteredSkills = q ? skills.filter((n) => n.toLowerCase().includes(q)) : skills;
  const filteredMcp = q ? mcpServers.filter((n) => n.toLowerCase().includes(q)) : mcpServers;

  return (
    <aside
      className={`shrink-0 flex flex-col h-full overflow-hidden border-r transition-[width,background-color,border-color] duration-250 ease-in-out ${
        collapsed ? "bg-(--bg-base) border-transparent" : "bg-(--bg-sidebar) border-(--border-faint)"
      }`}
      style={{ width: collapsed ? 52 : 260 }}
    >
      {/* Header */}
      <div
        className={`pt-4 pb-3 min-h-17 shrink-0 flex items-center pl-2 border-b transition-[border-color] duration-250 ease-in-out ${
          collapsed ? "gap-0 border-transparent" : "gap-2.5 pr-3 border-(--border-faint)"
        }`}
      >
        <button
          ref={toggleBtnRef}
          onClick={collapsed ? () => handleCollapse(false) : onBack}
          onMouseEnter={handleToggleEnter}
          onMouseLeave={() => setTooltipVisible(false)}
          className="w-9 h-9 shrink-0 rounded-lg bg-transparent flex items-center justify-center border-none cursor-pointer text-(--text-muted) hover:text-(--text-secondary) transition-colors duration-150"
        >
          {collapsed ? <SidebarOpenIcon /> : <GridsIcon />}
        </button>

        <div
          className="flex-1 min-w-0 overflow-hidden"
          style={{ opacity: collapsed ? 0 : 1, maxWidth: collapsed ? 0 : 300, transition: "opacity 100ms ease, max-width 200ms ease 100ms" }}
        >
          <p className="text-[20px] font-semibold font-['Bricolage_Grotesque',sans-serif] text-(--text-primary) leading-[1.2] whitespace-nowrap truncate overflow-hidden">
            {gridName}
          </p>
        </div>

        <button
          onClick={() => handleCollapse(true)}
          title="Collapse panel"
          className="shrink-0 text-(--text-muted) bg-transparent border-none cursor-pointer p-1 rounded flex items-center transition-all duration-200 hover:text-(--text-secondary)"
          style={{ opacity: collapsed ? 0 : 1, pointerEvents: collapsed ? "none" : "auto", width: collapsed ? 0 : undefined, transition: "opacity 100ms ease, width 200ms ease 100ms" }}
        >
          <SidebarCloseIcon />
        </button>
      </div>

      {/* Search */}
      <div
        className="shrink-0 overflow-hidden px-3"
        style={{ opacity: collapsed ? 0 : 1, maxHeight: collapsed ? 0 : 80, pointerEvents: collapsed ? "none" : "auto", transition: "opacity 100ms ease, max-height 200ms ease 100ms" }}
      >
        <div className="relative mt-3 mb-1">
          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-(--text-muted) pointer-events-none">
            <SearchIcon />
          </span>
          <input
            ref={searchRef}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search nodes…"
            className="w-full bg-(--bg-surface) border border-(--border-subtle) rounded-lg pl-8 pr-3 py-1.5 text-[13px] text-(--text-primary) outline-none focus:border-(--accent) transition-colors duration-120"
          />
        </div>
      </div>

      {/* Scrollable content */}
      {!collapsed && (
        <div className="flex-1 min-h-0 overflow-y-auto px-3 pb-4 flex flex-col gap-4 pt-3">
          {/* Agents */}
          <NodeSection
            label="Agents"
            icon={<AgentIcon />}
            open={agentsOpen}
            onToggle={() => { setAgentsOpen((v) => { localStorage.setItem(LS_AGENTS_OPEN, String(!v)); return !v; }); }}
            count={filteredAgents.length}
            loading={loading}
          >
            {filteredAgents.map((name) => (
              <DraggableItem key={name} name={name} type="agent" />
            ))}
            {creatingAgent ? (
              <InlineCreate label="Agent" onSubmit={handleCreateAgent} onCancel={() => setCreatingAgent(false)} />
            ) : (
              <AddButton label="New Agent" onClick={() => setCreatingAgent(true)} />
            )}
          </NodeSection>

          {/* Skills */}
          <NodeSection
            label="Skills"
            icon={<SkillIcon />}
            open={skillsOpen}
            onToggle={() => { setSkillsOpen((v) => { localStorage.setItem(LS_SKILLS_OPEN, String(!v)); return !v; }); }}
            count={filteredSkills.length}
            loading={loading}
          >
            {filteredSkills.map((name) => (
              <DraggableItem key={name} name={name} type="skill" />
            ))}
            {creatingSkill ? (
              <InlineCreate label="Skill" onSubmit={handleCreateSkill} onCancel={() => setCreatingSkill(false)} />
            ) : (
              <AddButton label="New Skill" onClick={() => setCreatingSkill(true)} />
            )}
          </NodeSection>

          {/* MCP Servers */}
          <NodeSection
            label="MCP Servers"
            icon={<McpIcon />}
            open={mcpOpen}
            onToggle={() => setMcpOpen((v) => !v)}
            count={filteredMcp.length}
            loading={loading}
          >
            {filteredMcp.length === 0 && !loading && (
              <p className="text-[11px] text-(--text-muted) italic px-1">No MCP servers configured</p>
            )}
            {filteredMcp.map((name) => (
              <DraggableItem key={name} name={name} type="mcp" />
            ))}
          </NodeSection>

        </div>
      )}

      {tooltipVisible &&
        createPortal(
          <span
            className="fixed z-9999 pointer-events-none -translate-y-1/2 px-2 py-1 rounded-md text-[11px] font-medium whitespace-nowrap bg-(--bg-elevated) border border-(--border-subtle) text-(--text-secondary) animate-[tooltipFadeIn_150ms_ease-in_both]"
            style={{ left: tooltipPos.x, top: tooltipPos.y }}
          >
            {collapsed ? "Open sidebar" : "Back to Grids"}
          </span>,
          document.body,
        )}
    </aside>
  );
};
