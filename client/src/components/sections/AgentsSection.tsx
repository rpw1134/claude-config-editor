import { useEffect, useState } from "react";
import { fetchAgentSummaries } from "../../lib/api";
import type { AgentSummary } from "../../lib/api";
import { SectionHeader } from "../Shared/SectionHeader";
import { Pagination } from "../Shared/Pagination";
import { useVersionControl } from "../../contexts/VersionControlContext";
import { ForkIcon } from "../Icons";
import { ForkModal } from "../Modals/ForkModal";

const PAGE_SIZE = 10;

interface AgentCardProps {
  name: string;
  color?: string;
  isSelected: boolean;
  onSelect: (name: string | null) => void;
  onFork: (name: string) => void;
  vcStatus?: "M" | "A" | "??" | null;
}

const AgentCard = ({ name, color, isSelected, onSelect, onFork, vcStatus }: AgentCardProps) => {
  const dotStyle = color ? { backgroundColor: color } : undefined;
  const dotClass = color
    ? "w-1.5 h-1.5 rounded-full shrink-0"
    : [
        "w-1.5 h-1.5 rounded-full shrink-0 transition-colors",
        isSelected ? "bg-orange-400" : "bg-white/20 group-hover:bg-white/35",
      ].join(" ");

  return (
    <div
      className={[
        "group relative w-full rounded-lg border transition-all duration-150",
        isSelected
          ? "bg-white/6 border-white/14"
          : "bg-white/2.5 border-white/7 hover:bg-white/4.5 hover:border-white/12",
      ].join(" ")}
    >
      <button
        onClick={() => onSelect(isSelected ? null : name)}
        className="w-full text-left px-4 py-2 bg-transparent border-none cursor-pointer"
      >
        <div className="flex items-center gap-3">
          <div className={dotClass} style={dotStyle} />
          <div className="flex items-center gap-1.5 min-w-0 pr-6">
            <span
              className={[
                "text-[15px] font-semibold font-mono transition-colors leading-tight truncate",
                isSelected ? "text-white/95" : "text-white/70 group-hover:text-white/90",
              ].join(" ")}
            >
              {name}
            </span>
            {vcStatus && (
              <span
                className={[
                  "w-1.5 h-1.5 rounded-full shrink-0 flex-none",
                  vcStatus === "M" ? "bg-amber-400" : "bg-emerald-400",
                ].join(" ")}
              />
            )}
          </div>
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
};

interface AgentsSectionProps {
  projectPath: string;
  selectedName: string | null;
  onSelect: (name: string | null) => void;
  onNew: () => void;
  refreshKey: number;
}

export const AgentsSection = ({
  projectPath,
  selectedName,
  onSelect,
  onNew,
  refreshKey,
}: AgentsSectionProps) => {
  const { getItemStatus } = useVersionControl();
  const [summaries, setSummaries] = useState<AgentSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [forkName, setForkName] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchAgentSummaries(projectPath)
      .then((data) => {
        if (cancelled) return;
        setSummaries(data);
        setPage(1);
        setError(null);
        setLoading(false);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Failed to load agents");
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [projectPath, refreshKey]);

  const totalPages = Math.ceil(summaries.length / PAGE_SIZE);
  const pageItems = summaries.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div>
      <SectionHeader
        title="Agents"
        description="Named sub-agents with specialized roles and model assignments, stored as markdown files."
        actionLabel="New Agent"
        onAction={onNew}
        count={summaries.length}
      />

      {error && (
        <p className="text-[12px] text-rose-400/60 font-mono px-1">{error}</p>
      )}

      {!loading && !error && (
        <>
          <div className="space-y-2.5">
            {pageItems.map(({ name, color }) => (
              <AgentCard
                key={name}
                name={name}
                color={color}
                isSelected={selectedName === name}
                onSelect={onSelect}
                onFork={setForkName}
                vcStatus={getItemStatus("agent", name)}
              />
            ))}
          </div>
          <Pagination page={page} totalPages={totalPages} onPage={setPage} />
        </>
      )}

      {forkName && (
        <ForkModal
          resourceType="agent"
          name={forkName}
          sourceProjectPath={projectPath}
          onClose={() => setForkName(null)}
          onSuccess={() => setForkName(null)}
        />
      )}
    </div>
  );
};
