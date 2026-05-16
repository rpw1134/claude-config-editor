import { createContext, useContext, useEffect, useState } from 'react';
import { Routes, Route, useNavigate, useParams, Navigate, Outlet } from 'react-router-dom';
import { Sidebar } from './components/Sidebar';
import { EditorPane } from './components/Editor/EditorPane';
import { WelcomePane, NoProjectPane } from './components/WelcomePane';
import { AgentsLandingPage, SkillsLandingPage, McpLandingPage } from './components/LandingPage';
import { CreateNewModal } from './components/CreateNewModal';
import { AgentCreateFlow } from './components/AgentCreateFlow';
import { fetchProjects } from './lib/api';
import { addRecentItem, readRecents } from './hooks/useRecents';
import type { RecentItem } from './hooks/useRecents';

const RECENT_PROJECT_KEY = 'ccs:recentProject';

// ── Helpers ───────────────────────────────────────────────────────────────────

function encodeProject(path: string): string {
  return encodeURIComponent(path);
}

function decodeProject(param: string): string {
  return decodeURIComponent(param);
}

// ── Shell context — shared across all routes under the layout ─────────────────

interface ShellContextValue {
  selectedProjectPath: string | null;
  onProjectSelect: (path: string) => void;
  recents: RecentItem[];
  onRecentClick: (item: RecentItem) => void;
  addToRecents: (type: RecentItem['type'], name: string) => void;
  onCreateNew: (type: 'agent' | 'skill' | 'mcp-server') => void;
  sidebarCollapsed: boolean;
  onToggleCollapsed: () => void;
  agentsRefreshKey: number;
  skillsRefreshKey: number;
  mcpRefreshKey: number;
  onBumpAgentsRefresh: () => void;
  onBumpSkillsRefresh: () => void;
  onBumpMcpRefresh: () => void;
}

const ShellContext = createContext<ShellContextValue | null>(null);

const useShell = (): ShellContextValue => {
  const ctx = useContext(ShellContext);
  if (!ctx) throw new Error('useShell must be used inside ShellContext.Provider');
  return ctx;
};

// ── Shell wraps the sidebar + main content area ────────────────────────────────

interface ShellProps {
  selectedProjectPath: string | null;
  onProjectSelect: (path: string) => void;
  recents: RecentItem[];
  onRecentClick: (item: RecentItem) => void;
  onCreateNew: (type: 'agent' | 'skill' | 'mcp-server') => void;
  sidebarCollapsed: boolean;
  onToggleCollapsed: () => void;
  children: React.ReactNode;
}

const Shell = ({
  selectedProjectPath,
  onProjectSelect,
  recents,
  onRecentClick,
  onCreateNew,
  sidebarCollapsed,
  onToggleCollapsed,
  children,
}: ShellProps) => (
  <div className="flex h-screen bg-[#0a0a0c] text-white overflow-hidden">
    <Sidebar
      selectedProjectPath={selectedProjectPath}
      onProjectSelect={onProjectSelect}
      collapsed={sidebarCollapsed}
      onToggleCollapsed={onToggleCollapsed}
      recents={recents}
      onRecentClick={onRecentClick}
      onCreateNew={onCreateNew}
    />
    <main className="flex flex-1 overflow-hidden">
      {children}
    </main>
  </div>
);

// ── Layout route — Shell mounted exactly once ──────────────────────────────────

const LayoutRoute = () => {
  const ctx = useShell();
  return (
    <Shell
      selectedProjectPath={ctx.selectedProjectPath}
      onProjectSelect={ctx.onProjectSelect}
      recents={ctx.recents}
      onRecentClick={ctx.onRecentClick}
      onCreateNew={ctx.onCreateNew}
      sidebarCollapsed={ctx.sidebarCollapsed}
      onToggleCollapsed={ctx.onToggleCollapsed}
    >
      <Outlet />
    </Shell>
  );
};

// ── Content-only route components (no Shell) ───────────────────────────────────

// /  (root — no project)
const RootContent = () => <NoProjectPane />;

// /:projectId  (welcome)
const ProjectWelcomeContent = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const projectPath = projectId ? decodeProject(projectId) : null;

  if (!projectPath) return <Navigate to="/" replace />;

  return (
    <WelcomePane
      projectName={projectPath.split('/').pop() ?? projectPath}
      onOpenClaudeMd={() => navigate(`/${encodeProject(projectPath)}/claude-md`)}
      onOpenAgents={() => navigate(`/${encodeProject(projectPath)}/agents`)}
      onOpenSkills={() => navigate(`/${encodeProject(projectPath)}/skills`)}
      onOpenMcp={() => navigate(`/${encodeProject(projectPath)}/mcp`)}
    />
  );
};

// /:projectId/claude-md
const ClaudeMdContent = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const projectPath = projectId ? decodeProject(projectId) : null;

  if (!projectPath) return <Navigate to="/" replace />;

  return (
    <EditorPane
      key={`claude-md:${projectPath}`}
      name={projectPath}
      type="project"
      projectPath={projectPath}
      onDeleted={() => navigate(`/${encodeProject(projectPath)}`)}
    />
  );
};

