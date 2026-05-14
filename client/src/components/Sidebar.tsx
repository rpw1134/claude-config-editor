import { useEffect, useRef, useState } from 'react';
import { ProjectPicker } from './ProjectPicker';
import type { RecentItem } from '../hooks/useRecents';

// ── Icons ─────────────────────────────────────────────────────────────────────

const DocumentIcon = () => (
  <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M3 2.5C3 1.67 3.67 1 4.5 1H9L12 4V12.5C12 13.33 11.33 14 10.5 14H4.5C3.67 14 3 13.33 3 12.5V2.5Z" stroke="currentColor" strokeWidth="1.2" fill="none"/>
    <path d="M9 1V4H12" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
    <path d="M5.5 7H9.5M5.5 9.5H9.5" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round"/>
  </svg>
);

const AgentIcon = () => (
  <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="7.5" cy="5" r="3" stroke="currentColor" strokeWidth="1.2" fill="none"/>
    <path d="M2 13C2 10.24 4.46 8 7.5 8C10.54 8 13 10.24 13 13" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" fill="none"/>
  </svg>
);

const SkillIcon = () => (
  <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M7.5 1L9.18 5.27L13.5 5.64L10.35 8.38L11.35 12.59L7.5 10.2L3.65 12.59L4.65 8.38L1.5 5.64L5.82 5.27L7.5 1Z" stroke="currentColor" strokeWidth="1.2" fill="none" strokeLinejoin="round"/>
  </svg>
);

const McpIcon = () => (
  <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="1" y="1" width="13" height="13" rx="2" stroke="currentColor" strokeWidth="1.2" fill="none"/>
    <path d="M4 7.5H11M7.5 4V11" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
  </svg>
);

const PlusIcon = () => (
  <svg width="13" height="13" viewBox="0 0 13 13" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M6.5 1.5V11.5M1.5 6.5H11.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
  </svg>
);

