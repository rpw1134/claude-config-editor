import { BackArrowIcon } from '../../components/Icons';

export type GridTabId = 'editor' | 'history' | 'settings';

interface TabDef {
  id: GridTabId;
  label: string;
}

const TABS: TabDef[] = [
  { id: 'editor', label: 'Editor' },
  { id: 'history', label: 'History' },
  { id: 'settings', label: 'Settings' },
];

interface GridTopBarProps {
  gridName: string;
  dirty: boolean;
  saving: boolean;
  canUndo: boolean;
  activeTab: GridTabId;
  onTabChange: (tab: GridTabId) => void;
  onBack: () => void;
  onSave: () => void;
  onUndo: () => void;
}

export const GridTopBar = ({
  gridName,
  dirty,
  saving,
  canUndo,
  activeTab,
  onTabChange,
  onBack,
  onSave,
  onUndo,
}: GridTopBarProps) => (
  <div className="shrink-0 flex items-stretch justify-between px-4 border-b border-(--border-faint) bg-(--bg-sidebar)">
    <div className="flex items-stretch gap-1">
      {/* Back button */}
      <button
        type="button"
        onClick={onBack}
        className="flex items-center gap-1.5 pt-6 pb-5 text-[14px] text-(--text-secondary) hover:text-(--text-primary) bg-transparent border-none cursor-pointer transition-colors duration-150 pr-3 mr-2"
      >
        <BackArrowIcon /> Grids
      </button>

      {/* Grid name + unsaved badge */}
      <div className="flex items-center gap-2 pr-4 mr-1 border-r border-(--border-faint)">
        <span className="text-[15px] font-bold text-(--text-primary) tracking-tight font-['Bricolage_Grotesque',sans-serif]">
          {gridName}
        </span>
        {dirty && (
          <span className="text-[11px] font-medium text-(--text-muted) bg-white/5 px-2 py-0.5 rounded-full">
            unsaved
          </span>
        )}
      </div>

      {/* Tabs */}
      {TABS.map((tab) => {
        const isActive = tab.id === activeTab;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onTabChange(tab.id)}
            className={[
              'pt-6 pb-5 px-3 bg-transparent border-none relative transition-colors duration-150',
              isActive
                ? 'cursor-default text-[15px] font-semibold text-(--text-primary) after:absolute after:bottom-0 after:left-0 after:right-0 after:h-px after:bg-(--accent)'
                : 'cursor-pointer text-[14px] text-(--text-secondary) hover:text-(--text-primary)',
            ].join(' ')}
          >
            {tab.label}
          </button>
        );
      })}
    </div>

    {/* Right actions — only visible on editor tab */}
    {activeTab === 'editor' && (
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={canUndo ? onUndo : undefined}
          disabled={!canUndo}
          title="Undo (⌘Z)"
          className={[
            'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] font-medium border-none transition-colors duration-150',
            canUndo
              ? 'text-(--text-secondary) bg-transparent cursor-pointer hover:bg-white/5 hover:text-(--text-primary)'
              : 'text-(--text-muted) bg-transparent cursor-not-allowed opacity-40',
          ].join(' ')}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M2 5H8.5C10.43 5 12 6.57 12 8.5C12 10.43 10.43 12 8.5 12H4"
              stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
            <path d="M4.5 2.5L2 5L4.5 7.5"
              stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Undo
        </button>

        <button
          type="button"
          onClick={dirty && !saving ? onSave : undefined}
          disabled={!dirty || saving}
          className={[
            'flex items-center gap-2 px-4 py-1.5 rounded-lg text-[13px] border-none transition-colors duration-150',
            dirty && !saving
              ? 'text-(--accent) font-semibold cursor-pointer hover:bg-(--accent)/8 bg-transparent'
              : 'bg-(--bg-surface) text-(--text-muted) opacity-50 cursor-not-allowed font-medium',
          ].join(' ')}
        >
          {saving ? 'Saving…' : 'Save'}
        </button>
      </div>
    )}
  </div>
);
