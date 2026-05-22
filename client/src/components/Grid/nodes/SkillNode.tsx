import { Handle, Position } from '@xyflow/react';

interface SkillNodeProps {
  data: { label: string; skillName?: string };
  selected?: boolean;
}

export const SkillNode = ({ data, selected }: SkillNodeProps) => (
  <div
    className={[
      'skill-node relative flex items-center gap-2.5 px-4 py-2.5 rounded-full transition-all duration-150',
      selected ? 'ring-1 ring-[#7c3aed]/60' : '',
    ].join(' ')}
  >
    <div className="w-5 h-5 flex items-center justify-center text-[#a78bfa] shrink-0">
      <svg width="12" height="12" viewBox="0 0 15 15" fill="none">
        <path
          d="M7.5 1L9.18 5.27L13.5 5.64L10.35 8.38L11.35 12.59L7.5 10.2L3.65 12.59L4.65 8.38L1.5 5.64L5.82 5.27L7.5 1Z"
          stroke="currentColor" strokeWidth="1.3" fill="none" strokeLinejoin="round"
        />
      </svg>
    </div>
    <span className="text-[12px] font-semibold text-[#e9d5ff] whitespace-nowrap">
      {data.label}
    </span>
    <Handle
      type="target"
      position={Position.Top}
      className="!w-2.5 !h-2.5 !bg-[#7c3aed] !border-2 !border-(--bg-base) !rounded-full"
    />
  </div>
);
