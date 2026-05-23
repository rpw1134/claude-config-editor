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
import { requireProjectPath, resolveHome } from "../utils/parsing.js";

const router: Router = express.Router();

const AGENTS_GRIDS_DIR = resolveHome("~/.claude/agents/grids");

function gridsDir(projectPath: string): string {
  return path.join(projectPath, ".stryde", "grids");
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
}

interface GridNode {
  id: string;
  type: "orchestrator" | "agent" | "skill";
  position: NodePosition;
  data: NodeData;
}

interface EdgeData {
  description?: string;
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
  createdAt: string;
  nodes: GridNode[];
  edges: GridEdge[];
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function gridPath(dir: string, name: string): string {
  return path.join(dir, `${name}.json`);
}

function agentPath(name: string): string {
  return path.join(AGENTS_GRIDS_DIR, `${name}.md`);
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

function buildInitialGrid(name: string, description: string): GridJson {
  return {
    name,
    description,
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

// ── Typed graph for structured prompt output ──────────────────────────────────

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
      const entry = buildAgentEntry(child.id, rule, nodes, edges, new Set(visited));
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
  `You are being invoked as a subagent in a larger network. ` +
  `Your available tools are provided below as a subgraph.\n\n` +
  `Type definitions:\n\n` +
  TYPE_DEFINITIONS +
  `\n\nYour subgraph:\n{SUBGRAPH}\n\n` +
  `When invoking your own subagents, find their entry in your subgraph, extract their ` +
  `"agents" and "skills" arrays as their subgraph, and prepend this same block verbatim ` +
  `to their invocation — replacing {SUBGRAPH} with their subgraph JSON.`;

function buildOrchestratorPrompt(grid: GridJson): string {
  const orchEdges = grid.edges.filter((e) => e.source === "orchestrator");
  const agentTree: AgentEntry[] = [];

  for (const edge of orchEdges) {
    const target = grid.nodes.find((n) => n.id === edge.target);
    if (!target || target.type !== "agent") continue;
    const rule = edge.data.description ?? "Use when appropriate";
    const entry = buildAgentEntry(target.id, rule, grid.nodes, grid.edges, new Set(["orchestrator"]));
    if (entry) agentTree.push(entry);
  }

  const graphBlock = "```json\n" + JSON.stringify(agentTree, null, 2) + "\n```";

  const body =
    `You are an orchestrator. Route each request to the correct agent. Do not fulfill requests yourself.\n\n` +
    `## Type Definitions\n\n` +
    "```\n" + TYPE_DEFINITIONS + "\n```\n\n" +
    `## Agent Graph\n\n` +
    graphBlock + `\n\n` +
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
  return `---\nname: ${grid.name}\ndescription: ${grid.description}\n---\n\n`;
}

async function writeAgentFile(grid: GridJson): Promise<void> {
  await ensureDir(AGENTS_GRIDS_DIR);
  const content = buildOrchestratorPrompt(grid);
  await writeFileEnsureDir(agentPath(grid.name), content);
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
    const { name: rawName, description: rawDescription } = req.body as {
      projectPath?: unknown;
      name?: unknown;
      description?: unknown;
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

      const grid = buildInitialGrid(name, description);
      await writeFileEnsureDir(filePath, JSON.stringify(grid, null, 2));
      await writeAgentFile(grid);

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
      await writeAgentFile(grid);

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

      const agentFilePath = agentPath(name);
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