// /:projectId/agents
const AgentsLandingContent = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { addToRecents, onCreateNew, agentsRefreshKey } = useShell();
  const projectPath = projectId ? decodeProject(projectId) : null;

  if (!projectPath) return <Navigate to="/" replace />;

  return (
    <AgentsLandingPage
      projectPath={projectPath}
      selectedName={null}
      refreshKey={agentsRefreshKey}
      onSelect={(name) => {
        addToRecents('agent', name);
        navigate(`/${encodeProject(projectPath)}/agents/${encodeURIComponent(name)}`);
      }}
      onNew={() => onCreateNew('agent')}
    />
  );
};

// /:projectId/agents/new
const AgentCreateContent = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { addToRecents, onBumpAgentsRefresh } = useShell();
  const projectPath = projectId ? decodeProject(projectId) : null;

  if (!projectPath) return <Navigate to="/" replace />;

  return (
    <AgentCreateFlow
      projectPath={projectPath}
      onCreated={(name) => {
        onBumpAgentsRefresh();
        addToRecents('agent', name);
        navigate(`/${encodeProject(projectPath)}/agents/${encodeURIComponent(name)}`);
      }}
      onCancel={() => navigate(`/${encodeProject(projectPath)}/agents`)}
    />
  );
};

// /:projectId/agents/:name
const AgentEditorContent = () => {
  const { projectId, name } = useParams<{ projectId: string; name: string }>();
  const navigate = useNavigate();
  const { onBumpAgentsRefresh } = useShell();
  const projectPath = projectId ? decodeProject(projectId) : null;
  const agentName = name ? decodeURIComponent(name) : null;

  if (!projectPath || !agentName) return <Navigate to="/" replace />;

  return (
    <EditorPane
      key={`agent:${projectPath}:${agentName}`}
      name={agentName}
      type="agent"
      projectPath={projectPath}
      onDeleted={() => {
        onBumpAgentsRefresh();
        navigate(`/${encodeProject(projectPath)}/agents`);
      }}
    />
  );
};

// /:projectId/skills
const SkillsLandingContent = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { addToRecents, onCreateNew, skillsRefreshKey } = useShell();
  const projectPath = projectId ? decodeProject(projectId) : null;

  if (!projectPath) return <Navigate to="/" replace />;

  return (
    <SkillsLandingPage
      projectPath={projectPath}
      selectedName={null}
      refreshKey={skillsRefreshKey}
      onSelect={(name) => {
        addToRecents('skill', name);
        navigate(`/${encodeProject(projectPath)}/skills/${encodeURIComponent(name)}`);
      }}
      onNew={() => onCreateNew('skill')}
    />
  );
};

// /:projectId/skills/:name
const SkillEditorContent = () => {
  const { projectId, name } = useParams<{ projectId: string; name: string }>();
  const navigate = useNavigate();
  const { onBumpSkillsRefresh } = useShell();
  const projectPath = projectId ? decodeProject(projectId) : null;
  const skillName = name ? decodeURIComponent(name) : null;

  if (!projectPath || !skillName) return <Navigate to="/" replace />;

  return (
    <EditorPane
      key={`skill:${projectPath}:${skillName}`}
      name={skillName}
      type="skill"
      projectPath={projectPath}
      onDeleted={() => {
        onBumpSkillsRefresh();
        navigate(`/${encodeProject(projectPath)}/skills`);
      }}
    />
  );
};

// /:projectId/mcp
const McpLandingContent = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { addToRecents, onCreateNew, mcpRefreshKey } = useShell();
  const projectPath = projectId ? decodeProject(projectId) : null;

  if (!projectPath) return <Navigate to="/" replace />;

  return (
    <McpLandingPage
      projectPath={projectPath}
      selectedName={null}
      refreshKey={mcpRefreshKey}
      onSelect={(name) => {
        addToRecents('mcp-server', name);
        navigate(`/${encodeProject(projectPath)}/mcp/${encodeURIComponent(name)}`);
      }}
      onNew={() => onCreateNew('mcp-server')}
    />
  );
};

// /:projectId/mcp/:name
const McpEditorContent = () => {
  const { projectId, name } = useParams<{ projectId: string; name: string }>();
  const navigate = useNavigate();
  const { onBumpMcpRefresh } = useShell();
  const projectPath = projectId ? decodeProject(projectId) : null;
  const mcpName = name ? decodeURIComponent(name) : null;

  if (!projectPath || !mcpName) return <Navigate to="/" replace />;

  return (
    <EditorPane
      key={`mcp:${projectPath}:${mcpName}`}
      name={mcpName}
      type="mcp-server"
      projectPath={projectPath}
      onDeleted={() => {
        onBumpMcpRefresh();
        navigate(`/${encodeProject(projectPath)}/mcp`);
      }}
    />
  );
};

// ── App ───────────────────────────────────────────────────────────────────────

