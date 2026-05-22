import { useEffect, useState } from 'react';
import { listGrids } from '../../lib/api';
import type { GridSummary } from '../../types/grids';

interface GridCardProps {
  name: string;
  isSelected: boolean;
  onSelect: (name: string | null) => void;
}

const GridCard = ({ name, isSelected, onSelect }: GridCardProps) => (
  <button
    onClick={() => onSelect(isSelected ? null : name)}
    className={[
      'group w-full text-left px-4 py-2 rounded-lg border transition-all duration-150 block',
      isSelected
        ? 'bg-white/6 border-white/14'
        : 'bg-white/2.5 border-white/7 hover:bg-white/4.5 hover:border-white/12',
    ].join(' ')}
  >
    <div className="flex items-center gap-3">
      <div
        className={[
          'w-1.5 h-1.5 rounded-full shrink-0 transition-colors',
          isSelected ? 'bg-(--accent)' : 'bg-white/20 group-hover:bg-white/35',
        ].join(' ')}
      />
      <span
        className={[
          'text-[15px] font-semibold font-mono transition-colors leading-tight truncate',
          isSelected ? 'text-white/95' : 'text-white/70 group-hover:text-white/90',
        ].join(' ')}
      >
        {name}
      </span>
    </div>
  </button>
);

interface GridsSectionProps {
  projectPath: string;
  selectedName: string | null;
  onSelect: (name: string | null) => void;
  onNew: () => void;
  refreshKey: number;
}

export const GridsSection = ({
  projectPath,
  selectedName,
  onSelect,
  onNew,
  refreshKey,
}: GridsSectionProps) => {
  const [grids, setGrids] = useState<GridSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    listGrids(projectPath)
      .then((data) => {
        if (cancelled) return;
        setGrids(data);
        setLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setGrids([]);
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [projectPath, refreshKey]);

  return (
    <div>
      <div className="flex items-center justify-between px-1 mb-2">
        <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-(--text-muted)">
          Grids {!loading && grids.length > 0 && <span className="text-[10px] opacity-60">({grids.length})</span>}
        </span>
        <button
          onClick={onNew}
          title="New Grid"
          className="text-[11px] font-medium text-(--text-muted) hover:text-(--accent) transition-colors duration-150 bg-transparent border-none cursor-pointer px-1 py-0.5 rounded"
        >
          + New
        </button>
      </div>
      {!loading && (
        <div className="space-y-1.5">
          {grids.map((g) => (
            <GridCard
              key={g.name}
              name={g.name}
              isSelected={selectedName === g.name}
              onSelect={onSelect}
            />
          ))}
        </div>
      )}
    </div>
  );
};
