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
    className={direction === 'right' ? 'rotate-180' : undefined}
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
      className="absolute top-full left-0 right-0 mt-1.5 z-30 bg-(--bg-elevated) border border-(--border-default) rounded-lg overflow-hidden shadow-[0_4px_24px_rgba(0,0,0,0.4)]"
    >
      {options.map(({ type, label, icon }) => (
        <button
          key={type}
          onClick={() => { onSelect(type); onClose(); }}
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
  onClick: () => void;
}

const NavButton = ({ icon, label, active, disabled = false, onClick }: NavButtonProps) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={[
      'w-full flex items-center gap-2.5 px-2.5 pl-2 rounded-md text-left text-[14px] font-medium min-h-8.5 border-none transition-all duration-150',
      'border-l-[3px]',
      active
        ? 'bg-(--bg-surface) text-(--text-primary) border-l-(--accent)'
        : disabled
        ? 'bg-transparent text-(--text-muted) border-l-transparent cursor-not-allowed'
        : 'bg-transparent text-(--text-secondary) border-l-transparent cursor-pointer hover:bg-(--bg-hover) hover:text-(--text-primary)',
    ].join(' ')}
  >
    <span className={[
      'shrink-0 transition-colors duration-150',
      disabled ? 'text-(--text-muted)' : active ? 'text-(--accent)' : 'text-(--text-muted)',
    ].join(' ')}>
      {icon}
    </span>
    <span className="overflow-hidden text-ellipsis whitespace-nowrap">{label}</span>
  </button>
);

// ── Sidebar ────────────────────────────────────────────────────────────────────

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
      <aside className="w-13 shrink-0 flex flex-col items-center bg-(--bg-sidebar) border-r border-(--border-faint) h-full">
        {/* Logo / expand */}
        <div className="pt-4 pb-3 flex flex-col items-center gap-2 border-b border-(--border-faint) w-full shrink-0">
          <button
            onClick={onToggleCollapsed}
            title="Expand sidebar"
            className="w-8 h-8 rounded-lg bg-[#2a2a30] flex items-center justify-center border-none cursor-pointer transition-colors duration-150 hover:bg-[#333340]"
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
              'w-full flex items-center justify-center p-2 rounded-md min-h-8.5 border-none transition-colors duration-150',
              hasProject
                ? 'bg-(--accent) text-white cursor-pointer hover:bg-(--accent-hover)'
                : 'bg-(--bg-surface) text-white cursor-not-allowed opacity-40',
            ].join(' ')}
          >
            <PlusIcon />
          </button>
        </div>

        {/* Icon nav items */}
        {[
          { tab: 'claude-md', matchTabs: ['claude-md'], icon: <DocumentIcon />, title: 'CLAUDE.md' },
          { tab: 'landing-agents', matchTabs: ['landing-agents', 'agents'], icon: <AgentIcon />, title: 'Agents' },
          { tab: 'landing-skills', matchTabs: ['landing-skills', 'skills'], icon: <SkillIcon />, title: 'Skills' },
          { tab: 'landing-mcp', matchTabs: ['landing-mcp', 'mcp-servers'], icon: <McpIcon />, title: 'MCP Servers' },
        ].map(({ tab, matchTabs, icon, title }) => {
          const isActive = matchTabs.includes(activeTab);
          return (
            <div key={tab} className="py-0.5 px-2 w-full shrink-0">
              <button
                onClick={() => hasProject && onTabChange(tab)}
                disabled={!hasProject}
                title={title}
                className={[
                  'w-full flex items-center justify-center p-2 rounded-md min-h-8.5 border-none transition-colors duration-150',
                  !hasProject ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer',
                  isActive ? 'bg-(--bg-surface) text-(--accent)' : 'bg-transparent text-(--text-muted)',
                ].join(' ')}
              >
                {icon}
              </button>
            </div>
          );
        })}

        <div className="flex-1" />
      </aside>
    );
  }

  // ── Expanded sidebar ───────────────────────────────────────────────────────

  return (
    <aside className="w-65 shrink-0 flex flex-col bg-(--bg-sidebar) border-r border-(--border-faint) h-full">
      {/* App header */}
      <div className="px-4 pt-5 pb-4 border-b border-(--border-faint) shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#2a2a30] flex items-center justify-center shrink-0">
            <span className="text-[13px] font-bold text-white leading-none">C</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[14px] font-semibold text-(--text-primary) leading-[1.2]">Config Studio</p>
            <p className="text-[12px] text-(--text-muted) font-['Fira_Code',monospace] leading-[1.2] mt-0.5">~/.claude/</p>
          </div>
          <button
            onClick={onToggleCollapsed}
            title="Collapse sidebar"
            className="shrink-0 text-(--text-muted) bg-transparent border-none cursor-pointer p-1 rounded flex items-center transition-colors duration-150 hover:text-(--text-secondary)"
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
      <div className="px-2.5 pt-3 shrink-0 flex flex-col gap-0.5">
        {/* Create New button */}
        <div className="relative mb-1.5">
          <button
            onClick={() => hasProject && setCreateDropdownOpen((v) => !v)}
            disabled={!hasProject}
            className={[
              'w-full flex items-center gap-2.5 px-3 py-1.75 rounded-lg text-left text-[14px] font-medium min-h-8.5 border-none transition-colors duration-150',
              hasProject
                ? 'bg-(--accent) text-white cursor-pointer hover:bg-(--accent-hover)'
                : 'bg-(--bg-surface) text-(--text-muted) cursor-not-allowed border border-(--border-faint) opacity-50',
            ].join(' ')}
          >
            <span className={hasProject ? 'text-white' : 'text-(--text-muted)'}>
              <PlusIcon />
            </span>
            <span>Create New</span>
            <span
              className={[
                'ml-auto transition-transform duration-150 opacity-70',
                createDropdownOpen ? 'rotate-180' : '',
              ].join(' ')}
            >
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
          <div className="mx-3 my-4 border-t border-(--border-faint) shrink-0" />
          <div className="flex-1 overflow-y-auto min-h-0 pb-2">
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
                    <span className="text-(--text-muted) shrink-0">{recentTypeIcon(item.type)}</span>
                    <span className="text-[12px] font-medium text-(--text-muted) shrink-0">
                      {recentTypeLabel(item.type)}
                    </span>
                    <span className="text-[13px] font-['Instrument_Sans',sans-serif] overflow-hidden text-ellipsis whitespace-nowrap">
                      {item.name}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </>
      )}

      {(!hasProject || recents.length === 0) && <div className="flex-1" />}

      {/* Bottom */}
      <div className="px-3 pt-3 pb-4 border-t border-(--border-faint) shrink-0">
        <p className="px-2.5 text-[11px] font-['Fira_Code',monospace] text-(--text-muted) opacity-60">v0.1.0-pre</p>
      </div>
    </aside>
  );
};
