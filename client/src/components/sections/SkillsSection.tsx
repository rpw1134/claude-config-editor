import { SectionHeader } from '../SectionHeader';

type TriggerType = 'keyword' | 'always' | 'manual' | 'slash-command';

interface Skill {
  id: string;
  name: string;
  path: string;
  description: string;
  trigger: TriggerType;
  triggerDetail: string;
  lastModified: string;
}

const MOCK_SKILLS: Skill[] = [
  {
    id: '1',
    name: 'frontend-design',
    path: '~/.claude/skills/frontend-design/SKILL.md',
    description:
      'Builds production-grade UI components with intentional aesthetic direction. Invokes when creating React components, pages, or web interfaces. Avoids generic design patterns.',
    trigger: 'keyword',
    triggerDetail: 'build|create|design + component|page|UI',
    lastModified: '1 day ago',
  },
  {
    id: '2',
    name: 'security-review',
    path: '~/.claude/skills/security-review/SKILL.md',
    description:
      'Performs threat modeling, dependency audits, and vulnerability assessment on staged changes. Reviews auth flows, input validation, and secrets handling.',
    trigger: 'slash-command',
    triggerDetail: '/security-review',
    lastModified: '4 days ago',
  },
  {
    id: '3',
    name: 'simplify',
    path: '~/.claude/skills/simplify/SKILL.md',
    description:
      'Reviews changed code for reuse opportunities, redundancy, and unnecessary complexity. Proposes targeted refactors without altering behavior.',
    trigger: 'slash-command',
    triggerDetail: '/simplify',
    lastModified: '1 week ago',
  },
  {
    id: '4',
    name: 'update-config',
    path: '~/.claude/skills/update-config/SKILL.md',
    description:
      'Manages Claude Code harness settings — hooks, permissions, env vars, and automated behaviors — by editing settings.json files.',
    trigger: 'keyword',
    triggerDetail: 'settings|config|permission|hook',
    lastModified: '2 weeks ago',
  },
];

const TRIGGER_STYLES: Record<TriggerType, { bg: string; text: string; border: string; label: string }> = {
  keyword: {
    bg: 'bg-amber-500/10',
    text: 'text-amber-400',
    border: 'border-amber-500/20',
    label: 'Keyword',
  },
  'slash-command': {
    bg: 'bg-orange-500/10',
    text: 'text-orange-400',
    border: 'border-orange-500/20',
    label: 'Slash',
  },
  always: {
    bg: 'bg-rose-500/10',
    text: 'text-rose-400',
    border: 'border-rose-500/20',
    label: 'Always',
  },
  manual: {
    bg: 'bg-zinc-500/10',
    text: 'text-zinc-400',
    border: 'border-zinc-500/20',
    label: 'Manual',
  },
};

const TriggerIcon = () => (
  <svg width="10" height="10" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M5.5 1L1 5.5L4 5.5L4 9L8.5 4.5L5.5 4.5L5.5 1Z"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinejoin="round"
      fill="none"
    />
  </svg>
);

interface SkillCardProps {
  skill: Skill;
}

const SkillCard = ({ skill }: SkillCardProps) => {
  const triggerStyle = TRIGGER_STYLES[skill.trigger];

  return (
    <button className="group w-full text-left px-4 py-3.5 rounded-md bg-white/[0.02] border border-white/[0.06] hover:bg-white/[0.045] hover:border-white/[0.1] transition-all duration-150 block">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-0.5 flex-wrap">
            <span className="text-[13px] font-semibold text-white/80 group-hover:text-white/95 transition-colors font-mono">
              {skill.name}
            </span>
            <span
              className={[
                'inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-semibold uppercase tracking-wider border',
                triggerStyle.bg,
                triggerStyle.text,
                triggerStyle.border,
              ].join(' ')}
            >
              <TriggerIcon />
              {triggerStyle.label}
            </span>
          </div>
          <p className="font-mono text-[11px] text-white/25 mb-2 truncate">{skill.path}</p>
          <p className="text-[12px] text-white/40 leading-relaxed line-clamp-2">{skill.description}</p>
        </div>
      </div>
      <div className="mt-3 pt-3 border-t border-white/[0.05] flex items-center justify-between">
        <p className="font-mono text-[10px] text-white/20 truncate max-w-xs">{skill.triggerDetail}</p>
        <span className="text-[11px] text-white/20 shrink-0 ml-2">{skill.lastModified}</span>
      </div>
    </button>
  );
};

export const SkillsSection = () => {
  return (
    <div>
      <SectionHeader
        title="Skills"
        description="Reusable instruction sets that activate on keywords or slash commands to guide specialized tasks."
        actionLabel="New Skill"
        count={MOCK_SKILLS.length}
      />
      <div className="space-y-2">
        {MOCK_SKILLS.map((skill) => (
          <SkillCard key={skill.id} skill={skill} />
        ))}
      </div>
    </div>
  );
};
