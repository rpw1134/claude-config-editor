interface PaginationProps {
  page: number;
  totalPages: number;
  onPage: (page: number) => void;
}

export const Pagination = ({ page, totalPages, onPage }: PaginationProps) => {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center gap-1 mt-4 px-1">
      <button
        onClick={() => onPage(page - 1)}
        disabled={page === 1}
        className="font-mono text-[12px] text-white/40 hover:text-white/70 disabled:opacity-30 disabled:cursor-not-allowed px-2 py-1 transition-colors"
        aria-label="Previous page"
      >
        ←
      </button>
      <span className="font-mono text-[12px] text-white/40 px-2">
        Page {page} of {totalPages}
      </span>
      <button
        onClick={() => onPage(page + 1)}
        disabled={page === totalPages}
        className="font-mono text-[12px] text-white/40 hover:text-white/70 disabled:opacity-30 disabled:cursor-not-allowed px-2 py-1 transition-colors"
        aria-label="Next page"
      >
        →
      </button>
    </div>
  );
};
