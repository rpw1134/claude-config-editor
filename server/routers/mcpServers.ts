import express from "express";
import type { NextFunction, Request, Response, Router } from "express";
import { getMcpServer, setMcpServer, createMcpServer } from "../services/claudeConfig.js";

const router: Router = express.Router();

router.get(
  "/:key",
  async (req: Request, res: Response, next: NextFunction) => {
    const { key } = req.params;
    try {
      const server = await getMcpServer(key);
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
    const { content } = req.body as { content?: unknown };
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
      await setMcpServer(key, parsed);
      res.status(200).json({ message: "MCP server saved" });
    } catch (err) {
      next(err);
    }
  },
);

router.post(
  "/",
  async (req: Request, res: Response, next: NextFunction) => {
    const { name, content } = req.body as { name?: unknown; content?: unknown };
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
      await createMcpServer(name, parsed);
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

export default router;
