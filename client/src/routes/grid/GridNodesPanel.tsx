import { useEffect, useState } from 'react';
import { fetchAgents, fetchSkills, createAgent, createSkill } from '../../lib/api';

interface DraggableItemProps {
  name: string;
  type: 'agent' | 'skill';
}

const DraggableItem = ({ name, type }: DraggableItemProps) => {
  const handleDragStart = (e: React.DragEvent) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const offsetX = e.clientX - rect.left;
    const offsetY = e.clientY - rect.top;
    e.dataTransfer.setData('application/grid-node-type', type);
    e.dataTransfer.setData('application/grid-node-name', name);
    e.dataTransfer.setData('application/drag-offset', JSON.stringify({ offsetX, offsetY }));
    e.dataTransfer.effectAllowed = 'copy';
  };

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      className={[
        'flex items-center gap-2.5 px-3 py-2 rounded-lg cursor-grab active:cursor-grabbing',
        'bg-white/3 border border-white/6 hover:bg-white/6 hover:border-white/12',
        'transition-all duration-120 select-none',
      ].join(' ')}
    >
      {type === 'agent' ? (
        <svg width="12" height="12" viewBox="0 0 15 15" fill="none" className="text-(--text-muted) shrink-0">
          <circle cx="7.5" cy="5" r="3" stroke="currentColor" strokeWidth="1.3" fill="none" />
          <path d="M2 13C2 10.24 4.46 8 7.5 8C10.54 8 13 10.24 13 13" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" fill="none" />
        </svg>
      ) : (
        <svg width="12" height="12" viewBox="0 0 15 15" fill="none" className="text-[#a78bfa] shrink-0">
          <path d="M7.5 1L9.18 5.27L13.5 5.64L10.35 8.38L11.35 12.59L7.5 10.2L3.65 12.59L4.65 8.38L1.5 5.64L5.82 5.27L7.5 1Z"
            stroke="currentColor" strokeWidth="1.3" fill="none" strokeLinejoin="round" />
        </svg>
      )}
      <span className="text-[12px] font-medium text-(--text-secondary) truncate">{name}</span>
    </div>
  );
};

interface InlineCreateProps {
  label: string;
  onSubmit: (name: string) => void;
  onCancel: () => void;
}

const InlineCreate = ({ label, onSubmit, onCancel }: InlineCreateProps) => {
  const [value, setValue] = useState('');

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && value.trim()) onSubmit(value.trim());
    if (e.key === 'Escape') onCancel();
  };

  return (
    <div className="flex items-center gap-2 mt-1">
      <input
        autoFocus
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKey}
        placeholder={`${label} name…`}
        className="flex-1 min-w-0 bg-(--bg-surface) border border-(--border-subtle) rounded-lg px-2.5 py-1.5 text-[12px] text-(--text-primary) outline-none focus:outline-none focus:border-(--accent) transition-colors duration-120"
      />
      <button
        onClick={() => value.trim() && onSubmit(value.trim())}
        disabled={!value.trim()}
        className="px-2.5 py-1.5 rounded-lg text-[11px] font-semibold bg-(--accent) text-(--bg-base) border-none cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
      >
        Add
      </button>
    </div>
  );
};

interface GridNodesPanelProps {
  projectPath: string;
  refreshKey: number;
  onAgentCreated: (name: string) => void;
  onSkillCreated: (name: string) => void;
  showToast: (msg: string) => void;
}

