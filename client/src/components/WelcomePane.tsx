// WelcomePane — shown when a project is selected but nothing is open in the editor.

interface QuickCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  isPrimary?: boolean;
  onClick: () => void;
}

const QuickCard = ({ icon, title, description, isPrimary = false, onClick }: QuickCardProps) => (
  <button
    onClick={onClick}
    style={{
      textAlign: 'left',
      width: '100%',
      padding: '16px',
      borderRadius: '10px',
      border: '1px solid var(--border-subtle)',
      background: 'var(--bg-surface)',
      cursor: 'pointer',
      transition: 'background 150ms ease, border-color 150ms ease',
      display: 'block',
    }}
    onMouseEnter={(e) => {
      const el = e.currentTarget as HTMLButtonElement;
      el.style.borderColor = 'var(--border-default)';
      el.style.background = 'var(--bg-elevated)';
    }}
    onMouseLeave={(e) => {
      const el = e.currentTarget as HTMLButtonElement;
      el.style.borderColor = 'var(--border-subtle)';
      el.style.background = 'var(--bg-surface)';
    }}
  >
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
      <div
        style={{
          background: isPrimary ? 'var(--accent-dim)' : 'var(--bg-elevated)',
          color: isPrimary ? 'var(--accent)' : 'var(--text-secondary)',
          width: '32px',
          height: '32px',
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          marginTop: '2px',
        }}
      >
        {icon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{
          fontSize: '14px',
          fontWeight: 500,
          color: 'var(--text-primary)',
          lineHeight: 1.3,
        }}>
          {title}
        </p>
        <p style={{
          marginTop: '4px',
          fontSize: '13px',
          color: 'var(--text-secondary)',
          lineHeight: 1.5,
        }}>
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
  <div style={{
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '64px 40px',
    minHeight: 0,
    overflowY: 'auto',
    background: 'var(--bg-base)',
  }}>
    <div style={{ width: '100%', maxWidth: '440px' }}>
      {/* Heading */}
      <div style={{ marginBottom: '32px' }}>
        {/* Project badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
          <div style={{
            width: '7px',
            height: '7px',
            borderRadius: '50%',
            background: 'var(--accent)',
            flexShrink: 0,
          }} />
          <span style={{
            fontSize: '12px',
            color: 'var(--text-secondary)',
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            padding: '2px 8px',
            borderRadius: '100px',
          }}>
            {projectName}
          </span>
        </div>
        <h1 style={{
          fontSize: '22px',
          fontWeight: 600,
          color: 'var(--text-primary)',
          lineHeight: 1.25,
          letterSpacing: '-0.01em',
          margin: 0,
        }}>
          What are you working on?
        </h1>
        <p style={{
          marginTop: '8px',
          fontSize: '14px',
          color: 'var(--text-secondary)',
          lineHeight: 1.6,
        }}>
          Open a file from the sidebar, or jump in below.
        </p>
      </div>

      {/* Quick-access cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <QuickCard
          icon={<DocumentIcon />}
          title="CLAUDE.md"
          description="Project-level instructions for Claude — context, conventions, working agreements."
          isPrimary={true}
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
  <div style={{
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '64px 40px',
    background: 'var(--bg-base)',
  }}>
    <div style={{ textAlign: 'center' }}>
      <div style={{
        width: '40px',
        height: '40px',
        borderRadius: '12px',
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-subtle)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        margin: '0 auto 16px',
        color: 'var(--text-muted)',
      }}>
        <DocumentIcon />
      </div>
      <p style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-secondary)' }}>No project selected</p>
      <p style={{
        marginTop: '6px',
        fontSize: '13px',
        color: 'var(--text-muted)',
        fontFamily: 'Fira Code, monospace',
      }}>Pick a project from the sidebar to get started.</p>
    </div>
  </div>
);
