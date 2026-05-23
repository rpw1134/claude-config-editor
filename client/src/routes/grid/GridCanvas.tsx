import { useCallback, useRef } from 'react';
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  ConnectionMode,
  addEdge,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
  type Connection,
  type IsValidConnection,
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

interface GridCanvasProps {
  nodes: Node[];
  edges: Edge[];
  onNodesChange: OnNodesChange;
  onEdgesChange: OnEdgesChange;
  onConnect: (connection: Connection) => void;
  onUpdateEdge: (edgeId: string, description: string) => void;
  onDrop: (event: React.DragEvent<HTMLDivElement>) => void;
  onDragOver: (event: React.DragEvent<HTMLDivElement>) => void;
}

export const GridCanvas = ({
  nodes,
  edges,
  onNodesChange,
  onEdgesChange,
  onConnect,
  onUpdateEdge,
  onDrop,
  onDragOver,
}: GridCanvasProps) => {
  const nodeMap = useRef<Map<string, Node>>(new Map());
  nodeMap.current = new Map(nodes.map((n) => [n.id, n]));

  // React Flow v12: isValidConnection receives Connection | Edge (not two Node args).
  // We resolve source/target types from our nodeMap ref here.
  const checkConnection = useCallback<IsValidConnection>(
    (connectionOrEdge) => {
      const src = nodeMap.current.get(connectionOrEdge.source ?? '') ?? null;
      const tgt = nodeMap.current.get(connectionOrEdge.target ?? '') ?? null;
      if (!src || !tgt) return false;
      if (src.id === tgt.id) return false;
      const types = new Set([src.type, tgt.type]);
      if (types.has('orchestrator') && types.has('agent')) return true;
      if (types.has('agent') && types.has('skill')) return true;
      if (src.type === 'agent' && tgt.type === 'agent') return true;
      return false;
    },
    [],
  );

  const handleConnect = useCallback(
    (connection: Connection) => {
      onConnect(connection);
    },
    [onConnect],
  );

  // Inject the onUpdateEdge callback into each edge's data so GridEdgeComponent can call it
  const edgesWithCallback = edges.map((e) => ({
    ...e,
    data: { ...(e.data ?? {}), onUpdateEdge },
  }));

  return (
    <div className="flex-1 relative" onDrop={onDrop} onDragOver={onDragOver}>
      <ReactFlow
        nodes={nodes}
        edges={edgesWithCallback}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={handleConnect}
        isValidConnection={checkConnection}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        connectionMode={ConnectionMode.Loose}
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
