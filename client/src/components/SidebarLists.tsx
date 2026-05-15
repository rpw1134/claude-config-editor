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
    <div className="flex items-center justify-between px-4 min-h-7">
      <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-(--text-muted)">
        {label}
      </span>
      <button
        onClick={onNew}
        className="text-(--text-muted) bg-transparent border-none cursor-pointer rounded p-0.5 flex items-center transition-colors duration-150 hover:text-(--text-secondary)"
        aria-label={`New ${label}`}
      >
        <PlusIcon />
      </button>
    </div>

    {/* Item list */}
    {loading && (
      <div className="px-4 py-1">
        <span className="text-[13px] text-(--text-muted)">Loading…</span>
      </div>
    )}

    {error && !loading && (
      <div className="px-4 py-1">
        <span className="text-[13px] text-(--error) opacity-70">Error</span>
      </div>
    )}

    {!loading && !error && items.length === 0 && (
      <div className="px-4 py-1">
        <span className="text-[13px] text-(--text-muted) italic">{emptyText}</span>
      </div>
    )}

    {!loading && !error && items.length > 0 && (
      <ul className="list-none m-0 p-0">
        {items.map((name) => {
          const isSelected = selectedName === name;
          return (
            <li key={name}>
              <button
                onClick={() => onSelect(name)}
                title={name}
                className={[
                  'w-full text-left px-4 flex items-center gap-2.5 min-h-7 border-none cursor-pointer',
                  'text-[13px] overflow-hidden transition-colors duration-100',
                  isSelected
                    ? 'bg-(--accent-dim) text-(--text-accent)'
                    : 'bg-transparent text-(--text-secondary) hover:bg-(--bg-hover) hover:text-(--text-primary)',
                ].join(' ')}
              >
                <span className={[
                  'shrink-0 w-1.25 h-1.25 rounded-full transition-colors duration-100',
                  isSelected ? 'bg-(--accent) opacity-100' : 'bg-(--text-muted) opacity-50',
                ].join(' ')} />
                <span className="overflow-hidden text-ellipsis whitespace-nowrap">{name}</span>
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
