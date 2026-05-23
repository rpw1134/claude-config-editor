import { useState } from 'react';
import { createPortal } from 'react-dom';
import { BaseEdge, EdgeLabelRenderer, getBezierPath } from '@xyflow/react';
import { EdgeDescriptionModal } from './EdgeDescriptionModal';

interface GridEdgeProps {
  id: string;
  sourceX: number;
  sourceY: number;
  targetX: number;
  targetY: number;
  sourcePosition: import('@xyflow/react').Position;
  targetPosition: import('@xyflow/react').Position;
  data?: {
    description?: string;
    onUpdateEdge?: (edgeId: string, description: string) => void;
  };
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
  const [editing, setEditing] = useState(false);

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

  const handleLabelClick = () => {
    if (data?.onUpdateEdge) setEditing(true);
  };

  const handleSave = (newDescription: string) => {
    data?.onUpdateEdge?.(id, newDescription);
    setEditing(false);
  };

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
      <EdgeLabelRenderer>
        {label ? (
          <button
            onClick={handleLabelClick}
            style={{ transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)` }}
            className="absolute pointer-events-auto px-2 py-0.5 rounded-full text-[10px] font-medium text-(--text-secondary) bg-(--bg-elevated) border border-(--border-subtle) whitespace-nowrap cursor-pointer hover:border-(--accent)/40 hover:text-(--text-primary) transition-colors duration-120"
          >
            {label}
          </button>
        ) : (
          data?.onUpdateEdge && (
            <button
              onClick={handleLabelClick}
              style={{ transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)` }}
              className="absolute pointer-events-auto px-2 py-0.5 rounded-full text-[10px] font-medium text-(--text-muted) bg-(--bg-elevated)/60 border border-(--border-subtle)/50 whitespace-nowrap cursor-pointer opacity-0 hover:opacity-100 transition-opacity duration-150"
            >
              + directions
            </button>
          )
        )}
      </EdgeLabelRenderer>

      {editing && createPortal(
        <EdgeDescriptionModal
          initialDescription={description}
          onConfirm={handleSave}
          onCancel={() => setEditing(false)}
        />,
        document.body,
      )}
    </>
  );
};
