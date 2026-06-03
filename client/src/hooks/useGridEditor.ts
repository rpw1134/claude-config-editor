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
import type { GridNode, GridEdge, NodeType } from '../types/grids';
import { isValidPair, isAutoConfirmEdge, shouldFlipByTypeOrder } from '../types/grids';

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

export interface PendingConnection {
  connection: Connection;
  sourceType: NodeType;
  targetType: NodeType;
  sourceLabel: string;
  targetLabel: string;
  wasFlipped: boolean;
  noModal: boolean;
}

export interface HistorySnapshot {
  nodes: Node[];
  edges: Edge[];
  timestamp: number;
}

function nodeType(nodes: Node[], id: string): NodeType {
  return (nodes.find((n) => n.id === id)?.type ?? 'agent') as NodeType;
}

// Directed reachability — only follows source→target edges
function isReachableDirected(edges: Edge[], from: string, to: string): boolean {
  const visited = new Set<string>();
  const queue = [from];
  while (queue.length > 0) {
    const current = queue.shift()!;
    if (current === to) return true;
    if (visited.has(current)) continue;
    visited.add(current);
    for (const e of edges) {
      if (e.source === current) queue.push(e.target);
    }
  }
  return false;
}

// Returns depth of each node from the orchestrator via UNDIRECTED BFS.
// Used for subgraph reorientation so we can discover nodes regardless of
// current edge direction.
function undirectedDepthFromOrchestrator(nodes: Node[], edges: Edge[]): Map<string, number> {
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

function flipEdge(e: Edge): Edge {
  const data = (e.data ?? {}) as Record<string, unknown>;
  return {
    ...e,
    source: e.target,
    target: e.source,
    sourceHandle: e.targetHandle ?? null,
    targetHandle: e.sourceHandle ?? null,
    data: { ...data, sourceType: data.targetType, targetType: data.sourceType } as Edge['data'],
  };
}

// After adding a new edge, reorient all edges whose endpoints are now reachable from
// the orchestrator (via undirected BFS) so they point away from the orchestrator.
// Fixed-direction edges (auto-confirm) are left untouched.
function reorientEdges(nodes: Node[], edges: Edge[]): Edge[] {
  const depth = undirectedDepthFromOrchestrator(nodes, edges);
  return edges.map((e) => {
    const srcDepth = depth.get(e.source);
    const tgtDepth = depth.get(e.target);
    // Skip orphan edges (either end not yet reachable from orchestrator)
    if (srcDepth === undefined || tgtDepth === undefined) return e;

    const srcType = nodeType(nodes as Node[], e.source);
    const tgtType = nodeType(nodes as Node[], e.target);

    // Never reorient fixed-direction edges
    if (isAutoConfirmEdge(srcType, tgtType)) return e;
    // If it's backwards from what auto-confirm expects, flip it
    if (isAutoConfirmEdge(tgtType, srcType)) return flipEdge(e);

    const needsFlip =
      srcDepth > tgtDepth ||
      (srcDepth === tgtDepth && shouldFlipByTypeOrder(srcType, tgtType));

    return needsFlip ? flipEdge(e) : e;
  });
}

// Returns depth of each node from the orchestrator via directed BFS
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
    }
  }
  return depth;
}

function isDuplicateDirected(edges: Edge[], src: string, tgt: string): boolean {
  return edges.some((e) => e.source === src && e.target === tgt);
}

