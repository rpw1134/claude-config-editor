// WelcomePane — shown when a project is selected but nothing is open in the editor.

interface QuickCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  onClick: () => void;
}

const QuickCard = ({ icon, title, description, onClick }: QuickCardProps) => (
  <button
    onClick={onClick}
    className="group text-left w-full p-4 rounded-xl border border-white/6 bg-white/[0.025] hover:bg-white/[0.045] hover:border-white/10 transition-all duration-150"
  >
    <div className="flex items-start gap-3.5">
      <div className="shrink-0 mt-0.5 w-8 h-8 rounded-lg bg-white/5 group-hover:bg-white/8 flex items-center justify-center transition-colors text-white/35 group-hover:text-white/60">
        {icon}
      </div>
      <div>
        <p className="text-[13px] font-medium text-white/70 group-hover:text-white/90 transition-colors leading-tight">
          {title}
        </p>
        <p className="mt-1 text-[11px] text-white/30 group-hover:text-white/45 transition-colors leading-snug">
          {description}
        </p>
      </div>
    </div>
  </button>
);

// ── Icons ─────────────────────────────────────────────────────────────────────

const DocumentIcon = () => (
  <svg width="16" height="16" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M3 2.5C3 1.67 3.67 1 4.5 1H9L12 4V12.5C12 13.33 11.33 14 10.5 14H4.5C3.67 14 3 13.33 3 12.5V2.5Z" stroke="currentColor" strokeWidth="1.2" fill="none"/>
    <path d="M9 1V4H12" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
    <path d="M5.5 7H9.5M5.5 9.5H9.5" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round"/>
  </svg>
);

const AgentIcon = () => (
  <svg width="16" height="16" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="7.5" cy="5" r="3" stroke="currentColor" strokeWidth="1.2" fill="none"/>
    <path d="M2 13C2 10.24 4.46 8 7.5 8C10.54 8 13 10.24 13 13" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" fill="none"/>
  </svg>
);

const SkillIcon = () => (
  <svg width="16" height="16" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M7.5 1L9.18 5.27L13.5 5.64L10.35 8.38L11.35 12.59L7.5 10.2L3.65 12.59L4.65 8.38L1.5 5.64L5.82 5.27L7.5 1Z" stroke="currentColor" strokeWidth="1.2" fill="none" strokeLinejoin="round"/>
  </svg>
);

const McpIcon = () => (
  <svg width="16" height="16" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="1" y="1" width="13" height="13" rx="2" stroke="currentColor" strokeWidth="1.2" fill="none"/>
    <path d="M4 7.5H11M7.5 4V11" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
  </svg>
);

// ── WelcomePane ───────────────────────────────────────────────────────────────

interface WelcomePaneProps {
  projectName: string;
  onOpenClaudeMd: () => void;
  onOpenAgents: () => void;
  onOpenSkills: () => void;
  onOpenMcp: () => void;
}

export const WelcomePane = ({
  projectName,
  onOpenClaudeMd,
  onOpenAgents,
  onOpenSkills,
  onOpenMcp,
}: WelcomePaneProps) => (
  <div className="flex-1 flex flex-col items-center justify-center px-10 py-16 min-h-0 overflow-y-auto">
    <div className="w-full max-w-md">
      {/* Heading */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-1.5 h-1.5 rounded-full bg-orange-500" />
          <span className="text-[11px] font-mono text-white/25 uppercase tracking-widest">
            {projectName}
          </span>
        </div>
        <h1 className="text-[22px] font-semibold text-white/85 leading-tight tracking-tight">
          What are you working on?
        </h1>
        <p className="mt-2 text-[13px] text-white/35 leading-relaxed">
          Open a file from the sidebar, or jump in below.
        </p>
      </div>

      {/* Quick-access cards */}
      <div className="grid grid-cols-1 gap-2.5">
        <QuickCard
          icon={<DocumentIcon />}
          title="CLAUDE.md"
          description="Project-level instructions for Claude — context, conventions, working agreements."
          onClick={onOpenClaudeMd}
        />
        <QuickCard
          icon={<AgentIcon />}
          title="Agents"
          description="Named sub-agents with specialized roles and model assignments."
          onClick={onOpenAgents}
        />
        <QuickCard
          icon={<SkillIcon />}
          title="Skills"
          description="Reusable instruction sets that activate on keywords or slash commands."
          onClick={onOpenSkills}
        />
        <QuickCard
          icon={<McpIcon />}
          title="MCP Servers"
          description="Model Context Protocol servers that extend Claude's tool capabilities."
          onClick={onOpenMcp}
        />
      </div>
    </div>
  </div>
);

// ── NoProjectPane ─────────────────────────────────────────────────────────────

export const NoProjectPane = () => (
  <div className="flex-1 flex flex-col items-center justify-center px-10 py-16">
    <div className="text-center">
      <div className="w-10 h-10 rounded-xl bg-white/4 border border-white/8 flex items-center justify-center mx-auto mb-4">
        <DocumentIcon />
      </div>
      <p className="text-[14px] font-medium text-white/40 leading-tight">No project selected</p>
      <p className="mt-1.5 text-[12px] text-white/20 font-mono">Pick a project from the sidebar to get started.</p>
    </div>
  </div>
);
