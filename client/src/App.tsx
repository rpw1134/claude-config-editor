import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Routes, Route, useNavigate, useParams, Navigate, Outlet, useLocation, useBlocker } from 'react-router-dom';
import { SkillTabBar } from './components/Editor/SkillTabBar';
import type { SkillTabId } from './components/Editor/SkillTabBar';
import { Sidebar } from './components/Sidebar';
import { EditorPane } from './components/Editor/EditorPane';
import { SkillDirectoryView } from './components/Editor/SkillDirectoryView';
import { SkillFormEditor } from './components/Editor/SkillFormEditor';
import { PlainFileEditor, resolvedFilePath } from './components/Editor/PlainFileEditor';
import { WelcomePane, NoProjectPane } from './components/WelcomePane';
import { AgentsLandingPage, SkillsLandingPage, McpLandingPage } from './components/LandingPage';
import { CreateNewModal } from './components/CreateNewModal';
import { AgentCreateFlow } from './components/AgentCreateFlow';
import {
  fetchProjects,
  fetchSkillContent,
  fetchSkillFile,
  updateSkillContent,
  updateSkillFile,
  deleteSkill,
  createSkillFile,
} from './lib/api';
import { parseSkillFrontmatter, serializeSkillFrontmatter } from './lib/frontmatter';
import { addRecentItem, readRecents, removeRecentItem } from './hooks/useRecents';
import type { RecentItem } from './hooks/useRecents';

const RECENT_PROJECT_KEY = 'ccs:recentProject';

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
  addToRecents: (type: RecentItem['type'], name: string) => void;
  removeFromRecents: (type: RecentItem['type'], name: string) => void;
  onCreateNew: (type: 'agent' | 'skill' | 'mcp-server') => void;
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
  if (!ctx) throw new Error('useShell must be used inside ShellContext.Provider');
  return ctx;
};

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';
type DeleteStatus = 'idle' | 'confirm' | 'deleting' | 'error';

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
  if (!ctx) throw new Error('useSkillDrafts must be used inside SkillDraftContext.Provider');
  return ctx;
};

// ── Skill header (top-level save/path controls) ─────────────────────────────

type SkillHeaderConfig = {
  filePath: string;
  saveStatus: SaveStatus;
  saveDisabled: boolean;
  onSave: () => void;
  rightSlot?: React.ReactNode;
};

interface SkillHeaderContextValue {
  setHeader: (config: SkillHeaderConfig | null) => void;
}

const SkillHeaderContext = createContext<SkillHeaderContextValue | null>(null);

const useSkillHeader = (): SkillHeaderContextValue => {
  const ctx = useContext(SkillHeaderContext);
  if (!ctx) throw new Error('useSkillHeader must be used inside SkillHeaderContext.Provider');
  return ctx;
};

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
      projectName={projectPath.split('/').pop() ?? projectPath}
      onOpenClaudeMd={() => navigate(`/${encodeProject(projectPath)}/claude-md`)}
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
        addToRecents('agent', name);
        navigate(`/${encodeProject(projectPath)}/agents/${encodeURIComponent(name)}`);
      }}
      onNew={() => onCreateNew('agent')}
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
        addToRecents('agent', name);
        navigate(`/${encodeProject(projectPath)}/agents/${encodeURIComponent(name)}`);
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
        removeFromRecents('agent', agentName);
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
        addToRecents('skill', name);
        navigate(`/${encodeProject(projectPath)}/skills/${encodeURIComponent(name)}`);
      }}
      onNew={() => onCreateNew('skill')}
    />
  );
};

// ── Shared unsaved-changes modal ─────────────────────────────────────────────

