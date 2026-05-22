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
import { resolveHome } from "../utils/parsing.js";

const router: Router = express.Router();

// App repo root — one level up from server/
const APP_ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "../..");
const GRIDS_DIR = path.join(APP_ROOT, ".stryde", "grids");
const AGENTS_GRIDS_DIR = resolveHome("~/.claude/agents/grids");

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

function gridPath(name: string): string {
  return path.join(GRIDS_DIR, `${name}.json`);
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

function buildOrchestratorPrompt(grid: GridJson): string {
  const agentEdges = grid.edges.filter((e) => e.source === "orchestrator");

  if (agentEdges.length === 0) {
    return buildFrontmatter(grid) + noAgentsBody();
  }

  const agentSections = agentEdges.map((edge) => {
    const targetNode = grid.nodes.find((n) => n.id === edge.target);
    if (!targetNode || targetNode.type !== "agent") return null;

    const agentName = targetNode.data.agentName ?? targetNode.data.label;
    const whenToUse = edge.data.description ?? "Use when appropriate";

    const skillEdges = grid.edges.filter((e) => e.source === targetNode.id);
    const skillLines = skillEdges
      .map((se) => {
        const skillNode = grid.nodes.find((n) => n.id === se.target);
        if (!skillNode) return null;
        const skillName = skillNode.data.skillName ?? skillNode.data.label;
        const desc = se.data.description ?? "Use when appropriate";
        return `- For ${skillName}: ${desc}`;
      })
      .filter((l): l is string => l !== null);

    const skillBlock =
      skillLines.length > 0
        ? `\n**When invoking this agent, append these directions:**\n${skillLines.join("\n")}`
        : "";

    return `### ${agentName}\n**When to use:** ${whenToUse}${skillBlock}`;
  });

  const validSections = agentSections.filter((s): s is string => s !== null);

  const body =
    `You are an orchestrator agent. Your sole responsibility is to route incoming requests ` +
    `to the appropriate specialist agent. Do not attempt to fulfill requests yourself — ` +
    `analyze what is being asked and delegate to the correct agent.\n\n` +
    `## Available Agents\n\n` +
    validSections.join("\n\n");

  return buildFrontmatter(grid) + body;
}

function buildFrontmatter(grid: GridJson): string {
  return `---\nname: ${grid.name}\ndescription: ${grid.description}\n---\n\n`;
}

function noAgentsBody(): string {
  return (
    "You are an orchestrator agent. No agents are connected to this grid yet. " +
    "Add agent nodes in the Grids editor to enable routing."
  );
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
  async (_req: Request, res: Response, next: NextFunction) => {
    try {
      await ensureDir(GRIDS_DIR);
      const listing = await listDir(GRIDS_DIR);
      const files = (listing?.files ?? []).filter((f) => f.endsWith(".json"));

      const grids = await Promise.all(
        files.map(async (file) => {
          const raw = await readFileContent(path.join(GRIDS_DIR, file));
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

    try {
      const filePath = gridPath(name);
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

// POST /api/grids  body: { name, description } → 201
router.post(
  "/",
  async (req: Request, res: Response, next: NextFunction) => {
    const { name: rawName, description: rawDescription } = req.body as {
      name?: unknown;
      description?: unknown;
    };

    const name = validateName(rawName, res);
    if (name === null) return;

    const description =
      typeof rawDescription === "string" ? rawDescription : "";

    try {
      await ensureDir(GRIDS_DIR);
      const filePath = gridPath(name);

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

// PUT /api/grids/:name  body: { data } → 200
router.put(
  "/:name",
  async (req: Request, res: Response, next: NextFunction) => {
    const name = validateName(req.params.name, res);
    if (name === null) return;

    const { data } = req.body as { data?: unknown };
    if (typeof data !== "object" || data === null) {
      return res.status(400).json({ message: "data must be a non-null object" });
    }

    try {
      const filePath = gridPath(name);
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

    try {
      const filePath = gridPath(name);
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
