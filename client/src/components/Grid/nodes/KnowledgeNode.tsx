import { Handle, Position } from '@xyflow/react';

interface KnowledgeNodeProps {
  data: { label: string; skillName?: string };
  selected?: boolean;
}

const srcClass =
  '!w-2.5 !h-2.5 !rounded-full !bg-[#818cf8] !border-2 !border-(--bg-base) transition-opacity';

export const KnowledgeNode = ({ data }: KnowledgeNodeProps) => (
  <div className="knowledge-node relative flex items-center gap-2.5 px-4 py-2.5 rounded-full transition-all duration-150">
    <div className="w-5 h-5 flex items-center justify-center text-[#818cf8] shrink-0">
      <svg width="12" height="12" viewBox="0 0 15 15" fill="none">
        <path d="M2 2.5h11M2 5.5h11M2 8.5h7" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
        <rect x="1" y="1" width="13" height="13" rx="2" stroke="currentColor" strokeWidth="1.2" fill="none" />
      </svg>
    </div>
    <span className="text-[12px] font-semibold text-[#c7d2fe] whitespace-nowrap">
      {data.label}
    </span>

    <Handle type="source" position={Position.Top}    id="top"    className={srcClass} />
    <Handle type="source" position={Position.Right}  id="right"  className={srcClass} />
    <Handle type="source" position={Position.Bottom} id="bottom" className={srcClass} />
    <Handle type="source" position={Position.Left}   id="left"   className={srcClass} />
  </div>
);