const UnsavedModal = ({ onLeave, onKeep }: { onLeave: () => void; onKeep: () => void }) => (
  <div
    className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
    onClick={onKeep}
  >
    <div
      className="bg-(--bg-surface) rounded-4.5 border border-(--border-subtle) p-8 max-w-90 w-full mx-4 shadow-2xl"
      onClick={(e) => e.stopPropagation()}
    >
      <h2 className="m-0 mb-2 text-[20px] font-bold text-(--text-primary)">Unsaved changes</h2>
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

const SKILL_SECTIONS = new Set(['identity', 'instructions', 'settings']);
type SkillSection = 'identity' | 'instructions' | 'settings';

// /:projectId/skills/:name  — shared layout (tab bar stays mounted across tab switches)
const SkillLayout = () => {
  const { projectId, name } = useParams<{ projectId: string; name: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const match = location.pathname.match(/^\/[^/]+\/skills\/[^/]+(?:\/([^/]+))?$/);
  const rawFile = match?.[1] ? decodeURIComponent(match[1]) : undefined;

  const projectPath = projectId ? decodeProject(projectId) : '';
  const skillName = name ? decodeURIComponent(name) : '';

  const isSkillSection = rawFile ? SKILL_SECTIONS.has(rawFile) : false;
  // For SKILL.md sections, pass the section name as activeTab so no file tab is highlighted
  const activeTab = (rawFile ?? 'directory') as SkillTabId;

  const draftStore = useRef<Record<string, SkillDraft>>({});
  const getDraft = useCallback((file: string) => draftStore.current[file] ?? null, []);
  const setDraft = useCallback((file: string, draft: SkillDraft) => {
    draftStore.current[file] = draft;
  }, []);
  const clearDrafts = useCallback(() => {
    draftStore.current = {};
  }, []);

  const [headerConfig, setHeaderConfig] = useState<SkillHeaderConfig | null>(null);

  const draftContextValue = useMemo<SkillDraftContextValue>(
    () => ({ getDraft, setDraft, clear: clearDrafts }),
    [getDraft, setDraft, clearDrafts]
  );

  const headerContextValue = useMemo<SkillHeaderContextValue>(
    () => ({ setHeader: setHeaderConfig }),
    []
  );

  useEffect(() => {
    clearDrafts();
  }, [clearDrafts, projectPath, skillName]);

  useEffect(() => {
    if (activeTab === 'directory') setHeaderConfig(null);
  }, [activeTab]);

  const headerSaveLabel = headerConfig
    ? headerConfig.saveStatus === 'saving'
      ? 'Saving…'
      : headerConfig.saveStatus === 'saved'
      ? 'Saved ✓'
      : headerConfig.saveDisabled
      ? 'Up to date'
      : 'Save'
    : '';
  const headerSaveDisabled = headerConfig
    ? headerConfig.saveDisabled && headerConfig.saveStatus !== 'saved'
    : true;
  const headerActions = headerConfig
    ? {
        filePath: headerConfig.filePath,
        saveLabel: headerSaveLabel,
        saveDisabled: headerSaveDisabled,
        onSave: headerConfig.onSave,
        rightSlot: headerConfig.rightSlot,
      }
    : null;

  return (
    <div className="flex flex-1 flex-col h-full w-full bg-(--bg-base) border-l border-(--border-faint)">
      <SkillTabBar
        activeTab={activeTab}
        skillName={skillName}
        projectPath={projectPath}
        onBack={() => navigate(`/${encodeProject(projectPath)}/skills`)}
        headerActions={headerActions}
      />
      <SkillDraftContext.Provider value={draftContextValue}>
        <SkillHeaderContext.Provider value={headerContextValue}>
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
        </SkillHeaderContext.Provider>
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
  const { setHeader } = useSkillHeader();
  const draftKey = 'SKILL.md';
  const cachedDraft = draftStore.getDraft(draftKey);
  const cachedEdits = cachedDraft?.hasEdits ?? (cachedDraft ? cachedDraft.fileContent !== cachedDraft.savedContent : false);

  const [fileContent, setFileContent] = useState(cachedDraft?.fileContent ?? '');
  const [savedContent, setSavedContent] = useState(cachedDraft?.savedContent ?? '');
  const [contentLoading, setContentLoading] = useState(cachedDraft?.contentLoading ?? true);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>(cachedDraft?.saveStatus ?? 'idle');
  const [deleteStatus, setDeleteStatus] = useState<DeleteStatus>(cachedDraft?.deleteStatus ?? 'idle');
  const [hasEdits, setHasEdits] = useState(cachedEdits);

  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const deleteTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const dirty = !contentLoading && fileContent !== savedContent;

  useEffect(() => () => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    if (deleteTimer.current) clearTimeout(deleteTimer.current);
  }, []);

  // Load SKILL.md once — the key on SkillLayout ensures remount only when skill changes
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const cached = draftStore.getDraft(draftKey);
      if (cached?.initialized) {
        setFileContent(cached.fileContent);
        setSavedContent(cached.savedContent);
        setSaveStatus(cached.saveStatus);
        setDeleteStatus(cached.deleteStatus ?? 'idle');
        setHasEdits(cached.hasEdits ?? cached.fileContent !== cached.savedContent);
        setContentLoading(false);
        return;
      }
      setContentLoading(true);
      setFileContent('');
      setSavedContent('');
      setSaveStatus('idle');
      setHasEdits(false);
      try {
        const raw = await fetchSkillContent(projectPath, skillName);
        if (cancelled) return;
        const { frontmatter, body } = parseSkillFrontmatter(raw);
        if (!frontmatter.name) {
          const filled = serializeSkillFrontmatter({ ...frontmatter, name: skillName }, body);
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
        if (!cancelled) { setFileContent(''); setSavedContent(''); }
      } finally {
        if (!cancelled) setContentLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [projectPath, skillName, draftStore, draftKey]);

  useEffect(() => {
    draftStore.setDraft(draftKey, {
      initialized: !contentLoading,
      fileContent,
      savedContent,
      contentLoading,
      saveStatus,
      deleteStatus,
      hasEdits,
    });
  }, [draftStore, fileContent, savedContent, contentLoading, saveStatus, deleteStatus, hasEdits]);

  const handleSave = useCallback(async () => {
    if (!dirty || saveStatus === 'saving') return;
    setSaveStatus('saving');
    try {
      await updateSkillContent(projectPath, skillName, fileContent);
      setSavedContent(fileContent);
      setHasEdits(false);
      setSaveStatus('saved');
      saveTimer.current = setTimeout(() => setSaveStatus('idle'), 1500);
    } catch {
      setSaveStatus('error');
      saveTimer.current = setTimeout(() => setSaveStatus('idle'), 2000);
    }
  }, [dirty, saveStatus, projectPath, skillName, fileContent]);

  useEffect(() => {
    setHeader({
      filePath: resolvedFilePath(projectPath, skillName, 'SKILL.md'),
      saveStatus,
      saveDisabled: !dirty || saveStatus === 'saving',
      onSave: handleSave,
    });
    return () => setHeader(null);
  }, [setHeader, projectPath, skillName, saveStatus, dirty, handleSave]);

  // Cmd+S shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') { e.preventDefault(); void handleSave(); }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  });

  // Block navigation away from this skill when dirty
  const blocker = useBlocker(({ currentLocation, nextLocation }) => {
    if (!dirty || !hasEdits || currentLocation.pathname === nextLocation.pathname) return false;
    return !isSameSkillRoute(currentLocation.pathname, nextLocation.pathname);
  });
  useEffect(() => {
    if (!dirty && blocker.state === 'blocked') blocker.reset();
  }, [dirty, blocker]);

  async function handleDeleteSkill() {
    if (deleteStatus === 'deleting') return;
    if (deleteStatus !== 'confirm') {
      setDeleteStatus('confirm');
      deleteTimer.current = setTimeout(() => setDeleteStatus('idle'), 3000);
      return;
    }
    if (deleteTimer.current) clearTimeout(deleteTimer.current);
    setDeleteStatus('deleting');
    try {
      await deleteSkill(projectPath, skillName);
      onBumpSkillsRefresh();
      removeFromRecents('skill', skillName);
      navigate(`/${encodeProject(projectPath)}/skills`);
    } catch {
      setDeleteStatus('error');
      deleteTimer.current = setTimeout(() => setDeleteStatus('idle'), 2000);
    }
  }

  if (contentLoading) return <div className="flex-1" />;

  return (
    <>
      {blocker.state === 'blocked' && (
        <UnsavedModal onLeave={() => blocker.proceed()} onKeep={() => blocker.reset()} />
      )}
      <SkillFormEditor
        content={fileContent}
        onChange={(next) => {
          setHasEdits(true);
          setFileContent(next);
        }}
        onDelete={handleDeleteSkill}
        deleteStatus={deleteStatus}
        disabled={saveStatus === 'saving'}
        activeSection={section}
      />
    </>
  );
};

// /:projectId/skills/:name/reference.md|examples.md — supplementary file editor
const SkillFileContent = () => {
  const { projectId, name, file } = useParams<{ projectId: string; name: string; file: string }>();
  const draftStore = useSkillDrafts();
  const { setHeader } = useSkillHeader();

  const projectPath = projectId ? decodeProject(projectId) : null;
  const skillName = name ? decodeURIComponent(name) : null;
  const fileName = file ? decodeURIComponent(file) : null;

  const cachedDraft = fileName ? draftStore.getDraft(fileName) : null;
  const cachedEdits = cachedDraft?.hasEdits ?? (cachedDraft ? cachedDraft.fileContent !== cachedDraft.savedContent : false);
  const [fileContent, setFileContent] = useState(cachedDraft?.fileContent ?? '');
  const [savedContent, setSavedContent] = useState(cachedDraft?.savedContent ?? '');
  const [contentLoading, setContentLoading] = useState(cachedDraft?.contentLoading ?? true);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>(cachedDraft?.saveStatus ?? 'idle');
  const [previewMode, setPreviewMode] = useState(false);
  const [hasEdits, setHasEdits] = useState(cachedEdits);

  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dirty = !contentLoading && fileContent !== savedContent;

  useEffect(() => () => { if (saveTimer.current) clearTimeout(saveTimer.current); }, []);

  useEffect(() => {
    if (!projectPath || !skillName || !fileName) return;
    let cancelled = false;
    const load = async () => {
      const cached = draftStore.getDraft(fileName);
      if (cached?.initialized) {
        setFileContent(cached.fileContent);
        setSavedContent(cached.savedContent);
        setSaveStatus(cached.saveStatus);
        setHasEdits(cached.hasEdits ?? cached.fileContent !== cached.savedContent);
        setContentLoading(false);
        return;
      }
      setContentLoading(true);
      setFileContent('');
      setSavedContent('');
      setSaveStatus('idle');
      setHasEdits(false);
      try { await createSkillFile(projectPath, skillName, fileName); } catch { /* already exists */ }
      try {
        const raw = await fetchSkillFile(projectPath, skillName, fileName);
        if (cancelled) return;
        setFileContent(raw);
        setSavedContent(raw);
        setHasEdits(false);
      } catch {
        if (!cancelled) { setFileContent(''); setSavedContent(''); }
      } finally {
        if (!cancelled) setContentLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [projectPath, skillName, fileName, draftStore]);

  useEffect(() => {
    if (!fileName) return;
    draftStore.setDraft(fileName, {
      initialized: !contentLoading,
      fileContent,
      savedContent,
      contentLoading,
      saveStatus,
      hasEdits,
    });
  }, [draftStore, fileName, fileContent, savedContent, contentLoading, saveStatus, hasEdits]);

  const blocker = useBlocker(({ currentLocation, nextLocation }) => {
    if (!dirty || !hasEdits || currentLocation.pathname === nextLocation.pathname) return false;
    return !isSameSkillRoute(currentLocation.pathname, nextLocation.pathname);
  });
  useEffect(() => {
    if (!dirty && blocker.state === 'blocked') blocker.reset();
  }, [dirty, blocker]);

  if (!projectPath || !skillName || !fileName) return <Navigate to="/" replace />;

  const path = projectPath;
  const skill = skillName;
  const fname = fileName;

  const handleSave = useCallback(async () => {
    if (!dirty || saveStatus === 'saving') return;
    setSaveStatus('saving');
    try {
      await updateSkillFile(path, skill, fname, fileContent);
      setSavedContent(fileContent);
      setHasEdits(false);
      setSaveStatus('saved');
      saveTimer.current = setTimeout(() => setSaveStatus('idle'), 1500);
    } catch {
      setSaveStatus('error');
      saveTimer.current = setTimeout(() => setSaveStatus('idle'), 2000);
    }
  }, [dirty, saveStatus, path, skill, fname, fileContent]);

  useEffect(() => {
    if (!projectPath || !skillName || !fileName) return;
    setHeader({
      filePath: resolvedFilePath(projectPath, skillName, fileName),
      saveStatus,
      saveDisabled: !dirty || saveStatus === 'saving',
      onSave: handleSave,
      rightSlot: (
        <div className="flex items-center bg-(--bg-surface) border border-(--border-subtle) rounded-md p-0.5 shrink-0">
          <button
            type="button"
            onClick={() => setPreviewMode(false)}
            className={[
              'text-[13px] px-2.5 py-0.5 rounded cursor-pointer border-none transition-colors duration-150',
              !previewMode
                ? 'bg-(--bg-elevated) text-(--text-primary)'
                : 'bg-transparent text-(--text-muted) hover:text-(--text-secondary)',
            ].join(' ')}
          >
            Edit
          </button>
          <button
            type="button"
            onClick={() => setPreviewMode(true)}
            className={[
              'text-[13px] px-2.5 py-0.5 rounded cursor-pointer border-none transition-colors duration-150',
              previewMode
                ? 'bg-(--bg-elevated) text-(--text-primary)'
                : 'bg-transparent text-(--text-muted) hover:text-(--text-secondary)',
            ].join(' ')}
          >
            Preview
          </button>
        </div>
      ),
    });
    return () => setHeader(null);
  }, [setHeader, projectPath, skillName, fileName, saveStatus, dirty, previewMode, handleSave]);

  // Cmd+S shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') { e.preventDefault(); void handleSave(); }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  });

  if (contentLoading) return <div className="flex-1" />;

  return (
    <>
      {blocker.state === 'blocked' && (
        <UnsavedModal onLeave={() => blocker.proceed()} onKeep={() => blocker.reset()} />
      )}
      <PlainFileEditor
        file={fname}
        skillName={skill}
        projectPath={path}
        content={fileContent}
        onChange={(next) => {
          setHasEdits(true);
          setFileContent(next);
        }}
        previewMode={previewMode}
      />
    </>
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
        addToRecents('mcp-server', name);
        navigate(`/${encodeProject(projectPath)}/mcp/${encodeURIComponent(name)}`);
      }}
      onNew={() => onCreateNew('mcp-server')}
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
        removeFromRecents('mcp-server', mcpName);
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
    <p className="text-[15px] text-(--text-muted) font-medium">
      Coming soon
    </p>
  </div>
);

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

  const removeFromRecents = (type: RecentItem['type'], name: string) => {
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
          <Route path="/:projectId/agents/new" element={<AgentCreateContent />} />
          <Route path="/:projectId/agents/:name" element={<AgentEditorContent />} />

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
