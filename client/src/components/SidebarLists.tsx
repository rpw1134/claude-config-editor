import { useEffect, useState } from 'react';
import { fetchAgents, fetchSkills, fetchMcpServers } from '../lib/api';

// ── Icons ────────────────────────────────────────────────────────────────────

const PlusIcon = () => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M6 1.5V10.5M1.5 6H10.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
  </svg>
);

// ── Generic section ───────────────────────────────────────────────────────────

interface SidebarListSectionProps {
  label: string;
  items: string[];
  selectedName: string | null;
  loading: boolean;
  error: string | null;
  emptyText: string;
  onSelect: (name: string) => void;
  onNew: () => void;
}

export const SidebarListSection = ({
  label,
  items,
  selectedName,
  loading,
  error,
  emptyText,
  onSelect,
  onNew,
}: SidebarListSectionProps) => (
  <div className="mb-1">
    {/* Section header */}
    <div className="flex items-center justify-between px-4 mb-0.5" style={{ minHeight: '28px' }}>
      <span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-white/20">
        {label}
      </span>
      <button
        onClick={onNew}
        className="text-white/20 hover:text-white/60 transition-colors rounded p-0.5 -mr-0.5"
        aria-label={`New ${label}`}
      >
        <PlusIcon />
      </button>
    </div>

    {/* Item list */}
    {loading && (
      <div className="px-4 py-1">
        <span className="text-[11px] text-white/15 font-mono">Loading…</span>
      </div>
    )}

    {error && !loading && (
      <div className="px-4 py-1">
        <span className="text-[11px] text-rose-400/50 font-mono">Error</span>
      </div>
    )}

    {!loading && !error && items.length === 0 && (
      <div className="px-4 py-1">
        <span className="text-[11px] text-white/15 font-mono italic">{emptyText}</span>
      </div>
    )}

    {!loading && !error && items.length > 0 && (
      <ul>
        {items.map((name) => {
          const isSelected = selectedName === name;
          return (
            <li key={name}>
              <button
                onClick={() => onSelect(name)}
                className={[
                  'w-full text-left px-4 py-0 flex items-center gap-2.5 transition-colors duration-100',
                  'text-[12px] font-mono truncate',
                  isSelected
                    ? 'text-orange-300 bg-orange-500/10'
                    : 'text-white/40 hover:text-white/75 hover:bg-white/5',
                ].join(' ')}
                style={{ minHeight: '28px' }}
                title={name}
              >
                <span
                  className={[
                    'shrink-0 w-1 h-1 rounded-full transition-colors',
                    isSelected ? 'bg-orange-400' : 'bg-white/15',
                  ].join(' ')}
                />
                <span className="truncate">{name}</span>
              </button>
            </li>
          );
        })}
      </ul>
    )}
  </div>
);

// ── Per-type lists ────────────────────────────────────────────────────────────

interface SidebarListProps {
  projectPath: string;
  selectedName: string | null;
  refreshKey: number;
  onSelect: (name: string) => void;
  onNew: () => void;
}

export const SidebarAgentsList = ({
  projectPath,
  selectedName,
  refreshKey,
  onSelect,
  onNew,
}: SidebarListProps) => {
  const [items, setItems] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchAgents(projectPath)
      .then((data) => {
        if (cancelled) return;
        setItems(data);
        setError(null);
        setLoading(false);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : 'Failed');
        setLoading(false);
      });
    return () => { cancelled = true; };
  }, [projectPath, refreshKey]);

  return (
    <SidebarListSection
      label="Agents"
      items={items}
      selectedName={selectedName}
      loading={loading}
      error={error}
      emptyText="none"
      onSelect={onSelect}
      onNew={onNew}
    />
  );
};

export const SidebarSkillsList = ({
  projectPath,
  selectedName,
  refreshKey,
  onSelect,
  onNew,
}: SidebarListProps) => {
  const [items, setItems] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchSkills(projectPath)
      .then((data) => {
        if (cancelled) return;
        setItems(data);
        setError(null);
        setLoading(false);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : 'Failed');
        setLoading(false);
      });
    return () => { cancelled = true; };
  }, [projectPath, refreshKey]);

  return (
    <SidebarListSection
      label="Skills"
      items={items}
      selectedName={selectedName}
      loading={loading}
      error={error}
      emptyText="none"
      onSelect={onSelect}
      onNew={onNew}
    />
  );
};

export const SidebarMcpList = ({
  projectPath,
  selectedName,
  refreshKey,
  onSelect,
  onNew,
}: SidebarListProps) => {
  const [items, setItems] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchMcpServers(projectPath)
      .then((data) => {
        if (cancelled) return;
        setItems(data);
        setError(null);
        setLoading(false);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : 'Failed');
        setLoading(false);
      });
    return () => { cancelled = true; };
  }, [projectPath, refreshKey]);

  return (
    <SidebarListSection
      label="MCP Servers"
      items={items}
      selectedName={selectedName}
      loading={loading}
      error={error}
      emptyText="none"
      onSelect={onSelect}
      onNew={onNew}
    />
  );
};
