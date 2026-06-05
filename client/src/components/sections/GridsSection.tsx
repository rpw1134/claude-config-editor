import { useEffect, useState } from 'react';
import { listGrids } from '../../lib/api';
import type { GridSummary } from '../../types/grids';
import { ForkIcon } from '../Icons';
import { ForkModal } from '../Modals/ForkModal';

interface GridCardProps {
  name: string;
  isSelected: boolean;
  onSelect: (name: string | null) => void;
  onFork: (name: string) => void;
}

const GridCard = ({ name, isSelected, onSelect, onFork }: GridCardProps) => (
  <div
    className={[
      'group relative w-full rounded-lg border transition-all duration-150',
      isSelected
        ? 'bg-white/6 border-white/14'
        : 'bg-white/2.5 border-white/7 hover:bg-white/4.5 hover:border-white/12',
    ].join(' ')}
  >
    <button
      onClick={() => onSelect(isSelected ? null : name)}
      className="w-full text-left px-4 py-2 bg-transparent border-none cursor-pointer"
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
            'text-[15px] font-semibold font-mono transition-colors leading-tight truncate pr-6',
            isSelected ? 'text-white/95' : 'text-white/70 group-hover:text-white/90',
          ].join(' ')}
        >
          {name}
        </span>
      </div>
    </button>
    <button
      onClick={(e) => { e.stopPropagation(); onFork(name); }}
      title="Fork to another project"
      className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-150 p-1 rounded text-white/40 hover:text-white/80 bg-transparent border-none cursor-pointer"
    >
      <ForkIcon />
    </button>
  </div>
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
  const [forkName, setForkName] = useState<string | null>(null);

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
              onFork={setForkName}
            />
          ))}
        </div>
      )}

      {forkName && (
        <ForkModal
          resourceType="grid"
          name={forkName}
          sourceProjectPath={projectPath}
          onClose={() => setForkName(null)}
          onSuccess={() => setForkName(null)}
        />
      )}
    </div>
  );
};
