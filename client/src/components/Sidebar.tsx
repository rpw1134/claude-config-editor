import { ProjectPicker } from './ProjectPicker';

// ── Icons ─────────────────────────────────────────────────────────────────────

const DocumentIcon = () => (
  <svg width="16" height="16" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M3 2.5C3 1.67 3.67 1 4.5 1H9L12 4V12.5C12 13.33 11.33 14 10.5 14H4.5C3.67 14 3 13.33 3 12.5V2.5Z" stroke="currentColor" strokeWidth="1.2" fill="none"/>
    <path d="M9 1V4H12" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
    <path d="M5.5 7H9.5M5.5 9.5H9.5" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round"/>
  </svg>
);

const SettingsIcon = () => (
  <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M7.5 9.5C8.6 9.5 9.5 8.6 9.5 7.5C9.5 6.4 8.6 5.5 7.5 5.5C6.4 5.5 5.5 6.4 5.5 7.5C5.5 8.6 6.4 9.5 7.5 9.5Z" stroke="currentColor" strokeWidth="1.2" fill="none"/>
    <path d="M12.07 9.31C12.12 9.05 12.15 8.78 12.15 8.5C12.15 8.22 12.12 7.95 12.07 7.69L13.62 6.57C13.76 6.47 13.8 6.28 13.71 6.12L12.24 3.62C12.15 3.46 11.96 3.4 11.79 3.46L9.97 4.2C9.57 3.9 9.13 3.65 8.65 3.47L8.38 1.54C8.35 1.36 8.19 1.22 8 1.22H5.06C4.87 1.22 4.71 1.36 4.68 1.54L4.41 3.47C3.93 3.65 3.49 3.9 3.09 4.2L1.27 3.46C1.1 3.4 0.91 3.46 0.82 3.62L-0.65 6.12C-0.74 6.28 -0.7 6.47 -0.56 6.57L0.99 7.69C0.94 7.95 0.91 8.22 0.91 8.5C0.91 8.78 0.94 9.05 0.99 9.31L-0.56 10.43C-0.7 10.53 -0.74 10.72 -0.65 10.88L0.82 13.38C0.91 13.54 1.1 13.6 1.27 13.54L3.09 12.8C3.49 13.1 3.93 13.35 4.41 13.53L4.68 15.46C4.71 15.64 4.87 15.78 5.06 15.78H8C8.19 15.78 8.35 15.64 8.38 15.46L8.65 13.53C9.13 13.35 9.57 13.1 9.97 12.8L11.79 13.54C11.96 13.6 12.15 13.54 12.24 13.38L13.71 10.88C13.8 10.72 13.76 10.53 13.62 10.43L12.07 9.31Z" stroke="currentColor" strokeWidth="1.1" fill="none" strokeLinejoin="round"/>
  </svg>
);

// ── Sidebar ───────────────────────────────────────────────────────────────────

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  selectedProjectPath: string | null;
  onProjectSelect: (path: string) => void;
  /** Compact inline lists — agents, skills, MCP — rendered in the scrollable body. */
  listContent?: React.ReactNode;
}

export const Sidebar = ({
  activeTab,
  onTabChange,
  selectedProjectPath,
  onProjectSelect,
  listContent,
}: SidebarProps) => {
  const hasProject = selectedProjectPath !== null;
  const isClaudeMdActive = activeTab === 'claude-md';

  return (
    <aside className="w-65 shrink-0 flex flex-col bg-[#0d0d0f] border-r border-white/6 h-full">
      {/* App header */}
      <div className="px-4 pt-5 pb-4 border-b border-white/6 shrink-0">
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

      {/* Project picker */}
      <div className="shrink-0">
        <ProjectPicker selectedPath={selectedProjectPath} onSelect={onProjectSelect} />
      </div>

      {/* CLAUDE.md button */}
      <div className="px-3 pt-3 shrink-0">
        <button
          onClick={() => hasProject && onTabChange('claude-md')}
          disabled={!hasProject}
          className={[
            'w-full flex items-center gap-3 px-3 py-2 rounded-md text-left transition-all duration-150',
            'text-[13px] font-medium',
            !hasProject
              ? 'text-white/18 cursor-not-allowed'
              : isClaudeMdActive
              ? 'bg-orange-500/15 text-orange-300'
              : 'text-white/45 hover:text-white/75 hover:bg-white/5',
          ].join(' ')}
          style={{ minHeight: '36px' }}
        >
          <span className={[
            'shrink-0 transition-colors',
            !hasProject
              ? 'text-white/15'
              : isClaudeMdActive
              ? 'text-orange-400'
              : 'text-white/30',
          ].join(' ')}>
            <DocumentIcon />
          </span>
          <span>CLAUDE.md</span>
          {isClaudeMdActive && hasProject && (
            <span className="ml-auto w-1.5 h-1.5 rounded-full bg-orange-500 shrink-0" />
          )}
        </button>
      </div>

      {/* Divider + scrollable list area */}
      {listContent && (
        <>
          <div className="mx-3 mt-3 mb-2 border-t border-white/6" />
          <div className="flex-1 overflow-y-auto pb-2 min-h-0">
            {listContent}
          </div>
        </>
      )}

      {!listContent && <div className="flex-1" />}

      {/* Bottom settings */}
      <div className="px-3 pb-4 border-t border-white/6 pt-3 shrink-0">
        <button
          className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-left text-white/30 hover:text-white/60 hover:bg-white/5 transition-all duration-150 text-[13px] font-medium"
          style={{ minHeight: '36px' }}
        >
          <span className="text-white/20 shrink-0">
            <SettingsIcon />
          </span>
          Settings
        </button>
        <p className="px-3 mt-2 text-[10px] font-mono text-white/12">v0.1.0-pre</p>
      </div>
    </aside>
  );
};
