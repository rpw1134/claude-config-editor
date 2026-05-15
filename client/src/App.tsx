import { useEffect, useState } from 'react';
import { Routes, Route, useNavigate, useParams, Navigate } from 'react-router-dom';
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

// ── Route components ──────────────────────────────────────────────────────────

interface RouteSharedProps {
  recents: RecentItem[];
  onRecentClick: (item: RecentItem) => void;
  onCreateNew: (type: 'agent' | 'skill' | 'mcp-server') => void;
  sidebarCollapsed: boolean;
  onToggleCollapsed: () => void;
  selectedProjectPath: string | null;
  onProjectSelect: (path: string) => void;
}

// /  (root — no project)
const RootRoute = (props: RouteSharedProps) => (
  <Shell {...props}>
    <NoProjectPane />
  </Shell>
);

// /:projectId  (welcome)
const ProjectWelcomeRoute = (props: RouteSharedProps) => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const projectPath = projectId ? decodeProject(projectId) : null;

  if (!projectPath) return <Navigate to="/" replace />;

  return (
    <Shell {...props} selectedProjectPath={projectPath}>
      <WelcomePane
        projectName={projectPath.split('/').pop() ?? projectPath}
        onOpenClaudeMd={() => navigate(`/${encodeProject(projectPath)}/claude-md`)}
        onOpenAgents={() => navigate(`/${encodeProject(projectPath)}/agents`)}
        onOpenSkills={() => navigate(`/${encodeProject(projectPath)}/skills`)}
        onOpenMcp={() => navigate(`/${encodeProject(projectPath)}/mcp`)}
      />
    </Shell>
  );
};

// /:projectId/claude-md
const ClaudeMdRoute = (props: RouteSharedProps) => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const projectPath = projectId ? decodeProject(projectId) : null;

  if (!projectPath) return <Navigate to="/" replace />;

  return (
    <Shell {...props} selectedProjectPath={projectPath}>
      <EditorPane
        key={`claude-md:${projectPath}`}
        name={projectPath}
        type="project"
        projectPath={projectPath}
        onDeleted={() => navigate(`/${encodeProject(projectPath)}`)}
      />
    </Shell>
  );
};

// /:projectId/agents
const AgentsLandingRoute = (
  props: RouteSharedProps & { refreshKey: number; onBumpRefresh: () => void }
) => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const projectPath = projectId ? decodeProject(projectId) : null;

  if (!projectPath) return <Navigate to="/" replace />;

  return (
    <Shell {...props} selectedProjectPath={projectPath}>
      <AgentsLandingPage
        projectPath={projectPath}
        selectedName={null}
        refreshKey={props.refreshKey}
        onSelect={(name) => {
          props.onRecentClick({ type: 'agent', name, timestamp: Date.now() });
          navigate(`/${encodeProject(projectPath)}/agents/${encodeURIComponent(name)}`);
        }}
        onNew={() => props.onCreateNew('agent')}
      />
    </Shell>
  );
};

// /:projectId/agents/new
const AgentCreateRoute = (
  props: RouteSharedProps & { onBumpAgentsRefresh: () => void; addToRecents: (type: RecentItem['type'], name: string) => void }
) => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const projectPath = projectId ? decodeProject(projectId) : null;

  if (!projectPath) return <Navigate to="/" replace />;

  return (
    <Shell {...props} selectedProjectPath={projectPath}>
      <AgentCreateFlow
        projectPath={projectPath}
        onCreated={(name) => {
          props.onBumpAgentsRefresh();
          props.addToRecents('agent', name);
          navigate(`/${encodeProject(projectPath)}/agents/${encodeURIComponent(name)}`);
        }}
        onCancel={() => navigate(`/${encodeProject(projectPath)}/agents`)}
      />
    </Shell>
  );
};

// /:projectId/agents/:name
const AgentEditorRoute = (props: RouteSharedProps & { onBumpAgentsRefresh: () => void }) => {
  const { projectId, name } = useParams<{ projectId: string; name: string }>();
  const navigate = useNavigate();
  const projectPath = projectId ? decodeProject(projectId) : null;
  const agentName = name ? decodeURIComponent(name) : null;

  if (!projectPath || !agentName) return <Navigate to="/" replace />;

  return (
    <Shell {...props} selectedProjectPath={projectPath}>
      <EditorPane
        key={`agent:${projectPath}:${agentName}`}
        name={agentName}
        type="agent"
        projectPath={projectPath}
        onDeleted={() => {
          props.onBumpAgentsRefresh();
          navigate(`/${encodeProject(projectPath)}/agents`);
        }}
      />
    </Shell>
  );
};

// /:projectId/skills
const SkillsLandingRoute = (
  props: RouteSharedProps & { refreshKey: number }
) => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const projectPath = projectId ? decodeProject(projectId) : null;

  if (!projectPath) return <Navigate to="/" replace />;

  return (
    <Shell {...props} selectedProjectPath={projectPath}>
      <SkillsLandingPage
        projectPath={projectPath}
        selectedName={null}
        refreshKey={props.refreshKey}
        onSelect={(name) => {
          props.onRecentClick({ type: 'skill', name, timestamp: Date.now() });
          navigate(`/${encodeProject(projectPath)}/skills/${encodeURIComponent(name)}`);
        }}
        onNew={() => props.onCreateNew('skill')}
      />
    </Shell>
  );
};

