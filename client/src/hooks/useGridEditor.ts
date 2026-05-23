import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
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

const HISTORY_LIMIT = 50;

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
    sourceHandle: e.sourceHandle ?? null,
    targetHandle: e.targetHandle ?? null,
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
    sourceHandle: e.sourceHandle ?? null,
    targetHandle: e.targetHandle ?? null,
    data: (e.data ?? { description: '' }) as GridEdge['data'],
  };
}

interface PendingConnection {
  connection: Connection;
}

interface HistorySnapshot {
  nodes: Node[];
  edges: Edge[];
}

// Undirected reachability — treats every edge as bidirectional
function isConnected(edges: Edge[], nodeA: string, nodeB: string): boolean {
  const visited = new Set<string>();
  const queue = [nodeA];
  while (queue.length > 0) {
    const current = queue.shift()!;
    if (current === nodeB) return true;
    if (visited.has(current)) continue;
    visited.add(current);
    for (const e of edges) {
      if (e.source === current) queue.push(e.target);
      if (e.target === current) queue.push(e.source);
    }
  }
  return false;
}

// Returns depth of each node from the orchestrator via undirected BFS
function depthFromOrchestrator(nodes: Node[], edges: Edge[]): Map<string, number> {
  const orch = nodes.find((n) => n.type === 'orchestrator');
  if (!orch) return new Map();
  const depth = new Map<string, number>();
  const queue: [string, number][] = [[orch.id, 0]];
  while (queue.length > 0) {
    const [id, d] = queue.shift()!;
    if (depth.has(id)) continue;
    depth.set(id, d);
    for (const e of edges) {
      if (e.source === id && !depth.has(e.target)) queue.push([e.target, d + 1]);
      if (e.target === id && !depth.has(e.source)) queue.push([e.source, d + 1]);
    }
  }
  return depth;
}

function isDuplicate(edges: Edge[], a: string, b: string): boolean {
  return edges.some(
    (e) => (e.source === a && e.target === b) || (e.source === b && e.target === a),
  );
}

export function useGridEditor(projectPath: string, gridName: string, onError?: (msg: string) => void) {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [pendingConnection, setPendingConnection] = useState<PendingConnection | null>(null);
  const [gridDescription, setGridDescription] = useState('');
  const [createdAt, setCreatedAt] = useState('');
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Undo history — array of past { nodes, edges } snapshots
  const history = useRef<HistorySnapshot[]>([]);
  const [canUndo, setCanUndo] = useState(false);

  // Track current nodes/edges in a ref so snapshots can be taken synchronously
  const nodesRef = useRef<Node[]>([]);
  const edgesRef = useRef<Edge[]>([]);
  useLayoutEffect(() => {
    nodesRef.current = nodes;
    edgesRef.current = edges;
  });

  useEffect(() => {
    let cancelled = false;
    getGrid(projectPath, gridName)
      .then((data) => {
        if (cancelled) return;
        setNodes(data.nodes.map(toFlowNode));
        setEdges(data.edges.map(toFlowEdge));
        setGridDescription(data.description);
        setCreatedAt(data.createdAt);
        history.current = [];
        setCanUndo(false);
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
        history.current = [];
        setCanUndo(false);
        setLoading(false);
      });
    return () => { cancelled = true; };
  }, [projectPath, gridName, setNodes, setEdges]);

  const pushHistory = useCallback(() => {
    const snapshot: HistorySnapshot = {
      nodes: nodesRef.current,
      edges: edgesRef.current,
    };
    history.current = [...history.current.slice(-HISTORY_LIMIT + 1), snapshot];
    setCanUndo(true);
  }, []);

  const undo = useCallback(() => {
    const stack = history.current;
    if (stack.length === 0) return;
    const snapshot = stack[stack.length - 1];
    history.current = stack.slice(0, -1);
    setCanUndo(history.current.length > 0);
    setNodes(snapshot.nodes);
    setEdges(snapshot.edges);
    setDirty(true);
  }, [setNodes, setEdges]);

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
      // Only push history for meaningful changes (not selection/dimension updates)
      const meaningful = changes.some(
        (c) => c.type === 'remove' || c.type === 'add',
      );
      if (meaningful) pushHistory();
      onNodesChange(changes);
      markDirty();
    },
    [onNodesChange, markDirty, pushHistory],
  );

  const handleEdgesChange = useCallback(
    (changes: Parameters<typeof onEdgesChange>[0]) => {
      const meaningful = changes.some((c) => c.type === 'remove' || c.type === 'add');
      if (meaningful) pushHistory();
      onEdgesChange(changes);
      markDirty();
    },
    [onEdgesChange, markDirty, pushHistory],
  );

  const requestConnection = useCallback((connection: Connection) => {
    const src = connection.source ?? '';
    const tgt = connection.target ?? '';
    if (isDuplicate(edgesRef.current, src, tgt)) {
      onError?.('These nodes are already connected.');
      return;
    }
    if (isConnected(edgesRef.current, src, tgt)) {
      onError?.('This connection would create a cycle.');
      return;
    }
    // Orient edge away from orchestrator based on BFS depth
    const depth = depthFromOrchestrator(nodesRef.current, edgesRef.current);
    const srcDepth = depth.get(src) ?? Infinity;
    const tgtDepth = depth.get(tgt) ?? Infinity;
    const oriented: Connection = srcDepth <= tgtDepth
      ? connection
      : { ...connection, source: tgt, target: src, sourceHandle: connection.targetHandle, targetHandle: connection.sourceHandle };
    setPendingConnection({ connection: oriented });
  }, [onError]);

  const confirmConnection = useCallback(
    (description: string) => {
      if (!pendingConnection) return;
      pushHistory();
      const conn = pendingConnection.connection;
      const newEdge: Edge = {
        id: `e-${conn.source}-${conn.target}-${Date.now()}`,
        source: conn.source ?? '',
        target: conn.target ?? '',
        sourceHandle: conn.sourceHandle ?? null,
        targetHandle: conn.targetHandle ?? null,
        type: 'gridEdge',
        data: { description },
      };
      setEdges((eds) => addEdge(newEdge, eds));
      setPendingConnection(null);
      markDirty();
    },
    [pendingConnection, setEdges, markDirty, pushHistory],
  );

  const cancelConnection = useCallback(() => {
    setPendingConnection(null);
  }, []);

  const addNode = useCallback(
    (type: 'agent' | 'skill', name: string, position: { x: number; y: number }) => {
      pushHistory();
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
    [setNodes, markDirty, pushHistory],
  );

  // Update the description on an existing edge (used by inline label click)
  const updateEdge = useCallback(
    (edgeId: string, description: string) => {
      pushHistory();
      setEdges((eds) =>
        eds.map((e) =>
          e.id === edgeId ? { ...e, data: { ...(e.data ?? {}), description } } : e,
        ),
      );
      markDirty();
    },
    [setEdges, markDirty, pushHistory],
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
    gridDescription,
    nodes.map(fromFlowNode),
    edges.map(fromFlowEdge),
  );

  return {
    nodes,
    edges,
    loading,
    saving,
    dirty,
    canUndo,
    pendingConnection,
    generatedPrompt,
    onNodesChange: handleNodesChange,
    onEdgesChange: handleEdgesChange,
    requestConnection,
    confirmConnection,
    cancelConnection,
    addNode,
    updateEdge,
    undo,
    save,
  };
}
