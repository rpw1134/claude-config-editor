import { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { ProjectsSection } from './components/sections/ProjectsSection';
import { AgentsSection } from './components/sections/AgentsSection';
import { SkillsSection } from './components/sections/SkillsSection';
import { McpServersSection } from './components/sections/McpServersSection';
import { EditorPane } from './components/Editor/EditorPane';

type ActiveTab = 'projects' | 'agents' | 'skills' | 'mcp-servers';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('projects');
  const [selectedName, setSelectedName] = useState<string | null>(null);
  const [creatingType, setCreatingType] = useState<'agent' | 'skill' | null>(null);
  const [agentsRefreshKey, setAgentsRefreshKey] = useState(0);
  const [skillsRefreshKey, setSkillsRefreshKey] = useState(0);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab as ActiveTab);
    setSelectedName(null);
    setCreatingType(null);
  };

  const handleNewAgent = () => {
    setSelectedName(null);
    setCreatingType('agent');
  };

  const handleNewSkill = () => {
    setSelectedName(null);
    setCreatingType('skill');
  };

  const handleCreated = (name: string) => {
    if (activeTab === 'agents') setAgentsRefreshKey((k) => k + 1);
    else setSkillsRefreshKey((k) => k + 1);
    setCreatingType(null);
    setSelectedName(name);
  };

  const isSplitTab = activeTab === 'agents' || activeTab === 'skills';
  const showEditor = isSplitTab && (selectedName !== null || creatingType !== null);

  // Key that changes whenever we switch between create and edit mode so
  // EditorPane remounts and its local state (draftName, createStatus, content)
  // starts clean each time.
  const editorKey =
    creatingType !== null ? `create:${creatingType}` : `edit:${activeTab}:${selectedName}`;

  const sectionContent = (() => {
    switch (activeTab) {
      case 'agents':
        return (
          <AgentsSection
            selectedName={selectedName}
            onSelect={setSelectedName}
            onNew={handleNewAgent}
            refreshKey={agentsRefreshKey}
          />
        );
      case 'skills':
        return (
          <SkillsSection
            selectedName={selectedName}
            onSelect={setSelectedName}
            onNew={handleNewSkill}
            refreshKey={skillsRefreshKey}
          />
        );
      case 'mcp-servers':
        return <McpServersSection />;
      default:
        return <ProjectsSection />;
    }
  })();

  if (showEditor) {
    return (
      <div className="flex h-screen bg-[#0a0a0c] text-white overflow-hidden">
        <Sidebar activeTab={activeTab} onTabChange={handleTabChange} />
        <main className="flex flex-1 overflow-hidden">
          <div className="w-90 shrink-0 overflow-y-auto px-8 py-8">
            {sectionContent}
          </div>
          <div className="flex-1 min-w-0">
            <EditorPane
              key={editorKey}
              name={creatingType !== null ? null : selectedName}
              type={activeTab === 'agents' ? 'agent' : 'skill'}
              onClose={() => { setSelectedName(null); setCreatingType(null); }}
              onCreated={handleCreated}
            />
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#0a0a0c] text-white overflow-hidden">
      <Sidebar activeTab={activeTab} onTabChange={handleTabChange} />
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-8 py-8">
          {sectionContent}
        </div>
      </main>
    </div>
  );
}
