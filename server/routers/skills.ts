import express from "express";
import type { NextFunction, Request, Response, Router } from "express";
import { fileExists, readFileContent, writeFileContent, writeFileEnsureDir, deleteDir, deleteFile, listDir } from "../utils/fileIO.js";
import { requireProjectPath } from "../utils/parsing.js";
import { getConfigDir } from "../services/claudeConfig.js";

const router: Router = express.Router();

router.get(
  "/:name",
  async (req: Request, res: Response, next: NextFunction) => {
    const { name } = req.params;
    const projectPath = requireProjectPath(req.query.projectPath, res);
    if (projectPath === null) return;
    const filePath = `${getConfigDir(projectPath)}/skills/${name}/SKILL.md`;
    try {
      const content = await readFileContent(filePath);
      res.json({ content });
    } catch (err) {
      const error = err as NodeJS.ErrnoException;
      if (error.code === "ENOENT") {
        return res.status(404).json({ message: "Skill not found" });
      }
      next(err);
    }
  },
);

router.put(
  "/:name",
  async (req: Request, res: Response, next: NextFunction) => {
    const { name } = req.params;
    const { projectPath: rawPath, content } = req.body as { projectPath?: unknown; content?: unknown };
    const projectPath = requireProjectPath(rawPath, res);
    if (projectPath === null) return;
    if (typeof content !== "string") {
      return res.status(400).json({ message: "content must be a string" });
    }
    const filePath = `${getConfigDir(projectPath)}/skills/${name}/SKILL.md`;
    try {
      await writeFileContent(filePath, content);
      res.status(200).json({ message: "Skill saved" });
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
    const filePath = `${getConfigDir(projectPath)}/skills/${name}/SKILL.md`;
    try {
      if (await fileExists(filePath)) {
        return res.status(409).json({ message: "Skill already exists" });
      }
      await writeFileEnsureDir(filePath, content);
      res.status(201).json({ message: "Skill created" });
    } catch (err) {
      next(err);
    }
  },
);

router.delete(
  "/:name",
  async (req: Request, res: Response, next: NextFunction) => {
    const { name } = req.params;
    const projectPath = requireProjectPath(req.query.projectPath, res);
    if (projectPath === null) return;
    const dirPath = `${getConfigDir(projectPath)}/skills/${name}`;
    try {
      if (!(await fileExists(dirPath))) {
        return res.status(404).json({ message: "Skill not found" });
      }
      await deleteDir(dirPath);
      res.status(200).json({ message: "Skill deleted" });
    } catch (err) {
      next(err);
    }
  },
);

// ── Per-file routes (non-SKILL.md files inside the skill dir) ─────────────────

function validateFileName(file: unknown, res: Response): string | null {
  if (typeof file !== "string" || !file) {
    res.status(400).json({ message: "file must be a non-empty string" });
    return null;
  }
  if (file.includes("..") || file.includes("/") || file.includes("\\")) {
    res.status(400).json({ message: "file must be a single filename with no path separators" });
    return null;
  }
  return file;
}

// GET /:name/files?projectPath=X  → { files: string[] }
router.get(
  "/:name/files",
  async (req: Request, res: Response, next: NextFunction) => {
    const { name } = req.params;
    const projectPath = requireProjectPath(req.query.projectPath, res);
    if (projectPath === null) return;
    const skillDir = `${getConfigDir(projectPath)}/skills/${name}`;
    try {
      const listing = await listDir(skillDir);
      const files = (listing?.files ?? []).filter((f) => f !== "SKILL.md");
      res.json({ files });
    } catch (err) {
      next(err);
    }
  },
);

// GET /:name/file?projectPath=X&file=reference.md  → { content: string }
router.get(
  "/:name/file",
  async (req: Request, res: Response, next: NextFunction) => {
    const { name } = req.params;
    const projectPath = requireProjectPath(req.query.projectPath, res);
    if (projectPath === null) return;
    const file = validateFileName(req.query.file, res);
    if (file === null) return;
    const filePath = `${getConfigDir(projectPath)}/skills/${name}/${file}`;
    try {
      const content = await readFileContent(filePath);
      res.json({ content });
    } catch (err) {
      const error = err as NodeJS.ErrnoException;
      if (error.code === "ENOENT") {
        return res.status(404).json({ message: "File not found" });
      }
      next(err);
    }
  },
);

// PUT /:name/file  body: { projectPath, file, content }  → 200
router.put(
  "/:name/file",
  async (req: Request, res: Response, next: NextFunction) => {
    const { name } = req.params;
    const { projectPath: rawPath, file: rawFile, content } = req.body as {
      projectPath?: unknown;
      file?: unknown;
      content?: unknown;
    };
    const projectPath = requireProjectPath(rawPath, res);
    if (projectPath === null) return;
    const file = validateFileName(rawFile, res);
    if (file === null) return;
    if (typeof content !== "string") {
      return res.status(400).json({ message: "content must be a string" });
    }
    const filePath = `${getConfigDir(projectPath)}/skills/${name}/${file}`;
    try {
      await writeFileContent(filePath, content);
      res.status(200).json({ message: "File saved" });
    } catch (err) {
      next(err);
    }
  },
);

// POST /:name/file  body: { projectPath, file }  → 201
router.post(
  "/:name/file",
  async (req: Request, res: Response, next: NextFunction) => {
    const { name } = req.params;
    const { projectPath: rawPath, file: rawFile } = req.body as {
      projectPath?: unknown;
      file?: unknown;
    };
    const projectPath = requireProjectPath(rawPath, res);
    if (projectPath === null) return;
    const file = validateFileName(rawFile, res);
    if (file === null) return;
    const filePath = `${getConfigDir(projectPath)}/skills/${name}/${file}`;
    try {
      if (await fileExists(filePath)) {
        return res.status(409).json({ message: "File already exists" });
      }
      await writeFileEnsureDir(filePath, "");
      res.status(201).json({ message: "File created" });
    } catch (err) {
      next(err);
    }
  },
);

// DELETE /:name/file?projectPath=X&file=reference.md  → 200
router.delete(
  "/:name/file",
  async (req: Request, res: Response, next: NextFunction) => {
    const { name } = req.params;
    const projectPath = requireProjectPath(req.query.projectPath, res);
    if (projectPath === null) return;
    const file = validateFileName(req.query.file, res);
    if (file === null) return;
    const filePath = `${getConfigDir(projectPath)}/skills/${name}/${file}`;
    try {
      if (!(await fileExists(filePath))) {
        return res.status(404).json({ message: "File not found" });
      }
      await deleteFile(filePath);
      res.status(200).json({ message: "File deleted" });
    } catch (err) {
      next(err);
    }
  },
);

// ── Script routes (files inside the skill's scripts/ subdirectory) ────────────

// GET /:name/scripts?projectPath=X  → { scripts: string[] }
router.get(
  "/:name/scripts",
  async (req: Request, res: Response, next: NextFunction) => {
    const { name } = req.params;
    const projectPath = requireProjectPath(req.query.projectPath, res);
    if (projectPath === null) return;
    const scriptsDir = `${getConfigDir(projectPath)}/skills/${name}/scripts`;
    try {
      const listing = await listDir(scriptsDir);
      const scripts = listing?.files ?? [];
      res.json({ scripts });
    } catch (err) {
      next(err);
    }
  },
);

// GET /:name/script?projectPath=X&file=foo.sh  → { content: string }
router.get(
  "/:name/script",
  async (req: Request, res: Response, next: NextFunction) => {
    const { name } = req.params;
    const projectPath = requireProjectPath(req.query.projectPath, res);
    if (projectPath === null) return;
    const file = validateFileName(req.query.file, res);
    if (file === null) return;
    const filePath = `${getConfigDir(projectPath)}/skills/${name}/scripts/${file}`;
    try {
      const content = await readFileContent(filePath);
      res.json({ content });
    } catch (err) {
      const error = err as NodeJS.ErrnoException;
      if (error.code === "ENOENT") {
        return res.status(404).json({ message: "Script not found" });
      }
      next(err);
    }
  },
);

// POST /:name/script  body: { projectPath, file, content }  → 201 (409 if exists)
router.post(
  "/:name/script",
  async (req: Request, res: Response, next: NextFunction) => {
    const { name } = req.params;
    const { projectPath: rawPath, file: rawFile, content } = req.body as {
      projectPath?: unknown;
      file?: unknown;
      content?: unknown;
    };
    const projectPath = requireProjectPath(rawPath, res);
    if (projectPath === null) return;
    const file = validateFileName(rawFile, res);
    if (file === null) return;
    if (typeof content !== "string") {
      return res.status(400).json({ message: "content must be a string" });
    }
    const filePath = `${getConfigDir(projectPath)}/skills/${name}/scripts/${file}`;
    try {
      if (await fileExists(filePath)) {
        return res.status(409).json({ message: "Script already exists" });
      }
      await writeFileEnsureDir(filePath, content);
      res.status(201).json({ message: "Script created" });
    } catch (err) {
      next(err);
    }
  },
);

// PUT /:name/script  body: { projectPath, file, content }  → 200
router.put(
  "/:name/script",
  async (req: Request, res: Response, next: NextFunction) => {
    const { name } = req.params;
    const { projectPath: rawPath, file: rawFile, content } = req.body as {
      projectPath?: unknown;
      file?: unknown;
      content?: unknown;
    };
    const projectPath = requireProjectPath(rawPath, res);
    if (projectPath === null) return;
    const file = validateFileName(rawFile, res);
    if (file === null) return;
    if (typeof content !== "string") {
      return res.status(400).json({ message: "content must be a string" });
    }
    const filePath = `${getConfigDir(projectPath)}/skills/${name}/scripts/${file}`;
    try {
      await writeFileContent(filePath, content);
      res.status(200).json({ message: "Script saved" });
    } catch (err) {
      next(err);
    }
  },
);

// DELETE /:name/script?projectPath=X&file=foo.sh  → 200 (404 if not found)
router.delete(
  "/:name/script",
  async (req: Request, res: Response, next: NextFunction) => {
    const { name } = req.params;
    const projectPath = requireProjectPath(req.query.projectPath, res);
    if (projectPath === null) return;
    const file = validateFileName(req.query.file, res);
    if (file === null) return;
    const filePath = `${getConfigDir(projectPath)}/skills/${name}/scripts/${file}`;
    try {
      if (!(await fileExists(filePath))) {
        return res.status(404).json({ message: "Script not found" });
      }
      await deleteFile(filePath);
      res.status(200).json({ message: "Script deleted" });
    } catch (err) {
      next(err);
    }
  },
);

export default router;