// /:projectId/skills/:name
const SkillEditorRoute = (props: RouteSharedProps & { onBumpSkillsRefresh: () => void }) => {
  const { projectId, name } = useParams<{ projectId: string; name: string }>();
  const navigate = useNavigate();
  const projectPath = projectId ? decodeProject(projectId) : null;
  const skillName = name ? decodeURIComponent(name) : null;

  if (!projectPath || !skillName) return <Navigate to="/" replace />;

  return (
    <Shell {...props} selectedProjectPath={projectPath}>
      <EditorPane
        key={`skill:${projectPath}:${skillName}`}
        name={skillName}
        type="skill"
        projectPath={projectPath}
        onDeleted={() => {
          props.onBumpSkillsRefresh();
          navigate(`/${encodeProject(projectPath)}/skills`);
        }}
      />
    </Shell>
  );
};

// /:projectId/mcp
const McpLandingRoute = (
  props: RouteSharedProps & { refreshKey: number }
) => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const projectPath = projectId ? decodeProject(projectId) : null;

  if (!projectPath) return <Navigate to="/" replace />;

  return (
    <Shell {...props} selectedProjectPath={projectPath}>
      <McpLandingPage
        projectPath={projectPath}
        selectedName={null}
        refreshKey={props.refreshKey}
        onSelect={(name) => {
          props.onRecentClick({ type: 'mcp-server', name, timestamp: Date.now() });
          navigate(`/${encodeProject(projectPath)}/mcp/${encodeURIComponent(name)}`);
        }}
        onNew={() => props.onCreateNew('mcp-server')}
      />
    </Shell>
  );
};

// /:projectId/mcp/:name
const McpEditorRoute = (props: RouteSharedProps & { onBumpMcpRefresh: () => void }) => {
  const { projectId, name } = useParams<{ projectId: string; name: string }>();
  const navigate = useNavigate();
  const projectPath = projectId ? decodeProject(projectId) : null;
  const mcpName = name ? decodeURIComponent(name) : null;

  if (!projectPath || !mcpName) return <Navigate to="/" replace />;

  return (
    <Shell {...props} selectedProjectPath={projectPath}>
      <EditorPane
        key={`mcp:${projectPath}:${mcpName}`}
        name={mcpName}
        type="mcp-server"
        projectPath={projectPath}
        onDeleted={() => {
          props.onBumpMcpRefresh();
          navigate(`/${encodeProject(projectPath)}/mcp`);
        }}
      />
    </Shell>
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

  const sharedProps: RouteSharedProps = {
    recents,
    onRecentClick: handleRecentClick,
    onCreateNew: handleCreateNew,
    sidebarCollapsed,
    onToggleCollapsed: () => setSidebarCollapsed((v) => !v),
    selectedProjectPath,
    onProjectSelect: handleProjectSelect,
  };

  return (
    <>
      <Routes>
        <Route path="/" element={<RootRoute {...sharedProps} />} />

        <Route
          path="/:projectId"
          element={<ProjectWelcomeRoute {...sharedProps} />}
        />

        <Route
          path="/:projectId/claude-md"
          element={<ClaudeMdRoute {...sharedProps} />}
        />

        {/* Agents */}
        <Route
          path="/:projectId/agents"
          element={
            <AgentsLandingRoute
              {...sharedProps}
              refreshKey={agentsRefreshKey}
              onBumpRefresh={() => setAgentsRefreshKey((k) => k + 1)}
            />
          }
        />
        <Route
          path="/:projectId/agents/new"
          element={
            <AgentCreateRoute
              {...sharedProps}
              onBumpAgentsRefresh={() => setAgentsRefreshKey((k) => k + 1)}
              addToRecents={addToRecents}
            />
          }
        />
        <Route
          path="/:projectId/agents/:name"
          element={
            <AgentEditorRoute
              {...sharedProps}
              onBumpAgentsRefresh={() => setAgentsRefreshKey((k) => k + 1)}
            />
          }
        />

        {/* Skills */}
        <Route
          path="/:projectId/skills"
          element={
            <SkillsLandingRoute
              {...sharedProps}
              refreshKey={skillsRefreshKey}
            />
          }
        />
        <Route
          path="/:projectId/skills/:name"
          element={
            <SkillEditorRoute
              {...sharedProps}
              onBumpSkillsRefresh={() => setSkillsRefreshKey((k) => k + 1)}
            />
          }
        />

        {/* MCP */}
        <Route
          path="/:projectId/mcp"
          element={
            <McpLandingRoute
              {...sharedProps}
              refreshKey={mcpRefreshKey}
            />
          }
        />
        <Route
          path="/:projectId/mcp/:name"
          element={
            <McpEditorRoute
              {...sharedProps}
              onBumpMcpRefresh={() => setMcpRefreshKey((k) => k + 1)}
            />
          }
        />
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
    </>
  );
}
