import { useEffect, useState } from 'react';
import { fetchAgents, fetchSkills, fetchMcpServers } from '../lib/api';

// ── Icons ─────────────────────────────────────────────────────────────────────

const AgentIcon = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="7.5" cy="5" r="3" stroke="currentColor" strokeWidth="1.2" fill="none"/>
    <path d="M2 13C2 10.24 4.46 8 7.5 8C10.54 8 13 10.24 13 13" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" fill="none"/>
  </svg>
);

const SkillIcon = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M7.5 1L9.18 5.27L13.5 5.64L10.35 8.38L11.35 12.59L7.5 10.2L3.65 12.59L4.65 8.38L1.5 5.64L5.82 5.27L7.5 1Z" stroke="currentColor" strokeWidth="1.2" fill="none" strokeLinejoin="round"/>
  </svg>
);

const McpIcon = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="1" y="1" width="13" height="13" rx="2" stroke="currentColor" strokeWidth="1.2" fill="none"/>
    <path d="M4 7.5H11M7.5 4V11" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
  </svg>
);

const PlusIcon = () => (
  <svg width="13" height="13" viewBox="0 0 13 13" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M6.5 1.5V11.5M1.5 6.5H11.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

const SearchIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.3"/>
    <path d="M10.5 10.5L13.5 13.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
  </svg>
);

// ── Types ─────────────────────────────────────────────────────────────────────

type LandingType = 'agent' | 'skill' | 'mcp-server';

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
  onClick: () => void;
}

const ItemRow = ({ name, isLast, onClick }: ItemRowProps) => (
  <button
    onClick={onClick}
    className={[
      'w-full flex items-center pl-4 pr-1 min-h-[64px] text-left cursor-pointer',
      'bg-transparent text-[var(--text-secondary)] transition-colors duration-[120ms]',
      'border-none hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]',
      !isLast ? 'border-b border-[var(--border-faint)]' : '',
    ].join(' ')}
  >
    <span className="font-['Instrument_Sans',sans-serif] text-[17px] font-medium overflow-hidden text-ellipsis whitespace-nowrap">
      {name}
    </span>
  </button>
);

// ── Generic landing page ──────────────────────────────────────────────────────

export const TypeLandingPage = (props: TypeLandingPageProps) => {
  const { type, title, projectPath, refreshKey, onSelect, onNew } = props;
  const [items, setItems] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');

  useEffect(() => {
    let cancelled = false;

    const fetcher =
      type === 'agent'
        ? fetchAgents
        : type === 'skill'
        ? fetchSkills
        : fetchMcpServers;

    fetcher(projectPath)
      .then((data) => {
        if (cancelled) return;
        setItems(data);
        setError(null);
        setLoading(false);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : 'Failed to load');
        setLoading(false);
      });

    return () => { cancelled = true; };
  }, [projectPath, type, refreshKey]);

  const filtered = query.trim()
    ? items.filter((name) => name.toLowerCase().includes(query.trim().toLowerCase()))
    : items;

  // singular label for new button: strip trailing 's', handle 'MCP Servers' edge case
  const singularType = title === 'MCP Servers' ? 'MCP Server' : title.replace(/s$/, '');

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-y-auto bg-[var(--bg-base)]">
      <div className="w-full px-14 py-12">

        {/* Heading row */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="font-['Bricolage_Grotesque',sans-serif] text-[40px] font-bold text-[var(--text-primary)] tracking-[-0.03em] leading-[1.05] m-0">
            {title}
          </h1>

          <button
            onClick={onNew}
            className="flex items-center gap-[7px] px-4 py-2 rounded-lg bg-[var(--accent)] text-white text-[14px] font-medium border-none cursor-pointer shrink-0 transition-colors duration-150 hover:bg-[var(--accent-hover)]"
          >
            <PlusIcon />
            New {singularType}
          </button>
        </div>

        {/* Search bar */}
        <div className="relative mb-6">
          <span
            className="absolute left-[14px] top-1/2 text-[var(--text-muted)] flex items-center pointer-events-none"
            style={{ transform: 'translateY(-50%)' }}
          >
            <SearchIcon />
          </span>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={`Search ${title.toLowerCase()}...`}
            className="w-full h-11 pl-10 pr-[14px] bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-[10px] text-[15px] text-[var(--text-primary)] outline-none box-border transition-colors duration-[120ms] focus:border-[var(--border-default)]"
          />
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex flex-col">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="shimmer h-16 bg-[var(--bg-surface)]"
                style={{
                  borderBottom: i < 3 ? '1px solid var(--border-faint)' : 'none',
                  animationDelay: `${(i - 1) * 0.15}s`,
                }}
              />
            ))}
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <div className="px-4 py-3 rounded-lg bg-[rgba(248,113,113,0.08)] border border-[rgba(248,113,113,0.2)] text-[var(--error)] text-[13px]">
            {error}
          </div>
        )}

        {/* Empty state — no items at all */}
        {!loading && !error && items.length === 0 && (
          <div className="pt-16 text-center">
            <p className="text-[15px] text-[var(--text-muted)] m-0">
              No {title.toLowerCase()} yet
            </p>
          </div>
        )}

        {/* Empty state — search has no results */}
        {!loading && !error && items.length > 0 && filtered.length === 0 && (
          <div className="pt-16 text-center">
            <p className="text-[15px] text-[var(--text-muted)] m-0">
              No results for "{query.trim()}"
            </p>
          </div>
        )}

        {/* List */}
        {!loading && !error && filtered.length > 0 && (
          <div>
            {filtered.map((name, idx) => (
              <ItemRow
                key={name}
                name={name}
                isLast={idx === filtered.length - 1}
                onClick={() => onSelect(name)}
              />
            ))}
          </div>
        )}
      </div>
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
