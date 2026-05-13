import { useEffect, useState } from 'react';
import { fetchMcpServers } from '../../lib/api';
import { SectionHeader } from '../SectionHeader';

interface McpServerRowProps {
  name: string;
}

const McpServerRow = ({ name }: McpServerRowProps) => (
  <div className="group px-4 py-3 rounded-md bg-white/2 border border-white/6 hover:bg-white/4 hover:border-white/9 transition-all duration-150">
    <div className="flex items-center gap-3">
      <div className="shrink-0 w-1.5 h-1.5 rounded-full bg-zinc-600" />
      <span className="text-[13px] font-semibold text-white/80 group-hover:text-white/90 transition-colors font-mono">
        {name}
      </span>
    </div>
  </div>
);

export const McpServersSection = () => {
  const [servers, setServers] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchMcpServers()
      .then((data) => {
        setServers(data);
        setLoading(false);
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : 'Failed to load MCP servers');
        setLoading(false);
      });
  }, []);

  return (
    <div>
      <SectionHeader
        title="MCP Servers"
        description="Model Context Protocol servers configured in settings.json. Each server extends Claude's tool capabilities."
        actionLabel="Add Server"
        count={servers.length}
      />

      {loading && (
        <p className="text-[12px] text-white/25 font-mono px-1">Loading…</p>
      )}

      {error && (
        <p className="text-[12px] text-rose-400/60 font-mono px-1">{error}</p>
      )}

      {!loading && !error && (
        <div className="space-y-1.5">
          {servers.map((name) => (
            <McpServerRow key={name} name={name} />
          ))}
        </div>
      )}

      <p className="mt-4 px-1 text-[11px] text-white/20 font-mono">
        Source: ~/.claude/settings.json → mcpServers
      </p>
    </div>
  );
};
