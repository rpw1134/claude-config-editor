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
    style={{
      width: '100%',
      display: 'flex',
      alignItems: 'center',
      padding: '0 4px 0 16px',
      minHeight: '64px',
      borderRadius: 0,
      border: 'none',
      borderBottom: isLast ? 'none' : '1px solid var(--border-faint)',
      textAlign: 'left',
      cursor: 'pointer',
      background: 'transparent',
      color: 'var(--text-secondary)',
      transition: 'background 120ms ease, color 120ms ease',
    }}
    onMouseEnter={(e) => {
      const el = e.currentTarget as HTMLButtonElement;
      el.style.background = 'var(--bg-hover)';
      el.style.color = 'var(--text-primary)';
    }}
    onMouseLeave={(e) => {
      const el = e.currentTarget as HTMLButtonElement;
      el.style.background = 'transparent';
      el.style.color = 'var(--text-secondary)';
    }}
  >
    <span style={{
      fontFamily: "'Instrument Sans', sans-serif",
      fontSize: '17px',
      fontWeight: 500,
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
    }}>
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
    <div style={{
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      minHeight: 0,
      overflowY: 'auto',
      background: 'var(--bg-base)',
    }}>
      <div style={{
        width: '100%',
        padding: '48px 56px',
      }}>

        {/* Heading row */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '32px',
        }}>
          <h1 style={{
            fontFamily: "'Bricolage Grotesque', sans-serif",
            fontSize: '40px',
            fontWeight: 700,
            color: 'var(--text-primary)',
            letterSpacing: '-0.03em',
            lineHeight: 1.05,
            margin: 0,
          }}>
            {title}
          </h1>

          <button
            onClick={onNew}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '7px',
              padding: '8px 16px',
              borderRadius: '8px',
              background: 'var(--accent)',
              color: 'white',
              fontSize: '14px',
              fontWeight: 500,
              border: 'none',
              cursor: 'pointer',
              flexShrink: 0,
              transition: 'background 150ms ease',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = 'var(--accent-hover)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = 'var(--accent)';
            }}
          >
            <PlusIcon />
            New {singularType}
          </button>
        </div>

        {/* Search bar */}
        <div style={{ position: 'relative', marginBottom: '24px' }}>
          <span style={{
            position: 'absolute',
            left: '14px',
            top: '50%',
            transform: 'translateY(-50%)',
            color: 'var(--text-muted)',
            display: 'flex',
            alignItems: 'center',
            pointerEvents: 'none',
          }}>
            <SearchIcon />
          </span>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={`Search ${title.toLowerCase()}...`}
            style={{
              width: '100%',
              height: '44px',
              paddingLeft: '40px',
              paddingRight: '14px',
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '10px',
              fontSize: '15px',
              color: 'var(--text-primary)',
              outline: 'none',
              boxSizing: 'border-box',
              transition: 'border-color 120ms ease',
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = 'var(--border-default)';
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = 'var(--border-subtle)';
            }}
          />
        </div>

        {/* Loading */}
        {loading && (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="shimmer"
                style={{
                  height: '64px',
                  borderBottom: i < 3 ? '1px solid var(--border-faint)' : 'none',
                  background: 'var(--bg-surface)',
                  animationDelay: `${(i - 1) * 0.15}s`,
                }}
              />
            ))}
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <div style={{
            padding: '12px 16px',
            borderRadius: '8px',
            background: 'rgba(248, 113, 113, 0.08)',
            border: '1px solid rgba(248, 113, 113, 0.2)',
            color: 'var(--error)',
            fontSize: '13px',
          }}>
            {error}
          </div>
        )}

        {/* Empty state — no items at all */}
        {!loading && !error && items.length === 0 && (
          <div style={{
            paddingTop: '64px',
            textAlign: 'center',
          }}>
            <p style={{
              fontSize: '15px',
              color: 'var(--text-muted)',
              margin: 0,
            }}>
              No {title.toLowerCase()} yet
            </p>
          </div>
        )}

        {/* Empty state — search has no results */}
        {!loading && !error && items.length > 0 && filtered.length === 0 && (
          <div style={{
            paddingTop: '64px',
            textAlign: 'center',
          }}>
            <p style={{
              fontSize: '15px',
              color: 'var(--text-muted)',
              margin: 0,
            }}>
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
