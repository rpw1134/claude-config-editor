import { useEffect, useRef, useState } from "react";
import {
  fetchAgents,
  fetchSkills,
  createAgent,
  createSkill,
} from "../../lib/api";
import {
  AgentIcon,
  SkillIcon,
  SearchIcon,
  SidebarCloseIcon,
} from "../../components/Icons";

// ── Chevron (local, tiny) ─────────────────────────────────────────────────────

const ChevronIcon = ({ open }: { open: boolean }) => (
  <svg
    width="10"
    height="10"
    viewBox="0 0 10 10"
    fill="none"
    className={`text-(--text-muted) transition-transform duration-150 shrink-0 ${open ? "rotate-90" : ""}`}
  >
    <path
      d="M3 2L7 5L3 8"
      stroke="currentColor"
      strokeWidth="1.3"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

// ── InlineCreate ──────────────────────────────────────────────────────────────

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
        className="flex-1 min-w-0 bg-(--bg-surface) border border-(--border-subtle) rounded-lg px-2.5 py-1.5 text-[12px] text-(--text-primary) outline-none focus:outline-none focus:border-(--accent) transition-colors duration-120"
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

// ── NodeSection ───────────────────────────────────────────────────────────────

interface NodeSectionProps {
  label: string;
  icon: React.ReactNode;
  items: string[];
  type: "agent" | "skill";
  loading: boolean;
  collapsed: boolean;
  creating: boolean;
  onStartCreate: () => void;
  onCancelCreate: () => void;
  onSubmitCreate: (name: string) => void;
}

const NodeSection = ({
  label,
  icon,
  items,
  type,
  loading,
  collapsed,
  creating,
  onStartCreate,
  onCancelCreate,
  onSubmitCreate,
}: NodeSectionProps) => {
  // Section open/close state is independent of sidebar collapsed state
  const [open, setOpen] = useState(true);

  return (
    <div>
      {/* Section header */}
      <button
        onClick={() => !collapsed && setOpen((v) => !v)}
        title={collapsed ? label : undefined}
        className="w-full flex items-center mb-1 text-left bg-transparent border-none cursor-pointer"
        style={{ gap: collapsed ? 0 : 6 }}
      >
        {/* In collapsed mode the section header shows just the type icon */}
        {collapsed ? (
          <span className="w-full flex items-center justify-center py-1 text-(--text-muted)">
            {icon}
          </span>
        ) : (
          <>
            <ChevronIcon open={open} />
            <span className="text-[11px] font-semibold text-(--text-secondary) uppercase tracking-widest">
              {label}{" "}
              {!loading && (
                <span className="opacity-50">({items.length})</span>
              )}
            </span>
          </>
        )}
      </button>

      {/* Items */}
      {!loading && (
        <div className="flex flex-col" style={{ gap: collapsed ? 2 : 6 }}>
          {(collapsed || open) &&
            items.map((name) =>
              collapsed ? (
                // Collapsed: icon-only, centered, not draggable
                <div
                  key={name}
                  title={name}
                  className="flex items-center justify-center h-8 rounded-lg text-(--text-muted) hover:text-(--text-secondary) hover:bg-(--bg-hover) transition-colors duration-120"
                >
                  {icon}
                </div>
              ) : (
                // Expanded: full draggable item
                <DraggableItem key={name} name={name} type={type} />
              ),
            )}

          {/* Create button / inline form — hidden when collapsed */}
          <div
            className="overflow-hidden"
            style={{
              opacity: collapsed ? 0 : 1,
              maxHeight: collapsed ? 0 : 200,
              pointerEvents: collapsed ? "none" : "auto",
              transition: "opacity 100ms ease, max-height 200ms ease 100ms",
            }}
          >
            {open &&
              (creating ? (
                <InlineCreate
                  label={label.slice(0, -1)} // "Agents" → "Agent", "Skills" → "Skill"
                  onSubmit={onSubmitCreate}
                  onCancel={onCancelCreate}
                />
              ) : (
                <button
                  onClick={onStartCreate}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium text-(--text-muted) hover:text-(--text-secondary) bg-transparent border border-dashed border-white/10 hover:border-white/20 cursor-pointer transition-all duration-120 mt-1 w-full"
                >
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                    <path
                      d="M5 1.5V8.5M1.5 5H8.5"
                      stroke="currentColor"
                      strokeWidth="1.4"
                      strokeLinecap="round"
                    />
                  </svg>
                  New {label.replace(/s$/, "")}
                </button>
              ))}
          </div>
        </div>
      )}
    </div>
  );
};

// ── DraggableItem ─────────────────────────────────────────────────────────────

interface DraggableItemProps {
  name: string;
  type: "agent" | "skill";
}

const DraggableItem = ({ name, type }: DraggableItemProps) => {
  const handleDragStart = (e: React.DragEvent) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const offsetX = e.clientX - rect.left;
    const offsetY = e.clientY - rect.top;
    e.dataTransfer.setData("application/grid-node-type", type);
    e.dataTransfer.setData("application/grid-node-name", name);
    e.dataTransfer.setData(
      "application/drag-offset",
      JSON.stringify({ offsetX, offsetY }),
    );
    e.dataTransfer.effectAllowed = "copy";
  };

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      className={[
        "flex items-center gap-2.5 px-3 py-2 rounded-lg cursor-grab active:cursor-grabbing",
        "bg-white/3 border border-white/6 hover:bg-white/6 hover:border-white/12",
        "transition-all duration-120 select-none",
      ].join(" ")}
    >
      <span
        className={`shrink-0 ${type === "skill" ? "text-[#a78bfa]" : "text-(--text-muted)"}`}
      >
        {type === "agent" ? <AgentIcon /> : <SkillIcon />}
      </span>
      <span className="text-[12px] font-medium text-(--text-secondary) truncate">
        {name}
      </span>
    </div>
  );
};

