import express from "express";
import path from "path";
import type { NextFunction, Request, Response, Router } from "express";
import {
  deleteFile,
  ensureDir,
  fileExists,
  listDir,
  readFileContent,
  writeFileEnsureDir,
} from "../utils/fileIO.js";
import { requireProjectPath } from "../utils/parsing.js";
import { findRepoRoot, stageFiles } from "../services/versionControl.js";
import { getConfigDir } from "../services/claudeConfig.js";
import { getHooks, setHooks } from "../services/hooksService.js";

const router: Router = express.Router();

function gridsDir(projectPath: string): string {
  return path.join(projectPath, ".stryde", "grids");
}

// Orchestrator agents now live at top level, not in a grids/ subfolder
function agentsDir(projectPath: string): string {
  return path.join(getConfigDir(projectPath), "agents");
}

// ── Types ──────────────────────────────────────────────────────────────────────

interface NodePosition {
  x: number;
  y: number;
}

interface NodeData {
  label: string;
  agentName?: string;
  skillName?: string;
  mcpName?: string;
  hookEvent?: "PreToolUse" | "PostToolUse" | "PreAgentRun" | "PostAgentRun";
  hookCommand?: string;
}

interface GridNode {
  id: string;
  type: "orchestrator" | "agent" | "skill" | "knowledge" | "mcp" | "hook";
  position: NodePosition;
  data: NodeData;
}

interface EdgeData {
  description?: string;
  sourceType?: string;
  targetType?: string;
  // Legacy flags — kept for backward compat with old saved grids
  isKnowledge?: boolean;
  isMcpRelation?: boolean;
}

interface GridEdge {
  id: string;
  source: string;
  target: string;
  data: EdgeData;
}

