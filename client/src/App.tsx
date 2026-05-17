import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Routes,
  Route,
  useNavigate,
  useParams,
  Navigate,
  Outlet,
  useLocation,
  useBlocker,
} from "react-router-dom";
import { SkillTabBar } from "./components/Editor/SkillTabBar";
import type { SkillTabId } from "./components/Editor/SkillTabBar";
import { Sidebar } from "./components/Sidebar";
import { EditorPane } from "./components/Editor/EditorPane";
import { SkillDirectoryView } from "./components/Editor/SkillDirectoryView";
import { SkillFormEditor } from "./components/Editor/SkillFormEditor";
import {
  PlainFileEditor,
  resolvedFilePath,
} from "./components/Editor/PlainFileEditor";
import { WelcomePane, NoProjectPane } from "./components/WelcomePane";
import {
  AgentsLandingPage,
  SkillsLandingPage,
  McpLandingPage,
} from "./components/LandingPage";
import { CreateNewModal } from "./components/CreateNewModal";
import { AgentCreateFlow } from "./components/AgentCreateFlow";
import {
  fetchProjects,
  fetchSkillContent,
  fetchSkillFile,
  updateSkillContent,
  updateSkillFile,
  deleteSkill,
  createSkillFile,
} from "./lib/api";
import {
  parseSkillFrontmatter,
  serializeSkillFrontmatter,
} from "./lib/frontmatter";
import {
  addRecentItem,
  readRecents,
  removeRecentItem,
} from "./hooks/useRecents";
import type { RecentItem } from "./hooks/useRecents";

const RECENT_PROJECT_KEY = "ccs:recentProject";

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
  addToRecents: (type: RecentItem["type"], name: string) => void;
  removeFromRecents: (type: RecentItem["type"], name: string) => void;
  onCreateNew: (type: "agent" | "skill" | "mcp-server") => void;
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
  if (!ctx)
    throw new Error("useShell must be used inside ShellContext.Provider");
  return ctx;
};

type SaveStatus = "idle" | "saving" | "saved" | "error";
type DeleteStatus = "idle" | "confirm" | "deleting" | "error";

// ── Skill draft cache (persist edits across tabs) ───────────────────────────-

type SkillDraft = {
  initialized: boolean;
  fileContent: string;
  savedContent: string;
  contentLoading: boolean;
  saveStatus: SaveStatus;
  deleteStatus?: DeleteStatus;
  hasEdits?: boolean;
};

interface SkillDraftContextValue {
  getDraft: (file: string) => SkillDraft | null;
  setDraft: (file: string, draft: SkillDraft) => void;
  clear: () => void;
}

const SkillDraftContext = createContext<SkillDraftContextValue | null>(null);

const useSkillDrafts = (): SkillDraftContextValue => {
  const ctx = useContext(SkillDraftContext);
  if (!ctx)
    throw new Error(
      "useSkillDrafts must be used inside SkillDraftContext.Provider",
    );
  return ctx;
};

// ── Skill layout context — unified dirty/save/preview for whole skill ────────

interface SkillLayoutContextValue {
  reportDirty: (file: string, isDirty: boolean) => void;
  registerSaveHandler: (file: string, fn: () => Promise<void>) => void;
  unregisterSaveHandler: (file: string) => void;
  previewMode: boolean;
  isSaving: boolean;
}

const SkillLayoutContext = createContext<SkillLayoutContextValue | null>(null);

const useSkillLayout = (): SkillLayoutContextValue => {
  const ctx = useContext(SkillLayoutContext);
  if (!ctx)
    throw new Error(
      "useSkillLayout must be inside SkillLayoutContext.Provider",
    );
  return ctx;
};

// ── Shell wraps the sidebar + main content area ────────────────────────────────