export default function App() {
  const navigate = useNavigate();

  const [selectedProjectPath, setSelectedProjectPath] = useState<string | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [recents, setRecents] = useState<RecentItem[]>([]);

  // Refresh keys for landing pages (bump after create/delete)
  const [agentsRefreshKey, setAgentsRefreshKey] = useState(0);
  const [skillsRefreshKey, setSkillsRefreshKey] = useState(0);
  const [mcpRefreshKey, setMcpRefreshKey] = useState(0);

  // Modal for skill / mcp-server create
  const [modalType, setModalType] = useState<'agent' | 'skill' | 'mcp-server' | null>(null);

  // Auto-load most recent project on mount
  useEffect(() => {
    fetchProjects()
      .then((projects) => {
        if (projects.length === 0) return;
        const stored = localStorage.getItem(RECENT_PROJECT_KEY);
        const match = stored ? projects.find((p) => p.path === stored) : null;
        const fallback = projects.find((p) => p.name === 'global') ?? projects[0];
        const target = match ?? fallback;
        if (target) {
          setSelectedProjectPath(target.path);
          setRecents(readRecents(target.path));
          navigate(`/${encodeProject(target.path)}`, { replace: true });
        }
      })
      .catch(() => {/* server not ready — stay on root */});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const addToRecents = (type: RecentItem['type'], name: string) => {
    if (!selectedProjectPath) return;
    const updated = addRecentItem(selectedProjectPath, type, name);
    setRecents(updated);
  };

  const handleProjectSelect = (path: string) => {
    localStorage.setItem(RECENT_PROJECT_KEY, path);
    setSelectedProjectPath(path);
    setRecents(readRecents(path));
    navigate(`/${encodeProject(path)}`);
  };

  const handleRecentClick = (item: RecentItem) => {
    addToRecents(item.type, item.name);
    if (!selectedProjectPath) return;
    if (item.type === 'agent') {
      navigate(`/${encodeProject(selectedProjectPath)}/agents/${encodeURIComponent(item.name)}`);
    } else if (item.type === 'skill') {
      navigate(`/${encodeProject(selectedProjectPath)}/skills/${encodeURIComponent(item.name)}`);
    } else {
      navigate(`/${encodeProject(selectedProjectPath)}/mcp/${encodeURIComponent(item.name)}`);
    }
  };

  const handleCreateNew = (type: 'agent' | 'skill' | 'mcp-server') => {
    if (!selectedProjectPath) return;
    if (type === 'agent') {
      navigate(`/${encodeProject(selectedProjectPath)}/agents/new`);
    } else {
      setModalType(type);
    }
  };

  const handleModalSuccess = (name: string) => {
    const type = modalType!;
    setModalType(null);
    addToRecents(type, name);
    if (!selectedProjectPath) return;
    if (type === 'skill') {
      setSkillsRefreshKey((k) => k + 1);
      navigate(`/${encodeProject(selectedProjectPath)}/skills/${encodeURIComponent(name)}`);
    } else if (type === 'mcp-server') {
      setMcpRefreshKey((k) => k + 1);
      navigate(`/${encodeProject(selectedProjectPath)}/mcp/${encodeURIComponent(name)}`);
    }
  };

  const shellContextValue: ShellContextValue = {
    selectedProjectPath,
    onProjectSelect: handleProjectSelect,
    recents,
    onRecentClick: handleRecentClick,
    addToRecents,
    onCreateNew: handleCreateNew,
    sidebarCollapsed,
    onToggleCollapsed: () => setSidebarCollapsed((v) => !v),
    agentsRefreshKey,
    skillsRefreshKey,
    mcpRefreshKey,
    onBumpAgentsRefresh: () => setAgentsRefreshKey((k) => k + 1),
    onBumpSkillsRefresh: () => setSkillsRefreshKey((k) => k + 1),
    onBumpMcpRefresh: () => setMcpRefreshKey((k) => k + 1),
  };

  return (
    <ShellContext.Provider value={shellContextValue}>
      <Routes>
        {/* Single layout wrapper — Shell is mounted once */}
        <Route element={<LayoutRoute />}>
          <Route path="/" element={<RootContent />} />

          <Route path="/:projectId" element={<ProjectWelcomeContent />} />
          <Route path="/:projectId/claude-md" element={<ClaudeMdContent />} />

          {/* Agents */}
          <Route path="/:projectId/agents" element={<AgentsLandingContent />} />
          <Route path="/:projectId/agents/new" element={<AgentCreateContent />} />
          <Route path="/:projectId/agents/:name" element={<AgentEditorContent />} />

          {/* Skills */}
          <Route path="/:projectId/skills" element={<SkillsLandingContent />} />
          <Route path="/:projectId/skills/:name" element={<SkillEditorContent />} />

          {/* MCP */}
          <Route path="/:projectId/mcp" element={<McpLandingContent />} />
          <Route path="/:projectId/mcp/:name" element={<McpEditorContent />} />
        </Route>
      </Routes>

      {/* Create New modal for skill/mcp-server */}
      {modalType && selectedProjectPath && (
        <CreateNewModal
          type={modalType}
          projectPath={selectedProjectPath}
          onSuccess={handleModalSuccess}
          onClose={() => setModalType(null)}
        />
      )}
    </ShellContext.Provider>
  );
}