interface GridJson {
  name: string;
  description: string;
  model?: string;
  createdAt: string;
  nodes: GridNode[];
  edges: GridEdge[];
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function gridPath(dir: string, name: string): string {
  return path.join(dir, `${name}.json`);
}

function agentPath(projectPath: string, name: string): string {
  return path.join(agentsDir(projectPath), `${name}.md`);
}

function validateName(name: unknown, res: Response): string | null {
  if (typeof name !== "string" || !name.trim()) {
    res.status(400).json({ message: "name must be a non-empty string" });
    return null;
  }
  if (name.includes("/") || name.includes("\\") || name.includes("..")) {
    res.status(400).json({ message: "name must not contain path separators" });
    return null;
  }
  return name.trim();
}

function buildInitialGrid(name: string, description: string, model?: string): GridJson {
  return {
    name,
    description,
    ...(model ? { model } : {}),
    createdAt: new Date().toISOString(),
    nodes: [
      {
        id: "orchestrator",
        type: "orchestrator",
        position: { x: 400, y: 200 },
        data: { label: name },
      },
    ],
    edges: [],
  };
}

// ── Prompt builder ─────────────────────────────────────────────────────────────

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

function buildSkillEntry(
  edge: GridEdge,
  skillNode: GridNode,
  nodes: GridNode[],
  edges: GridEdge[],
  configDir: string,
  isKnowledge = false,
): SkillEntry {
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
      const entry = buildAgentEntry(child.id, edge.data.description ?? "Use when appropriate", nodes, edges, new Set(visited), configDir);
      if (entry) childAgents.push(entry);
    } else if (child.type === "skill") {
      childSkills.push(buildSkillEntry(edge, child, nodes, edges, configDir, edge.data.isKnowledge));
    } else if (child.type === "knowledge") {
      childSkills.push(buildSkillEntry(edge, child, nodes, edges, configDir, true));
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

function buildOrchestratorPrompt(grid: GridJson, projectPath: string): string {
  const configDir = projectPath.endsWith("/.claude") ? projectPath : `${projectPath}/.claude`;
  const orchEdges = grid.edges.filter((e) => e.source === "orchestrator");
  const agentTree: AgentEntry[] = [];
  const directSkills: SkillEntry[] = [];

  for (const edge of orchEdges) {
    const target = grid.nodes.find((n) => n.id === edge.target);
    if (!target) continue;

    if (target.type === "agent") {
      const rule = edge.data.description ?? "Use when appropriate";
      const entry = buildAgentEntry(target.id, rule, grid.nodes, grid.edges, new Set(["orchestrator"]), configDir);
      if (entry) agentTree.push(entry);
    } else if (target.type === "skill") {
      directSkills.push(buildSkillEntry(edge, target, grid.nodes, grid.edges, configDir, edge.data.isKnowledge));
    }
  }

  const graphBlock = "```json\n" + JSON.stringify(agentTree, null, 2) + "\n```";

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

  return buildFrontmatter(grid) + body;
}

function buildFrontmatter(grid: GridJson): string {
  const modelLine = grid.model ? `model: ${grid.model}\n` : "";
  return `---\nname: ${grid.name}\ndescription: ${grid.description}\n${modelLine}---\n\n`;
}

async function writeAgentFile(projectPath: string, grid: GridJson): Promise<void> {
  await ensureDir(agentsDir(projectPath));
  const content = buildOrchestratorPrompt(grid, projectPath);
  await writeFileEnsureDir(agentPath(projectPath, grid.name), content);
}

async function writeHooksFromGrid(projectPath: string, grid: GridJson): Promise<void> {
  const hookNodes = grid.nodes.filter((n) => n.type === "hook");
  if (hookNodes.length === 0) return;

  const skillsInGrid = new Set(
    grid.nodes
      .filter((n) => n.type === "skill")
      .map((n) => n.data.skillName ?? n.data.label),
  );

  // Build hooks contributed by this grid
  const gridHooksByEvent: Record<string, { matcher: string; hooks: { type: string; command: string }[] }[]> = {};

  for (const hookNode of hookNodes) {
    const event = hookNode.data.hookEvent ?? "PreToolUse";
    const command = hookNode.data.hookCommand;
    if (!command) continue;

    const hookEdges = grid.edges.filter((e) => e.source === hookNode.id);
    for (const edge of hookEdges) {
      const target = grid.nodes.find((n) => n.id === edge.target);
      if (!target || target.type !== "skill") continue;
      const skillName = target.data.skillName ?? target.data.label;
      if (!gridHooksByEvent[event]) gridHooksByEvent[event] = [];
      gridHooksByEvent[event].push({
        matcher: skillName,
        hooks: [{ type: "command", command }],
      });
    }
  }

  if (Object.keys(gridHooksByEvent).length === 0) return;

  // Merge with existing hooks, replacing entries for skills managed by this grid
  const existing = await getHooks(projectPath) as Record<string, { matcher?: string }[]>;
  const merged: Record<string, unknown[]> = { ...existing };

  for (const [event, newEntries] of Object.entries(gridHooksByEvent)) {
    const existingForEvent = (merged[event] as { matcher?: string }[] | undefined) ?? [];
    const filtered = existingForEvent.filter((e) => !skillsInGrid.has(e.matcher ?? ""));
    merged[event] = [...filtered, ...newEntries];
  }

  // Remove stale grid-managed entries from events not in gridHooksByEvent
  for (const event of Object.keys(merged)) {
    if (!gridHooksByEvent[event]) {
      const existingForEvent = (merged[event] as { matcher?: string }[] | undefined) ?? [];
      merged[event] = existingForEvent.filter((e) => !skillsInGrid.has(e.matcher ?? ""));
    }
  }

  await setHooks(projectPath, merged);
}

async function stageGridFiles(projectPath: string, gridFilePath: string, agentFilePath: string): Promise<void> {
  // Always stage .stryde when git repo exists
  const projectRepoRoot = await findRepoRoot(projectPath);
  if (projectRepoRoot) {
    await stageFiles(projectRepoRoot, [path.relative(projectRepoRoot, gridFilePath)]);
  }
  const agentRepoRoot = await findRepoRoot(path.dirname(agentFilePath));
  if (agentRepoRoot) {
    await stageFiles(agentRepoRoot, [path.relative(agentRepoRoot, agentFilePath)]);
  }
}

// ── Routes ─────────────────────────────────────────────────────────────────────

// GET /api/grids → [{ name, description, createdAt }]
router.get(
  "/",
  async (req: Request, res: Response, next: NextFunction) => {
    const projectPath = requireProjectPath(req.query.projectPath, res);
    if (projectPath === null) return;

    const dir = gridsDir(projectPath);
    try {
      await ensureDir(dir);
      const listing = await listDir(dir);
      const files = (listing?.files ?? []).filter((f) => f.endsWith(".json"));

      const grids = await Promise.all(
        files.map(async (file) => {
          const raw = await readFileContent(path.join(dir, file));
          const data = JSON.parse(raw) as GridJson;
          return { name: data.name, description: data.description, createdAt: data.createdAt };
        }),
      );

      res.json(grids);
    } catch (err) {
      next(err);
    }
  },
);

// GET /api/grids/:name → full grid JSON
router.get(
  "/:name",
  async (req: Request, res: Response, next: NextFunction) => {
    const name = validateName(req.params.name, res);
    if (name === null) return;

    const projectPath = requireProjectPath(req.query.projectPath, res);
    if (projectPath === null) return;

    const dir = gridsDir(projectPath);
    try {
      await ensureDir(dir);
      const filePath = gridPath(dir, name);
      if (!(await fileExists(filePath))) {
        return res.status(404).json({ message: "Grid not found" });
      }
      const raw = await readFileContent(filePath);
      res.json(JSON.parse(raw));
    } catch (err) {
      next(err);
    }
  },
);

// POST /api/grids  body: { projectPath, name, description } → 201
router.post(
  "/",
  async (req: Request, res: Response, next: NextFunction) => {
    const { name: rawName, description: rawDescription, model: rawModel } = req.body as {
      projectPath?: unknown;
      name?: unknown;
      description?: unknown;
      model?: unknown;
    };

    const projectPath = requireProjectPath((req.body as { projectPath?: unknown }).projectPath, res);
    if (projectPath === null) return;

    const name = validateName(rawName, res);
    if (name === null) return;

    if (typeof rawDescription !== "string" || !rawDescription.trim()) {
      res.status(400).json({ error: "description is required" });
      return;
    }
    const description = rawDescription.trim();

    const dir = gridsDir(projectPath);
    try {
      await ensureDir(dir);
      const filePath = gridPath(dir, name);

      if (await fileExists(filePath)) {
        return res.status(409).json({ message: "Grid already exists" });
      }

      const model = typeof rawModel === "string" && rawModel ? rawModel : undefined;
      const grid = buildInitialGrid(name, description, model);
      await writeFileEnsureDir(filePath, JSON.stringify(grid, null, 2));
      await writeAgentFile(projectPath, grid);
      await stageGridFiles(projectPath, filePath, agentPath(projectPath, name));

      res.status(201).json({ message: "Grid created", grid });
    } catch (err) {
      next(err);
    }
  },
);

// PUT /api/grids/:name  body: { projectPath, data } → 200
router.put(
  "/:name",
  async (req: Request, res: Response, next: NextFunction) => {
    const name = validateName(req.params.name, res);
    if (name === null) return;

    const projectPath = requireProjectPath((req.body as { projectPath?: unknown }).projectPath, res);
    if (projectPath === null) return;

    const { data } = req.body as { data?: unknown };
    if (typeof data !== "object" || data === null) {
      return res.status(400).json({ message: "data must be a non-null object" });
    }

    const dir = gridsDir(projectPath);
    try {
      await ensureDir(dir);
      const filePath = gridPath(dir, name);
      if (!(await fileExists(filePath))) {
        return res.status(404).json({ message: "Grid not found" });
      }

      const grid = data as GridJson;
      await writeFileEnsureDir(filePath, JSON.stringify(grid, null, 2));
      await writeAgentFile(projectPath, grid);
      await writeHooksFromGrid(projectPath, grid);
      await stageGridFiles(projectPath, filePath, agentPath(projectPath, name));

      res.status(200).json({ message: "Grid saved" });
    } catch (err) {
      next(err);
    }
  },
);

// DELETE /api/grids/:name → 200
router.delete(
  "/:name",
  async (req: Request, res: Response, next: NextFunction) => {
    const name = validateName(req.params.name, res);
    if (name === null) return;

    const projectPath = requireProjectPath(req.query.projectPath, res);
    if (projectPath === null) return;

    const dir = gridsDir(projectPath);
    try {
      await ensureDir(dir);
      const filePath = gridPath(dir, name);
      if (!(await fileExists(filePath))) {
        return res.status(404).json({ message: "Grid not found" });
      }

      await deleteFile(filePath);

      const agentFilePath = agentPath(projectPath, name);
      if (await fileExists(agentFilePath)) {
        await deleteFile(agentFilePath);
      }

      res.status(200).json({ message: "Grid deleted" });
    } catch (err) {
      next(err);
    }
  },
);

export default router;
