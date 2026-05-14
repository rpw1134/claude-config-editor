import { useEffect, useState } from 'react';
import { fetchAgents } from '../../lib/api';
import { SectionHeader } from '../SectionHeader';
import { Pagination } from '../Pagination';

const PAGE_SIZE = 10;

interface AgentCardProps {
  name: string;
  isSelected: boolean;
  onSelect: (name: string | null) => void;
}

const AgentCard = ({ name, isSelected, onSelect }: AgentCardProps) => (
  <button
    onClick={() => onSelect(isSelected ? null : name)}
    className={[
      'group w-full text-left px-5 py-4 rounded-lg border transition-all duration-150 block',
      isSelected
        ? 'bg-white/6 border-white/14'
        : 'bg-white/2.5 border-white/7 hover:bg-white/4.5 hover:border-white/12',
    ].join(' ')}
  >
    <div className="flex items-center gap-3">
      <div className={[
        'w-1.5 h-1.5 rounded-full shrink-0 transition-colors',
        isSelected ? 'bg-orange-400' : 'bg-white/20 group-hover:bg-white/35',
      ].join(' ')} />
      <span className={[
        'text-[14px] font-semibold font-mono transition-colors leading-tight',
        isSelected ? 'text-white/95' : 'text-white/70 group-hover:text-white/90',
      ].join(' ')}>
        {name}
      </span>
    </div>
  </button>
);

interface AgentsSectionProps {
  selectedName: string | null;
  onSelect: (name: string | null) => void;
  onNew: () => void;
  refreshKey: number;
}

export const AgentsSection = ({ selectedName, onSelect, onNew, refreshKey }: AgentsSectionProps) => {
  const [agents, setAgents] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  useEffect(() => {
    fetchAgents()
      .then((data) => {
        setAgents(data);
        setPage(1);
        setLoading(false);
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : 'Failed to load agents');
        setLoading(false);
      });
  }, [refreshKey]);

  const totalPages = Math.ceil(agents.length / PAGE_SIZE);
  const pageItems = agents.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div>
      <SectionHeader
        title="Agents"
        description="Named sub-agents with specialized roles and model assignments, stored as markdown files."
        actionLabel="New Agent"
        onAction={onNew}
        count={agents.length}
      />

      {loading && (
        <p className="text-[12px] text-white/25 font-mono px-1">Loading…</p>
      )}

      {error && (
        <p className="text-[12px] text-rose-400/60 font-mono px-1">{error}</p>
      )}

      {!loading && !error && (
        <>
          <div className="space-y-2.5">
            {pageItems.map((name) => (
              <AgentCard
                key={name}
                name={name}
                isSelected={selectedName === name}
                onSelect={onSelect}
              />
            ))}
          </div>
          <Pagination page={page} totalPages={totalPages} onPage={setPage} />
        </>
      )}
    </div>
  );
};
