import type { GridNode, GridEdge } from "../types/grids";

// ── Typed graph entries ────────────────────────────────────────────────────────

interface SkillEntry {
  name: string;
  directory: string;
  invocation_rule: string;
  mcp_servers?: string[];
}

interface AgentEntry {
  name: string;
  directory: string;
  invocation_rule: string;
  agents: AgentEntry[];
  skills: SkillEntry[];
}

function mcpServersForSkill(skillNodeId: string, nodes: GridNode[], edges: GridEdge[]): string[] {
  return edges
    .filter((e) => e.target === skillNodeId && nodes.find((n) => n.id === e.source)?.type === "mcp")
    .map((e) => {
      const src = nodes.find((n) => n.id === e.source);
      return src?.data.mcpName ?? src?.data.label ?? "";
    })
    .filter(Boolean);
}

function buildSkillEntry(edge: GridEdge, skillNode: GridNode, nodes: GridNode[], edges: GridEdge[], configDir: string, isKnowledge = false): SkillEntry {
  const skillName = skillNode.data.skillName ?? skillNode.data.label;
  const mcps = mcpServersForSkill(skillNode.id, nodes, edges);
  return {
    name: skillName,
    directory: `${configDir}/skills/${skillName}/`,
    invocation_rule: isKnowledge
      ? "at initialization. this is knowledge or context"
      : (edge.data.description ?? "Use when appropriate"),
    ...(mcps.length > 0 ? { mcp_servers: mcps } : {}),
  };
}

function buildAgentEntry(
  nodeId: string,
  invocationRule: string,
  nodes: GridNode[],
  edges: GridEdge[],
  visited: Set<string>,
  configDir: string,
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

    if (child.type === "agent") {
      const entry = buildAgentEntry(
        child.id,
        edge.data.description ?? "Use when appropriate",
        nodes,
        edges,
        new Set(visited),
        configDir,
      );
      if (entry) childAgents.push(entry);
    } else if (child.type === "skill") {
      childSkills.push(buildSkillEntry(edge, child, nodes, edges, configDir, edge.data.isKnowledge));
    }
  }

  visited.delete(nodeId);

  return {
    name,
    directory: `${configDir}/agents/${name}.md`,
    invocation_rule: invocationRule,
    agents: childAgents,
    skills: childSkills,
  };
}

const TYPE_DEFINITIONS = `type Skill = {
  name: string
  directory: string
  invocation_rule: string
  mcp_servers?: string[]
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
  projectPath: string,
  model?: string,
): string {
  const configDir = projectPath.endsWith("/.claude") ? projectPath : `${projectPath}/.claude`;
  const orchEdges = edges.filter((e) => e.source === "orchestrator");
  const agentTree: AgentEntry[] = [];
  const directSkills: SkillEntry[] = [];

  for (const edge of orchEdges) {
    const target = nodes.find((n) => n.id === edge.target);
    if (!target) continue;

    if (target.type === "agent") {
      const rule = edge.data.description ?? "Use when appropriate";
      const entry = buildAgentEntry(target.id, rule, nodes, edges, new Set(["orchestrator"]), configDir);
      if (entry) agentTree.push(entry);
    } else if (target.type === "skill") {
      directSkills.push(buildSkillEntry(edge, target, nodes, edges, configDir, edge.data.isKnowledge));
    }
  }

  const graphBlock = "```json\n" + JSON.stringify(agentTree, null, 2) + "\n```";
  const modelLine = model ? `model: ${model}\n` : "";
  const frontmatter = `---\nname: ${gridName}\ndescription: ${gridDescription}\n${modelLine}---\n\n`;

  let body = `You are an orchestrator. Route each request to the correct agent. Do not fulfill requests yourself.\n\n`;

  body +=
    `## Type Definitions\n\n` +
    "```\n" + TYPE_DEFINITIONS + "\n```\n\n" +
    `## Agent Graph\n\n` +
    graphBlock + `\n\n`;

  if (directSkills.length > 0) {
    body +=
      `## Direct Skills\n\n` +
      `The following skills are available to you directly:\n\n` +
      "```json\n" + JSON.stringify(directSkills, null, 2) + "\n```\n\n";
  }

  body +=
    `## Invocation Instructions\n\n` +
    `When invoking an agent:\n` +
    `1. Find their entry in the Agent Graph above.\n` +
    `2. Extract their \`agents\` and \`skills\` arrays as their subgraph.\n` +
    `3. Prepend the following block verbatim to your invocation, replacing \`{SUBGRAPH}\` with their subgraph JSON.\n` +
    `4. Append the actual task after the block.\n\n` +
    "```\n" + SUBAGENT_PREAMBLE_TEMPLATE + "\n```";

  return frontmatter + body;
}
