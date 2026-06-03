export interface GridNode {
  id: string;
  type: 'orchestrator' | 'agent' | 'skill' | 'mcp' | 'hook';
  position: { x: number; y: number };
  data: {
    label: string;
    agentName?: string;
    skillName?: string;
    mcpName?: string;
    hookEvent?: 'PreToolUse' | 'PostToolUse' | 'PreAgentRun' | 'PostAgentRun';
    hookCommand?: string;
  };
}

export interface GridEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string | null;
  targetHandle?: string | null;
  data: {
    description: string;
    isKnowledge?: boolean;   // true when the skill is used as passive context
    sourceType?: NodeType;   // stored at creation for edge styling
    targetType?: NodeType;
  };
}

export interface GridData {
  name: string;
  description: string;
  model?: string;
  createdAt: string;
  nodes: GridNode[];
  edges: GridEdge[];
}

export interface GridSummary {
  name: string;
  description: string;
  model?: string;
  createdAt: string;
}

export type NodeType = GridNode['type'];

// ── Validity ──────────────────────────────────────────────────────────────────

function pairKey(a: NodeType, b: NodeType): string {
  return [a, b].sort().join('-');
}

const VALID_PAIRS = new Set([
  pairKey('orchestrator', 'agent'),
  pairKey('orchestrator', 'skill'),
  pairKey('orchestrator', 'mcp'),
  pairKey('agent', 'agent'),
  pairKey('agent', 'skill'),
  pairKey('agent', 'mcp'),
  pairKey('mcp', 'skill'),
  pairKey('hook', 'skill'),
]);

export function isValidPair(a: NodeType, b: NodeType): boolean {
  if (a === b && a !== 'agent') return false;
  return VALID_PAIRS.has(pairKey(a, b));
}

// ── Auto-confirm (skips the description modal entirely) ───────────────────────

export function isAutoConfirmEdge(src: NodeType, tgt: NodeType): boolean {
  if (src === 'mcp' && tgt === 'skill') return true;
  if (src === 'hook' && tgt === 'skill') return true;
  return false;
}

// ── Orientation tiebreaker ───────────────────────────────────────────────────

const TYPE_ORDER: Record<NodeType, number> = {
  orchestrator: 0,
  agent: 1,
  mcp: 2,
  hook: 2,
  skill: 3,
};

export function shouldFlipByTypeOrder(srcType: NodeType, tgtType: NodeType): boolean {
  return TYPE_ORDER[srcType] > TYPE_ORDER[tgtType];
}
