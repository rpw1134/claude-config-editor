import { useEffect, useState } from 'react';
import { fetchMcpServers } from '../../lib/api';
import { SectionHeader } from '../SectionHeader';

interface McpServerRowProps {
  name: string;
}

const McpServerRow = ({ name }: McpServerRowProps) => (
  <div className="group px-5 py-4 rounded-lg bg-white/2.5 border border-white/7 hover:bg-white/4.5 hover:border-white/12 transition-all duration-150">
    <div className="flex items-center gap-3">
      <div className="shrink-0 w-1.5 h-1.5 rounded-full bg-white/20 group-hover:bg-white/35 transition-colors" />
      <span className="text-[14px] font-semibold text-white/70 group-hover:text-white/90 transition-colors font-mono leading-tight">
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
        description="Model Context Protocol servers configured in ~/.claude.json. Each server extends Claude's tool capabilities."
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
        <div className="space-y-2.5">
          {servers.map((name) => (
            <McpServerRow key={name} name={name} />
          ))}
        </div>
      )}

      <p className="mt-5 px-1 text-[11px] text-white/20 font-mono">
        Source: ~/.claude.json → mcpServers
      </p>
    </div>
  );
};
