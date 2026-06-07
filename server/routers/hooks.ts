import express from "express";
import path from "path";
import type { NextFunction, Request, Response, Router } from "express";
import { getHooks, setHooks } from "../services/hooksService.js";
import { requireProjectPath, resolveHome } from "../lib/parsing.js";
import { getConfigDir } from "../services/claudeConfig.js";
import { findRepoRoot, stageFiles } from "../services/versionControl.js";

const router: Router = express.Router();

router.get("/", async (req: Request, res: Response, next: NextFunction) => {
  const projectPath = requireProjectPath(req.query.projectPath, res);
  if (projectPath === null) return;
  try {
    const hooks = await getHooks(projectPath);
    res.json({ hooks });
  } catch (err) {
    next(err);
  }
});

router.put("/", async (req: Request, res: Response, next: NextFunction) => {
  const { projectPath: rawPath, hooks } = req.body as { projectPath?: unknown; hooks?: unknown };
  const projectPath = requireProjectPath(rawPath, res);
  if (projectPath === null) return;
  if (typeof hooks !== "object" || hooks === null || Array.isArray(hooks)) {
    return res.status(400).json({ message: "hooks must be an object" });
  }
  try {
    await setHooks(projectPath, hooks);
    const configDir = getConfigDir(projectPath);
    const settingsFile = resolveHome(`${configDir}/settings.json`);
    const repoRoot = (await findRepoRoot(configDir)) ?? (await findRepoRoot(projectPath));
    if (repoRoot) {
      const rel = path.relative(repoRoot, settingsFile);
      await stageFiles(repoRoot, [rel]);
    }
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

export default router;
