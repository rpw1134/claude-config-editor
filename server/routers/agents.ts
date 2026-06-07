import express from "express";
import path from "path";
import type { NextFunction, Request, Response, Router } from "express";
import {
  readFileContent,
  writeFileContent,
  writeFileEnsureDir,
  fileExists,
  deleteFile,
  listDir,
} from "../lib/fileIO.js";
import { requireProjectPath } from "../lib/parsing.js";
import { getConfigDir } from "../services/claudeConfig.js";
import { findRepoRoot, stageFiles } from "../services/versionControl.js";

interface AgentSummary {
  name: string;
  color?: string;
}

// Matches `color: #7c3aed` or `color: "#7c3aed"` in YAML frontmatter.
const COLOR_LINE_RE = /^color:\s*["']?(#[0-9a-fA-F]{3,8})["']?\s*$/m;
const FRONTMATTER_BLOCK_RE = /^---\r?\n[\s\S]*?\r?\n---(?:\r?\n|$)/;

function extractColor(content: string): string | undefined {
  const trimmed = content.trimStart();
  if (!FRONTMATTER_BLOCK_RE.test(trimmed)) return undefined;
  const match = COLOR_LINE_RE.exec(trimmed);
  return match ? match[1] : undefined;
}

const router: Router = express.Router();

router.get(
  "/summaries",
  async (req: Request, res: Response, next: NextFunction) => {
    const projectPath = requireProjectPath(req.query.projectPath, res);
    if (projectPath === null) return;
    const agentsDir = `${getConfigDir(projectPath)}/agents`;
    try {
      const listing = await listDir(agentsDir);
      const names =
        listing?.files.filter((f) => f.endsWith(".md")).map((f) => f.slice(0, -3)) ?? [];
      const summaries: AgentSummary[] = await Promise.all(
        names.map(async (name) => {
          try {
            const content = await readFileContent(`${agentsDir}/${name}.md`);
            return { name, color: extractColor(content) };
          } catch {
            return { name };
          }
        }),
      );
      res.json({ summaries });
    } catch (err) {
      next(err);
    }
  },
);
router.get(
  "/:name",
  async (req: Request, res: Response, next: NextFunction) => {
    const { name } = req.params;
    const projectPath = requireProjectPath(req.query.projectPath, res);
    if (projectPath === null) return;
    const filePath = `${getConfigDir(projectPath)}/agents/${name}.md`;
    try {
      const content = await readFileContent(filePath);
      res.json({ content });
    } catch (err) {
      const error = err as NodeJS.ErrnoException;
      if (error.code === "ENOENT") {
        return res.status(404).json({ message: "Agent not found" });
      }
      next(err);
    }
  },
);

router.put(
  "/:name",
  async (req: Request, res: Response, next: NextFunction) => {
    const { name } = req.params;
    const { projectPath: rawPath, content } = req.body as {
      projectPath?: unknown;
      content?: unknown;
    };
    const projectPath = requireProjectPath(rawPath, res);
    if (projectPath === null) return;
    if (typeof content !== "string") {
      return res.status(400).json({ message: "content must be a string" });
    }
    const configDir = getConfigDir(projectPath);
    const filePath = `${configDir}/agents/${name}.md`;
    try {
      await writeFileContent(filePath, content);
      const repoRoot =
        (await findRepoRoot(configDir)) ?? (await findRepoRoot(projectPath));
      if (repoRoot) {
        const rel = path.relative(repoRoot, filePath);
        await stageFiles(repoRoot, [rel]);
      }
      res.status(200).json({ message: "Agent saved" });
    } catch (err) {
      next(err);
    }
  },
);

router.post("/", async (req: Request, res: Response, next: NextFunction) => {
  const {
    projectPath: rawPath,
    name,
    content,
  } = req.body as {
    projectPath?: unknown;
    name?: unknown;
    content?: unknown;
  };
  const projectPath = requireProjectPath(rawPath, res);
  if (projectPath === null) return;
  if (typeof name !== "string" || typeof content !== "string") {
    return res
      .status(400)
      .json({ message: "name and content must be strings" });
  }
  if (
    !name ||
    name.includes("/") ||
    name.includes("\\") ||
    name.includes("..")
  ) {
    return res
      .status(400)
      .json({ message: "name must not be empty or contain path separators" });
  }
  const configDir = getConfigDir(projectPath);
  const filePath = `${configDir}/agents/${name}.md`;
  try {
    if (await fileExists(filePath)) {
      return res.status(409).json({ message: "Agent already exists" });
    }
    await writeFileEnsureDir(filePath, content);

    const repoRoot =
      (await findRepoRoot(configDir)) ?? (await findRepoRoot(projectPath));
    if (repoRoot) {
      const rel = path.relative(repoRoot, filePath);
      await stageFiles(repoRoot, [rel]);
    }

    res.status(201).json({ message: "Agent created" });
  } catch (err) {
    next(err);
  }
});

router.delete(
  "/:name",
  async (req: Request, res: Response, next: NextFunction) => {
    const { name } = req.params;
    const projectPath = requireProjectPath(req.query.projectPath, res);
    if (projectPath === null) return;
    const filePath = `${getConfigDir(projectPath)}/agents/${name}.md`;
    try {
      if (!(await fileExists(filePath))) {
        return res.status(404).json({ message: "Agent not found" });
      }
      await deleteFile(filePath);
      res.status(200).json({ message: "Agent deleted" });
    } catch (err) {
      next(err);
    }
  },
);

export default router;
