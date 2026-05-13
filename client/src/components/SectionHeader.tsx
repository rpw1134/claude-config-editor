interface SectionHeaderProps {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  count?: number;
}

const PlusIcon = () => (
  <svg width="11" height="11" viewBox="0 0 11 11" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M5.5 1.5V9.5M1.5 5.5H9.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

export const SectionHeader = ({
  title,
  description,
  actionLabel,
  onAction,
  count,
}: SectionHeaderProps) => {
  return (
    <div className="mb-8">
      <div className="flex items-start justify-between gap-4 mb-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <h1 className="text-[20px] font-bold text-white/95 tracking-tight leading-tight">{title}</h1>
          {count !== undefined && (
            <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full text-[11px] font-semibold font-mono bg-white/6 text-white/35 border border-white/8 tabular-nums">
              {count}
            </span>
          )}
        </div>
        {actionLabel && (
          <button
            onClick={onAction}
            className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[12px] font-medium bg-orange-500/12 text-orange-400 border border-orange-500/20 hover:bg-orange-500/20 hover:border-orange-500/35 hover:text-orange-300 transition-all duration-150"
          >
            <PlusIcon />
            {actionLabel}
          </button>
        )}
      </div>
      <p className="text-[12px] text-white/35 leading-[1.65] max-w-md">{description}</p>
    </div>
  );
};
