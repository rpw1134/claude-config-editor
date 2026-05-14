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

const ChevronRightIcon = () => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M4.5 2L8 6L4.5 10" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
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
  isSelected: boolean;
  typeIcon: React.ReactNode;
  onClick: () => void;
}

const ItemRow = ({ name, isSelected, typeIcon, onClick }: ItemRowProps) => (
  <button
    onClick={onClick}
    className={[
      'group w-full flex items-center gap-3 px-4 py-3 rounded-lg border text-left transition-all duration-150',
      isSelected
        ? 'bg-orange-500/10 border-orange-500/25 text-orange-300'
        : 'bg-white/[0.02] border-white/6 text-white/65 hover:bg-white/[0.04] hover:border-white/10 hover:text-white/90',
    ].join(' ')}
  >
    <span className={[
      'shrink-0 transition-colors',
      isSelected ? 'text-orange-400' : 'text-white/25 group-hover:text-white/45',
    ].join(' ')}>
      {typeIcon}
    </span>
    <span className="flex-1 font-mono text-[13px] truncate">{name}</span>
    <span className={[
      'shrink-0 transition-colors',
      isSelected ? 'text-orange-400/70' : 'text-white/15 group-hover:text-white/35',
    ].join(' ')}>
      <ChevronRightIcon />
    </span>
  </button>
);

// ── Generic landing page ──────────────────────────────────────────────────────

export const TypeLandingPage = ({
  type,
  title,
  description,
  icon,
  projectPath,
  selectedName,
  refreshKey,
  onSelect,
  onNew,
}: TypeLandingPageProps) => {
  const [items, setItems] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

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
        setLoading(false);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : 'Failed to load');
        setLoading(false);
      });

    return () => { cancelled = true; };
  }, [projectPath, type, refreshKey]);

  const smallIcon = type === 'agent'
    ? <AgentIcon size={14} />
    : type === 'skill'
    ? <SkillIcon size={14} />
    : <McpIcon size={14} />;

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-y-auto">
      <div className="w-full max-w-2xl mx-auto px-8 py-10">
        {/* Page header */}
        <div className="flex items-start justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-white/[0.04] border border-white/8 flex items-center justify-center text-white/40 shrink-0">
              {icon}
            </div>
            <div>
              <h1 className="text-[20px] font-semibold text-white/90 tracking-tight leading-tight">
                {title}
              </h1>
              <p className="mt-0.5 text-[12px] text-white/35 leading-snug">{description}</p>
            </div>
          </div>

          <button
            onClick={onNew}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-orange-500 text-white text-[13px] font-semibold hover:bg-orange-400 transition-colors shadow-[0_0_16px_rgba(249,115,22,0.25)] shrink-0 ml-4"
          >
            <PlusIcon />
            New {title.replace(/s$/, '')}
          </button>
        </div>

        {/* Divider */}
        <div className="border-t border-white/6 mb-6" />

        {/* Item count label */}
        {!loading && !error && items.length > 0 && (
          <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-white/20 mb-3">
            {items.length} {items.length === 1 ? title.replace(/s$/, '') : title}
          </p>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex flex-col gap-2">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-12 rounded-lg bg-white/[0.025] border border-white/6 animate-pulse"
                style={{ opacity: 1 - i * 0.2 }}
              />
            ))}
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <div className="px-4 py-3 rounded-lg bg-rose-500/8 border border-rose-500/15 text-rose-400 text-[12px] font-mono">
            {error}
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && items.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-12 h-12 rounded-xl bg-white/[0.03] border border-white/6 flex items-center justify-center text-white/20 mb-4">
              {icon}
            </div>
            <p className="text-[13px] text-white/35 leading-snug">
              No {title.toLowerCase()} yet
            </p>
            <p className="mt-1 text-[12px] text-white/20">
              Create one to get started
            </p>
            <button
              onClick={onNew}
              className="mt-5 flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 border border-white/8 text-white/50 hover:text-white/80 hover:bg-white/8 text-[12px] font-medium transition-all duration-150"
            >
              <PlusIcon />
              New {title.replace(/s$/, '')}
            </button>
          </div>
        )}

        {/* List */}
        {!loading && !error && items.length > 0 && (
          <div className="flex flex-col gap-1.5">
            {items.map((name) => (
              <ItemRow
                key={name}
                name={name}
                isSelected={selectedName === name}
                typeIcon={smallIcon}
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
