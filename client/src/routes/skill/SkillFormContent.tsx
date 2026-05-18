import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useShell } from "../../contexts/ShellContext";
import { useSkillDrafts } from "../../contexts/SkillDraftContext";
import type { DeleteStatus } from "../../contexts/SkillDraftContext";
import { useSkillLayout } from "../../contexts/SkillLayoutContext";
import { SkillFormEditor } from "../../components/Skill/SkillFormEditor";
import {
  fetchSkillContent,
  updateSkillContent,
  deleteSkill,
} from "../../lib/api";
import {
  parseSkillFrontmatter,
  serializeSkillFrontmatter,
} from "../../lib/frontmatter";
import { encodeProject } from "../../lib/navigation";
import { useSkillFileEditor } from "../../hooks/useSkillFileEditor";

type SkillSection = "identity" | "instructions" | "settings";

// /:projectId/skills/:name/identity|instructions|settings — SKILL.md form editor
// Rendered directly by SkillLayout (not via Outlet) so it keeps state across tab switches.
export const SkillFormContent = ({
  section,
  projectPath,
  skillName,
}: {
  section: SkillSection;
  projectPath: string;
  skillName: string;
}) => {
  const navigate = useNavigate();
  const { onBumpSkillsRefresh, removeFromRecents } = useShell();
  const draftStore = useSkillDrafts();
  const {
    reportDirty,
    registerSaveHandler,
    previewMode,
    isSaving,
    setPreviewMode,
  } = useSkillLayout();

  // Delete state lives here since it's not part of the shared file editor pattern
  const cachedDraft = draftStore.getDraft("SKILL.md");
  const [deleteStatus, setDeleteStatus] = useState<DeleteStatus>(
    cachedDraft?.deleteStatus ?? "idle",
  );
  const deleteTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (deleteTimer.current) clearTimeout(deleteTimer.current);
    },
    [],
  );

  // Custom fetch: after loading, normalize missing `name` field in frontmatter
  const fetchFn = async () => {
    const raw = await fetchSkillContent(projectPath, skillName);
    const { frontmatter, body } = parseSkillFrontmatter(raw);
    if (!frontmatter.name) {
      return serializeSkillFrontmatter({ ...frontmatter, name: skillName }, body);
    }
    return raw;
  };

  const { fileContent, setFileContent, contentLoading } = useSkillFileEditor({
    fileName: "SKILL.md",
    draftStore,
    reportDirty,
    registerSaveHandler,
    fetchFn,
    saveFn: (content) => updateSkillContent(projectPath, skillName, content),
    extraDraftFields: () => ({ deleteStatus }),
  });

  async function handleDeleteSkill() {
    if (deleteStatus === "deleting") return;
    if (deleteStatus !== "confirm") {
      setDeleteStatus("confirm");
      deleteTimer.current = setTimeout(() => setDeleteStatus("idle"), 3000);
      return;
    }
    if (deleteTimer.current) clearTimeout(deleteTimer.current);
    setDeleteStatus("deleting");
    try {
      await deleteSkill(projectPath, skillName);
      onBumpSkillsRefresh();
      removeFromRecents("skill", skillName);
      navigate(`/${encodeProject(projectPath)}/skills`);
    } catch {
      setDeleteStatus("error");
      deleteTimer.current = setTimeout(() => setDeleteStatus("idle"), 2000);
    }
  }

  if (contentLoading) return <div className="flex-1" />;

  return (
    <SkillFormEditor
      content={fileContent}
      onChange={setFileContent}
      onDelete={handleDeleteSkill}
      deleteStatus={deleteStatus}
      disabled={isSaving}
      activeSection={section}
      previewMode={previewMode}
      onSetPreviewMode={setPreviewMode}
    />
  );
};
