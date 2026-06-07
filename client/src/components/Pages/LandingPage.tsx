import { useEffect, useState } from "react";
import { fetchSkills, fetchMcpServers, fetchAgentSummaries } from "../../lib/api";
import type { AgentSummary } from "../../lib/api";
import { useVersionControl } from "../../contexts/VersionControlContext";
import { ForkIcon } from "../Icons";
import { ForkModal } from "../Modals/ForkModal";
import { COLORS } from "../Agent/constants";

// ── Icons ─────────────────────────────────────────────────────────────────────

const AgentIcon = ({ size = 18 }: { size?: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 15 15"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <circle
      cx="7.5"
      cy="5"
      r="3"
      stroke="currentColor"
      strokeWidth="1.2"
      fill="none"
    />
    <path
      d="M2 13C2 10.24 4.46 8 7.5 8C10.54 8 13 10.24 13 13"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinecap="round"
      fill="none"
    />
  </svg>
);

const SkillIcon = ({ size = 18 }: { size?: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 15 15"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M7.5 1L9.18 5.27L13.5 5.64L10.35 8.38L11.35 12.59L7.5 10.2L3.65 12.59L4.65 8.38L1.5 5.64L5.82 5.27L7.5 1Z"
      stroke="currentColor"
      strokeWidth="1.2"
      fill="none"
      strokeLinejoin="round"
    />
  </svg>
);

const McpIcon = ({ size = 18 }: { size?: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 15 15"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect
      x="1"
      y="1"
      width="13"
      height="13"
      rx="2"
      stroke="currentColor"
      strokeWidth="1.2"
      fill="none"
    />
    <path
      d="M4 7.5H11M7.5 4V11"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinecap="round"
    />
  </svg>
);

const PlusIcon = () => (
  <svg
    width="13"
    height="13"
    viewBox="0 0 13 13"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M6.5 1.5V11.5M1.5 6.5H11.5"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </svg>
);

const SearchIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 16 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.3" />
    <path
      d="M10.5 10.5L13.5 13.5"
      stroke="currentColor"
      strokeWidth="1.3"
      strokeLinecap="round"
    />
  </svg>
);

// ── Types ─────────────────────────────────────────────────────────────────────

type LandingType = "agent" | "skill" | "mcp-server";

interface TypeLandingPageProps {
  type: LandingType;
  title: string;
  description: string;
  icon: React.ReactNode;
  projectPath: string;
  selectedName: string | null;
  refreshKey: number;
  onSelect: (name: string) => void;
  onNew: () => void;
}

// ── Item row ──────────────────────────────────────────────────────────────────

interface ItemRowProps {
  name: string;
  isLast: boolean;
  leading?: React.ReactNode;
  vcStatus?: "M" | "A" | "??" | null;
  onClick: () => void;
  onFork: (name: string) => void;
}

const ItemRow = ({ name, isLast, leading, vcStatus, onClick, onFork }: ItemRowProps) => (
  <div
    className={[
      "group relative w-full flex items-center pl-4 pr-1 min-h-18",
      "bg-transparent transition-colors duration-120 hover:bg-(--bg-hover)",
      !isLast ? "border-b border-(--border-faint)" : "",
    ].join(" ")}
  >
    {leading && <span className="shrink-0 mr-3 flex items-center">{leading}</span>}
    <button
      onClick={onClick}
      className="flex-1 min-w-0 text-left cursor-pointer bg-transparent border-none py-0 pl-0 pr-8"
    >
      <span className="font-['Instrument_Sans',sans-serif] text-[19px] font-medium text-(--text-primary) overflow-hidden text-ellipsis whitespace-nowrap flex-1 min-w-0 block">
        {name}
      </span>
    </button>
    {vcStatus && (
      <span
        className={[
          "shrink-0 mr-2 w-4 text-center text-[12px] font-bold font-mono",
          vcStatus === "M" ? "text-amber-400" : "text-emerald-400",
        ].join(" ")}
        title={vcStatus === "M" ? "Modified" : "Added"}
      >
        {vcStatus === "M" ? "M" : "A"}
      </span>
    )}
    <button
      onClick={(e) => { e.stopPropagation(); onFork(name); }}
      title="Fork to another project"
      className="opacity-0 group-hover:opacity-100 transition-opacity duration-150 p-2 rounded text-(--text-muted) hover:text-(--text-primary) bg-transparent border-none cursor-pointer shrink-0"
    >
      <ForkIcon />
    </button>
  </div>
);

// ── Generic landing page ──────────────────────────────────────────────────────

export const TypeLandingPage = (props: TypeLandingPageProps) => {
  const { type, title, projectPath, refreshKey, onSelect, onNew } = props;
  const { getItemStatus } = useVersionControl();
  const [items, setItems] = useState<string[]>([]);
  const [agentSummaries, setAgentSummaries] = useState<AgentSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSkeleton, setShowSkeleton] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [forkName, setForkName] = useState<string | null>(null);

  // Only show skeleton after 200ms to avoid flash on fast loads
  useEffect(() => {
    if (!loading) {
      setShowSkeleton(false);
      return;
    }
    const timer = setTimeout(() => setShowSkeleton(true), 200);
    return () => clearTimeout(timer);
  }, [loading]);

  useEffect(() => {
    let cancelled = false;

    if (type === "agent") {
      fetchAgentSummaries(projectPath)
        .then((data) => {
          if (cancelled) return;
          setAgentSummaries(data);
          setItems(data.map((s) => s.name));
          setError(null);
          setLoading(false);
        })
        .catch((err: unknown) => {
          if (cancelled) return;
          setError(err instanceof Error ? err.message : "Failed to load");
          setLoading(false);
        });
    } else {
      const fetcher = type === "skill" ? fetchSkills : fetchMcpServers;
      fetcher(projectPath)
        .then((data) => {
          if (cancelled) return;
          setItems(data);
          setError(null);
          setLoading(false);
        })
        .catch((err: unknown) => {
          if (cancelled) return;
          setError(err instanceof Error ? err.message : "Failed to load");
          setLoading(false);
        });
    }

    return () => {
      cancelled = true;
    };
  }, [projectPath, type, refreshKey]);

  const colorMap = new Map(agentSummaries.map((s) => [s.name, s.color]));

  const filtered = query.trim()
    ? items.filter((name) =>
        name.toLowerCase().includes(query.trim().toLowerCase()),
      )
    : items;

  // singular label for new button: strip trailing 's', handle 'MCP Servers' edge case
  const singularType =
    title === "MCP Servers" ? "MCP Server" : title.replace(/s$/, "");

  const resourceType =
    type === "agent" ? "agent" : type === "skill" ? "skill" : "mcp";

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-y-auto bg-(--bg-base)">
      <div className="w-full px-14 pt-16 pb-12">
        {/* Heading row */}
        <div className="flex items-center justify-between mb-10">
          <h1 className="font-['Bricolage_Grotesque',sans-serif] text-[40px] font-bold text-(--text-primary) tracking-[-0.03em] leading-[1.05] m-0">
            {title}
          </h1>

          <button
            onClick={onNew}
            className="flex items-center gap-1.75 px-4 py-2 rounded-lg border-none bg-white text-gray-900 text-[14px] font-semibold cursor-pointer shrink-0 transition-all duration-150 hover:bg-white/90"
          >
            <PlusIcon />
            New {singularType}
          </button>
        </div>

        {/* Search bar */}
        <div className="relative mb-6">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-(--text-muted) flex items-center pointer-events-none">
            <SearchIcon />
          </span>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={`Search ${title.toLowerCase()}...`}
            className="w-full h-11 pl-10 pr-3.5 bg-(--bg-surface) border border-(--border-subtle) rounded-2.5 text-[15px] text-(--text-primary) outline-none box-border transition-colors duration-120 focus:border-(--border-default)"
          />
        </div>

        {/* Loading */}
        {loading && showSkeleton && (
          <div className="flex flex-col">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className={[
                  "shimmer h-16 bg-(--bg-surface)",
                  i < 3 ? "border-b border-(--border-faint)" : "",
                ].join(" ")}
                style={{ animationDelay: `${(i - 1) * 0.15}s` }}
              />
            ))}
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <div className="px-4 py-3 rounded-lg bg-[rgba(248,113,113,0.08)] border border-[rgba(248,113,113,0.2)] text-(--error) text-[13px]">
            {error}
          </div>
        )}

        {/* Empty state — no items at all */}
        {!loading && !error && items.length === 0 && (
          <div className="pt-16 text-center">
            <p className="text-[15px] text-(--text-muted) m-0">
              No {title.toLowerCase()} yet
            </p>
          </div>
        )}

        {/* Empty state — search has no results */}
        {!loading && !error && items.length > 0 && filtered.length === 0 && (
          <div className="pt-16 text-center">
            <p className="text-[15px] text-(--text-muted) m-0">
              No results for "{query.trim()}"
            </p>
          </div>
        )}

        {/* List */}
        {!loading && !error && filtered.length > 0 && (
          <div>
            {filtered.map((name, idx) => {
              let leading: React.ReactNode;
              if (type === "agent") {
                const colorName = colorMap.get(name);
                const base = colorName
                  ? (COLORS.find((c) => c.name === colorName)?.bg ?? colorName)
                  : "#64748b";
                leading = (
                  <span style={{ color: `color-mix(in srgb, ${base} 80%, #94a3b8 20%)` }} className="flex items-center">
                    <AgentIcon size={18} />
                  </span>
                );
              }
              return (
              <ItemRow
                key={name}
                name={name}
                isLast={idx === filtered.length - 1}
                leading={leading}
                vcStatus={
                  type === "agent"
                    ? getItemStatus("agent", name)
                    : type === "skill"
                      ? getItemStatus("skill", name)
                      : null
                }
                onClick={() => onSelect(name)}
                onFork={setForkName}
              />
              );
            })}
          </div>
        )}
      </div>

      {forkName && (
        <ForkModal
          resourceType={resourceType}
          name={forkName}
          sourceProjectPath={projectPath}
          onClose={() => setForkName(null)}
          onSuccess={() => setForkName(null)}
        />
      )}
    </div>
  );
};

// ── Thin wrappers ─────────────────────────────────────────────────────────────

interface LandingPageWrapperProps {
  projectPath: string;
  selectedName: string | null;
  refreshKey: number;
  onSelect: (name: string) => void;
  onNew: () => void;
}

export const AgentsLandingPage = (props: LandingPageWrapperProps) => (
  <TypeLandingPage
    type="agent"
    title="Agents"
    description="Named sub-agents with specialized roles and model assignments."
    icon={<AgentIcon size={18} />}
    {...props}
  />
);

export const SkillsLandingPage = (props: LandingPageWrapperProps) => (
  <TypeLandingPage
    type="skill"
    title="Skills"
    description="Reusable instruction sets that activate on keywords or slash commands."
    icon={<SkillIcon size={18} />}
    {...props}
  />
);

export const McpLandingPage = (props: LandingPageWrapperProps) => (
  <TypeLandingPage
    type="mcp-server"
    title="MCP Servers"
    description="Model Context Protocol servers that extend Claude's tool capabilities."
    icon={<McpIcon size={18} />}
    {...props}
  />
);
