import { BackArrowIcon } from '../../components/Icons';

interface GridTopBarProps {
  gridName: string;
  dirty: boolean;
  saving: boolean;
  previewOpen: boolean;
  onBack: () => void;
  onSave: () => void;
  onTogglePreview: () => void;
}

export const GridTopBar = ({
  gridName,
  dirty,
  saving,
  previewOpen,
  onBack,
  onSave,
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
      onClick={onSave}
      disabled={saving}
      className="flex items-center gap-2 px-4 py-1.5 rounded-lg text-[13px] font-semibold bg-(--accent) text-(--bg-base) border-none cursor-pointer hover:bg-(--accent-hover) transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {saving ? 'Saving…' : 'Save'}
    </button>
  </div>
);
