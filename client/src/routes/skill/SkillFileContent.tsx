import { Navigate, useParams } from "react-router-dom";
import { useSkillDrafts } from "../../contexts/SkillDraftContext";
import { useSkillLayout } from "../../contexts/SkillLayoutContext";
import { PlainFileEditor } from "../../components/Skill/PlainFileEditor";
import {
  fetchSkillFile,
  updateSkillFile,
  createSkillFile,
} from "../../lib/api";
import { decodeProject } from "../../lib/navigation";
import { useSkillFileEditor } from "../../hooks/useSkillFileEditor";

// /:projectId/skills/:name/reference.md|examples.md — supplementary file editor
export const SkillFileContent = () => {
  const { projectId, name, file } = useParams<{
    projectId: string;
    name: string;
    file: string;
  }>();
  const draftStore = useSkillDrafts();
  const { reportDirty, registerSaveHandler, previewMode, setPreviewMode } =
    useSkillLayout();

  const projectPath = projectId ? decodeProject(projectId) : null;
  const skillName = name ? decodeURIComponent(name) : null;
  const fileName = file ? decodeURIComponent(file) : null;

  const { fileContent, setFileContent, contentLoading } = useSkillFileEditor(
    // Guard: if any param is missing we render <Navigate> below; these
    // fallbacks keep the hook call unconditional (Rules of Hooks).
    {
      fileName: fileName ?? "__invalid__",
      draftStore,
      reportDirty,
      registerSaveHandler,
      fetchFn: () =>
        fetchSkillFile(projectPath!, skillName!, fileName!),
      saveFn: (content) =>
        updateSkillFile(projectPath!, skillName!, fileName!, content),
      onNotFound: () =>
        createSkillFile(projectPath!, skillName!, fileName!),
    },
  );

  if (!projectPath || !skillName || !fileName)
    return <Navigate to="/" replace />;

  if (contentLoading) return <div className="flex-1" />;

  return (
    <PlainFileEditor
      file={fileName}
      skillName={skillName}
      projectPath={projectPath}
      content={fileContent}
      onChange={setFileContent}
      previewMode={previewMode}
      onSetPreviewMode={setPreviewMode}
    />
  );
};
