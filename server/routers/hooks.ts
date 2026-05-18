import express from "express";
import type { NextFunction, Request, Response, Router } from "express";
import { getHooks, setHooks } from "../services/hooksService.js";
import { requireProjectPath } from "../utils/parsing.js";

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
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

export default router;
