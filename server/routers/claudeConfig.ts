import express from "express";
import type { NextFunction, Request, Response, Router } from "express";
import {
  listAgents,
  listMcpServers,
  listSkills,
} from "../services/claudeConfig.js";

const router: Router = express.Router();

router.get(
  "/skills",
  async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const skills = await listSkills();
      res.json({ skills });
    } catch (err) {
      next(err);
    }
  },
);

router.get(
  "/agents",
  async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const agents = await listAgents();
      res.json({ agents });
    } catch (err) {
      next(err);
    }
  },
);

router.get(
  "/mcp-servers",
  async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const mcpServers = await listMcpServers();
      res.json({ mcpServers });
    } catch (err) {
      next(err);
    }
  },
);

export default router;
