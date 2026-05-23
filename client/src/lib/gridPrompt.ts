import type { GridNode, GridEdge } from "../types/grids";

// ── Typed graph entries ────────────────────────────────────────────────────────

interface SkillEntry {
  name: string;
  directory: string;
  invocation_rule: string;
}

interface AgentEntry {
  name: string;
  directory: string;
  invocation_rule: string;
  agents: AgentEntry[];
  skills: SkillEntry[];
}

function buildAgentEntry(
  nodeId: string,
  invocationRule: string,
  nodes: GridNode[],
  edges: GridEdge[],
  visited: Set<string>,
): AgentEntry | null {
  if (visited.has(nodeId)) return null;
  visited.add(nodeId);

  const node = nodes.find((n) => n.id === nodeId);
  if (!node || node.type !== "agent") return null;

  const name = node.data.agentName ?? node.data.label;
  const childEdges = edges.filter((e) => e.source === nodeId);

  const childAgents: AgentEntry[] = [];
  const childSkills: SkillEntry[] = [];

  for (const edge of childEdges) {
    const child = nodes.find((n) => n.id === edge.target);
    if (!child) continue;
    const rule = edge.data.description ?? "Use when appropriate";

    if (child.type === "agent") {
      const entry = buildAgentEntry(
        child.id,
        rule,
        nodes,
        edges,
        new Set(visited),
      );
      if (entry) childAgents.push(entry);
    } else if (child.type === "skill") {
      const skillName = child.data.skillName ?? child.data.label;
      childSkills.push({
        name: skillName,
        directory: `~/.claude/skills/${skillName}/`,
        invocation_rule: rule,
      });
    }
  }

  visited.delete(nodeId);

  return {
    name,
    directory: `~/.claude/agents/${name}.md`,
    invocation_rule: invocationRule,
    agents: childAgents,
    skills: childSkills,
  };
}

const TYPE_DEFINITIONS = `type Skill = {
  name: string
  directory: string
  invocation_rule: string
}

type Agent = {
  name: string
  directory: string
  invocation_rule: string
  agents: Agent[]
  skills: Skill[]
}`;

const SUBAGENT_PREAMBLE_TEMPLATE =
  `Instructions from your superior agent:\n\n` +
  `You are being invoked as a subagent in a larger network. ` +
  `Your available tools are provided below as a subgraph. Tools should be used appropriately. If your task relates in any way to the tools provided, use them. If not, do not force use them.\n\n` +
  `Type definitions:\n\n` +
  TYPE_DEFINITIONS +
  `\n\nYour subgraph:\n{SUBGRAPH}\n\n` +
  `When invoking your own subagents, find their entry in your subgraph, extract their ` +
  `"agents" and "skills" arrays as their subgraph, and prepend this same block verbatim ` +
  `to their invocation — replacing {SUBGRAPH} with their subgraph JSON. The block starts at Instructions from your superior agent and ends right before the actual task.`;

export function generateOrchestratorPrompt(
  gridName: string,
  gridDescription: string,
  nodes: GridNode[],
  edges: GridEdge[],
): string {
  const orchEdges = edges.filter((e) => e.source === "orchestrator");
  const agentTree: AgentEntry[] = [];

  for (const edge of orchEdges) {
    const target = nodes.find((n) => n.id === edge.target);
    if (!target || target.type !== "agent") continue;
    const rule = edge.data.description ?? "Use when appropriate";
    const entry = buildAgentEntry(
      target.id,
      rule,
      nodes,
      edges,
      new Set(["orchestrator"]),
    );
    if (entry) agentTree.push(entry);
  }

  const graphBlock = "```json\n" + JSON.stringify(agentTree, null, 2) + "\n```";

  const frontmatter = `---\nname: ${gridName}\ndescription: ${gridDescription}\n---\n\n`;

  const body =
    `You are an orchestrator. Route each request to the correct agent. Do not fulfill requests yourself.\n\n` +
    `## Type Definitions\n\n` +
    "```\n" +
    TYPE_DEFINITIONS +
    "\n```\n\n" +
    `## Agent Graph\n\n` +
    graphBlock +
    `\n\n` +
    `## Invocation Instructions\n\n` +
    `When invoking an agent:\n` +
    `1. Find their entry in the Agent Graph above.\n` +
    `2. Extract their \`agents\` and \`skills\` arrays as their subgraph.\n` +
    `3. Prepend the following block verbatim to your invocation, replacing \`{SUBGRAPH}\` with their subgraph JSON.\n` +
    `4. Append the actual task after the block.\n\n` +
    "```\n" +
    SUBAGENT_PREAMBLE_TEMPLATE +
    "\n```";

  return frontmatter + body;
}
