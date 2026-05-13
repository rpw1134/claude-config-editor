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

  const handleTabChange = (tab: string) => {
    setActiveTab(tab as ActiveTab);
    setSelectedName(null);
  };

  const isSplitTab = activeTab === 'agents' || activeTab === 'skills';
  const showEditor = isSplitTab && selectedName !== null;

  const sectionContent = (() => {
    switch (activeTab) {
      case 'agents':
        return (
          <AgentsSection
            selectedName={selectedName}
            onSelect={setSelectedName}
          />
        );
      case 'skills':
        return (
          <SkillsSection
            selectedName={selectedName}
            onSelect={setSelectedName}
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
              name={selectedName}
              type={activeTab === 'agents' ? 'agent' : 'skill'}
              onClose={() => setSelectedName(null)}
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
