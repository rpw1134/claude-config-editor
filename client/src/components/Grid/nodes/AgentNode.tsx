import { Handle, Position } from '@xyflow/react';

interface AgentNodeProps {
  data: { label: string; agentName?: string };
  selected?: boolean;
}

// Opacity is controlled entirely by CSS rules in index.css — no Tailwind opacity here.
const srcClass =
  '!w-2.5 !h-2.5 !rounded-full !bg-(--accent) !border-2 !border-(--bg-base) transition-opacity';

export const AgentNode = ({ data, selected }: AgentNodeProps) => (
  <div
    className={[
      'agent-node relative flex items-center gap-3 px-4 py-3 rounded-xl min-w-[140px] transition-all duration-150',
      selected ? '' : '',
    ].join(' ')}
  >
    <div className="w-7 h-7 flex items-center justify-center rounded-lg bg-white/6 text-(--text-secondary) shrink-0">
      <svg width="13" height="13" viewBox="0 0 15 15" fill="none">
        <circle cx="7.5" cy="5" r="3" stroke="currentColor" strokeWidth="1.3" fill="none" />
        <path d="M2 13C2 10.24 4.46 8 7.5 8C10.54 8 13 10.24 13 13"
          stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" fill="none" />
      </svg>
    </div>
    <div className="flex flex-col min-w-0">
      <span className="text-[12px] font-bold text-(--text-primary) truncate">
        {data.label}
      </span>
      <span className="text-[10px] text-(--text-muted) uppercase tracking-[0.1em]">Agent</span>
    </div>

    <Handle type="source" position={Position.Top}    id="top"    className={srcClass} />
    <Handle type="source" position={Position.Right}  id="right"  className={srcClass} />
    <Handle type="source" position={Position.Bottom} id="bottom" className={srcClass} />
    <Handle type="source" position={Position.Left}   id="left"   className={srcClass} />
  </div>
);
