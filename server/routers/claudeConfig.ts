import express from "express";
import type { NextFunction, Request, Response, Router } from "express";
import {
  listAgents,
  listMcpServers,
  listSkills,
} from "../services/claudeConfig.js";
import { requireProjectPath } from "../utils/parsing.js";

const router: Router = express.Router();

router.get(
  "/skills",
  async (req: Request, res: Response, next: NextFunction) => {
    const projectPath = requireProjectPath(req.query.projectPath, res);
    if (projectPath === null) return;
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
    const projectPath = requireProjectPath(req.query.projectPath, res);
    if (projectPath === null) return;
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
    const projectPath = requireProjectPath(req.query.projectPath, res);
    if (projectPath === null) return;
    try {
      const mcpServers = await listMcpServers(projectPath);
      res.json({ mcpServers });
    } catch (err) {
      next(err);
    }
  },
);

export default router;
