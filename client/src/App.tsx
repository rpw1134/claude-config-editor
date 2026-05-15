import { useEffect, useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { EditorPane } from './components/Editor/EditorPane';
import { WelcomePane, NoProjectPane } from './components/WelcomePane';
import { AgentsLandingPage, SkillsLandingPage, McpLandingPage } from './components/LandingPage';
import { CreateNewModal } from './components/CreateNewModal';
import { AgentCreateFlow } from './components/AgentCreateFlow';
import { fetchProjects } from './lib/api';
import { addRecentItem, readRecents } from './hooks/useRecents';
import type { RecentItem } from './hooks/useRecents';

const RECENT_PROJECT_KEY = 'ccs:recentProject';

type ActiveTab =
  | 'claude-md'
  | 'agents'
  | 'skills'
  | 'mcp-servers'
  | 'welcome'
  | 'landing-agents'
  | 'landing-skills'
  | 'landing-mcp';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('welcome');
  const [selectedProjectPath, setSelectedProjectPath] = useState<string | null>(null);
  const [selectedName, setSelectedName] = useState<string | null>(null);
  const [creatingType, setCreatingType] = useState<'agent' | 'skill' | 'mcp-server' | null>(null);
  const [agentCreateMode, setAgentCreateMode] = useState(false);

  // Refresh keys for landing pages
  const [agentsRefreshKey, setAgentsRefreshKey] = useState(0);
  const [skillsRefreshKey, setSkillsRefreshKey] = useState(0);
  const [mcpRefreshKey, setMcpRefreshKey] = useState(0);

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Recents — stored in localStorage, kept as state so sidebar re-renders on changes
  const [recents, setRecents] = useState<RecentItem[]>([]);

  // Auto-load the most recent project on mount
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
          setActiveTab('welcome');
        }
      })
      .catch(() => {/* server not ready — stay on no-project screen */});
  }, []);

  // ── Recents helper ─────────────────────────────────────────────────────────

  const addToRecents = (type: RecentItem['type'], name: string) => {
    if (!selectedProjectPath) return;
    const updated = addRecentItem(selectedProjectPath, type, name);
    setRecents(updated);
  };

  // ── Project selection ──────────────────────────────────────────────────────

  const handleProjectSelect = (path: string) => {
    localStorage.setItem(RECENT_PROJECT_KEY, path);
    setSelectedProjectPath(path);
    setRecents(readRecents(path));
    setSelectedName(null);
    setCreatingType(null);
    setAgentCreateMode(false);
    setActiveTab('welcome');
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab as ActiveTab);
    setSelectedName(null);
    setCreatingType(null);
    setAgentCreateMode(false);
  };

  // ── Item selection (from landing pages or recents) ─────────────────────────

  const handleSelectAgent = (name: string) => {
    addToRecents('agent', name);
    setActiveTab('agents');
    setSelectedName(name);
    setCreatingType(null);
  };

  const handleSelectSkill = (name: string) => {
    addToRecents('skill', name);
    setActiveTab('skills');
    setSelectedName(name);
    setCreatingType(null);
  };

  const handleSelectMcp = (name: string) => {
    addToRecents('mcp-server', name);
    setActiveTab('mcp-servers');
    setSelectedName(name);
    setCreatingType(null);
  };

  // ── Recents click ──────────────────────────────────────────────────────────

  const handleRecentClick = (item: RecentItem) => {
    if (item.type === 'agent') handleSelectAgent(item.name);
    else if (item.type === 'skill') handleSelectSkill(item.name);
    else handleSelectMcp(item.name);
  };

  // ── Create New modal ───────────────────────────────────────────────────────

  // Modal state lives here so both the sidebar and landing pages can trigger it
  const [modalType, setModalType] = useState<'agent' | 'skill' | 'mcp-server' | null>(null);

  const handleCreateNew = (type: 'agent' | 'skill' | 'mcp-server') => {
    if (type === 'agent') {
      setAgentCreateMode(true);
      setActiveTab('landing-agents');
      setSelectedName(null);
    } else {
      setModalType(type);
    }
  };

  const handleAgentFlowCreated = (name: string) => {
    setAgentCreateMode(false);
    setAgentsRefreshKey((k) => k + 1);
    addToRecents('agent', name);
    handleSelectAgent(name);
  };

  const handleAgentFlowCancel = () => {
    setAgentCreateMode(false);
  };

  const handleModalSuccess = (name: string) => {
    const type = modalType!;
    setModalType(null);

    // Add to recents
    addToRecents(type, name);

    // Bump refresh key for that type's landing page
    if (type === 'agent') setAgentsRefreshKey((k) => k + 1);
    else if (type === 'skill') setSkillsRefreshKey((k) => k + 1);
    else setMcpRefreshKey((k) => k + 1);

    // Navigate to editor for the new item
    if (type === 'agent') {
      setActiveTab('agents');
    } else if (type === 'skill') {
      setActiveTab('skills');
    } else {
      setActiveTab('mcp-servers');
    }
    setSelectedName(name);
    setCreatingType(null);
  };

  const handleModalClose = () => {
    setModalType(null);
  };

  // ── Editor events ──────────────────────────────────────────────────────────

  const handleCreated = (name: string) => {
    if (activeTab === 'agents') { setAgentsRefreshKey((k) => k + 1); addToRecents('agent', name); }
    else if (activeTab === 'skills') { setSkillsRefreshKey((k) => k + 1); addToRecents('skill', name); }
    else if (activeTab === 'mcp-servers') { setMcpRefreshKey((k) => k + 1); addToRecents('mcp-server', name); }
    setCreatingType(null);
    setSelectedName(name);
  };

  const handleDeleted = () => {
    if (activeTab === 'agents') setAgentsRefreshKey((k) => k + 1);
    else if (activeTab === 'skills') setSkillsRefreshKey((k) => k + 1);
    else if (activeTab === 'mcp-servers') setMcpRefreshKey((k) => k + 1);
    setSelectedName(null);
    setActiveTab('welcome');
  };

  const handleEditorClose = () => {
    setSelectedName(null);
    setCreatingType(null);
    setActiveTab('welcome');
  };

  // ── Welcome pane quick-access ──────────────────────────────────────────────

  const handleWelcomeAgents = () => { setActiveTab('landing-agents'); setSelectedName(null); };
  const handleWelcomeSkills = () => { setActiveTab('landing-skills'); setSelectedName(null); };
  const handleWelcomeMcp    = () => { setActiveTab('landing-mcp');    setSelectedName(null); };

  // ── Derived state ──────────────────────────────────────────────────────────

  const editorType =
    activeTab === 'claude-md'   ? 'project'    :
    activeTab === 'agents'      ? 'agent'      :
    activeTab === 'mcp-servers' ? 'mcp-server' :
    'skill';

  const showEditor =
    selectedProjectPath !== null &&
    (activeTab === 'claude-md' ||
      ((activeTab === 'agents' || activeTab === 'skills' || activeTab === 'mcp-servers') &&
        (selectedName !== null || creatingType !== null)));

  const isLandingTab =
    activeTab === 'landing-agents' ||
    activeTab === 'landing-skills' ||
    activeTab === 'landing-mcp';

  const showWelcome = selectedProjectPath !== null && !showEditor && !isLandingTab;

  const editorKey =
    activeTab === 'claude-md'
      ? `claude-md:${selectedProjectPath}`
      : creatingType !== null
      ? `create:${creatingType}:${selectedProjectPath}`
      : `edit:${activeTab}:${selectedProjectPath}:${selectedName}`;

  const editorName =
    activeTab === 'claude-md'
      ? selectedProjectPath
      : creatingType !== null
      ? null
      : selectedName;

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="flex h-screen bg-[#0a0a0c] text-white overflow-hidden">
      <Sidebar
        activeTab={activeTab}
        onTabChange={handleTabChange}
        selectedProjectPath={selectedProjectPath}
        onProjectSelect={handleProjectSelect}
        collapsed={sidebarCollapsed}
        onToggleCollapsed={() => setSidebarCollapsed((v) => !v)}
        recents={recents}
        onRecentClick={handleRecentClick}
        onCreateNew={handleCreateNew}
      />

      <main className="flex flex-1 overflow-hidden">
        {!selectedProjectPath && <NoProjectPane />}

        {showWelcome && selectedProjectPath && (
          <WelcomePane
            projectName={selectedProjectPath.split('/').pop() ?? selectedProjectPath}
            onOpenClaudeMd={() => handleTabChange('claude-md')}
            onOpenAgents={handleWelcomeAgents}
            onOpenSkills={handleWelcomeSkills}
            onOpenMcp={handleWelcomeMcp}
          />
        )}

        {/* Landing pages */}
        {selectedProjectPath && activeTab === 'landing-agents' && !agentCreateMode && (
          <AgentsLandingPage
            projectPath={selectedProjectPath}
            selectedName={selectedName}
            refreshKey={agentsRefreshKey}
            onSelect={handleSelectAgent}
            onNew={() => handleCreateNew('agent')}
          />
        )}
        {selectedProjectPath && activeTab === 'landing-agents' && agentCreateMode && (
          <AgentCreateFlow
            projectPath={selectedProjectPath}
            onCreated={handleAgentFlowCreated}
            onCancel={handleAgentFlowCancel}
          />
        )}
        {selectedProjectPath && activeTab === 'landing-skills' && (
          <SkillsLandingPage
            projectPath={selectedProjectPath}
            selectedName={selectedName}
            refreshKey={skillsRefreshKey}
            onSelect={handleSelectSkill}
            onNew={() => handleCreateNew('skill')}
          />
        )}
        {selectedProjectPath && activeTab === 'landing-mcp' && (
          <McpLandingPage
            projectPath={selectedProjectPath}
            selectedName={selectedName}
            refreshKey={mcpRefreshKey}
            onSelect={handleSelectMcp}
            onNew={() => handleCreateNew('mcp-server')}
          />
        )}

        {showEditor && (
          <EditorPane
            key={editorKey}
            name={editorName}
            type={editorType}
            projectPath={selectedProjectPath}
            onClose={handleEditorClose}
            onCreated={handleCreated}
            onDeleted={handleDeleted}
          />
        )}
      </main>

      {/* Create New modal */}
      {modalType && selectedProjectPath && (
        <CreateNewModal
          type={modalType}
          projectPath={selectedProjectPath}
          onSuccess={handleModalSuccess}
          onClose={handleModalClose}
        />
      )}
    </div>
  );
}
