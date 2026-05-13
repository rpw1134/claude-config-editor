interface SectionHeaderProps {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  count?: number;
}

export const SectionHeader = ({
  title,
  description,
  actionLabel,
  onAction,
  count,
}: SectionHeaderProps) => {
  return (
    <div className="flex items-start justify-between mb-6">
      <div>
        <div className="flex items-baseline gap-2.5">
          <h1 className="text-[15px] font-semibold text-white/90 tracking-tight">{title}</h1>
          {count !== undefined && (
            <span className="text-[11px] font-mono text-white/25">{count}</span>
          )}
        </div>
        <p className="mt-0.5 text-[12px] text-white/40 leading-relaxed max-w-md">{description}</p>
      </div>
      {actionLabel && (
        <button
          onClick={onAction}
          className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded text-[12px] font-medium bg-orange-500/[0.12] text-orange-400 border border-orange-500/20 hover:bg-orange-500/[0.18] hover:border-orange-500/30 transition-all duration-100"
        >
          <span className="text-[10px]">+</span>
          {actionLabel}
        </button>
      )}
    </div>
  );
};
