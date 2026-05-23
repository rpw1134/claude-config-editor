import { BackArrowIcon } from '../../components/Icons';

interface GridTopBarProps {
  gridName: string;
  dirty: boolean;
  saving: boolean;
  canUndo: boolean;
  previewOpen: boolean;
  onBack: () => void;
  onSave: () => void;
  onUndo: () => void;
  onTogglePreview: () => void;
}

export const GridTopBar = ({
  gridName,
  dirty,
  saving,
  canUndo,
  previewOpen,
  onBack,
  onSave,
  onUndo,
  onTogglePreview,
}: GridTopBarProps) => (
  <div className="h-14 shrink-0 flex items-center gap-4 px-5 border-b border-(--border-faint) bg-(--bg-sidebar)">
    <button
      onClick={onBack}
      className="flex items-center gap-2 text-(--text-muted) hover:text-(--text-primary) transition-colors duration-150 bg-transparent border-none cursor-pointer text-[13px] font-medium py-1 px-2 rounded-lg hover:bg-white/5"
    >
      <BackArrowIcon />
      <span>Grids</span>
    </button>

    <div className="w-px h-5 bg-(--border-faint)" />

    <h1 className="text-[15px] font-bold text-(--text-primary) tracking-tight m-0 font-['Bricolage_Grotesque',sans-serif]">
      {gridName}
    </h1>

    {dirty && (
      <span className="text-[11px] font-medium text-(--text-muted) bg-white/5 px-2 py-0.5 rounded-full">
        unsaved
      </span>
    )}

    <div className="flex-1" />

    <button
      onClick={onTogglePreview}
      className={[
        'flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-[12px] font-semibold border transition-colors duration-150 cursor-pointer',
        previewOpen
          ? 'bg-(--accent)/12 border-(--accent)/30 text-(--accent)'
          : 'bg-transparent border-(--border-subtle) text-(--text-secondary) hover:text-(--text-primary) hover:border-(--border-default)',
      ].join(' ')}
    >
      <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
        <rect x="1" y="2" width="5" height="9" rx="1" stroke="currentColor" strokeWidth="1.2" />
        <rect x="7" y="2" width="5" height="9" rx="1" stroke="currentColor" strokeWidth="1.2" />
      </svg>
      Preview
    </button>

    <button
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
);
