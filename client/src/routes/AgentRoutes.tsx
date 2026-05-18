import { Navigate, useNavigate, useParams } from "react-router-dom";
import { useShell } from "../contexts/ShellContext";
import { AgentCreateFlow } from "../components/Agent/AgentCreateFlow";
import { EditorPane } from "../components/Editor/EditorPane";
import { AgentsLandingPage } from "../components/Pages/LandingPage";
import { encodeProject, decodeProject } from "../lib/navigation";

// /:projectId/agents
export const AgentsLandingContent = () => {
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
        addToRecents("agent", name);
        navigate(
          `/${encodeProject(projectPath)}/agents/${encodeURIComponent(name)}`,
        );
      }}
      onNew={() => onCreateNew("agent")}
    />
  );
};

// /:projectId/agents/new
export const AgentCreateContent = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { addToRecents, onBumpAgentsRefresh, showToast } = useShell();
  const projectPath = projectId ? decodeProject(projectId) : null;

  if (!projectPath) return <Navigate to="/" replace />;

  return (
    <AgentCreateFlow
      projectPath={projectPath}
      onCreated={(name) => {
        onBumpAgentsRefresh();
        addToRecents("agent", name);
        showToast(`Agent "${name}" created`);
        navigate(`/${encodeProject(projectPath)}/agents`, { replace: true });
      }}
      onCancel={() => navigate(`/${encodeProject(projectPath)}/agents`)}
    />
  );
};

// /:projectId/agents/:name
export const AgentEditorContent = () => {
  const { projectId, name } = useParams<{ projectId: string; name: string }>();
  const navigate = useNavigate();
  const { onBumpAgentsRefresh, removeFromRecents } = useShell();
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
        removeFromRecents("agent", agentName);
        navigate(`/${encodeProject(projectPath)}/agents`);
      }}
    />
  );
};
