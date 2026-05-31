import { Handle, Position } from '@xyflow/react';

interface HookNodeProps {
  data: {
    label: string;
    hookEvent?: 'PreToolUse' | 'PostToolUse' | 'PreAgentRun' | 'PostAgentRun';
    hookCommand?: string;
  };
  selected?: boolean;
}

const srcClass =
  '!w-2.5 !h-2.5 !rounded-full !bg-[#f59e0b] !border-2 !border-(--bg-base) transition-opacity';

const EVENT_LABELS: Record<string, string> = {
  PreToolUse: 'Pre-Tool',
  PostToolUse: 'Post-Tool',
  PreAgentRun: 'Pre-Agent',
  PostAgentRun: 'Post-Agent',
};

export const HookNode = ({ data, selected: _selected }: HookNodeProps) => (
  <div className="hook-node relative flex items-center gap-3 px-4 py-3 rounded-xl min-w-35 transition-all duration-150">
    <div className="w-7 h-7 flex items-center justify-center rounded-lg bg-[#f59e0b]/10 text-[#f59e0b] shrink-0">
      {/* Hook: lightning bolt — reads clearly as "trigger/event" */}
      <svg width="12" height="14" viewBox="0 0 12 14" fill="none">
        <path
          d="M7 1L1 8h5l-1 5 6-7H6l1-5Z"
          stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" fill="none"
        />
      </svg>
    </div>
    <div className="flex flex-col min-w-0">
      <span className="text-[12px] font-bold text-(--text-primary) truncate">
        {data.label}
      </span>
      <span className="text-[10px] text-[#f59e0b]/70 uppercase tracking-widest font-semibold">
        {data.hookEvent ? EVENT_LABELS[data.hookEvent] ?? data.hookEvent : 'Hook'}
      </span>
    </div>

    <Handle type="source" position={Position.Top}    id="top"    className={srcClass} />
    <Handle type="source" position={Position.Right}  id="right"  className={srcClass} />
    <Handle type="source" position={Position.Bottom} id="bottom" className={srcClass} />
    <Handle type="source" position={Position.Left}   id="left"   className={srcClass} />
  </div>
);
