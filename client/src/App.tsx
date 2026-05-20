import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { Routes, Route, useNavigate } from "react-router-dom";
import { NoProjectPane } from "./components/Pages/WelcomePane";
import { CreateNewModal } from "./components/Modals/CreateNewModal";
import { McpCreateModal } from "./components/Modals/McpCreateModal";
import { CreateProjectModal } from "./components/Modals/CreateProjectModal";
import { Toast } from "./components/Shared/Toast";
import { LayoutRoute } from "./components/Layout/Shell";
import {
  AgentsLandingContent,
  AgentCreateContent,
  AgentEditorContent,
} from "./routes/AgentRoutes";
import {
  McpLandingContent,
  McpEditorContent,
} from "./routes/McpRoutes";
import {
  ProjectWelcomeContent,
  ClaudeMdContent,
  ProjectSettingsContent,
  HooksContent,
} from "./routes/ProjectRoutes";
import {
  SkillsLandingContent,
  SkillLayout,
  SkillEditorContent,
  SkillFileContent,
  SkillHistoryContent,
  ScriptsTabContent,
  ScriptEditorContent,
} from "./routes/SkillRoutes";
import { VCContent } from "./routes/VCRoutes";
import { ShellContext } from "./contexts/ShellContext";
import { VersionControlProvider } from "./contexts/VersionControlContext";
import type { ShellContextValue } from "./contexts/ShellContext";
import { encodeProject } from "./lib/navigation";
import { fetchProjects } from "./lib/api";
import {
  addRecentItem,
  readRecents,
  removeRecentItem,
} from "./hooks/useRecents";
import type { RecentItem } from "./hooks/useRecents";

const RECENT_PROJECT_KEY = "ccs:recentProject";

// / (root — no project)
const RootContent = () => <NoProjectPane />;

export default function App() {
  const navigate = useNavigate();

  const [selectedProjectPath, setSelectedProjectPath] = useState<string | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [recents, setRecents] = useState<RecentItem[]>([]);

  // Refresh keys for landing pages (bump after create/delete)
  const [agentsRefreshKey, setAgentsRefreshKey] = useState(0);
  const [skillsRefreshKey, setSkillsRefreshKey] = useState(0);
  const [mcpRefreshKey, setMcpRefreshKey] = useState(0);
  const [projectsRefreshKey, setProjectsRefreshKey] = useState(0);
  const [vcRefreshKey, setVcRefreshKey] = useState(0);
  const onBumpProjectsRefresh = useCallback(
    () => setProjectsRefreshKey((k) => k + 1),
    [],
  );
  const onBumpVcRefresh = useCallback(() => setVcRefreshKey((k) => k + 1), []);

  // Modal for skill / mcp-server create
  const [modalType, setModalType] = useState<
    "agent" | "skill" | "mcp-server" | "project" | null
  >(null);

  // Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const showToast = useCallback((message: string) => {
    setToastMessage(message);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setToastMessage(null), 3000);
  }, []);

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

  const handleCreateNew = (
    type: "agent" | "skill" | "mcp-server" | "project",
  ) => {
    if (type === "project") {
      setModalType("project");
      return;
    }
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
    if (type !== "project") addToRecents(type, name);
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
    projectsRefreshKey,
    onBumpAgentsRefresh: () => setAgentsRefreshKey((k) => k + 1),
    onBumpSkillsRefresh: () => setSkillsRefreshKey((k) => k + 1),
    onBumpMcpRefresh: () => setMcpRefreshKey((k) => k + 1),
    onBumpProjectsRefresh,
    vcRefreshKey,
    onBumpVcRefresh,
    showToast,
  };

  return (
    <>
      <ShellContext.Provider value={shellContextValue}>
        <VersionControlProvider
          projectPath={selectedProjectPath}
          vcRefreshKey={vcRefreshKey}
        >
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
                <Route path="scripts" element={<ScriptsTabContent />} />
                <Route path="scripts/:scriptFile" element={<ScriptEditorContent />} />
                <Route path="history" element={<SkillHistoryContent />} />
                <Route path=":file" element={<SkillFileContent />} />
              </Route>

              {/* MCP */}
              <Route path="/:projectId/mcp" element={<McpLandingContent />} />
              <Route path="/:projectId/mcp/:name" element={<McpEditorContent />} />

              {/* Settings */}
              <Route
                path="/:projectId/settings"
                element={<ProjectSettingsContent />}
              />

              {/* Hooks */}
              <Route path="/:projectId/hooks" element={<HooksContent />} />

              {/* Version Control */}
              <Route
                path="/:projectId/version-control"
                element={<VCContent />}
              />
            </Route>
          </Routes>

          {/* Create modals */}
          {modalType === "skill" && selectedProjectPath && (
            <CreateNewModal
              type="skill"
              projectPath={selectedProjectPath}
              onSuccess={handleModalSuccess}
              onClose={() => setModalType(null)}
            />
          )}
          {modalType === "mcp-server" && selectedProjectPath && (
            <McpCreateModal
              projectPath={selectedProjectPath}
              onSuccess={(name) => {
                setModalType(null);
                addToRecents("mcp-server", name);
                setMcpRefreshKey((k) => k + 1);
                navigate(
                  `/${encodeProject(selectedProjectPath)}/mcp/${encodeURIComponent(name)}`,
                );
              }}
              onClose={() => setModalType(null)}
            />
          )}
          {modalType === "project" && (
            <CreateProjectModal
              onSuccess={(absolutePath) => {
                setModalType(null);
                onBumpProjectsRefresh();
                handleProjectSelect(absolutePath);
                showToast(`Project created`);
              }}
              onClose={() => setModalType(null)}
            />
          )}
        </VersionControlProvider>
      </ShellContext.Provider>
      {toastMessage && <Toast message={toastMessage} />}
    </>
  );
}
