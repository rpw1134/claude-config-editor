import { useCallback, useRef } from 'react';
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
  type Connection,
  type NodeTypes,
  type EdgeTypes,
  type OnNodesChange,
  type OnEdgesChange,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { OrchestratorNode } from '../../components/Grid/nodes/OrchestratorNode';
import { AgentNode } from '../../components/Grid/nodes/AgentNode';
import { SkillNode } from '../../components/Grid/nodes/SkillNode';
import { GridEdgeComponent } from '../../components/Grid/GridEdge';

const nodeTypes: NodeTypes = {
  orchestrator: OrchestratorNode as unknown as NodeTypes[string],
  agent: AgentNode as unknown as NodeTypes[string],
  skill: SkillNode as unknown as NodeTypes[string],
};

const edgeTypes: EdgeTypes = {
  gridEdge: GridEdgeComponent as unknown as EdgeTypes[string],
};

function isValidConnection(source: Node | null, target: Node | null): boolean {
  if (!source || !target) return false;
  const s = source.type;
  const t = target.type;
  if (s === 'orchestrator' && t === 'agent') return true;
  if (s === 'agent' && t === 'skill') return true;
  return false;
}

interface GridCanvasProps {
  nodes: Node[];
  edges: Edge[];
  onNodesChange: OnNodesChange;
  onEdgesChange: OnEdgesChange;
  onConnect: (connection: Connection) => void;
  onDrop: (event: React.DragEvent<HTMLDivElement>) => void;
  onDragOver: (event: React.DragEvent<HTMLDivElement>) => void;
}

export const GridCanvas = ({
  nodes,
  edges,
  onNodesChange,
  onEdgesChange,
  onConnect,
  onDrop,
  onDragOver,
}: GridCanvasProps) => {
  const nodeMap = useRef<Map<string, Node>>(new Map());
  nodeMap.current = new Map(nodes.map((n) => [n.id, n]));

  const handleConnect = useCallback(
    (connection: Connection) => {
      const src = nodeMap.current.get(connection.source ?? '') ?? null;
      const tgt = nodeMap.current.get(connection.target ?? '') ?? null;
      if (!isValidConnection(src, tgt)) return;
      onConnect(connection);
    },
    [onConnect],
  );

  return (
    <div className="flex-1 relative" onDrop={onDrop} onDragOver={onDragOver}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={handleConnect}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        defaultEdgeOptions={{ type: 'gridEdge', animated: false }}
        fitView
        fitViewOptions={{ padding: 0.3 }}
        minZoom={0.3}
        maxZoom={2}
        style={{ background: 'var(--bg-base)' }}
        proOptions={{ hideAttribution: true }}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={24}
          size={1}
          color="rgba(255,255,255,0.06)"
        />
        <Controls
          className="!bg-(--bg-elevated) !border !border-(--border-subtle) !rounded-xl !overflow-hidden !shadow-lg"
          style={{ bottom: 24, left: 24 }}
        />
        <MiniMap
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 12,
          }}
          nodeColor={(n) => {
            if (n.type === 'orchestrator') return 'var(--accent)';
            if (n.type === 'agent') return 'rgba(255,255,255,0.3)';
            return '#7c3aed';
          }}
          maskColor="rgba(0,0,0,0.4)"
        />
      </ReactFlow>
    </div>
  );
};

export { useNodesState, useEdgesState, addEdge };
