interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
}

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const FolderIcon = () => (
  <svg width="16" height="16" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M1 3.5C1 2.67 1.67 2 2.5 2H5.79C6.18 2 6.55 2.16 6.81 2.44L7.5 3.2L8.19 2.44C8.45 2.16 8.82 2 9.21 2H12.5C13.33 2 14 2.67 14 3.5V11.5C14 12.33 13.33 13 12.5 13H2.5C1.67 13 1 12.33 1 11.5V3.5Z" stroke="currentColor" strokeWidth="1.2" fill="none"/>
  </svg>
);

const AgentIcon = () => (
  <svg width="16" height="16" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="7.5" cy="5" r="3" stroke="currentColor" strokeWidth="1.2" fill="none"/>
    <path d="M2 13C2 10.24 4.46 8 7.5 8C10.54 8 13 10.24 13 13" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" fill="none"/>
  </svg>
);

const SkillIcon = () => (
  <svg width="16" height="16" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M7.5 1L9.18 5.27L13.5 5.64L10.35 8.38L11.35 12.59L7.5 10.2L3.65 12.59L4.65 8.38L1.5 5.64L5.82 5.27L7.5 1Z" stroke="currentColor" strokeWidth="1.2" fill="none" strokeLinejoin="round"/>
  </svg>
);

const McpIcon = () => (
  <svg width="16" height="16" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="1" y="1" width="13" height="13" rx="2" stroke="currentColor" strokeWidth="1.2" fill="none"/>
    <path d="M4 7.5H11M7.5 4V11" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
  </svg>
);

const SettingsIcon = () => (
  <svg width="16" height="16" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M7.5 9.5C8.6 9.5 9.5 8.6 9.5 7.5C9.5 6.4 8.6 5.5 7.5 5.5C6.4 5.5 5.5 6.4 5.5 7.5C5.5 8.6 6.4 9.5 7.5 9.5Z" stroke="currentColor" strokeWidth="1.2" fill="none"/>
    <path d="M12.07 9.31C12.12 9.05 12.15 8.78 12.15 8.5C12.15 8.22 12.12 7.95 12.07 7.69L13.62 6.57C13.76 6.47 13.8 6.28 13.71 6.12L12.24 3.62C12.15 3.46 11.96 3.4 11.79 3.46L9.97 4.2C9.57 3.9 9.13 3.65 8.65 3.47L8.38 1.54C8.35 1.36 8.19 1.22 8 1.22H5.06C4.87 1.22 4.71 1.36 4.68 1.54L4.41 3.47C3.93 3.65 3.49 3.9 3.09 4.2L1.27 3.46C1.1 3.4 0.91 3.46 0.82 3.62L-0.65 6.12C-0.74 6.28 -0.7 6.47 -0.56 6.57L0.99 7.69C0.94 7.95 0.91 8.22 0.91 8.5C0.91 8.78 0.94 9.05 0.99 9.31L-0.56 10.43C-0.7 10.53 -0.74 10.72 -0.65 10.88L0.82 13.38C0.91 13.54 1.1 13.6 1.27 13.54L3.09 12.8C3.49 13.1 3.93 13.35 4.41 13.53L4.68 15.46C4.71 15.64 4.87 15.78 5.06 15.78H8C8.19 15.78 8.35 15.64 8.38 15.46L8.65 13.53C9.13 13.35 9.57 13.1 9.97 12.8L11.79 13.54C11.96 13.6 12.15 13.54 12.24 13.38L13.71 10.88C13.8 10.72 13.76 10.53 13.62 10.43L12.07 9.31Z" stroke="currentColor" strokeWidth="1.1" fill="none" strokeLinejoin="round"/>
  </svg>
);

const NAV_ITEMS: NavItem[] = [
  { id: 'projects', label: 'Projects', icon: <FolderIcon /> },
  { id: 'agents', label: 'Agents', icon: <AgentIcon /> },
  { id: 'skills', label: 'Skills', icon: <SkillIcon /> },
  { id: 'mcp-servers', label: 'MCP Servers', icon: <McpIcon /> },
];

export const Sidebar = ({ activeTab, onTabChange }: SidebarProps) => {
  return (
    <aside className="w-[220px] shrink-0 flex flex-col bg-[#0d0d0f] border-r border-white/6 h-full">
      {/* App title */}
      <div className="px-4 pt-6 pb-5 border-b border-white/6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-orange-500 flex items-center justify-center shrink-0 shadow-[0_0_12px_rgba(249,115,22,0.25)]">
            <span className="text-[13px] font-bold text-white leading-none">C</span>
          </div>
          <div>
            <p className="text-[13px] font-semibold text-white/90 leading-tight tracking-tight">Config Studio</p>
            <p className="text-[11px] text-white/30 font-mono leading-tight mt-0.5">~/.claude/</p>
          </div>
        </div>
      </div>

      {/* Nav items */}
      <nav className="flex-1 px-3 pt-4 pb-2">
        <p className="px-2 mb-2 text-[10px] font-semibold uppercase tracking-[0.1em] text-white/20">Navigation</p>
        <ul className="space-y-0.5">
          {NAV_ITEMS.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <li key={item.id}>
                <button
                  onClick={() => onTabChange(item.id)}
                  className={[
                    'w-full flex items-center gap-3 px-3 py-2 rounded-md text-left transition-all duration-150',
                    'text-[13px] font-medium',
                    isActive
                      ? 'bg-orange-500/15 text-orange-300'
                      : 'text-white/45 hover:text-white/75 hover:bg-white/5',
                  ].join(' ')}
                  style={{ minHeight: '36px' }}
                >
                  <span className={[
                    'shrink-0 transition-colors',
                    isActive ? 'text-orange-400' : 'text-white/30',
                  ].join(' ')}>
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                  {isActive && (
                    <span className="ml-auto w-1.5 h-1.5 rounded-full bg-orange-500 shrink-0" />
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Bottom settings */}
      <div className="px-3 pb-4 border-t border-white/6 pt-3">
        <button
          className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-left text-white/35 hover:text-white/65 hover:bg-white/5 transition-all duration-150 text-[13px] font-medium"
          style={{ minHeight: '36px' }}
        >
          <span className="text-white/25 shrink-0">
            <SettingsIcon />
          </span>
          Settings
        </button>
        <p className="px-3 mt-3 text-[10px] font-mono text-white/15">v0.1.0-pre</p>
      </div>
    </aside>
  );
};