interface ShellProps {
  selectedProjectPath: string | null;
  onProjectSelect: (path: string) => void;
  recents: RecentItem[];
  onRecentClick: (item: RecentItem) => void;
  onCreateNew: (type: "agent" | "skill" | "mcp-server") => void;
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
    <main className="flex flex-1 overflow-hidden">{children}</main>
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
        addToRecents("agent", name);
        navigate(
          `/${encodeProject(projectPath)}/agents/${encodeURIComponent(name)}`,
        );
      }}
      onCancel={() => navigate(`/${encodeProject(projectPath)}/agents`)}
    />
  );
};

// /:projectId/agents/:name
const AgentEditorContent = () => {
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
        addToRecents("skill", name);
        navigate(
          `/${encodeProject(projectPath)}/skills/${encodeURIComponent(name)}`,
        );
      }}
      onNew={() => onCreateNew("skill")}
    />
  );
};

// ── Shared unsaved-changes modal ─────────────────────────────────────────────

const UnsavedModal = ({
  onLeave,
  onKeep,
}: {
  onLeave: () => void;
  onKeep: () => void;
}) => (
  <div
    className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
    onClick={onKeep}
  >
    <div
      className="bg-(--bg-surface) rounded-4.5 border border-(--border-subtle) p-8 max-w-90 w-full mx-4 shadow-2xl"
      onClick={(e) => e.stopPropagation()}
    >
      <h2 className="m-0 mb-2 text-[20px] font-bold text-(--text-primary)">
        Unsaved changes
      </h2>
      <p className="m-0 mb-6 text-[14px] text-(--text-secondary)">
        Leave without saving? Your changes will be lost.
      </p>
      <div className="flex items-center gap-3">
        <button
          onClick={onLeave}
          className="px-5 py-2.5 rounded-2.5 text-[14px] font-medium text-white bg-(--error) border-none cursor-pointer transition-colors duration-150"
        >
          Leave
        </button>
        <button
          onClick={onKeep}
          className="text-[14px] text-(--text-muted) bg-transparent border-none cursor-pointer transition-colors duration-150 hover:text-(--text-secondary)"
        >
          Keep editing
        </button>
      </div>
    </div>
  </div>
);

// ── Skill routing ─────────────────────────────────────────────────────────────

const SKILL_SECTIONS = new Set(["identity", "instructions", "settings"]);
type SkillSection = "identity" | "instructions" | "settings";

