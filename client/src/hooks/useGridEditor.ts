import { useCallback, useEffect, useRef, useState } from 'react';
import {
  useNodesState,
  useEdgesState,
  addEdge,
  type Node,
  type Edge,
  type Connection,
} from '@xyflow/react';
import { getGrid, updateGrid } from '../lib/api';
import { generateOrchestratorPrompt } from '../lib/gridPrompt';
import type { GridNode, GridEdge } from '../types/grids';

function toFlowNode(n: GridNode): Node {
  return {
    id: n.id,
    type: n.type,
    position: n.position,
    data: n.data,
    deletable: n.type !== 'orchestrator',
  };
}

function toFlowEdge(e: GridEdge): Edge {
  return {
    id: e.id,
    source: e.source,
    target: e.target,
    type: 'gridEdge',
    data: e.data,
  };
}

function fromFlowNode(n: Node): GridNode {
  return {
    id: n.id,
    type: n.type as GridNode['type'],
    position: n.position,
    data: n.data as GridNode['data'],
  };
}

function fromFlowEdge(e: Edge): GridEdge {
  return {
    id: e.id,
    source: e.source,
    target: e.target,
    data: (e.data ?? { description: '' }) as GridEdge['data'],
  };
}

interface PendingConnection {
  connection: Connection;
}

export function useGridEditor(projectPath: string, gridName: string) {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [pendingConnection, setPendingConnection] = useState<PendingConnection | null>(null);
  const [gridDescription, setGridDescription] = useState('');
  const [createdAt, setCreatedAt] = useState('');
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getGrid(projectPath, gridName)
      .then((data) => {
        if (cancelled) return;
        setNodes(data.nodes.map(toFlowNode));
        setEdges(data.edges.map(toFlowEdge));
        setGridDescription(data.description);
        setCreatedAt(data.createdAt);
        setLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        const orchNode: Node = {
          id: 'orchestrator-1',
          type: 'orchestrator',
          position: { x: 300, y: 80 },
          data: { label: gridName },
          deletable: false,
        };
        setNodes([orchNode]);
        setEdges([]);
        setLoading(false);
      });
    return () => { cancelled = true; };
  }, [projectPath, gridName, setNodes, setEdges]);

  const markDirty = useCallback(() => {
    setDirty(true);
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(() => {
      setNodes((currentNodes) => {
        setEdges((currentEdges) => {
          const data = {
            name: gridName,
            description: gridDescription,
            createdAt,
            nodes: currentNodes.map(fromFlowNode),
            edges: currentEdges.map(fromFlowEdge),
          };
          updateGrid(projectPath, gridName, data).catch(() => {});
          return currentEdges;
        });
        return currentNodes;
      });
      setDirty(false);
    }, 2000);
  }, [projectPath, gridName, gridDescription, createdAt, setNodes, setEdges]);

  const handleNodesChange = useCallback(
    (changes: Parameters<typeof onNodesChange>[0]) => {
      onNodesChange(changes);
      markDirty();
    },
    [onNodesChange, markDirty],
  );

  const handleEdgesChange = useCallback(
    (changes: Parameters<typeof onEdgesChange>[0]) => {
      onEdgesChange(changes);
      markDirty();
    },
    [onEdgesChange, markDirty],
  );

  const requestConnection = useCallback((connection: Connection) => {
    setPendingConnection({ connection });
  }, []);

  const confirmConnection = useCallback(
    (description: string) => {
      if (!pendingConnection) return;
      const newEdge: Edge = {
        id: `e-${pendingConnection.connection.source}-${pendingConnection.connection.target}-${Date.now()}`,
        source: pendingConnection.connection.source ?? '',
        target: pendingConnection.connection.target ?? '',
        type: 'gridEdge',
        data: { description },
      };
      setEdges((eds) => addEdge(newEdge, eds));
      setPendingConnection(null);
      markDirty();
    },
    [pendingConnection, setEdges, markDirty],
  );

  const cancelConnection = useCallback(() => {
    setPendingConnection(null);
  }, []);

  const addNode = useCallback(
    (type: 'agent' | 'skill', name: string, position: { x: number; y: number }) => {
      const node: Node = {
        id: `${type}-${name}-${Date.now()}`,
        type,
        position,
        data: {
          label: name,
          ...(type === 'agent' ? { agentName: name } : { skillName: name }),
        },
      };
      setNodes((nds) => [...nds, node]);
      markDirty();
    },
    [setNodes, markDirty],
  );

  const save = useCallback(
    async (
      currentNodes: Node[],
      currentEdges: Edge[],
    ): Promise<void> => {
      setSaving(true);
      const data = {
        name: gridName,
        description: gridDescription,
        createdAt,
        nodes: currentNodes.map(fromFlowNode),
        edges: currentEdges.map(fromFlowEdge),
      };
      await updateGrid(projectPath, gridName, data);
      setSaving(false);
      setDirty(false);
    },
    [projectPath, gridName, gridDescription, createdAt],
  );

  const generatedPrompt = generateOrchestratorPrompt(
    gridName,
    nodes.map(fromFlowNode),
    edges.map(fromFlowEdge),
  );

  return {
    nodes,
    edges,
    loading,
    saving,
    dirty,
    pendingConnection,
    generatedPrompt,
    onNodesChange: handleNodesChange,
    onEdgesChange: handleEdgesChange,
    requestConnection,
    confirmConnection,
    cancelConnection,
    addNode,
    save,
  };
}
