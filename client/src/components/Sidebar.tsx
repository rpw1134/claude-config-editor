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
      style={{
        position: 'absolute',
        top: '100%',
        left: 0,
        right: 0,
        marginTop: '6px',
        zIndex: 30,
        background: 'var(--bg-elevated)',
        border: '1px solid var(--border-default)',
        borderRadius: '8px',
        boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
        overflow: 'hidden',
      }}
    >
      {options.map(({ type, label, icon }) => (
        <button
          key={type}
          onClick={() => { onSelect(type); onClose(); }}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '9px 14px',
            textAlign: 'left',
            fontSize: '14px',
            fontWeight: 500,
            color: 'var(--text-secondary)',
            background: 'transparent',
            transition: 'background 150ms ease, color 150ms ease',
            border: 'none',
            cursor: 'pointer',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = 'var(--bg-hover)';
            (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-primary)';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
            (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-secondary)';
          }}
        >
          <span style={{ color: 'var(--text-muted)' }}>{icon}</span>
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
    style={{
      width: '100%',
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      padding: '6px 10px',
      paddingLeft: '8px',
      borderRadius: '6px',
      textAlign: 'left',
      fontSize: '14px',
      fontWeight: 500,
      minHeight: '34px',
      transition: 'all 150ms ease',
      border: 'none',
      cursor: disabled ? 'not-allowed' : 'pointer',
      // Active: 3px left border + subtle tint
      borderLeft: active ? '3px solid var(--accent)' : '3px solid transparent',
      background: active ? 'var(--bg-surface)' : 'transparent',
      color: disabled
        ? 'var(--text-muted)'
        : active
        ? 'var(--text-primary)'
        : 'var(--text-secondary)',
    }}
    onMouseEnter={(e) => {
      if (!disabled && !active) {
        (e.currentTarget as HTMLButtonElement).style.background = 'var(--bg-hover)';
        (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-primary)';
      }
    }}
    onMouseLeave={(e) => {
      if (!disabled && !active) {
        (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
        (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-secondary)';
      }
    }}
  >
    <span style={{
      flexShrink: 0,
      color: disabled ? 'var(--text-muted)' : active ? 'var(--accent)' : 'var(--text-muted)',
      transition: 'color 150ms ease',
    }}>
      {icon}
    </span>
    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label}</span>
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
      <aside style={{
        width: '52px',
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        background: 'var(--bg-sidebar)',
        borderRight: '1px solid var(--border-faint)',
        height: '100%',
      }}>
        {/* Logo / expand */}
        <div style={{
          paddingTop: '16px',
          paddingBottom: '12px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '8px',
          borderBottom: '1px solid var(--border-faint)',
          width: '100%',
          flexShrink: 0,
        }}>
          <button
            onClick={onToggleCollapsed}
            title="Expand sidebar"
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: '#2a2a30',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: 'none',
              cursor: 'pointer',
              transition: 'background 150ms ease',
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = '#333340'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = '#2a2a30'; }}
          >
            <span style={{ fontSize: '13px', fontWeight: 700, color: 'white', lineHeight: 1 }}>C</span>
          </button>
        </div>

        {/* Create New (+) */}
        <div style={{ padding: '12px 8px 0', width: '100%', flexShrink: 0 }}>
          <button
            onClick={() => hasProject && onCreateNew('agent')}
            disabled={!hasProject}
            title="Create New"
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '8px',
              borderRadius: '6px',
              minHeight: '34px',
              border: 'none',
              cursor: hasProject ? 'pointer' : 'not-allowed',
              color: 'white',
              background: hasProject ? 'var(--accent)' : 'var(--bg-surface)',
              transition: 'background 150ms ease',
              opacity: hasProject ? 1 : 0.4,
            }}
            onMouseEnter={(e) => {
              if (hasProject) (e.currentTarget as HTMLButtonElement).style.background = 'var(--accent-hover)';
            }}
            onMouseLeave={(e) => {
              if (hasProject) (e.currentTarget as HTMLButtonElement).style.background = 'var(--accent)';
            }}
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
            <div key={tab} style={{ padding: '2px 8px', width: '100%', flexShrink: 0 }}>
              <button
                onClick={() => hasProject && onTabChange(tab)}
                disabled={!hasProject}
                title={title}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '8px',
                  borderRadius: '6px',
                  minHeight: '34px',
                  border: 'none',
                  cursor: hasProject ? 'pointer' : 'not-allowed',
                  background: isActive ? 'var(--bg-surface)' : 'transparent',
                  color: isActive ? 'var(--accent)' : hasProject ? 'var(--text-muted)' : 'var(--text-muted)',
                  transition: 'background 150ms ease, color 150ms ease',
                  opacity: hasProject ? 1 : 0.4,
                }}
              >
                {icon}
              </button>
            </div>
          );
        })}

        <div style={{ flex: 1 }} />
      </aside>
    );
  }

  // ── Expanded sidebar ───────────────────────────────────────────────────────

  return (
    <aside style={{
      width: '260px',
      flexShrink: 0,
      display: 'flex',
      flexDirection: 'column',
      background: 'var(--bg-sidebar)',
      borderRight: '1px solid var(--border-faint)',
      height: '100%',
    }}>
      {/* App header */}
      <div style={{
        padding: '20px 16px 16px',
        borderBottom: '1px solid var(--border-faint)',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            background: '#2a2a30',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}>
            <span style={{ fontSize: '13px', fontWeight: 700, color: 'white', lineHeight: 1 }}>C</span>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{
              fontSize: '14px',
              fontWeight: 600,
              color: 'var(--text-primary)',
              lineHeight: 1.2,
            }}>Config Studio</p>
            <p style={{
              fontSize: '12px',
              color: 'var(--text-muted)',
              fontFamily: 'Fira Code, monospace',
              lineHeight: 1.2,
              marginTop: '2px',
            }}>~/.claude/</p>
          </div>
          <button
            onClick={onToggleCollapsed}
            title="Collapse sidebar"
            style={{
              flexShrink: 0,
              color: 'var(--text-muted)',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              padding: '4px',
              borderRadius: '4px',
              transition: 'color 150ms ease',
              display: 'flex',
              alignItems: 'center',
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-secondary)'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-muted)'; }}
          >
            <ChevronIcon direction="left" />
          </button>
        </div>
      </div>

      {/* Project picker */}
      <div style={{ flexShrink: 0 }}>
        <ProjectPicker selectedPath={selectedProjectPath} onSelect={onProjectSelect} />
      </div>

      {/* Nav area */}
      <div style={{ padding: '12px 10px 0', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '2px' }}>
        {/* Create New button */}
        <div style={{ position: 'relative', marginBottom: '6px' }}>
          <button
            onClick={() => hasProject && setCreateDropdownOpen((v) => !v)}
            disabled={!hasProject}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '7px 12px',
              borderRadius: '8px',
              textAlign: 'left',
              fontSize: '14px',
              fontWeight: 500,
              minHeight: '34px',
              transition: 'background 150ms ease',
              cursor: hasProject ? 'pointer' : 'not-allowed',
              background: hasProject ? 'var(--accent)' : 'var(--bg-surface)',
              color: hasProject ? 'white' : 'var(--text-muted)',
              border: hasProject ? 'none' : '1px solid var(--border-faint)',
              opacity: hasProject ? 1 : 0.5,
            }}
            onMouseEnter={(e) => {
              if (hasProject) {
                (e.currentTarget as HTMLButtonElement).style.background = 'var(--accent-hover)';
              }
            }}
            onMouseLeave={(e) => {
              if (hasProject) {
                (e.currentTarget as HTMLButtonElement).style.background = 'var(--accent)';
              }
            }}
          >
            <span style={{ color: hasProject ? 'white' : 'var(--text-muted)' }}>
              <PlusIcon />
            </span>
            <span>Create New</span>
            <span style={{
              marginLeft: 'auto',
              transition: 'transform 150ms ease',
              transform: createDropdownOpen ? 'rotate(180deg)' : 'none',
              opacity: 0.7,
            }}>
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
          <div style={{ margin: '16px 12px 8px', borderTop: '1px solid var(--border-faint)', flexShrink: 0 }} />
          <div style={{ flex: 1, overflowY: 'auto', minHeight: 0, paddingBottom: '8px' }}>
            <div style={{
              padding: '0 16px',
              marginBottom: '6px',
              minHeight: '24px',
              display: 'flex',
              alignItems: 'center',
            }}>
              <span style={{
                fontSize: '11px',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.12em',
                color: 'var(--text-muted)',
              }}>
                Recents
              </span>
            </div>
            <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
              {recents.map((item, i) => (
                <li key={`${item.type}:${item.name}:${i}`}>
                  <button
                    onClick={() => onRecentClick(item)}
                    title={`${recentTypeLabel(item.type)} — ${item.name}`}
                    style={{
                      width: '100%',
                      textAlign: 'left',
                      padding: '0 16px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      minHeight: '30px',
                      background: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      color: 'var(--text-secondary)',
                      transition: 'background 150ms ease, color 150ms ease',
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.background = 'var(--bg-hover)';
                      (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-primary)';
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
                      (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-secondary)';
                    }}
                  >
                    <span style={{ color: 'var(--text-muted)', flexShrink: 0 }}>{recentTypeIcon(item.type)}</span>
                    <span style={{
                      fontSize: '12px',
                      fontWeight: 500,
                      color: 'var(--text-muted)',
                      flexShrink: 0,
                    }}>
                      {recentTypeLabel(item.type)}
                    </span>
                    <span style={{
                      fontSize: '13px',
                      fontFamily: "'Instrument Sans', sans-serif",
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}>{item.name}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </>
      )}

      {(!hasProject || recents.length === 0) && <div style={{ flex: 1 }} />}

      {/* Bottom */}
      <div style={{
        padding: '12px 12px 16px',
        borderTop: '1px solid var(--border-faint)',
        flexShrink: 0,
      }}>
        <p style={{
          padding: '0 10px',
          fontSize: '11px',
          fontFamily: 'Fira Code, monospace',
          color: 'var(--text-muted)',
          opacity: 0.6,
        }}>v0.1.0-pre</p>
      </div>
    </aside>
  );
};
