import { Navigate, useParams } from "react-router-dom";
import { useSkillDrafts } from "../../contexts/SkillDraftContext";
import { useSkillLayout } from "../../contexts/SkillLayoutContext";
import { ScriptFileEditor } from "../../components/Skill/ScriptFileEditor";
import {
  fetchSkillScript,
  updateSkillScript,
  createSkillScript,
} from "../../lib/api";
import { decodeProject } from "../../lib/navigation";
import { useSkillFileEditor } from "../../hooks/useSkillFileEditor";

// /:projectId/skills/:name/scripts/:scriptFile
export const ScriptEditorContent = () => {
  const { projectId, name, scriptFile } = useParams<{
    projectId: string;
    name: string;
    scriptFile: string;
  }>();
  const draftStore = useSkillDrafts();
  const { reportDirty, registerSaveHandler } = useSkillLayout();

  const projectPath = projectId ? decodeProject(projectId) : null;
  const skillName = name ? decodeURIComponent(name) : null;
  const fileName = scriptFile ? decodeURIComponent(scriptFile) : null;
  const draftKey = fileName ? `scripts/${fileName}` : null;

  const { fileContent, setFileContent, contentLoading } = useSkillFileEditor({
    fileName: draftKey ?? "__invalid__",
    draftStore,
    reportDirty,
    registerSaveHandler,
    fetchFn: () => fetchSkillScript(projectPath!, skillName!, fileName!),
    saveFn: (content) =>
      updateSkillScript(projectPath!, skillName!, fileName!, content),
    onNotFound: () =>
      createSkillScript(projectPath!, skillName!, fileName!, ""),
  });

  if (!projectPath || !skillName || !fileName)
    return <Navigate to="/" replace />;
  if (contentLoading) return <div className="flex-1" />;

  return (
    <ScriptFileEditor
      file={fileName}
      content={fileContent}
      onChange={setFileContent}
    />
  );
};
