import express from "express";
import type { NextFunction, Request, Response, Router } from "express";
import { readFileContent, writeFileContent } from "../utils/fileIO.js";
import { resolveHome } from "../utils/parsing.js";

const router: Router = express.Router();

router.get(
  "/:name",
  async (req: Request, res: Response, next: NextFunction) => {
    const { name } = req.params;
    const filePath = resolveHome(`~/.claude/agents/${name}.md`);
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
    const { content } = req.body as { content?: unknown };
    if (typeof content !== "string") {
      return res.status(400).json({ message: "content must be a string" });
    }
    const filePath = resolveHome(`~/.claude/agents/${name}.md`);
    try {
      await writeFileContent(filePath, content);
      res.status(200).json({ message: "Agent saved" });
    } catch (err) {
      next(err);
    }
  },
);

export default router;
