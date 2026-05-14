import { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { AgentsSection } from './components/sections/AgentsSection';
import { SkillsSection } from './components/sections/SkillsSection';
import { McpServersSection } from './components/sections/McpServersSection';
import { EditorPane } from './components/Editor/EditorPane';

type ActiveTab = 'claude-md' | 'agents' | 'skills' | 'mcp-servers';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('claude-md');
  const [selectedProjectPath, setSelectedProjectPath] = useState<string | null>(null);
  const [selectedName, setSelectedName] = useState<string | null>(null);
  const [creatingType, setCreatingType] = useState<'agent' | 'skill' | 'mcp-server' | null>(null);
  const [agentsRefreshKey, setAgentsRefreshKey] = useState(0);
  const [skillsRefreshKey, setSkillsRefreshKey] = useState(0);
  const [mcpRefreshKey, setMcpRefreshKey] = useState(0);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab as ActiveTab);
    setSelectedName(null);
    setCreatingType(null);
  };

  const handleProjectSelect = (path: string) => {
    setSelectedProjectPath(path);
    setSelectedName(null);
    setCreatingType(null);
    setActiveTab('claude-md');
  };

  const handleNewAgent = () => {
    setSelectedName(null);
    setCreatingType('agent');
  };

  const handleNewSkill = () => {
    setSelectedName(null);
    setCreatingType('skill');
  };

  const handleNewMcpServer = () => {
    setSelectedName(null);
    setCreatingType('mcp-server');
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
    setSelectedName(null);
  };

  const editorType =
    activeTab === 'claude-md'
      ? 'project'
      : activeTab === 'agents'
      ? 'agent'
      : activeTab === 'mcp-servers'
      ? 'mcp-server'
      : 'skill';

  const isClaudeMdTab = activeTab === 'claude-md';
  const isSplitTab = activeTab === 'agents' || activeTab === 'skills' || activeTab === 'mcp-servers';
  const showEditor =
    (isClaudeMdTab && selectedProjectPath !== null) ||
    (isSplitTab && (selectedName !== null || creatingType !== null));

  const editorKey = isClaudeMdTab
    ? `claude-md:${selectedProjectPath}`
    : creatingType !== null
    ? `create:${creatingType}:${selectedProjectPath}`
    : `edit:${activeTab}:${selectedProjectPath}:${selectedName}`;

  const editorName = isClaudeMdTab ? selectedProjectPath : (creatingType !== null ? null : selectedName);

  const sectionContent = (() => {
    if (!selectedProjectPath) return null;
    switch (activeTab) {
      case 'agents':
        return (
          <AgentsSection
            projectPath={selectedProjectPath}
            selectedName={selectedName}
            onSelect={setSelectedName}
            onNew={handleNewAgent}
            refreshKey={agentsRefreshKey}
          />
        );
      case 'skills':
        return (
          <SkillsSection
            projectPath={selectedProjectPath}
            selectedName={selectedName}
            onSelect={setSelectedName}
            onNew={handleNewSkill}
            refreshKey={skillsRefreshKey}
          />
        );
      case 'mcp-servers':
        return (
          <McpServersSection
            projectPath={selectedProjectPath}
            selectedName={selectedName}
            onSelect={setSelectedName}
            onNew={handleNewMcpServer}
            refreshKey={mcpRefreshKey}
          />
        );
      default:
        return null;
    }
  })();

  const sidebar = (
    <Sidebar
      activeTab={activeTab}
      onTabChange={handleTabChange}
      selectedProjectPath={selectedProjectPath}
      onProjectSelect={handleProjectSelect}
    />
  );

  if (!selectedProjectPath) {
    return (
      <div className="flex h-screen bg-[#0a0a0c] text-white overflow-hidden">
        {sidebar}
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-[13px] text-white/25 font-mono">Select a project to get started</p>
          </div>
        </main>
      </div>
    );
  }

  if (isClaudeMdTab) {
    return (
      <div className="flex h-screen bg-[#0a0a0c] text-white overflow-hidden">
        {sidebar}
        <main className="flex flex-1 overflow-hidden">
          <EditorPane
            key={editorKey}
            name={editorName}
            type="project"
            projectPath={selectedProjectPath}
            onClose={() => {}}
            onCreated={handleCreated}
            onDeleted={handleDeleted}
          />
        </main>
      </div>
    );
  }

  if (showEditor) {
    return (
      <div className="flex h-screen bg-[#0a0a0c] text-white overflow-hidden">
        {sidebar}
        <main className="flex flex-1 overflow-hidden">
          <div className="w-90 shrink-0 overflow-y-auto px-8 py-8">
            {sectionContent}
          </div>
          <div className="flex-1 min-w-0">
            <EditorPane
              key={editorKey}
              name={editorName}
              type={editorType}
              projectPath={selectedProjectPath}
              onClose={() => { setSelectedName(null); setCreatingType(null); }}
              onCreated={handleCreated}
              onDeleted={handleDeleted}
            />
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#0a0a0c] text-white overflow-hidden">
      {sidebar}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-8 py-8">
          {sectionContent}
        </div>
      </main>
    </div>
  );
}
