import { useEffect, useState } from "react";
import { fetchMcpServers } from "../../lib/api";
import { SectionHeader } from "../Shared/SectionHeader";
import { Pagination } from "../Shared/Pagination";

const PAGE_SIZE = 10;

interface McpServersSectionProps {
  projectPath: string;
  selectedName: string | null;
  onSelect: (name: string) => void;
  onNew: () => void;
  refreshKey: number;
}

interface McpServerRowProps {
  name: string;
  selected: boolean;
  onClick: () => void;
}

const McpServerRow = ({ name, selected, onClick }: McpServerRowProps) => (
  <button
    onClick={onClick}
    className={[
      "w-full text-left group px-5 py-4 rounded-lg border transition-all duration-150",
      selected
        ? "bg-white/6 border-white/12"
        : "bg-white/2.5 border-white/7 hover:bg-white/4.5 hover:border-white/12",
    ].join(" ")}
  >
    <div className="flex items-center gap-3">
      <div
        className={[
          "shrink-0 w-1.5 h-1.5 rounded-full transition-colors",
          selected ? "bg-white/50" : "bg-white/20 group-hover:bg-white/35",
        ].join(" ")}
      />
      <span
        className={[
          "text-[14px] font-semibold font-mono leading-tight transition-colors",
          selected
            ? "text-white/90"
            : "text-white/70 group-hover:text-white/90",
        ].join(" ")}
      >
        {name}
      </span>
    </div>
  </button>
);

export const McpServersSection = ({
  projectPath,
  selectedName,
  onSelect,
  onNew,
  refreshKey,
}: McpServersSectionProps) => {
  const [servers, setServers] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  useEffect(() => {
    let cancelled = false;
    fetchMcpServers(projectPath)
      .then((data) => {
        if (cancelled) return;
        setServers(data);
        setPage(1);
        setError(null);
        setLoading(false);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(
          err instanceof Error ? err.message : "Failed to load MCP servers",
        );
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [projectPath, refreshKey]);

  const totalPages = Math.ceil(servers.length / PAGE_SIZE);
  const pageItems = servers.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div>
      <SectionHeader
        title="MCP Servers"
        description="Model Context Protocol servers configured in ~/.claude.json. Each server extends Claude's tool capabilities."
        actionLabel="Add Server"
        onAction={onNew}
        count={servers.length}
      />

      {error && (
        <p className="text-[12px] text-rose-400/60 font-mono px-1">{error}</p>
      )}

      {!loading && !error && (
        <>
          <div className="space-y-2.5">
            {pageItems.map((name) => (
              <McpServerRow
                key={name}
                name={name}
                selected={name === selectedName}
                onClick={() => onSelect(name)}
              />
            ))}
          </div>
          <Pagination page={page} totalPages={totalPages} onPage={setPage} />
        </>
      )}

      <p className="mt-5 px-1 text-[11px] text-white/20 font-mono">
        Source: ~/.claude.json → mcpServers
      </p>
    </div>
  );
};