const ChevronIcon = ({ direction = 'left' }: { direction?: 'left' | 'right' }) => (
  <svg
    width="12"
    height="12"
    viewBox="0 0 12 12"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    style={{ transform: direction === 'right' ? 'rotate(180deg)' : undefined }}
  >
    <path d="M7.5 2L4 6L7.5 10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

// ── Type label helpers ────────────────────────────────────────────────────────

function recentTypeLabel(type: RecentItem['type']): string {
  if (type === 'agent') return 'Agent';
  if (type === 'skill') return 'Skill';
  return 'MCP';
}

function recentTypeIcon(type: RecentItem['type']) {
  if (type === 'agent') return <AgentIcon />;
  if (type === 'skill') return <SkillIcon />;
  return <McpIcon />;
}

// ── Create New dropdown ───────────────────────────────────────────────────────

interface CreateNewDropdownProps {
  onSelect: (type: 'agent' | 'skill' | 'mcp-server') => void;
  onClose: () => void;
}

const CreateNewDropdown = ({ onSelect, onClose }: CreateNewDropdownProps) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    // Small delay so the click that opened the dropdown doesn't immediately close it
    const t = setTimeout(() => document.addEventListener('mousedown', handler), 50);
    return () => {
      clearTimeout(t);
      document.removeEventListener('mousedown', handler);
    };
  }, [onClose]);

  const options: { type: 'agent' | 'skill' | 'mcp-server'; label: string; icon: React.ReactNode }[] = [
    { type: 'agent', label: 'Agent', icon: <AgentIcon /> },
    { type: 'skill', label: 'Skill', icon: <SkillIcon /> },
    { type: 'mcp-server', label: 'MCP Server', icon: <McpIcon /> },
  ];

  return (
    <div
      ref={ref}
      className="absolute top-full left-0 right-0 mt-1.5 z-30 bg-[#18181b] border border-white/10 rounded-xl shadow-[0_8px_32px_rgba(0,0,0,0.5)] overflow-hidden"
    >
      {options.map(({ type, label, icon }) => (
        <button
          key={type}
          onClick={() => { onSelect(type); onClose(); }}
          className="w-full flex items-center gap-3 px-3.5 py-2.5 text-left text-[12px] font-medium text-white/55 hover:text-white/90 hover:bg-white/6 transition-colors duration-100"
        >
          <span className="text-white/30">{icon}</span>
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
  onClick: () => void;
}

const NavButton = ({ icon, label, active, disabled = false, onClick }: NavButtonProps) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={[
      'w-full flex items-center gap-3 px-3 py-2 rounded-md text-left transition-all duration-150',
      'text-[13px] font-medium',
      disabled
        ? 'text-white/18 cursor-not-allowed'
        : active
        ? 'bg-orange-500/15 text-orange-300'
        : 'text-white/45 hover:text-white/75 hover:bg-white/5',
    ].join(' ')}
    style={{ minHeight: '34px' }}
  >
    <span className={[
      'shrink-0 transition-colors',
      disabled ? 'text-white/15' : active ? 'text-orange-400' : 'text-white/30',
    ].join(' ')}>
      {icon}
    </span>
    <span className="truncate">{label}</span>
    {active && !disabled && (
      <span className="ml-auto w-1.5 h-1.5 rounded-full bg-orange-500 shrink-0" />
    )}
  </button>
);

// ── Sidebar (expanded) ────────────────────────────────────────────────────────

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  selectedProjectPath: string | null;
  onProjectSelect: (path: string) => void;
  collapsed: boolean;
  onToggleCollapsed: () => void;
  recents: RecentItem[];
  onRecentClick: (item: RecentItem) => void;
  onCreateNew: (type: 'agent' | 'skill' | 'mcp-server') => void;
}

export const Sidebar = ({
  activeTab,
  onTabChange,
  selectedProjectPath,
  onProjectSelect,
  collapsed,
  onToggleCollapsed,
  recents,
  onRecentClick,
  onCreateNew,
}: SidebarProps) => {
  const [createDropdownOpen, setCreateDropdownOpen] = useState(false);
  const hasProject = selectedProjectPath !== null;

  // ── Collapsed strip ────────────────────────────────────────────────────────

  if (collapsed) {
    return (
      <aside className="w-13 shrink-0 flex flex-col items-center bg-[#0d0d0f] border-r border-white/6 h-full">
        {/* Logo / expand */}
        <div className="pt-4 pb-3 flex flex-col items-center gap-2 border-b border-white/6 w-full shrink-0">
          <button
            onClick={onToggleCollapsed}
            className="w-8 h-8 rounded-lg bg-orange-500 flex items-center justify-center shadow-[0_0_12px_rgba(249,115,22,0.25)] hover:bg-orange-400 transition-colors"
            title="Expand sidebar"
          >
            <span className="text-[13px] font-bold text-white leading-none">C</span>
          </button>
        </div>

        {/* Create New (+) */}
        <div className="pt-3 px-2 w-full shrink-0">
          <button
            onClick={() => hasProject && onCreateNew('agent')}
            disabled={!hasProject}
            title="Create New"
            className={[
              'w-full flex items-center justify-center p-2 rounded-md transition-all duration-150',
              !hasProject
                ? 'text-white/15 cursor-not-allowed'
                : 'text-white/30 hover:text-white/60 hover:bg-white/5',
            ].join(' ')}
            style={{ minHeight: '34px' }}
          >
            <PlusIcon />
          </button>
        </div>

        {/* CLAUDE.md */}
        <div className="px-2 w-full shrink-0">
          <button
            onClick={() => hasProject && onTabChange('claude-md')}
            disabled={!hasProject}
            title="CLAUDE.md"
            className={[
              'w-full flex items-center justify-center p-2 rounded-md transition-all duration-150',
              !hasProject
                ? 'text-white/15 cursor-not-allowed'
                : activeTab === 'claude-md'
                ? 'bg-orange-500/15 text-orange-400'
                : 'text-white/30 hover:text-white/60 hover:bg-white/5',
            ].join(' ')}
            style={{ minHeight: '34px' }}
          >
            <DocumentIcon />
          </button>
        </div>

        {/* Agents */}
        <div className="px-2 w-full shrink-0">
          <button
            onClick={() => hasProject && onTabChange('landing-agents')}
            disabled={!hasProject}
            title="Agents"
            className={[
              'w-full flex items-center justify-center p-2 rounded-md transition-all duration-150',
              !hasProject
                ? 'text-white/15 cursor-not-allowed'
                : activeTab === 'landing-agents' || activeTab === 'agents'
                ? 'bg-orange-500/15 text-orange-400'
                : 'text-white/30 hover:text-white/60 hover:bg-white/5',
            ].join(' ')}
            style={{ minHeight: '34px' }}
          >
            <AgentIcon />
          </button>
        </div>

        {/* Skills */}
        <div className="px-2 w-full shrink-0">
          <button
            onClick={() => hasProject && onTabChange('landing-skills')}
            disabled={!hasProject}
            title="Skills"
            className={[
              'w-full flex items-center justify-center p-2 rounded-md transition-all duration-150',
              !hasProject
                ? 'text-white/15 cursor-not-allowed'
                : activeTab === 'landing-skills' || activeTab === 'skills'
                ? 'bg-orange-500/15 text-orange-400'
                : 'text-white/30 hover:text-white/60 hover:bg-white/5',
            ].join(' ')}
            style={{ minHeight: '34px' }}
          >
            <SkillIcon />
          </button>
        </div>

        {/* MCP Servers */}
        <div className="px-2 w-full shrink-0">
          <button
            onClick={() => hasProject && onTabChange('landing-mcp')}
            disabled={!hasProject}
            title="MCP Servers"
            className={[
              'w-full flex items-center justify-center p-2 rounded-md transition-all duration-150',
              !hasProject
                ? 'text-white/15 cursor-not-allowed'
                : activeTab === 'landing-mcp' || activeTab === 'mcp-servers'
                ? 'bg-orange-500/15 text-orange-400'
                : 'text-white/30 hover:text-white/60 hover:bg-white/5',
            ].join(' ')}
            style={{ minHeight: '34px' }}
          >
            <McpIcon />
          </button>
        </div>

        <div className="flex-1" />
      </aside>
    );
  }

  // ── Expanded sidebar ───────────────────────────────────────────────────────

  return (
    <aside className="w-65 shrink-0 flex flex-col bg-[#0d0d0f] border-r border-white/6 h-full">
      {/* App header */}
      <div className="px-4 pt-5 pb-4 border-b border-white/6 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-orange-500 flex items-center justify-center shrink-0 shadow-[0_0_12px_rgba(249,115,22,0.25)]">
            <span className="text-[13px] font-bold text-white leading-none">C</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-semibold text-white/90 leading-tight tracking-tight">Config Studio</p>
            <p className="text-[11px] text-white/30 font-mono leading-tight mt-0.5">~/.claude/</p>
          </div>
          <button
            onClick={onToggleCollapsed}
            className="shrink-0 text-white/20 hover:text-white/55 transition-colors p-1 rounded hover:bg-white/5"
            title="Collapse sidebar"
          >
            <ChevronIcon direction="left" />
          </button>
        </div>
      </div>

      {/* Project picker */}
      <div className="shrink-0">
        <ProjectPicker selectedPath={selectedProjectPath} onSelect={onProjectSelect} />
      </div>

      {/* Nav area */}
      <div className="px-3 pt-3 shrink-0 flex flex-col gap-0.5">
        {/* Create New */}
        <div className="relative mb-1.5">
          <button
            onClick={() => hasProject && setCreateDropdownOpen((v) => !v)}
            disabled={!hasProject}
            className={[
              'w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-left transition-all duration-150',
              'text-[13px] font-semibold',
              !hasProject
                ? 'text-white/18 cursor-not-allowed bg-white/2 border border-white/6'
                : createDropdownOpen
                ? 'bg-orange-500/20 text-orange-300 border border-orange-500/20'
                : 'bg-orange-500/10 text-orange-400 border border-orange-500/15 hover:bg-orange-500/15 hover:text-orange-300',
            ].join(' ')}
            style={{ minHeight: '34px' }}
          >
            <span className={!hasProject ? 'text-white/15' : 'text-orange-400'}>
              <PlusIcon />
            </span>
            <span>Create New</span>
            <span className={[
              'ml-auto text-[10px] transition-transform duration-150',
              createDropdownOpen ? 'rotate-180' : '',
            ].join(' ')}>
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                <path d="M2 3.5L5 6.5L8 3.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </span>
          </button>

          {createDropdownOpen && hasProject && (
            <CreateNewDropdown
              onSelect={(type) => { onCreateNew(type); }}
              onClose={() => setCreateDropdownOpen(false)}
            />
          )}
        </div>

        {/* CLAUDE.md */}
        <NavButton
          icon={<DocumentIcon />}
          label="CLAUDE.md"
          active={activeTab === 'claude-md'}
          disabled={!hasProject}
          onClick={() => { onTabChange('claude-md'); }}
        />

        {/* Agents */}
        <NavButton
          icon={<AgentIcon />}
          label="Agents"
          active={activeTab === 'landing-agents' || activeTab === 'agents'}
          disabled={!hasProject}
          onClick={() => { onTabChange('landing-agents'); }}
        />

        {/* Skills */}
        <NavButton
          icon={<SkillIcon />}
          label="Skills"
          active={activeTab === 'landing-skills' || activeTab === 'skills'}
          disabled={!hasProject}
          onClick={() => { onTabChange('landing-skills'); }}
        />

        {/* MCP Servers */}
        <NavButton
          icon={<McpIcon />}
          label="MCP Servers"
          active={activeTab === 'landing-mcp' || activeTab === 'mcp-servers'}
          disabled={!hasProject}
          onClick={() => { onTabChange('landing-mcp'); }}
        />
      </div>

      {/* Recents */}
      {hasProject && recents.length > 0 && (
        <>
          <div className="mx-3 mt-4 mb-2 border-t border-white/6 shrink-0" />
          <div className="flex-1 overflow-y-auto min-h-0 pb-2">
            <div className="px-4 mb-1.5" style={{ minHeight: '24px', display: 'flex', alignItems: 'center' }}>
              <span className="text-[10px] font-semibold uppercase tracking-widest text-white/20">
                Recents
              </span>
            </div>
            <ul>
              {recents.map((item, i) => (
                <li key={`${item.type}:${item.name}:${i}`}>
                  <button
                    onClick={() => onRecentClick(item)}
                    className="w-full text-left px-4 flex items-center gap-2.5 transition-colors duration-100 text-white/35 hover:text-white/70 hover:bg-white/5"
                    style={{ minHeight: '28px' }}
                    title={`${recentTypeLabel(item.type)} — ${item.name}`}
                  >
                    <span className="text-white/20 shrink-0">{recentTypeIcon(item.type)}</span>
                    <span className="text-[10px] font-semibold uppercase tracking-[0.07em] text-white/20 shrink-0">
                      {recentTypeLabel(item.type)}
                    </span>
                    <span className="text-[12px] font-mono truncate">{item.name}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </>
      )}

      {(!hasProject || recents.length === 0) && <div className="flex-1" />}

      {/* Bottom */}
      <div className="px-3 pb-4 border-t border-white/6 pt-3 shrink-0">
        <p className="px-3 text-[10px] font-mono text-white/12">v0.1.0-pre</p>
      </div>
    </aside>
  );
};
