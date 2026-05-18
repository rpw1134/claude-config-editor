import express from "express";
import type { NextFunction, Request, Response, Router } from "express";
import { createProject, getProjectContent, listProjects, setProjectContent } from "../services/claudeConfig.js";

const router: Router = express.Router();

router.get("/", async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const projects = await listProjects();
    res.json({ projects });
  } catch (err) {
    next(err);
  }
});

router.get("/file", async (req: Request, res: Response, next: NextFunction) => {
  const path = req.query.path as string;
  if (!path) {
    return res.status(400).json({ message: "path query parameter is required" });
  }
  try {
    const content = await getProjectContent(path);
    if (content === null) {
      return res.status(404).json({ message: "CLAUDE.md not found for project" });
    }
    res.json({ content });
  } catch (err) {
    const error = err as Error;
    if (error.message === "Project not found") {
      return res.status(403).json({ message: error.message });
    }
    next(err);
  }
});

router.put("/file", async (req: Request, res: Response, next: NextFunction) => {
  const path = req.query.path as string;
  if (!path) {
    return res.status(400).json({ message: "path query parameter is required" });
  }
  const { content } = req.body as { content?: unknown };
  if (typeof content !== "string") {
    return res.status(400).json({ message: "content must be a string" });
  }
  try {
    await setProjectContent(path, content);
    res.json({ message: "Project saved" });
  } catch (err) {
    const error = err as Error;
    if (error.message === "Project not found") {
      return res.status(403).json({ message: error.message });
    }
    next(err);
  }
});

router.post("/create", async (req: Request, res: Response, next: NextFunction) => {
  const { path } = req.body as { path?: unknown };
  if (typeof path !== "string" || !path.trim()) {
    return res.status(400).json({ code: "invalid_path", message: "path is required" });
  }
  try {
    const result = await createProject(path);
    res.status(201).json(result);
  } catch (err) {
    const e = err as NodeJS.ErrnoException & { code?: string };
    if (e.code === "already_project") {
      return res.status(400).json({ code: "already_project", message: e.message });
    }
    if (e.code === "ERR_INVALID_PATH" || e.message?.includes("projectPath")) {
      return res.status(400).json({ code: "invalid_path", message: e.message });
    }
    next(err);
  }
});

export default router;
