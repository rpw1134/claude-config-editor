import express from "express";
import path from "path";
import type { NextFunction, Request, Response, Router } from "express";
import {
  readFileContent,
  writeFileContent,
  writeFileEnsureDir,
  fileExists,
  deleteFile,
} from "../utils/fileIO.js";
import { requireProjectPath } from "../utils/parsing.js";
import { getConfigDir } from "../services/claudeConfig.js";
import { findRepoRoot, stageFiles } from "../services/versionControl.js";

const router: Router = express.Router();
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
