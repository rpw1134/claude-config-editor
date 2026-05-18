import { Navigate, useNavigate, useParams } from "react-router-dom";
import { useShell } from "../contexts/ShellContext";
import { EditorPane } from "../components/Editor/EditorPane";
import { WelcomePane } from "../components/Pages/WelcomePane";
import { ProjectSettingsPage } from "../components/Pages/ProjectSettingsPage";
import { HooksPage } from "../components/Hooks/HooksPage";
import { encodeProject, decodeProject } from "../lib/navigation";

// /:projectId  (welcome)
export const ProjectWelcomeContent = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const projectPath = projectId ? decodeProject(projectId) : null;

  if (!projectPath) return <Navigate to="/" replace />;

  return (
    <WelcomePane
      projectName={projectPath.split("/").pop() ?? projectPath}
      onOpenClaudeMd={() =>
        navigate(`/${encodeProject(projectPath)}/claude-md`)
      }
      onOpenAgents={() => navigate(`/${encodeProject(projectPath)}/agents`)}
      onOpenSkills={() => navigate(`/${encodeProject(projectPath)}/skills`)}
      onOpenMcp={() => navigate(`/${encodeProject(projectPath)}/mcp`)}
    />
  );
};

// /:projectId/claude-md
export const ClaudeMdContent = () => {
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

// /:projectId/settings
export const ProjectSettingsContent = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { onBumpProjectsRefresh } = useShell();
  const projectPath = projectId ? decodeProject(projectId) : null;
  if (!projectPath) return <Navigate to="/" replace />;

  return (
    <ProjectSettingsPage
      projectPath={projectPath}
      onDeleted={() => {
        onBumpProjectsRefresh();
        navigate("/", { replace: true });
      }}
    />
  );
};

// /:projectId/hooks
export const HooksContent = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const projectPath = projectId ? decodeProject(projectId) : null;
  if (!projectPath) return <Navigate to="/" replace />;

  return (
    <HooksPage
      key={`hooks:${projectPath}`}
      projectPath={projectPath}
    />
  );
};
