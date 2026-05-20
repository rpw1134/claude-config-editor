import { Navigate, useParams, useSearchParams } from "react-router-dom";
import { VCHistoryTab } from "../components/VersionControl/VCHistoryTab";
import { SkillDirectoryView } from "../components/Skill/SkillDirectoryView";
import { ScriptsTab } from "../components/Skill/ScriptsTab";
import { SkillsLandingPage } from "../components/Pages/LandingPage";
import { useShell } from "../contexts/ShellContext";
import { encodeProject, decodeProject } from "../lib/navigation";
import { useNavigate } from "react-router-dom";

export { SkillLayout } from "./skill/SkillLayout";
export { SkillFileContent } from "./skill/SkillFileContent";
export { ScriptEditorContent } from "./skill/ScriptEditorContent";
export {
  SKILL_SECTIONS,
  matchSkillRoute,
  isSameSkillRoute,
} from "./skill/skillUtils";
export type { SkillSection } from "./skill/SkillLayout";

// /:projectId/skills
export const SkillsLandingContent = () => {
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
        addToRecents("skill", name);
        navigate(
          `/${encodeProject(projectPath)}/skills/${encodeURIComponent(name)}`,
        );
      }}
      onNew={() => onCreateNew("skill")}
    />
  );
};

// /:projectId/skills/:name  (directory index)
export const SkillEditorContent = () => {
  const { projectId, name } = useParams<{ projectId: string; name: string }>();
  const projectPath = projectId ? decodeProject(projectId) : null;
  const skillName = name ? decodeURIComponent(name) : null;

  if (!projectPath || !skillName) return <Navigate to="/" replace />;

  return (
    <SkillDirectoryView
      key={`skill:${projectPath}:${skillName}`}
      skillName={skillName}
      projectPath={projectPath}
    />
  );
};

// /:projectId/skills/:name/history
export const SkillHistoryContent = () => {
  const { projectId, name } = useParams<{ projectId: string; name: string }>();
  const projectPath = projectId ? decodeProject(projectId) : null;
  const skillName = name ? decodeURIComponent(name) : null;

  if (!projectPath || !skillName) return <Navigate to="/" replace />;

  return (
    <div className="flex-1 min-h-0 overflow-y-auto">
      <VCHistoryTab
        projectPath={projectPath}
        filePath={`skills/${skillName}/`}
      />
    </div>
  );
};

// /:projectId/skills/:name/scripts
export const ScriptsTabContent = () => {
  const { projectId, name } = useParams<{ projectId: string; name: string }>();
  const [searchParams] = useSearchParams();
  const projectPath = projectId ? decodeProject(projectId) : null;
  const skillName = name ? decodeURIComponent(name) : null;

  if (!projectPath || !skillName) return <Navigate to="/" replace />;

  return (
    <ScriptsTab
      skillName={skillName}
      projectPath={projectPath}
      autoCreate={searchParams.get("create") === "true"}
    />
  );
};
