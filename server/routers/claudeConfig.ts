import express from "express";
import type { NextFunction, Request, Response, Router } from "express";
import {
  listAgents,
  listMcpServers,
  listSkills,
} from "../services/claudeConfig.js";
import { validateProjectPath } from "../utils/parsing.js";

const router: Router = express.Router();

router.get(
  "/skills",
  async (req: Request, res: Response, next: NextFunction) => {
    let projectPath: string;
    try {
      projectPath = validateProjectPath(req.query.projectPath);
    } catch (e) {
      return res.status(400).json({ message: (e as Error).message });
    }
    try {
      const skills = await listSkills(projectPath);
      res.json({ skills });
    } catch (err) {
      next(err);
    }
  },
);

router.get(
  "/agents",
  async (req: Request, res: Response, next: NextFunction) => {
    let projectPath: string;
    try {
      projectPath = validateProjectPath(req.query.projectPath);
    } catch (e) {
      return res.status(400).json({ message: (e as Error).message });
    }
    try {
      const agents = await listAgents(projectPath);
      res.json({ agents });
    } catch (err) {
      next(err);
    }
  },
);

router.get(
  "/mcp-servers",
  async (req: Request, res: Response, next: NextFunction) => {
    let projectPath: string;
    try {
      projectPath = validateProjectPath(req.query.projectPath);
    } catch (e) {
      return res.status(400).json({ message: (e as Error).message });
    }
    try {
      const mcpServers = await listMcpServers(projectPath);
      res.json({ mcpServers });
    } catch (err) {
      next(err);
    }
  },
);

export default router;