// ── GridNodesPanel ─────────────────────────────────────────────────────────────

interface GridNodesPanelProps {
  projectPath: string;
  refreshKey: number;
  onAgentCreated: (name: string) => void;
  onSkillCreated: (name: string) => void;
  showToast: (msg: string) => void;
}

export const GridNodesPanel = ({
  projectPath,
  refreshKey,
  onAgentCreated,
  onSkillCreated,
  showToast,
}: GridNodesPanelProps) => {
  const [collapsed, setCollapsed] = useState(false);
  const [agents, setAgents] = useState<string[]>([]);
  const [skills, setSkills] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [creatingAgent, setCreatingAgent] = useState(false);
  const [creatingSkill, setCreatingSkill] = useState(false);
  const [search, setSearch] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([fetchAgents(projectPath), fetchSkills(projectPath)])
      .then(([a, s]) => {
        if (cancelled) return;
        setAgents(a);
        setSkills(s);
        setLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
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

  return (
    <aside
      className={`shrink-0 flex flex-col h-full overflow-hidden transition-[width,background-color] duration-250 ease-in-out ${
        collapsed
          ? "bg-(--bg-base)"
          : "bg-(--bg-sidebar) border-r border-(--border-faint)"
      }`}
      style={{ width: collapsed ? 52 : 260 }}
    >
      {/* Header */}
      <div
        className={`pt-4 pb-3 min-h-17 shrink-0 flex items-center pl-2 ${
          collapsed ? "gap-0" : "gap-2.5 pr-3 border-b border-(--border-faint)"
        }`}
      >
        {/* Icon — clicking when collapsed re-opens */}
        <button
          onClick={() => setCollapsed((v) => !v)}
          title={collapsed ? "Open nodes panel" : undefined}
          className="w-9 h-9 shrink-0 rounded-lg bg-transparent flex items-center justify-center border-none cursor-pointer text-(--text-muted) hover:text-(--text-secondary) transition-colors duration-150"
        >
          <AgentIcon />
        </button>

        {/* Title — fades out when collapsed */}
        <div
          className="flex-1 min-w-0 overflow-hidden"
          style={{
            opacity: collapsed ? 0 : 1,
            maxWidth: collapsed ? 0 : 300,
            transition: "opacity 100ms ease, max-width 200ms ease 100ms",
          }}
        >
          <p className="text-[13px] font-semibold text-(--text-primary) whitespace-nowrap leading-[1.2]">
            Nodes
          </p>
          <p className="text-[11px] text-(--text-muted) mt-0.5 leading-relaxed whitespace-nowrap">
            Drag onto canvas
          </p>
        </div>

        {/* Collapse button — fades out when collapsed (matches Sidebar exactly) */}
        <button
          onClick={() => setCollapsed(true)}
          title="Collapse panel"
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

      {/* Search — fades out when collapsed (matches Sidebar project picker pattern) */}
      <div
        className="shrink-0 overflow-hidden px-3"
        style={{
          opacity: collapsed ? 0 : 1,
          maxHeight: collapsed ? 0 : 80,
          pointerEvents: collapsed ? "none" : "auto",
          transition: "opacity 100ms ease, max-height 200ms ease 100ms",
        }}
      >
        <div className="relative mt-3 mb-1">
          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-(--text-muted) pointer-events-none">
            <SearchIcon />
          </span>
          <input
            ref={searchRef}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search agents & skills…"
            className="w-full bg-(--bg-surface) border border-(--border-subtle) rounded-lg pl-8 pr-3 py-1.5 text-[13px] text-(--text-primary) outline-none focus:outline-none focus:border-(--accent) transition-colors duration-120"
          />
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 min-h-0 overflow-y-auto px-3 pb-4 flex flex-col gap-4 pt-3">
        <NodeSection
          label="Agents"
          icon={<AgentIcon />}
          items={filteredAgents}
          type="agent"
          loading={loading}
          collapsed={collapsed}
          creating={creatingAgent}
          onStartCreate={() => setCreatingAgent(true)}
          onCancelCreate={() => setCreatingAgent(false)}
          onSubmitCreate={handleCreateAgent}
        />
        <NodeSection
          label="Skills"
          icon={<SkillIcon />}
          items={filteredSkills}
          type="skill"
          loading={loading}
          collapsed={collapsed}
          creating={creatingSkill}
          onStartCreate={() => setCreatingSkill(true)}
          onCancelCreate={() => setCreatingSkill(false)}
          onSubmitCreate={handleCreateSkill}
        />
      </div>
    </aside>
  );
};