// /:projectId/skills/:name  — shared layout (tab bar stays mounted across tab switches)
const SkillLayout = () => {
  const { projectId, name } = useParams<{ projectId: string; name: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const match = location.pathname.match(
    /^\/[^/]+\/skills\/[^/]+(?:\/([^/]+))?$/,
  );
  const rawFile = match?.[1] ? decodeURIComponent(match[1]) : undefined;

  const projectPath = projectId ? decodeProject(projectId) : "";
  const skillName = name ? decodeURIComponent(name) : "";

  const isSkillSection = rawFile ? SKILL_SECTIONS.has(rawFile) : false;
  const activeTab = (rawFile ?? "directory") as SkillTabId;

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

  // ── Unified dirty & save state ────────────────────────────────────────────────
  const [dirtyFiles, setDirtyFiles] = useState<Record<string, boolean>>({});
  const anyDirty = Object.values(dirtyFiles).some(Boolean);
  const saveHandlerRefs = useRef<Record<string, () => Promise<void>>>({});
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Preview mode — stored with the tab it belongs to so switching tabs
  // automatically resets it without needing an effect ──────────────────────────
  const [previewState, setPreviewState] = useState({ forTab: activeTab, value: false });
  const previewMode = previewState.forTab === activeTab && previewState.value;
  const setPreviewMode = (val: boolean) =>
    setPreviewState({ forTab: activeTab, value: val });

  useEffect(
    () => () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    },
    [],
  );

  // Clear stale handlers and drafts when the skill changes
  useEffect(() => {
    saveHandlerRefs.current = {};
    clearDrafts();
    setDirtyFiles({});
    setSaveStatus("idle");
  }, [clearDrafts, projectPath, skillName]);

  // ── Child callbacks ───────────────────────────────────────────────────────────
  const reportDirty = useCallback((file: string, isDirty: boolean) => {
    setDirtyFiles((prev) => {
      if (prev[file] === isDirty) return prev;
      return { ...prev, [file]: isDirty };
    });
  }, []);

  const registerSaveHandler = useCallback(
    (file: string, fn: () => Promise<void>) => {
      saveHandlerRefs.current[file] = fn;
    },
    [],
  );

  const unregisterSaveHandler = useCallback((file: string) => {
    delete saveHandlerRefs.current[file];
  }, []);

  // ── Global save ───────────────────────────────────────────────────────────────
  const handleGlobalSave = useCallback(async () => {
    if (saveStatus === "saving") return;
    const drafts = draftStore.current;
    const pending = Object.entries(drafts).filter(([, draft]) =>
      draft.initialized &&
      !draft.contentLoading &&
      draft.fileContent !== draft.savedContent
    );
    if (pending.length === 0) return;
    setSaveStatus("saving");
    try {
      await Promise.all(
        pending.map(([file, draft]) =>
          file === "SKILL.md"
            ? updateSkillContent(projectPath, skillName, draft.fileContent)
            : updateSkillFile(projectPath, skillName, file, draft.fileContent)
        ),
      );
      pending.forEach(([file, draft]) => {
        drafts[file] = { ...draft, savedContent: draft.fileContent, hasEdits: false };
      });
      setDirtyFiles((prev) => {
        const next = { ...prev };
        pending.forEach(([file]) => {
          next[file] = false;
        });
        return next;
      });
      setSaveStatus("saved");
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => setSaveStatus("idle"), 1500);
    } catch {
      setSaveStatus("error");
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => setSaveStatus("idle"), 2000);
    }
  }, [projectPath, skillName, saveStatus, draftStore]);

  // Cmd+S — global for the whole skill
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        void handleGlobalSave();
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  });

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
  const draftContextValue = useMemo<SkillDraftContextValue>(
    () => ({ getDraft, setDraft, clear: clearDrafts }),
    [getDraft, setDraft, clearDrafts],
  );

  const layoutContextValue = useMemo<SkillLayoutContextValue>(
    () => ({
      reportDirty,
      registerSaveHandler,
      unregisterSaveHandler,
      previewMode,
      isSaving: saveStatus === "saving",
    }),
    [
      reportDirty,
      registerSaveHandler,
      unregisterSaveHandler,
      previewMode,
      saveStatus,
    ],
  );

  // ── Header ────────────────────────────────────────────────────────────────────
  const showHeader = activeTab !== "directory";
  const headerSaveLabel =
    saveStatus === "saving"
      ? "Saving…"
      : saveStatus === "saved"
        ? "Saved ✓"
        : anyDirty
          ? "Save"
          : "Up to date";
  const headerSaveDisabled = !anyDirty || saveStatus === "saving";
  const headerFilePath = showHeader
    ? resolvedFilePath(
        projectPath,
        skillName,
        isSkillSection ? "SKILL.md" : (rawFile ?? ""),
      )
    : "";

  const showPreviewToggle =
    activeTab === "instructions" ||
    activeTab === "reference.md" ||
    activeTab === "examples.md";
  const headerRightSlot = showPreviewToggle ? (
    <div className="flex items-center bg-(--bg-surface) border border-(--border-subtle) rounded-md p-0.5 shrink-0">
      <button
        type="button"
        onClick={() => setPreviewMode(false)}
        className={[
          "text-[13px] px-2.5 py-0.5 rounded cursor-pointer border-none transition-colors duration-150",
          !previewMode
            ? "bg-(--bg-elevated) text-(--text-primary)"
            : "bg-transparent text-(--text-muted) hover:text-(--text-secondary)",
        ].join(" ")}
      >
        Edit
      </button>
      <button
        type="button"
        onClick={() => setPreviewMode(true)}
        className={[
          "text-[13px] px-2.5 py-0.5 rounded cursor-pointer border-none transition-colors duration-150",
          previewMode
            ? "bg-(--bg-elevated) text-(--text-primary)"
            : "bg-transparent text-(--text-muted) hover:text-(--text-secondary)",
        ].join(" ")}
      >
        Preview
      </button>
    </div>
  ) : null;

  const headerActions = showHeader
    ? {
        filePath: headerFilePath,
        saveLabel: headerSaveLabel,
        saveDisabled: headerSaveDisabled,
        onSave: handleGlobalSave,
        rightSlot: headerRightSlot,
      }
    : null;

  return (
    <div className="flex flex-1 flex-col h-full w-full bg-(--bg-base) border-l border-(--border-faint)">
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
        headerActions={headerActions}
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

const matchSkillRoute = (pathname: string) => {
  const match = pathname.match(/^\/([^/]+)\/skills\/([^/]+)(?:\/|$)/);
  if (!match) return null;
  return { projectId: match[1], skillName: match[2] };
};

const isSameSkillRoute = (current: string, next: string) => {
  const currentMatch = matchSkillRoute(current);
  const nextMatch = matchSkillRoute(next);
  if (!currentMatch || !nextMatch) return false;
  return (
    currentMatch.projectId === nextMatch.projectId &&
    currentMatch.skillName === nextMatch.skillName
  );
};

const SkillEditorContent = () => {
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

// /:projectId/skills/:name/identity|instructions|settings — SKILL.md form editor
// Rendered directly by SkillLayout (not via Outlet) so it keeps state across tab switches.
const SkillFormContent = ({
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
  const { reportDirty, registerSaveHandler, previewMode, isSaving } =
    useSkillLayout();
  const draftKey = "SKILL.md";
  const cachedDraft = draftStore.getDraft(draftKey);
  const cachedEdits =
    cachedDraft?.hasEdits ??
    (cachedDraft
      ? cachedDraft.fileContent !== cachedDraft.savedContent
      : false);

  const [fileContent, setFileContent] = useState(
    cachedDraft?.fileContent ?? "",
  );
  const [savedContent, setSavedContent] = useState(
    cachedDraft?.savedContent ?? "",
  );
  const [contentLoading, setContentLoading] = useState(
    cachedDraft?.contentLoading ?? true,
  );
  const [deleteStatus, setDeleteStatus] = useState<DeleteStatus>(
    cachedDraft?.deleteStatus ?? "idle",
  );
  const [hasEdits, setHasEdits] = useState(cachedEdits);

  const deleteTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dirty = !contentLoading && hasEdits;

  useEffect(
    () => () => {
      if (deleteTimer.current) clearTimeout(deleteTimer.current);
    },
    [],
  );

  // Report dirty state to SkillLayout
  useEffect(() => {
    reportDirty("SKILL.md", dirty);
  }, [dirty, reportDirty]);

  // Stable ref always holds the latest save logic. The wrapper registered in
  // saveHandlerRefs is stable (registered once), so it survives tab switches and
  // always delegates to the freshest closure via the ref.
  const saveFnRef = useRef<(() => Promise<void>) | undefined>(undefined);
  useEffect(() => {
    saveFnRef.current = async () => {
      const draft = draftStore.getDraft("SKILL.md");
      const nextContent = draft?.fileContent ?? fileContent;
      const nextSaved = draft?.savedContent ?? savedContent;
      if (nextContent === nextSaved) return;
      await updateSkillContent(projectPath, skillName, nextContent);
      setSavedContent(nextContent);
      setHasEdits(false);
      const cached = draftStore.getDraft("SKILL.md");
      if (cached) {
        draftStore.setDraft("SKILL.md", {
          ...cached,
          savedContent: nextContent,
          hasEdits: false,
        });
      }
      reportDirty("SKILL.md", false);
    };
  }, [projectPath, skillName, fileContent, savedContent, reportDirty, draftStore]);

  useEffect(() => {
    registerSaveHandler("SKILL.md", async () => saveFnRef.current?.());
    // No cleanup — handler must persist when switching tabs so SkillLayout can
    // save this file even when this component is not mounted.
  }, [registerSaveHandler]);

  // Load SKILL.md once — the key on SkillLayout ensures remount only when skill changes
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const cached = draftStore.getDraft(draftKey);
      if (cached?.initialized) {
        setFileContent(cached.fileContent);
        setSavedContent(cached.savedContent);
        setDeleteStatus(cached.deleteStatus ?? "idle");
        setHasEdits(
          cached.hasEdits ?? cached.fileContent !== cached.savedContent,
        );
        setContentLoading(false);
        return;
      }
      setContentLoading(true);
      setFileContent("");
      setSavedContent("");
      setHasEdits(false);
      try {
        const raw = await fetchSkillContent(projectPath, skillName);
        if (cancelled) return;
        const { frontmatter, body } = parseSkillFrontmatter(raw);
        if (!frontmatter.name) {
          const filled = serializeSkillFrontmatter(
            { ...frontmatter, name: skillName },
            body,
          );
          setFileContent(filled);
          setSavedContent(filled);
          setHasEdits(false);
          setContentLoading(false);
          return;
        }
        setFileContent(raw);
        setSavedContent(raw);
        setHasEdits(false);
      } catch {
        if (!cancelled) {
          setFileContent("");
          setSavedContent("");
        }
      } finally {
        if (!cancelled) setContentLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [projectPath, skillName, draftStore, draftKey]);

  useEffect(() => {
    draftStore.setDraft(draftKey, {
      initialized: !contentLoading,
      fileContent,
      savedContent,
      contentLoading,
      saveStatus: "idle",
      deleteStatus,
      hasEdits,
    });
  }, [draftStore, fileContent, savedContent, contentLoading, deleteStatus, hasEdits]);

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
      onChange={(next) => {
        setHasEdits(true);
        setFileContent(next);
      }}
      onDelete={handleDeleteSkill}
      deleteStatus={deleteStatus}
      disabled={isSaving}
      activeSection={section}
      previewMode={previewMode}
    />
  );
};

// /:projectId/skills/:name/reference.md|examples.md — supplementary file editor
const SkillFileContent = () => {
  const { projectId, name, file } = useParams<{
    projectId: string;
    name: string;
    file: string;
  }>();
  const draftStore = useSkillDrafts();
  const { reportDirty, registerSaveHandler, previewMode } = useSkillLayout();

  const projectPath = projectId ? decodeProject(projectId) : null;
  const skillName = name ? decodeURIComponent(name) : null;
  const fileName = file ? decodeURIComponent(file) : null;

  const cachedDraft = fileName ? draftStore.getDraft(fileName) : null;
  const cachedEdits =
    cachedDraft?.hasEdits ??
    (cachedDraft
      ? cachedDraft.fileContent !== cachedDraft.savedContent
      : false);
  const [fileContent, setFileContent] = useState(
    cachedDraft?.fileContent ?? "",
  );
  const [savedContent, setSavedContent] = useState(
    cachedDraft?.savedContent ?? "",
  );
  const [contentLoading, setContentLoading] = useState(
    cachedDraft?.contentLoading ?? true,
  );
  const [hasEdits, setHasEdits] = useState(cachedEdits);

  const dirty = !contentLoading && hasEdits;

  // Report dirty state to SkillLayout
  useEffect(() => {
    if (!fileName) return;
    reportDirty(fileName, dirty);
  }, [dirty, fileName, reportDirty]);

  // Stable ref always holds the latest save logic. The wrapper registered in
  // saveHandlerRefs is stable (registered once per fileName), so it survives tab
  // switches and always delegates to the freshest closure via the ref.
  const saveFnRef = useRef<(() => Promise<void>) | undefined>(undefined);
  useEffect(() => {
    if (!projectPath || !skillName || !fileName) return;
    saveFnRef.current = async () => {
      const draft = draftStore.getDraft(fileName);
      const nextContent = draft?.fileContent ?? fileContent;
      const nextSaved = draft?.savedContent ?? savedContent;
      if (nextContent === nextSaved) return;
      await updateSkillFile(projectPath, skillName, fileName, nextContent);
      setSavedContent(nextContent);
      setHasEdits(false);
      const cached = draftStore.getDraft(fileName);
      if (cached) {
        draftStore.setDraft(fileName, {
          ...cached,
          savedContent: nextContent,
          hasEdits: false,
        });
      }
      reportDirty(fileName, false);
    };
  }, [projectPath, skillName, fileName, fileContent, savedContent, reportDirty, draftStore]);

  useEffect(() => {
    if (!fileName) return;
    registerSaveHandler(fileName, async () => saveFnRef.current?.());
    // No cleanup — handler must persist when switching tabs.
  }, [fileName, registerSaveHandler]);

  useEffect(() => {
    if (!projectPath || !skillName || !fileName) return;
    let cancelled = false;
    const load = async () => {
      const cached = draftStore.getDraft(fileName);
      if (cached?.initialized) {
        setFileContent(cached.fileContent);
        setSavedContent(cached.savedContent);
        setHasEdits(
          cached.hasEdits ?? cached.fileContent !== cached.savedContent,
        );
        setContentLoading(false);
        return;
      }
      setContentLoading(true);
      setFileContent("");
      setSavedContent("");
      setHasEdits(false);
      try {
        await createSkillFile(projectPath, skillName, fileName);
      } catch {
        /* already exists */
      }
      try {
        const raw = await fetchSkillFile(projectPath, skillName, fileName);
        if (cancelled) return;
        setFileContent(raw);
        setSavedContent(raw);
        setHasEdits(false);
      } catch {
        if (!cancelled) {
          setFileContent("");
          setSavedContent("");
        }
      } finally {
        if (!cancelled) setContentLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [projectPath, skillName, fileName, draftStore]);

  useEffect(() => {
    if (!fileName) return;
    draftStore.setDraft(fileName, {
      initialized: !contentLoading,
      fileContent,
      savedContent,
      contentLoading,
      saveStatus: "idle",
      hasEdits,
    });
  }, [draftStore, fileName, fileContent, savedContent, contentLoading, hasEdits]);

  if (!projectPath || !skillName || !fileName)
    return <Navigate to="/" replace />;

  if (contentLoading) return <div className="flex-1" />;

  return (
    <PlainFileEditor
      file={fileName}
      skillName={skillName}
      projectPath={projectPath}
      content={fileContent}
      onChange={(next) => {
        setHasEdits(true);
        setFileContent(next);
      }}
      previewMode={previewMode}
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
const McpEditorContent = () => {
  const { projectId, name } = useParams<{ projectId: string; name: string }>();
  const navigate = useNavigate();
  const { onBumpMcpRefresh, removeFromRecents } = useShell();
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
        removeFromRecents("mcp-server", mcpName);
        navigate(`/${encodeProject(projectPath)}/mcp`);
      }}
    />
  );
};

// /:projectId/plugins
const PluginsContent = () => (
  <div className="flex flex-1 flex-col items-center justify-center bg-[#0a0a0c] gap-3">
    <h1 className="font-['Bricolage_Grotesque',sans-serif] text-[28px] font-semibold text-(--text-primary) tracking-tight">
      Plugins
    </h1>
    <p className="text-[15px] text-(--text-muted) font-medium">Coming soon</p>
  </div>
);

// ── App ───────────────────────────────────────────────────────────────────────

export default function App() {
  const navigate = useNavigate();

  const [selectedProjectPath, setSelectedProjectPath] = useState<string | null>(
    null,
  );
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [recents, setRecents] = useState<RecentItem[]>([]);

  // Refresh keys for landing pages (bump after create/delete)
  const [agentsRefreshKey, setAgentsRefreshKey] = useState(0);
  const [skillsRefreshKey, setSkillsRefreshKey] = useState(0);
  const [mcpRefreshKey, setMcpRefreshKey] = useState(0);

  // Modal for skill / mcp-server create
  const [modalType, setModalType] = useState<
    "agent" | "skill" | "mcp-server" | null
  >(null);

  // Auto-load most recent project on mount
  useEffect(() => {
    fetchProjects()
      .then((projects) => {
        if (projects.length === 0) return;
        const stored = localStorage.getItem(RECENT_PROJECT_KEY);
        const match = stored ? projects.find((p) => p.path === stored) : null;
        const fallback =
          projects.find((p) => p.name === "global") ?? projects[0];
        const target = match ?? fallback;
        if (target) {
          setSelectedProjectPath(target.path);
          setRecents(readRecents(target.path));
          navigate(`/${encodeProject(target.path)}`, { replace: true });
        }
      })
      .catch(() => {
        /* server not ready — stay on root */
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const addToRecents = (type: RecentItem["type"], name: string) => {
    if (!selectedProjectPath) return;
    const updated = addRecentItem(selectedProjectPath, type, name);
    setRecents(updated);
  };

  const removeFromRecents = (type: RecentItem["type"], name: string) => {
    if (!selectedProjectPath) return;
    const updated = removeRecentItem(selectedProjectPath, type, name);
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
    if (item.type === "agent") {
      navigate(
        `/${encodeProject(selectedProjectPath)}/agents/${encodeURIComponent(item.name)}`,
      );
    } else if (item.type === "skill") {
      navigate(
        `/${encodeProject(selectedProjectPath)}/skills/${encodeURIComponent(item.name)}`,
      );
    } else {
      navigate(
        `/${encodeProject(selectedProjectPath)}/mcp/${encodeURIComponent(item.name)}`,
      );
    }
  };

  const handleCreateNew = (type: "agent" | "skill" | "mcp-server") => {
    if (!selectedProjectPath) return;
    if (type === "agent") {
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
    if (type === "skill") {
      setSkillsRefreshKey((k) => k + 1);
      navigate(
        `/${encodeProject(selectedProjectPath)}/skills/${encodeURIComponent(name)}`,
      );
    } else if (type === "mcp-server") {
      setMcpRefreshKey((k) => k + 1);
      navigate(
        `/${encodeProject(selectedProjectPath)}/mcp/${encodeURIComponent(name)}`,
      );
    }
  };

  const shellContextValue: ShellContextValue = {
    selectedProjectPath,
    onProjectSelect: handleProjectSelect,
    recents,
    onRecentClick: handleRecentClick,
    addToRecents,
    removeFromRecents,
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
          <Route
            path="/:projectId/agents/new"
            element={<AgentCreateContent />}
          />
          <Route
            path="/:projectId/agents/:name"
            element={<AgentEditorContent />}
          />

          {/* Skills */}
          <Route path="/:projectId/skills" element={<SkillsLandingContent />} />
          <Route path="/:projectId/skills/:name" element={<SkillLayout />}>
            <Route index element={<SkillEditorContent />} />
            <Route path=":file" element={<SkillFileContent />} />
          </Route>

          {/* MCP */}
          <Route path="/:projectId/mcp" element={<McpLandingContent />} />
          <Route path="/:projectId/mcp/:name" element={<McpEditorContent />} />

          {/* Plugins */}
          <Route path="/:projectId/plugins" element={<PluginsContent />} />
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