export function useGridEditor(projectPath: string, gridName: string, onError?: (msg: string) => void) {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [pendingConnection, setPendingConnection] = useState<PendingConnection | null>(null);
  const [gridDescription, setGridDescription] = useState('');
  const [gridModel, setGridModel] = useState<string | undefined>(undefined);
  const [createdAt, setCreatedAt] = useState('');
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const history = useRef<HistorySnapshot[]>([]);
  const [canUndo, setCanUndo] = useState(false);
  const [historyVersion, setHistoryVersion] = useState(0);

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
        setGridModel(data.model);
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
      timestamp: Date.now(),
    };
    history.current = [...history.current.slice(-HISTORY_LIMIT + 1), snapshot];
    setCanUndo(true);
    setHistoryVersion((v) => v + 1);
  }, []);

  const undo = useCallback(() => {
    const stack = history.current;
    if (stack.length === 0) return;
    const snapshot = stack[stack.length - 1];
    history.current = stack.slice(0, -1);
    setCanUndo(history.current.length > 0);
    setHistoryVersion((v) => v + 1);
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
      const meaningful = changes.some((c) => c.type === 'remove' || c.type === 'add');
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
    const srcType = nodeType(nodesRef.current, src);
    const tgtType = nodeType(nodesRef.current, tgt);

    if (!isValidPair(srcType, tgtType)) {
      onError?.(`Cannot connect ${srcType} and ${tgtType}.`);
      return;
    }

    // Orient edge away from orchestrator. Use directed BFS depth as primary signal;
    // fall back to type hierarchy when depths are equal (e.g., both unconnected nodes).
    const depth = depthFromOrchestrator(nodesRef.current, edgesRef.current);
    const srcDepth = depth.get(src) ?? Infinity;
    const tgtDepth = depth.get(tgt) ?? Infinity;
    const depthDiffers = srcDepth !== tgtDepth;
    const wasFlipped = depthDiffers
      ? srcDepth > tgtDepth
      : shouldFlipByTypeOrder(srcType, tgtType);
    const oriented: Connection = !wasFlipped
      ? connection
      : { ...connection, source: tgt, target: src, sourceHandle: connection.targetHandle, targetHandle: connection.sourceHandle };

    const finalSrc = oriented.source ?? '';
    const finalTgt = oriented.target ?? '';
    const finalSrcType = nodeType(nodesRef.current, finalSrc);
    const finalTgtType = nodeType(nodesRef.current, finalTgt);

    if (isDuplicateDirected(edgesRef.current, finalSrc, finalTgt)) {
      onError?.('These nodes are already connected.');
      return;
    }

    // Block MCP → skill when that skill is already used as a knowledge skill
    if (finalSrcType === 'mcp' && finalTgtType === 'skill') {
      const isKnowledgeSkill = edgesRef.current.some(
        (e) => e.target === finalTgt && (e.data as { isKnowledge?: boolean })?.isKnowledge,
      );
      if (isKnowledgeSkill) {
        onError?.('Cannot connect an MCP to a knowledge skill — knowledge is passive context and cannot take actions.');
        return;
      }
    }

    // Directed cycle check on the final oriented edge
    if (isReachableDirected(edgesRef.current, finalTgt, finalSrc)) {
      onError?.('This connection would create a cycle.');
      return;
    }
    const sourceLabel = nodesRef.current.find((n) => n.id === finalSrc)?.data?.label as string ?? finalSrc;
    const targetLabel = nodesRef.current.find((n) => n.id === finalTgt)?.data?.label as string ?? finalTgt;
    const noModal = isAutoConfirmEdge(finalSrcType, finalTgtType);

    setPendingConnection({ connection: oriented, sourceType: finalSrcType, targetType: finalTgtType, sourceLabel, targetLabel, wasFlipped, noModal });
  }, [onError]);

  const confirmConnection = useCallback(
    (description: string, isKnowledge?: boolean) => {
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
        data: {
          description,
          isKnowledge: isKnowledge ?? false,
          sourceType: pendingConnection.sourceType,
          targetType: pendingConnection.targetType,
        },
      };
      setEdges((eds) => reorientEdges(nodesRef.current, addEdge(newEdge, eds)));
      setPendingConnection(null);
      markDirty();
    },
    [pendingConnection, setEdges, markDirty, pushHistory],
  );

  const cancelConnection = useCallback(() => {
    setPendingConnection(null);
  }, []);

  const addNode = useCallback(
    (type: GridNode['type'], name: string, position: { x: number; y: number }, extraData?: Partial<GridNode['data']>) => {
      pushHistory();
      const node: Node = {
        id: `${type}-${name}-${Date.now()}`,
        type,
        position,
        data: {
          label: name,
          ...(type === 'agent' ? { agentName: name } : {}),
          ...(type === 'skill' ? { skillName: name } : {}),
          ...(type === 'mcp' ? { mcpName: name } : {}),
          ...extraData,
        },
      };
      setNodes((nds) => [...nds, node]);
      markDirty();
    },
    [setNodes, markDirty, pushHistory],
  );

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

  const updateNodeData = useCallback(
    (nodeId: string, data: Partial<GridNode['data']>) => {
      pushHistory();
      setNodes((nds) =>
        nds.map((n) =>
          n.id === nodeId ? { ...n, data: { ...(n.data ?? {}), ...data } } : n,
        ),
      );
      markDirty();
    },
    [setNodes, markDirty, pushHistory],
  );

  const restoreTo = useCallback(
    (index: number) => {
      const stack = history.current;
      if (index < 0 || index >= stack.length) return;
      const snapshot = stack[index];
      history.current = stack.slice(0, index);
      setCanUndo(history.current.length > 0);
      setHistoryVersion((v) => v + 1);
      setNodes(snapshot.nodes);
      setEdges(snapshot.edges);
      setDirty(true);
    },
    [setNodes, setEdges],
  );

  const save = useCallback(
    async (currentNodes: Node[], currentEdges: Edge[]): Promise<void> => {
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
    projectPath,
    gridModel,
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
    gridCreatedAt: createdAt,
    historySnapshots: history.current,
    historyVersion,
    onNodesChange: handleNodesChange,
    onEdgesChange: handleEdgesChange,
    requestConnection,
    confirmConnection,
    cancelConnection,
    addNode,
    updateEdge,
    updateNodeData,
    undo,
    restoreTo,
    save,
  };
}
