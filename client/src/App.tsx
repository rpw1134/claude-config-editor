import { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { ProjectsSection } from './components/sections/ProjectsSection';
import { AgentsSection } from './components/sections/AgentsSection';
import { SkillsSection } from './components/sections/SkillsSection';
import { McpServersSection } from './components/sections/McpServersSection';

type ActiveTab = 'projects' | 'agents' | 'skills' | 'mcp-servers';

const SECTION_MAP: Record<ActiveTab, React.ReactNode> = {
  projects: <ProjectsSection />,
  agents: <AgentsSection />,
  skills: <SkillsSection />,
  'mcp-servers': <McpServersSection />,
};

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('projects');

  return (
    <div className="flex h-screen bg-[#0a0a0c] text-white overflow-hidden">
      <Sidebar activeTab={activeTab} onTabChange={(tab) => setActiveTab(tab as ActiveTab)} />
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-8 py-8">
          {SECTION_MAP[activeTab]}
        </div>
      </main>
    </div>
  );
}
