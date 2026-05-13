import { SectionHeader } from '../SectionHeader';

interface Project {
  id: string;
  name: string;
  path: string;
  description: string;
  lastModified: string;
  isGlobal: boolean;
  size: string;
}

const MOCK_PROJECTS: Project[] = [
  {
    id: '1',
    name: 'Global',
    path: '~/.claude/CLAUDE.md',
    description:
      'Personal defaults for Claude Code. Hard rules, verification steps, communication baseline, and agent routing preferences applied across all projects.',
    lastModified: '2 hours ago',
    isGlobal: true,
    size: '1.4 KB',
  },
  {
    id: '2',
    name: 'claude-config-editor',
    path: '~/Projects/claude-config-editor/CLAUDE.md',
    description:
      'Claude Config Studio — local tool for managing Claude Code configuration files. Phase 1 web app scope, stack decisions, and working agreement.',
    lastModified: '1 day ago',
    isGlobal: false,
    size: '2.1 KB',
  },
  {
    id: '3',
    name: 'api-gateway',
    path: '~/Projects/api-gateway/CLAUDE.md',
    description:
      'Internal API gateway service. Go + Postgres. Migration safety rules, deployment checklist, and module boundaries for the auth subsystem.',
    lastModified: '5 days ago',
    isGlobal: false,
    size: '986 B',
  },
  {
    id: '4',
    name: 'design-system',
    path: '~/Projects/design-system/CLAUDE.md',
    description:
      'Shared component library. Token-first design rules, Storybook conventions, and accessibility requirements. Chromatic visual regression is mandatory.',
    lastModified: '12 days ago',
    isGlobal: false,
    size: '743 B',
  },
];

const ExternalLinkIcon = () => (
  <svg width="12" height="12" viewBox="0 0 11 11" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M2 9L9 2M9 2H4.5M9 2V6.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

interface ProjectCardProps {
  project: Project;
}

const ProjectCard = ({ project }: ProjectCardProps) => {
  return (
    <button className="group w-full text-left px-5 py-4 rounded-lg bg-white/2.5 border border-white/7 hover:bg-white/4.5 hover:border-white/12 transition-all duration-150 block">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          {/* Name row */}
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[14px] font-semibold text-white/85 group-hover:text-white transition-colors leading-tight">
              {project.name}
            </span>
            {project.isGlobal && (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-orange-500/15 text-orange-400/90 border border-orange-500/20">
                Global
              </span>
            )}
            <span className="ml-auto text-[11px] text-white/20 font-mono shrink-0">{project.lastModified}</span>
          </div>
          {/* Path */}
          <p className="font-mono text-[11px] text-white/25 mb-2.5 truncate">{project.path}</p>
          {/* Description */}
          <p className="text-[12px] text-white/40 leading-[1.6] line-clamp-2">{project.description}</p>
        </div>
        <div className="shrink-0 flex flex-col items-end gap-3 pt-0.5">
          <span className="opacity-0 group-hover:opacity-100 transition-opacity text-white/35">
            <ExternalLinkIcon />
          </span>
          <span className="text-[11px] text-white/20 font-mono">{project.size}</span>
        </div>
      </div>
    </button>
  );
};

export const ProjectsSection = () => {
  return (
    <div>
      <SectionHeader
        title="Projects"
        description="CLAUDE.md files that shape Claude's behavior — global defaults and per-project overrides."
        actionLabel="Add Project"
        count={MOCK_PROJECTS.length}
      />
      <div className="space-y-2.5">
        {MOCK_PROJECTS.map((project) => (
          <ProjectCard key={project.id} project={project} />
        ))}
      </div>
    </div>
  );
};
