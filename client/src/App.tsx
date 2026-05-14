import { useEffect, useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { SidebarAgentsList, SidebarSkillsList, SidebarMcpList } from './components/SidebarLists';
import { EditorPane } from './components/Editor/EditorPane';
import { WelcomePane, NoProjectPane } from './components/WelcomePane';
import { fetchProjects } from './lib/api';

const RECENT_PROJECT_KEY = 'ccs:recentProject';

type ActiveTab = 'claude-md' | 'agents' | 'skills' | 'mcp-servers' | 'welcome';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('welcome');
  const [selectedProjectPath, setSelectedProjectPath] = useState<string | null>(null);
  const [selectedName, setSelectedName] = useState<string | null>(null);
  const [creatingType, setCreatingType] = useState<'agent' | 'skill' | 'mcp-server' | null>(null);
  const [agentsRefreshKey, setAgentsRefreshKey] = useState(0);
  const [skillsRefreshKey, setSkillsRefreshKey] = useState(0);
  const [mcpRefreshKey, setMcpRefreshKey] = useState(0);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Auto-load the most recent project on mount
  useEffect(() => {
    fetchProjects().then((projects) => {
      if (projects.length === 0) return;
      const stored = localStorage.getItem(RECENT_PROJECT_KEY);
      const match = stored ? projects.find((p) => p.path === stored) : null;
      const fallback = projects.find((p) => p.name === 'global') ?? projects[0];
      const target = match ?? fallback;
      if (target) {
        setSelectedProjectPath(target.path);
        setActiveTab('welcome');
      }
    }).catch(() => {/* server not ready — stay on no-project screen */});
  }, []);

  const handleProjectSelect = (path: string) => {
    localStorage.setItem(RECENT_PROJECT_KEY, path);
    setSelectedProjectPath(path);
    setSelectedName(null);
    setCreatingType(null);
    setActiveTab('welcome');
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab as ActiveTab);
    setSelectedName(null);
    setCreatingType(null);
  };

  // Sidebar list item selected → open that item in the editor
  const handleSelectAgent = (name: string) => {
    setActiveTab('agents');
    setSelectedName(name);
    setCreatingType(null);
  };

  const handleSelectSkill = (name: string) => {
    setActiveTab('skills');
    setSelectedName(name);
    setCreatingType(null);
  };

  const handleSelectMcp = (name: string) => {
    setActiveTab('mcp-servers');
    setSelectedName(name);
    setCreatingType(null);
  };

  // "+" buttons in the sidebar
  const handleNewAgent = () => {
    setActiveTab('agents');
    setSelectedName(null);
    setCreatingType('agent');
  };

  const handleNewSkill = () => {
    setActiveTab('skills');
    setSelectedName(null);
    setCreatingType('skill');
  };

  const handleNewMcp = () => {
    setActiveTab('mcp-servers');
    setSelectedName(null);
    setCreatingType('mcp-server');
  };

  // Welcome pane quick-access cards — navigate to the section
  const handleWelcomeAgents = () => {
    setActiveTab('agents');
    setSelectedName(null);
    setCreatingType(null);
  };

  const handleWelcomeSkills = () => {
    setActiveTab('skills');
    setSelectedName(null);
    setCreatingType(null);
  };

  const handleWelcomeMcp = () => {
    setActiveTab('mcp-servers');
    setSelectedName(null);
    setCreatingType(null);
  };

  const handleCreated = (name: string) => {
    if (activeTab === 'agents') setAgentsRefreshKey((k) => k + 1);
    else if (activeTab === 'skills') setSkillsRefreshKey((k) => k + 1);
    else if (activeTab === 'mcp-servers') setMcpRefreshKey((k) => k + 1);
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

  // ── Derived state ─────────────────────────────────────────────────────────

  const editorType =
    activeTab === 'claude-md'
      ? 'project'
      : activeTab === 'agents'
      ? 'agent'
      : activeTab === 'mcp-servers'
      ? 'mcp-server'
      : 'skill';

  const showEditor =
    selectedProjectPath !== null &&
    (activeTab === 'claude-md' ||
      ((activeTab === 'agents' || activeTab === 'skills' || activeTab === 'mcp-servers') &&
        (selectedName !== null || creatingType !== null)));

  const showWelcome = selectedProjectPath !== null && !showEditor;

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

  // Selected name for sidebar highlight — only highlight within the active section
  const agentSelected = activeTab === 'agents' ? selectedName : null;
  const skillSelected = activeTab === 'skills' ? selectedName : null;
  const mcpSelected = activeTab === 'mcp-servers' ? selectedName : null;

  // ── Sidebar list content ──────────────────────────────────────────────────

  const listContent = selectedProjectPath ? (
    <div className="pt-1">
      <SidebarAgentsList
        projectPath={selectedProjectPath}
        selectedName={agentSelected}
        refreshKey={agentsRefreshKey}
        onSelect={handleSelectAgent}
        onNew={handleNewAgent}
      />
      <SidebarSkillsList
        projectPath={selectedProjectPath}
        selectedName={skillSelected}
        refreshKey={skillsRefreshKey}
        onSelect={handleSelectSkill}
        onNew={handleNewSkill}
      />
      <SidebarMcpList
        projectPath={selectedProjectPath}
        selectedName={mcpSelected}
        refreshKey={mcpRefreshKey}
        onSelect={handleSelectMcp}
        onNew={handleNewMcp}
      />
    </div>
  ) : undefined;

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="flex h-screen bg-[#0a0a0c] text-white overflow-hidden">
      <Sidebar
        activeTab={activeTab}
        onTabChange={handleTabChange}
        selectedProjectPath={selectedProjectPath}
        onProjectSelect={handleProjectSelect}
        listContent={listContent}
        collapsed={sidebarCollapsed}
        onToggleCollapsed={() => setSidebarCollapsed((v) => !v)}
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
    </div>
  );
}
