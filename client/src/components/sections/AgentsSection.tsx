import { SectionHeader } from '../SectionHeader';

interface Agent {
  id: string;
  name: string;
  path: string;
  description: string;
  model: string;
  lastModified: string;
}

const MOCK_AGENTS: Agent[] = [
  {
    id: '1',
    name: 'code-reviewer',
    path: '~/.claude/agents/code-reviewer.md',
    description:
      'Performs thorough pull request reviews: checks for logic errors, naming conventions, test coverage gaps, and security anti-patterns. Returns structured feedback with severity levels.',
    model: 'claude-opus-4-5',
    lastModified: '3 days ago',
  },
  {
    id: '2',
    name: 'tutor',
    path: '~/.claude/agents/tutor.md',
    description:
      'Teaching-focused agent for learning new concepts. Explains the "why" before the "how", uses concrete analogies, and checks for understanding before moving on.',
    model: 'claude-sonnet-4-5',
    lastModified: '1 week ago',
  },
  {
    id: '3',
    name: 'auditor',
    path: '~/.claude/agents/auditor.md',
    description:
      'Security-focused agent for threat modeling, vulnerability assessment, and reviewing changes for injection risks, auth flaws, and supply chain issues.',
    model: 'claude-opus-4-5',
    lastModified: '2 weeks ago',
  },
  {
    id: '4',
    name: 'docs-writer',
    path: '~/.claude/agents/docs-writer.md',
    description:
      'Generates and maintains documentation: READMEs, inline JSDoc, API references, and changelogs. Adapts tone to audience — internal vs. public-facing.',
    model: 'claude-haiku-4-5',
    lastModified: '3 weeks ago',
  },
];

const MODEL_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  'claude-opus-4-5': {
    bg: 'bg-violet-500/10',
    text: 'text-violet-400',
    border: 'border-violet-500/20',
  },
  'claude-sonnet-4-5': {
    bg: 'bg-sky-500/10',
    text: 'text-sky-400',
    border: 'border-sky-500/20',
  },
  'claude-haiku-4-5': {
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-400',
    border: 'border-emerald-500/20',
  },
};

const FileIcon = () => (
  <svg width="11" height="11" viewBox="0 0 11 11" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M2 1H7L9.5 3.5V10H2V1Z"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinejoin="round"
      fill="none"
    />
    <path d="M7 1V3.5H9.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
  </svg>
);

interface AgentCardProps {
  agent: Agent;
}

const AgentCard = ({ agent }: AgentCardProps) => {
  const modelStyle = MODEL_COLORS[agent.model] ?? {
    bg: 'bg-zinc-500/10',
    text: 'text-zinc-400',
    border: 'border-zinc-500/20',
  };

  return (
    <button className="group w-full text-left px-4 py-3.5 rounded-md bg-white/[0.02] border border-white/[0.06] hover:bg-white/[0.045] hover:border-white/[0.1] transition-all duration-150 block">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-[13px] font-semibold text-white/80 group-hover:text-white/95 transition-colors font-mono">
              {agent.name}
            </span>
            <span
              className={[
                'inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-semibold uppercase tracking-wider border',
                modelStyle.bg,
                modelStyle.text,
                modelStyle.border,
              ].join(' ')}
            >
              {agent.model.replace('claude-', '')}
            </span>
          </div>
          <p className="font-mono text-[11px] text-white/25 mb-2 truncate">{agent.path}</p>
          <p className="text-[12px] text-white/40 leading-relaxed line-clamp-2">{agent.description}</p>
        </div>
      </div>
      <div className="mt-3 pt-3 border-t border-white/[0.05] flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-white/20">
          <FileIcon />
          <span className="text-[11px] font-mono">agent.md</span>
        </div>
        <span className="text-[11px] text-white/20">{agent.lastModified}</span>
      </div>
    </button>
  );
};

export const AgentsSection = () => {
  return (
    <div>
      <SectionHeader
        title="Agents"
        description="Named sub-agents with specialized roles and model assignments, stored as markdown files."
        actionLabel="New Agent"
        count={MOCK_AGENTS.length}
      />
      <div className="space-y-2">
        {MOCK_AGENTS.map((agent) => (
          <AgentCard key={agent.id} agent={agent} />
        ))}
      </div>
    </div>
  );
};
