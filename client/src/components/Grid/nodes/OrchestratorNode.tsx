import { Handle, Position } from '@xyflow/react';

interface OrchestratorNodeProps {
  data: { label: string };
}

export const OrchestratorNode = ({ data }: OrchestratorNodeProps) => (
  <div className="orchestrator-node relative flex flex-col items-center gap-2 px-6 py-5 rounded-2xl min-w-[160px]">
    <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-(--accent)/15 text-(--accent) mb-0.5">
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path d="M8 1L10.2 6.2L16 6.7L11.8 10.4L13.1 16L8 13L2.9 16L4.2 10.4L0 6.7L5.8 6.2L8 1Z"
          stroke="currentColor" strokeWidth="1.3" fill="none" strokeLinejoin="round" />
      </svg>
    </div>
    <span className="text-[13px] font-bold text-(--text-primary) tracking-wide whitespace-nowrap">
      {data.label}
    </span>
    <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-(--accent)/70">
      Orchestrator
    </span>
    <Handle
      type="source"
      position={Position.Bottom}
      className="!w-3 !h-3 !bg-(--accent) !border-2 !border-(--bg-base) !rounded-full"
    />
  </div>
);
