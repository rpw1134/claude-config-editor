import { useEffect, useState } from 'react';
import { fetchProjects } from '../../lib/api';
import type { ProjectInfo } from '../../lib/api';
import { SectionHeader } from '../SectionHeader';
import { Pagination } from '../Pagination';

const PAGE_SIZE = 10;

interface ProjectCardProps {
  project: ProjectInfo;
  isSelected: boolean;
  onSelect: (path: string | null) => void;
}

const ProjectCard = ({ project, isSelected, onSelect }: ProjectCardProps) => (
  <button
    onClick={() => onSelect(isSelected ? null : project.path)}
    className={[
      'group w-full text-left px-5 py-4 rounded-lg border transition-all duration-150 block',
      isSelected
        ? 'bg-white/6 border-white/14'
        : 'bg-white/2.5 border-white/7 hover:bg-white/4.5 hover:border-white/12',
    ].join(' ')}
  >
    <div className="min-w-0">
      <div className="flex items-center gap-2 mb-1.5">
        <span className={[
          'text-[14px] font-semibold leading-tight transition-colors',
          isSelected ? 'text-white/95' : 'text-white/85 group-hover:text-white',
        ].join(' ')}>
          {project.name}
        </span>
        {project.name === 'global' && (
          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-orange-500/15 text-orange-400/90 border border-orange-500/20">
            Global
          </span>
        )}
      </div>
      <p className="font-mono text-[11px] text-white/30 truncate">{project.path}</p>
    </div>
  </button>
);

interface ProjectsSectionProps {
  selectedPath: string | null;
  onSelect: (path: string | null) => void;
}

export const ProjectsSection = ({ selectedPath, onSelect }: ProjectsSectionProps) => {
  const [projects, setProjects] = useState<ProjectInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  useEffect(() => {
    fetchProjects()
      .then((data) => {
        setProjects(data);
        setPage(1);
        setLoading(false);
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : 'Failed to load projects');
        setLoading(false);
      });
  }, []);

  const totalPages = Math.ceil(projects.length / PAGE_SIZE);
  const pageItems = projects.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div>
      <SectionHeader
        title="Projects"
        description="CLAUDE.md files that shape Claude's behavior — global defaults and per-project overrides."
        count={projects.length}
      />

      {error && (
        <p className="text-[12px] text-rose-400/60 font-mono px-1">{error}</p>
      )}

      {!loading && !error && (
        <>
          <div className="space-y-2.5">
            {pageItems.map((project) => (
              <ProjectCard
                key={project.path}
                project={project}
                isSelected={selectedPath === project.path}
                onSelect={onSelect}
              />
            ))}
          </div>
          <Pagination page={page} totalPages={totalPages} onPage={setPage} />
        </>
      )}
    </div>
  );
};
