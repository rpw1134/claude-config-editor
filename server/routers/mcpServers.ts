import express from "express";
import type { NextFunction, Request, Response, Router } from "express";
import { getMcpServer, setMcpServer, createMcpServer, deleteMcpServer } from "../services/claudeConfig.js";
import { requireProjectPath } from "../utils/parsing.js";

const router: Router = express.Router();

router.get(
  "/:key",
  async (req: Request, res: Response, next: NextFunction) => {
    const { key } = req.params;
    const projectPath = requireProjectPath(req.query.projectPath, res);
    if (projectPath === null) return;
    try {
      const server = await getMcpServer(projectPath, key);
      if (server === null) {
        return res.status(404).json({ message: "MCP server not found" });
      }
      res.json({ content: JSON.stringify(server, null, 2) });
    } catch (err) {
      next(err);
    }
  },
);

router.put(
  "/:key",
  async (req: Request, res: Response, next: NextFunction) => {
    const { key } = req.params;
    const { projectPath: rawPath, content } = req.body as { projectPath?: unknown; content?: unknown };
    const projectPath = requireProjectPath(rawPath, res);
    if (projectPath === null) return;
    if (typeof content !== "string") {
      return res.status(400).json({ message: "content must be a string" });
    }
    let parsed: unknown;
    try {
      parsed = JSON.parse(content);
    } catch {
      return res.status(400).json({ message: "content must be valid JSON" });
    }
    try {
      await setMcpServer(projectPath, key, parsed);
      res.status(200).json({ message: "MCP server saved" });
    } catch (err) {
      next(err);
    }
  },
);

router.post(
  "/",
  async (req: Request, res: Response, next: NextFunction) => {
    const { projectPath: rawPath, name, content } = req.body as {
      projectPath?: unknown;
      name?: unknown;
      content?: unknown;
    };
    const projectPath = requireProjectPath(rawPath, res);
    if (projectPath === null) return;
    if (typeof name !== "string" || typeof content !== "string") {
      return res.status(400).json({ message: "name and content must be strings" });
    }
    if (!name || name.includes("/") || name.includes("\\") || name.includes("..")) {
      return res.status(400).json({ message: "name must not be empty or contain path separators" });
    }
    let parsed: unknown;
    try {
      parsed = JSON.parse(content);
    } catch {
      return res.status(400).json({ message: "content must be valid JSON" });
    }
    try {
      await createMcpServer(projectPath, name, parsed);
      res.status(201).json({ message: "MCP server created" });
    } catch (err) {
      const error = err as Error;
      if (error.message.includes("already exists")) {
        return res.status(409).json({ message: error.message });
      }
      next(err);
    }
  },
);

router.delete(
  "/:key",
  async (req: Request, res: Response, next: NextFunction) => {
    const { key } = req.params;
    const projectPath = requireProjectPath(req.query.projectPath, res);
    if (projectPath === null) return;
    try {
      await deleteMcpServer(projectPath, key);
      res.status(200).json({ message: "MCP server deleted" });
    } catch (err) {
      const error = err as Error;
      if (error.message.includes("not found")) {
        return res.status(404).json({ message: error.message });
      }
      next(err);
    }
  },
);

export default router;
