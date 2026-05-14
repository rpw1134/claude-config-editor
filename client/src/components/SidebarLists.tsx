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
  <div style={{ marginBottom: '4px' }}>
    {/* Section header */}
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 16px',
      minHeight: '28px',
    }}>
      <span style={{
        fontSize: '11px',
        fontWeight: 600,
        textTransform: 'uppercase',
        letterSpacing: '0.12em',
        color: 'var(--text-muted)',
      }}>
        {label}
      </span>
      <button
        onClick={onNew}
        style={{
          color: 'var(--text-muted)',
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          borderRadius: '4px',
          padding: '2px',
          display: 'flex',
          alignItems: 'center',
          transition: 'color 150ms ease',
        }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-secondary)'; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-muted)'; }}
        aria-label={`New ${label}`}
      >
        <PlusIcon />
      </button>
    </div>

    {/* Item list */}
    {loading && (
      <div style={{ padding: '4px 16px' }}>
        <span style={{
          fontSize: '13px',
          color: 'var(--text-muted)',
          fontFamily: 'Fira Code, monospace',
        }}>Loading…</span>
      </div>
    )}

    {error && !loading && (
      <div style={{ padding: '4px 16px' }}>
        <span style={{
          fontSize: '13px',
          color: 'var(--error)',
          fontFamily: 'Fira Code, monospace',
          opacity: 0.7,
        }}>Error</span>
      </div>
    )}

    {!loading && !error && items.length === 0 && (
      <div style={{ padding: '4px 16px' }}>
        <span style={{
          fontSize: '13px',
          color: 'var(--text-muted)',
          fontFamily: 'Fira Code, monospace',
          fontStyle: 'italic',
        }}>{emptyText}</span>
      </div>
    )}

    {!loading && !error && items.length > 0 && (
      <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
        {items.map((name) => {
          const isSelected = selectedName === name;
          return (
            <li key={name}>
              <button
                onClick={() => onSelect(name)}
                title={name}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  padding: '0 16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  minHeight: '28px',
                  background: isSelected ? 'var(--accent-dim)' : 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  color: isSelected ? 'var(--text-accent)' : 'var(--text-secondary)',
                  fontSize: '13px',
                  fontFamily: 'Fira Code, monospace',
                  overflow: 'hidden',
                  transition: 'background 100ms ease, color 100ms ease',
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) {
                    (e.currentTarget as HTMLButtonElement).style.background = 'var(--bg-hover)';
                    (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-primary)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) {
                    (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
                    (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-secondary)';
                  }
                }}
              >
                <span style={{
                  flexShrink: 0,
                  width: '5px',
                  height: '5px',
                  borderRadius: '50%',
                  background: isSelected ? 'var(--accent)' : 'var(--text-muted)',
                  opacity: isSelected ? 1 : 0.5,
                  transition: 'background 100ms ease',
                }} />
                <span style={{
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}>{name}</span>
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
