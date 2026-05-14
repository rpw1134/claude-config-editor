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
    <div ref={containerRef} className="relative p-3 border-b border-(--border-faint)">
      <p className="px-2 mb-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-(--text-muted)">
        Project
      </p>
      <button
        onClick={() => setOpen((v) => !v)}
        className={[
          'w-full flex items-center justify-between gap-2 px-3 py-2 rounded-md text-left text-[14px] min-h-9 cursor-pointer border border-(--border-subtle) transition-all duration-150',
          open
            ? 'bg-(--bg-elevated) text-(--text-primary)'
            : selected
            ? 'bg-(--bg-surface) text-(--text-secondary) hover:bg-(--bg-elevated) hover:text-(--text-secondary)'
            : 'bg-(--bg-surface) text-(--text-muted) hover:bg-(--bg-elevated) hover:text-(--text-secondary)',
        ].join(' ')}
      >
        {loading ? (
          <span className='font-["Fira_Code",monospace] text-(--text-muted) text-[13px]'>Loading…</span>
        ) : selected ? (
          <span className="font-medium overflow-hidden text-ellipsis whitespace-nowrap">{selected.name}</span>
        ) : (
          <span className="italic text-(--text-muted)">Select a project…</span>
        )}
        <span className={[
          'shrink-0 text-(--text-muted) transition-transform duration-150',
          open ? 'rotate-180' : '',
        ].join(' ')}>
          <ChevronIcon />
        </span>
      </button>

      {open && (
        <div
          className="absolute left-3 right-3 top-full mt-1 z-50 rounded-lg border border-(--border-default) bg-(--bg-elevated) overflow-hidden"
          style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.4)' }}
        >
          <div className="max-h-[260px] overflow-y-auto">
            {projects.length === 0 ? (
              <p className='px-3 py-2.5 text-[13px] text-(--text-muted) font-["Fira_Code",monospace]'>
                No projects found
              </p>
            ) : (
              projects.map((project) => {
                const isActive = project.path === selectedPath;
                const isGlobal = project.name === 'global';
                return (
                  <button
                    key={project.path}
                    onClick={() => handleSelect(project)}
                    className={[
                      'w-full text-left px-3 py-2.5 flex items-start gap-2 border-none cursor-pointer transition-colors duration-100',
                      isActive ? 'bg-(--accent-dim)' : 'bg-transparent hover:bg-(--bg-hover)',
                    ].join(' ')}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={[
                          'text-[14px] font-medium leading-tight',
                          isActive ? 'text-(--text-accent)' : 'text-(--text-primary)',
                        ].join(' ')}>
                          {project.name}
                        </span>
                        {isGlobal && (
                          <span className="inline-flex items-center px-[5px] py-px rounded text-[11px] font-semibold uppercase tracking-[0.05em] bg-(--bg-surface) text-(--text-muted) border border-(--border-subtle)">
                            Global
                          </span>
                        )}
                      </div>
                      <p className='font-["Fira_Code",monospace] text-[11px] text-(--text-muted) overflow-hidden text-ellipsis whitespace-nowrap mt-0.5'>
                        {project.path}
                      </p>
                    </div>
                    {isActive && (
                      <span className="shrink-0 mt-1 w-1.5 h-1.5 rounded-full bg-(--accent)" />
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
