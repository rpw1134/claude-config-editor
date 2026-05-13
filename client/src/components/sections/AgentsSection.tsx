import { useEffect, useState } from 'react';
import { fetchAgents } from '../../lib/api';
import { SectionHeader } from '../SectionHeader';

interface AgentCardProps {
  name: string;
}

const AgentCard = ({ name }: AgentCardProps) => (
  <button className="group w-full text-left px-4 py-3.5 rounded-md bg-white/2 border border-white/6 hover:bg-white/4.5 hover:border-white/10 transition-all duration-150 block">
    <span className="text-[13px] font-semibold text-white/80 group-hover:text-white/95 transition-colors font-mono">
      {name}
    </span>
  </button>
);

export const AgentsSection = () => {
  const [agents, setAgents] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAgents()
      .then((data) => {
        setAgents(data);
        setLoading(false);
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : 'Failed to load agents');
        setLoading(false);
      });
  }, []);

  return (
    <div>
      <SectionHeader
        title="Agents"
        description="Named sub-agents with specialized roles and model assignments, stored as markdown files."
        actionLabel="New Agent"
        count={agents.length}
      />

      {loading && (
        <p className="text-[12px] text-white/25 font-mono px-1">Loading…</p>
      )}

      {error && (
        <p className="text-[12px] text-rose-400/60 font-mono px-1">{error}</p>
      )}

      {!loading && !error && (
        <div className="space-y-2">
          {agents.map((name) => (
            <AgentCard key={name} name={name} />
          ))}
        </div>
      )}
    </div>
  );
};
