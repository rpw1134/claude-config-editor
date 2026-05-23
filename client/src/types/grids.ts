export interface GridNode {
  id: string;
  type: 'orchestrator' | 'agent' | 'skill';
  position: { x: number; y: number };
  data: { label: string; agentName?: string; skillName?: string };
}

export interface GridEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string | null;
  targetHandle?: string | null;
  data: { description: string };
}

export interface GridData {
  name: string;
  description: string;
  createdAt: string;
  nodes: GridNode[];
  edges: GridEdge[];
}

export interface GridSummary {
  name: string;
  description: string;
  createdAt: string;
}
