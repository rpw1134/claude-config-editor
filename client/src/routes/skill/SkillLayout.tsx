import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Outlet,
  useBlocker,
  useLocation,
  useNavigate,
  useParams,
} from "react-router-dom";
import { SkillTabBar } from "../../components/Skill/SkillTabBar";
import type { SkillTabId } from "../../components/Skill/SkillTabBar";
import { UnsavedModal } from "../../components/Shared/UnsavedModal";
import {
  SkillDraftContext,
  type SkillDraft,
} from "../../contexts/SkillDraftContext";
import { SkillLayoutContext } from "../../contexts/SkillLayoutContext";
import { encodeProject, decodeProject } from "../../lib/navigation";
import { SkillFormContent } from "./SkillFormContent";
import { SKILL_SECTIONS, isSameSkillRoute } from "./skillUtils";
import { useSkillSave } from "../../hooks/useSkillSave";

export type SkillSection = "identity" | "instructions" | "settings";

// /:projectId/skills/:name  — shared layout (tab bar stays mounted across tab switches)
export const SkillLayout = () => {
  const { projectId, name } = useParams<{ projectId: string; name: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const match = location.pathname.match(
    /^\/[^/]+\/skills\/[^/]+(?:\/([^/]+)(?:\/([^/]+))?)?$/,
  );
  const rawFile = match?.[1] ? decodeURIComponent(match[1]) : undefined;
  const rawSubFile = match?.[2] ? decodeURIComponent(match[2]) : undefined;

  const projectPath = projectId ? decodeProject(projectId) : "";
  const skillName = name ? decodeURIComponent(name) : "";

  const isSkillSection = rawFile ? SKILL_SECTIONS.has(rawFile) : false;
  const activeTab = (rawFile ?? "directory") as SkillTabId;
  const showHeader =
    activeTab !== "directory" &&
    !(activeTab === "scripts" && !rawSubFile);

  // ── Draft store ──────────────────────────────────────────────────────────────
  const draftStore = useRef<Record<string, SkillDraft>>({});
  const getDraft = useCallback(
    (file: string) => draftStore.current[file] ?? null,
    [],
  );
  const setDraft = useCallback((file: string, draft: SkillDraft) => {
    draftStore.current[file] = draft;
  }, []);
  const clearDrafts = useCallback(() => {
    draftStore.current = {};
  }, []);

  // Clear draft store when skill changes (save hook clears handlers + dirty state)
  useEffect(() => {
    draftStore.current = {};
  }, [projectPath, skillName]);

  // ── Save logic ───────────────────────────────────────────────────────────────
  const {
    anyDirty,
    saveStatus,
    reportDirty,
    registerSaveHandler,
    unregisterSaveHandler,
    handleGlobalSave,
    headerSaveLabel,
    headerSaveDisabled,
  } = useSkillSave(projectPath, skillName, draftStore);

  const headerFilePath = showHeader
    ? activeTab === "scripts"
      ? `~/.claude/skills/${skillName}/scripts/${rawSubFile ?? ""}`
      : `~/.claude/skills/${skillName}/${isSkillSection ? "SKILL.md" : (rawFile ?? "")}`
    : "";

  // ── Preview mode — stored with the tab it belongs to so switching tabs
  // automatically resets it without needing an effect ──────────────────────────
  const [previewState, setPreviewState] = useState({
    forTab: activeTab,
    value: false,
  });
  const previewMode = previewState.forTab === activeTab && previewState.value;
  const setPreviewMode = useCallback(
    (val: boolean) => setPreviewState({ forTab: activeTab, value: val }),
    [activeTab],
  );

  // Navigation blocker — any dirty file blocks leaving the skill
  const blocker = useBlocker(({ currentLocation, nextLocation }) => {
    if (!anyDirty || currentLocation.pathname === nextLocation.pathname)
      return false;
    return !isSameSkillRoute(currentLocation.pathname, nextLocation.pathname);
  });
  useEffect(() => {
    if (!anyDirty && blocker.state === "blocked") blocker.reset();
  }, [anyDirty, blocker]);

  // ── Context values ────────────────────────────────────────────────────────────
  const draftContextValue = useMemo(
    () => ({ getDraft, setDraft, clear: clearDrafts }),
    [getDraft, setDraft, clearDrafts],
  );

  const layoutContextValue = useMemo(
    () => ({
      reportDirty,
      registerSaveHandler,
      unregisterSaveHandler,
      previewMode,
      isSaving: saveStatus === "saving",
      setPreviewMode,
    }),
    [
      reportDirty,
      registerSaveHandler,
      unregisterSaveHandler,
      previewMode,
      saveStatus,
      setPreviewMode,
    ],
  );

  return (
    <div className="flex flex-1 flex-col h-full w-full bg-(--bg-base)">
      {blocker.state === "blocked" && (
        <UnsavedModal
          onLeave={() => blocker.proceed()}
          onKeep={() => blocker.reset()}
        />
      )}
      <SkillTabBar
        activeTab={activeTab}
        skillName={skillName}
        projectPath={projectPath}
        onBack={() => navigate(`/${encodeProject(projectPath)}/skills`)}
        filePath={showHeader ? headerFilePath : undefined}
        saveLabel={headerSaveLabel}
        saveDisabled={headerSaveDisabled}
        onSave={showHeader ? handleGlobalSave : undefined}
      />
      <SkillDraftContext.Provider value={draftContextValue}>
        <SkillLayoutContext.Provider value={layoutContextValue}>
          {isSkillSection ? (
            <SkillFormContent
              key={`skill-form:${projectPath}:${skillName}`}
              section={rawFile as SkillSection}
              projectPath={projectPath}
              skillName={skillName}
            />
          ) : (
            <Outlet />
          )}
        </SkillLayoutContext.Provider>
      </SkillDraftContext.Provider>
    </div>
  );
};
