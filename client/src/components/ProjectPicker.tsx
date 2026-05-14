import { useEffect, useRef, useState } from 'react';
import { fetchProjects } from '../lib/api';
import type { ProjectInfo } from '../lib/api';

interface ProjectPickerProps {
  selectedPath: string | null;
  onSelect: (path: string) => void;
}

const ChevronIcon = () => (
  <svg width="10" height="10" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M2 3.5L5 6.5L8 3.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const ProjectPicker = ({ selectedPath, onSelect }: ProjectPickerProps) => {
  const [projects, setProjects] = useState<ProjectInfo[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchProjects()
      .then((data) => {
        const global = data.filter((p) => p.name === 'global');
        const rest = data.filter((p) => p.name !== 'global').sort((a, b) => a.name.localeCompare(b.name));
        setProjects([...global, ...rest]);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const selected = projects.find((p) => p.path === selectedPath) ?? null;

  const handleSelect = (project: ProjectInfo) => {
    onSelect(project.path);
    setOpen(false);
  };

  return (
    <div ref={containerRef} style={{
      position: 'relative',
      padding: '12px 12px',
      borderBottom: '1px solid var(--border-faint)',
    }}>
      <p style={{
        padding: '0 8px',
        marginBottom: '6px',
        fontSize: '11px',
        fontWeight: 600,
        textTransform: 'uppercase',
        letterSpacing: '0.12em',
        color: 'var(--text-muted)',
      }}>Project</p>
      <button
        onClick={() => setOpen((v) => !v)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '8px',
          padding: '8px 12px',
          borderRadius: '6px',
          textAlign: 'left',
          fontSize: '14px',
          minHeight: '36px',
          cursor: 'pointer',
          border: '1px solid var(--border-subtle)',
          background: open ? 'var(--bg-elevated)' : 'var(--bg-surface)',
          color: open
            ? 'var(--text-primary)'
            : selected
            ? 'var(--text-secondary)'
            : 'var(--text-muted)',
          transition: 'all 150ms ease',
        }}
        onMouseEnter={(e) => {
          if (!open) {
            (e.currentTarget as HTMLButtonElement).style.background = 'var(--bg-elevated)';
            (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-secondary)';
          }
        }}
        onMouseLeave={(e) => {
          if (!open) {
            (e.currentTarget as HTMLButtonElement).style.background = 'var(--bg-surface)';
            (e.currentTarget as HTMLButtonElement).style.color = selected ? 'var(--text-secondary)' : 'var(--text-muted)';
          }
        }}
      >
        {loading ? (
          <span style={{ fontFamily: 'Fira Code, monospace', color: 'var(--text-muted)', fontSize: '13px' }}>Loading…</span>
        ) : selected ? (
          <span style={{ fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{selected.name}</span>
        ) : (
          <span style={{ fontStyle: 'italic', color: 'var(--text-muted)' }}>Select a project…</span>
        )}
        <span style={{
          flexShrink: 0,
          transform: open ? 'rotate(180deg)' : 'none',
          transition: 'transform 150ms ease',
          color: 'var(--text-muted)',
        }}>
          <ChevronIcon />
        </span>
      </button>

      {open && (
        <div style={{
          position: 'absolute',
          left: '12px',
          right: '12px',
          top: '100%',
          marginTop: '4px',
          zIndex: 50,
          borderRadius: '8px',
          border: '1px solid var(--border-default)',
          background: 'var(--bg-elevated)',
          boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
          overflow: 'hidden',
        }}>
          <div style={{ maxHeight: '260px', overflowY: 'auto' }}>
            {projects.length === 0 ? (
              <p style={{
                padding: '10px 12px',
                fontSize: '13px',
                color: 'var(--text-muted)',
                fontFamily: 'Fira Code, monospace',
              }}>No projects found</p>
            ) : (
              projects.map((project) => {
                const isActive = project.path === selectedPath;
                const isGlobal = project.name === 'global';
                return (
                  <button
                    key={project.path}
                    onClick={() => handleSelect(project)}
                    style={{
                      width: '100%',
                      textAlign: 'left',
                      padding: '10px 12px',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '8px',
                      background: isActive ? 'var(--accent-dim)' : 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      transition: 'background 100ms ease',
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) (e.currentTarget as HTMLButtonElement).style.background = 'var(--bg-hover)';
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{
                          fontSize: '14px',
                          fontWeight: 500,
                          lineHeight: 1.3,
                          color: isActive ? 'var(--text-accent)' : 'var(--text-primary)',
                        }}>
                          {project.name}
                        </span>
                        {isGlobal && (
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            padding: '1px 5px',
                            borderRadius: '4px',
                            fontSize: '11px',
                            fontWeight: 600,
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                            background: 'var(--bg-surface)',
                            color: 'var(--text-muted)',
                            border: '1px solid var(--border-subtle)',
                          }}>
                            Global
                          </span>
                        )}
                      </div>
                      <p style={{
                        fontFamily: 'Fira Code, monospace',
                        fontSize: '11px',
                        color: 'var(--text-muted)',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        marginTop: '2px',
                      }}>{project.path}</p>
                    </div>
                    {isActive && (
                      <span style={{
                        flexShrink: 0,
                        marginTop: '4px',
                        width: '6px',
                        height: '6px',
                        borderRadius: '50%',
                        background: 'var(--accent)',
                      }} />
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};
