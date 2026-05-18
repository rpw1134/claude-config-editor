import { Navigate, useNavigate, useParams } from "react-router-dom";
import { useShell } from "../contexts/ShellContext";
import { McpEditorPane } from "../components/Mcp/McpEditorPane";
import { McpLandingPage } from "../components/Pages/LandingPage";
import { encodeProject, decodeProject } from "../lib/navigation";

// /:projectId/mcp
export const McpLandingContent = () => {
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
        addToRecents("mcp-server", name);
        navigate(
          `/${encodeProject(projectPath)}/mcp/${encodeURIComponent(name)}`,
        );
      }}
      onNew={() => onCreateNew("mcp-server")}
    />
  );
};

// /:projectId/mcp/:name
export const McpEditorContent = () => {
  const { projectId, name } = useParams<{ projectId: string; name: string }>();
  const navigate = useNavigate();
  const { onBumpMcpRefresh, removeFromRecents } = useShell();
  const projectPath = projectId ? decodeProject(projectId) : null;
  const mcpName = name ? decodeURIComponent(name) : null;

  if (!projectPath || !mcpName) return <Navigate to="/" replace />;

  return (
    <McpEditorPane
      key={`mcp:${projectPath}:${mcpName}`}
      name={mcpName}
      projectPath={projectPath}
      onBack={() => navigate(`/${encodeProject(projectPath)}/mcp`)}
      onDeleted={() => {
        onBumpMcpRefresh();
        removeFromRecents("mcp-server", mcpName);
        navigate(`/${encodeProject(projectPath)}/mcp`);
      }}
    />
  );
};
