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
    <div ref={containerRef} className="relative px-3 py-3 border-b border-white/6">
      <p className="px-2 mb-1.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-white/20">Project</p>
      <button
        onClick={() => setOpen((v) => !v)}
        className={[
          'w-full flex items-center justify-between gap-2 px-3 py-2 rounded-md transition-all duration-150',
          'text-left text-[12px]',
          open ? 'bg-white/8 text-white/80' : 'bg-white/4 text-white/50 hover:bg-white/6 hover:text-white/70',
        ].join(' ')}
        style={{ minHeight: '34px' }}
      >
        {loading ? (
          <span className="text-white/25 font-mono">Loading…</span>
        ) : selected ? (
          <span className="font-medium text-white/80 truncate">{selected.name}</span>
        ) : (
          <span className="text-white/30 italic">Select a project…</span>
        )}
        <span className={['shrink-0 transition-transform', open ? 'rotate-180' : ''].join(' ')}>
          <ChevronIcon />
        </span>
      </button>

      {open && (
        <div className="absolute left-3 right-3 top-full mt-1 z-50 rounded-md border border-white/10 bg-[#161618] shadow-xl overflow-hidden">
          <div className="max-h-[260px] overflow-y-auto">
            {projects.length === 0 ? (
              <p className="px-3 py-2.5 text-[12px] text-white/25 font-mono">No projects found</p>
            ) : (
              projects.map((project) => {
                const isActive = project.path === selectedPath;
                const isGlobal = project.name === 'global';
                return (
                  <button
                    key={project.path}
                    onClick={() => handleSelect(project)}
                    className={[
                      'w-full text-left px-3 py-2.5 flex items-start gap-2 transition-colors duration-100',
                      isActive ? 'bg-orange-500/12' : 'hover:bg-white/5',
                    ].join(' ')}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={[
                          'text-[12px] font-medium leading-tight',
                          isActive ? 'text-orange-300' : 'text-white/70',
                        ].join(' ')}>
                          {project.name}
                        </span>
                        {isGlobal && (
                          <span className="inline-flex items-center px-1 py-px rounded text-[9px] font-bold uppercase tracking-wider bg-orange-500/15 text-orange-400/80 border border-orange-500/20">
                            Global
                          </span>
                        )}
                      </div>
                      <p className="font-mono text-[10px] text-white/25 truncate mt-0.5">{project.path}</p>
                    </div>
                    {isActive && (
                      <span className="shrink-0 mt-1 w-1.5 h-1.5 rounded-full bg-orange-500" />
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
