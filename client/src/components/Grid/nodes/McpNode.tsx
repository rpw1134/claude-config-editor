import { Handle, Position } from '@xyflow/react';

interface McpNodeProps {
  data: { label: string; mcpName?: string };
  selected?: boolean;
}

const srcClass =
  '!w-2.5 !h-2.5 !rounded-full !bg-[#34d399] !border-2 !border-(--bg-base) transition-opacity';

export const McpNode = ({ data, selected: _selected }: McpNodeProps) => (
  <div className="mcp-node relative flex items-center gap-3 px-4 py-3 rounded-xl min-w-35 transition-all duration-150">
    <div className="w-7 h-7 flex items-center justify-center rounded-lg bg-[#34d399]/10 text-[#34d399] shrink-0">
      {/* MCP: plug/connector icon */}
      <svg width="13" height="13" viewBox="0 0 15 15" fill="none">
        <rect x="4" y="1" width="2.5" height="4" rx="1" stroke="currentColor" strokeWidth="1.2" />
        <rect x="8.5" y="1" width="2.5" height="4" rx="1" stroke="currentColor" strokeWidth="1.2" />
        <path d="M2 5h11v2.5A4 4 0 0 1 7.5 11.5 4 4 0 0 1 2 7.5V5Z" stroke="currentColor" strokeWidth="1.2" fill="none" />
        <path d="M7.5 11.5v2.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      </svg>
    </div>
    <div className="flex flex-col min-w-0">
      <span className="text-[12px] font-bold text-(--text-primary) truncate">
        {data.label}
      </span>
      <span className="text-[10px] text-[#34d399]/70 uppercase tracking-widest font-semibold">MCP</span>
    </div>

    <Handle type="source" position={Position.Top}    id="top"    className={srcClass} />
    <Handle type="source" position={Position.Right}  id="right"  className={srcClass} />
    <Handle type="source" position={Position.Bottom} id="bottom" className={srcClass} />
    <Handle type="source" position={Position.Left}   id="left"   className={srcClass} />
  </div>
);
