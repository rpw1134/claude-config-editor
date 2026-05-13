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
  <svg width="11" height="11" viewBox="0 0 11 11" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M2 9L9 2M9 2H4.5M9 2V6.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

interface ProjectCardProps {
  project: Project;
}

const ProjectCard = ({ project }: ProjectCardProps) => {
  return (
    <button className="group w-full text-left px-4 py-3.5 rounded-md bg-white/[0.02] border border-white/[0.06] hover:bg-white/[0.045] hover:border-white/[0.1] transition-all duration-150 block">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-[13px] font-semibold text-white/80 group-hover:text-white/95 transition-colors">
              {project.name}
            </span>
            {project.isGlobal && (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-semibold uppercase tracking-wider bg-orange-500/15 text-orange-400/80 border border-orange-500/20">
                Global
              </span>
            )}
          </div>
          <p className="font-mono text-[11px] text-white/25 mb-2 truncate">{project.path}</p>
          <p className="text-[12px] text-white/40 leading-relaxed line-clamp-2">{project.description}</p>
        </div>
        <div className="shrink-0 flex flex-col items-end gap-2 pt-0.5">
          <span className="opacity-0 group-hover:opacity-100 transition-opacity text-white/30">
            <ExternalLinkIcon />
          </span>
          <div className="text-right">
            <p className="text-[11px] text-white/20 font-mono">{project.size}</p>
          </div>
        </div>
      </div>
      <div className="mt-3 pt-3 border-t border-white/[0.05] flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <div className="w-1 h-1 rounded-full bg-white/20" />
          <span className="text-[11px] text-white/25 font-mono">CLAUDE.md</span>
        </div>
        <span className="text-[11px] text-white/20">{project.lastModified}</span>
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
      <div className="space-y-2">
        {MOCK_PROJECTS.map((project) => (
          <ProjectCard key={project.id} project={project} />
        ))}
      </div>
    </div>
  );
};