export const GridNodesPanel = ({
  projectPath,
  refreshKey,
  onAgentCreated,
  onSkillCreated,
  showToast,
}: GridNodesPanelProps) => {
  const [agents, setAgents] = useState<string[]>([]);
  const [skills, setSkills] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [agentsOpen, setAgentsOpen] = useState(true);
  const [skillsOpen, setSkillsOpen] = useState(true);
  const [creatingAgent, setCreatingAgent] = useState(false);
  const [creatingSkill, setCreatingSkill] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([fetchAgents(projectPath), fetchSkills(projectPath)])
      .then(([a, s]) => {
        if (cancelled) return;
        setAgents(a);
        setSkills(s);
        setLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setLoading(false);
      });
    return () => { cancelled = true; };
  }, [projectPath, refreshKey]);

  const handleCreateAgent = async (name: string) => {
    const content = `---\nname: ${name}\ndescription: Agent created from Grids editor.\n---\n\nYou are the ${name} agent.\n`;
    try {
      await createAgent(projectPath, name, content);
      setAgents((prev) => [...prev, name]);
      onAgentCreated(name);
      showToast(`Agent "${name}" created — edit it in the Agents tab`);
    } catch {
      showToast('Failed to create agent');
    }
    setCreatingAgent(false);
  };

  const handleCreateSkill = async (name: string) => {
    const content = `---\nname: ${name}\ndescription: Skill created from Grids editor.\n---\n\n# ${name}\n`;
    try {
      await createSkill(projectPath, name, content);
      setSkills((prev) => [...prev, name]);
      onSkillCreated(name);
      showToast(`Skill "${name}" created — edit it in the Skills tab.`);
    } catch {
      showToast('Failed to create skill');
    }
    setCreatingSkill(false);
  };

  return (
    <div className="w-[200px] shrink-0 flex flex-col border-r border-(--border-faint) bg-(--bg-sidebar) overflow-y-auto">
      <div className="px-4 pt-5 pb-3 shrink-0">
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-(--text-muted) m-0">
          Nodes
        </p>
        <p className="text-[11px] text-(--text-muted) mt-1 m-0 leading-relaxed">
          Drag onto the canvas to add
        </p>
      </div>

      <div className="flex-1 px-3 pb-4 flex flex-col gap-4 min-h-0">
        <div>
          <button
            onClick={() => setAgentsOpen((v) => !v)}
            className="w-full flex items-center gap-1.5 mb-2 text-left bg-transparent border-none cursor-pointer group"
          >
            <svg
              width="10" height="10" viewBox="0 0 10 10" fill="none"
              className={`text-(--text-muted) transition-transform duration-150 ${agentsOpen ? 'rotate-90' : ''}`}
            >
              <path d="M3 2L7 5L3 8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="text-[11px] font-semibold text-(--text-secondary) uppercase tracking-[0.1em]">
              Agents {!loading && <span className="opacity-50">({agents.length})</span>}
            </span>
          </button>

          {agentsOpen && !loading && (
            <div className="flex flex-col gap-1.5">
              {agents.map((name) => (
                <DraggableItem key={name} name={name} type="agent" />
              ))}
              {creatingAgent ? (
                <InlineCreate
                  label="Agent"
                  onSubmit={handleCreateAgent}
                  onCancel={() => setCreatingAgent(false)}
                />
              ) : (
                <button
                  onClick={() => setCreatingAgent(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium text-(--text-muted) hover:text-(--text-secondary) bg-transparent border border-dashed border-white/10 hover:border-white/20 cursor-pointer transition-all duration-120 mt-1"
                >
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                    <path d="M5 1.5V8.5M1.5 5H8.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                  </svg>
                  New Agent
                </button>
              )}
            </div>
          )}
        </div>

        <div>
          <button
            onClick={() => setSkillsOpen((v) => !v)}
            className="w-full flex items-center gap-1.5 mb-2 text-left bg-transparent border-none cursor-pointer group"
          >
            <svg
              width="10" height="10" viewBox="0 0 10 10" fill="none"
              className={`text-(--text-muted) transition-transform duration-150 ${skillsOpen ? 'rotate-90' : ''}`}
            >
              <path d="M3 2L7 5L3 8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="text-[11px] font-semibold text-(--text-secondary) uppercase tracking-[0.1em]">
              Skills {!loading && <span className="opacity-50">({skills.length})</span>}
            </span>
          </button>

          {skillsOpen && !loading && (
            <div className="flex flex-col gap-1.5">
              {skills.map((name) => (
                <DraggableItem key={name} name={name} type="skill" />
              ))}
              {creatingSkill ? (
                <InlineCreate
                  label="Skill"
                  onSubmit={handleCreateSkill}
                  onCancel={() => setCreatingSkill(false)}
                />
              ) : (
                <button
                  onClick={() => setCreatingSkill(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium text-(--text-muted) hover:text-(--text-secondary) bg-transparent border border-dashed border-white/10 hover:border-white/20 cursor-pointer transition-all duration-120 mt-1"
                >
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                    <path d="M5 1.5V8.5M1.5 5H8.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                  </svg>
                  New Skill
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
