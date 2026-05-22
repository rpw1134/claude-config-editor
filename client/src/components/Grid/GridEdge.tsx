import { BaseEdge, EdgeLabelRenderer, getBezierPath } from '@xyflow/react';

interface GridEdgeProps {
  id: string;
  sourceX: number;
  sourceY: number;
  targetX: number;
  targetY: number;
  sourcePosition: import('@xyflow/react').Position;
  targetPosition: import('@xyflow/react').Position;
  data?: { description?: string };
  selected?: boolean;
}

export const GridEdgeComponent = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  selected,
}: GridEdgeProps) => {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const description = data?.description ?? '';
  const label = description.length > 30 ? description.slice(0, 28) + '…' : description;

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        style={{
          stroke: selected ? 'rgba(0,229,255,0.85)' : 'rgba(0,229,255,0.45)',
          strokeWidth: selected ? 2 : 1.5,
          strokeDasharray: '6 3',
          animation: 'gridEdgeDash 1.2s linear infinite',
        }}
      />
      {label && (
        <EdgeLabelRenderer>
          <div
            style={{ transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)` }}
            className="absolute pointer-events-none px-2 py-0.5 rounded-full text-[10px] font-medium text-(--text-secondary) bg-(--bg-elevated) border border-(--border-subtle) whitespace-nowrap"
          >
            {label}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
};
