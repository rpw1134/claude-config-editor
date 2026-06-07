import express from "express";
import path from "path";
import type { NextFunction, Request, Response, Router } from "express";
import { requireProjectPath } from "../lib/parsing.js";
import { getConfigDir } from "../services/claudeConfig.js";
import { resolveHome } from "../lib/parsing.js";
import {
  findRepoRoot,
  initRepo,
  commitAll,
  getStatus,
  getFileLog,
  getFileDiff,
  restoreFile,
  getChangedFilesInCommit,
} from "../services/versionControl.js";
import {
  checkGitignore,
  ensureLocalProtection,
  ensureStrydeIgnored,
  removeClaudeIgnore,
} from "../services/gitignoreManager.js";
import {
  getStrydeConfig,
  setStrydeConfig,
} from "../services/strydeConfig.js";
import type { GitignoreCheckResult } from "../services/gitignoreManager.js";

const router: Router = express.Router();

const GLOBAL_CLAUDE_DIR = resolveHome("~/.claude");

const ALL_FALSE_GITIGNORE: GitignoreCheckResult = {
  claudeIgnored: false,
  claudeIgnoredBy: null,
  localsProtected: false,
  strydeIgnored: false,
};

async function getRepoDirs(
  projectPath: string,
): Promise<{ configDir: string; repoRoot: string | null }> {
  const configDir = getConfigDir(projectPath);
  let repoRoot = await findRepoRoot(configDir);
  // configDir may not exist yet (no agents/skills created); fall back to projectPath
  if (repoRoot === null && configDir !== projectPath) {
    repoRoot = await findRepoRoot(projectPath);
  }
  return { configDir, repoRoot };
}

function isGitNotFoundError(err: unknown): boolean {
  return (err as NodeJS.ErrnoException & { code?: string })?.code === "GIT_NOT_FOUND";
}

// Convert a path to a repoRoot-relative path.
// Absolute paths are resolved directly against repoRoot.
// Relative paths are assumed to be configDir-relative and prefixed accordingly.
// CLAUDE.md is a special case: it lives at the repo root.
function resolveFilePath(repoRoot: string, configDir: string, file: string): string {
  if (file === "CLAUDE.md") return "CLAUDE.md";
  if (path.isAbsolute(file)) return path.relative(repoRoot, file);
  const prefix = path.relative(repoRoot, configDir);
  return prefix ? path.join(prefix, file) : file;
}

router.get(
  "/status",
  async (req: Request, res: Response, next: NextFunction) => {
    const projectPath = requireProjectPath(req.query.projectPath, res);
    if (projectPath === null) return;

    try {
      const { configDir, repoRoot } = await getRepoDirs(projectPath);
      const initialized = repoRoot !== null;
      const changes = initialized ? await getStatus(repoRoot!, configDir) : [];
      const gitignore = initialized
        ? await checkGitignore(repoRoot!, configDir)
        : { ...ALL_FALSE_GITIGNORE };

      res.json({ initialized, repoRoot, configDir, changes, gitignore });
    } catch (err) {
      if (isGitNotFoundError(err)) {
        return res.status(503).json({ code: "GIT_NOT_FOUND" });
      }
      next(err);
    }
  },
);

router.post(
  "/init",
  async (req: Request, res: Response, next: NextFunction) => {
    const { projectPath: rawPath } = req.body as { projectPath?: unknown };
    const projectPath = requireProjectPath(rawPath, res);
    if (projectPath === null) return;

    try {
      const { configDir, repoRoot } = await getRepoDirs(projectPath);

      if (repoRoot === null) {
        const isGlobal = projectPath === GLOBAL_CLAUDE_DIR;
        if (isGlobal) {
          await initRepo(configDir);
        } else {
          // Only stage .claude/ and CLAUDE.md — not the entire project tree
          await initRepo(projectPath, [".claude", "CLAUDE.md"]);
        }
      }

      await setStrydeConfig(projectPath, { versionControl: { enabled: true } });
      res.status(201).json({ message: "Initialized" });
    } catch (err) {
      if (isGitNotFoundError(err)) {
        return res.status(503).json({ code: "GIT_NOT_FOUND" });
      }
      next(err);
    }
  },
);

router.get(
  "/log",
  async (req: Request, res: Response, next: NextFunction) => {
    const projectPath = requireProjectPath(req.query.projectPath, res);
    if (projectPath === null) return;
    const file = req.query.file as string | undefined;

    if (!file) {
      return res.status(400).json({ message: "file query parameter is required" });
    }

    try {
      let repoRoot: string | null;
      let repoRelFile: string;

      if (path.isAbsolute(file)) {
        // File path is absolute — find the repo from the file's own directory.
        // This handles grid JSON files at projectPath/.stryde/ which live outside
        // the .claude sub-repo that getRepoDirs would otherwise return.
        repoRoot = await findRepoRoot(path.dirname(file));
        if (repoRoot === null) {
          return res.status(404).json({ message: "Version control not initialized" });
        }
        repoRelFile = path.relative(repoRoot, file);
      } else {
        const dirs = await getRepoDirs(projectPath);
        repoRoot = dirs.repoRoot;
        if (repoRoot === null) {
          return res.status(404).json({ message: "Version control not initialized" });
        }
        repoRelFile = resolveFilePath(repoRoot, dirs.configDir, file);
      }

      const commits = await getFileLog(repoRoot, repoRelFile);
      res.json({ commits });
    } catch (err) {
      if (isGitNotFoundError(err)) {
        return res.status(503).json({ code: "GIT_NOT_FOUND" });
      }
      next(err);
    }
  },
);

router.get(
  "/diff",
  async (req: Request, res: Response, next: NextFunction) => {
    const projectPath = requireProjectPath(req.query.projectPath, res);
    if (projectPath === null) return;
    const file = req.query.file as string | undefined;
    const hash = req.query.hash as string | undefined;

    if (!file || !hash) {
      return res.status(400).json({ message: "file and hash query parameters are required" });
    }

    try {
      const { repoRoot, configDir } = await getRepoDirs(projectPath);
      if (repoRoot === null) {
        return res.status(404).json({ message: "Version control not initialized" });
      }

      const repoRelFile = resolveFilePath(repoRoot, configDir, file);
      const diff = await getFileDiff(repoRoot, repoRelFile, hash);
      res.json(diff);
    } catch (err) {
      if (isGitNotFoundError(err)) {
        return res.status(503).json({ code: "GIT_NOT_FOUND" });
      }
      next(err);
    }
  },
);

router.post(
  "/restore",
  async (req: Request, res: Response, next: NextFunction) => {
    const { projectPath: rawPath, file, hash } = req.body as {
      projectPath?: unknown;
      file?: unknown;
      hash?: unknown;
    };
    const projectPath = requireProjectPath(rawPath, res);
    if (projectPath === null) return;

    if (typeof file !== "string" || typeof hash !== "string") {
      return res.status(400).json({ message: "file and hash must be strings" });
    }

    try {
      const { repoRoot, configDir } = await getRepoDirs(projectPath);
      if (repoRoot === null) {
        return res.status(404).json({ message: "Version control not initialized" });
      }

      const repoRelFile = resolveFilePath(repoRoot, configDir, file);
      const content = await restoreFile(repoRoot, repoRelFile, hash);
      res.json({ content });
    } catch (err) {
      if (isGitNotFoundError(err)) {
        return res.status(503).json({ code: "GIT_NOT_FOUND" });
      }
      next(err);
    }
  },
);

router.post(
  "/commit",
  async (req: Request, res: Response, next: NextFunction) => {
    const { projectPath: rawPath, message } = req.body as {
      projectPath?: unknown;
      message?: unknown;
    };
    const projectPath = requireProjectPath(rawPath, res);
    if (projectPath === null) return;

    if (typeof message !== "string") {
      return res.status(400).json({ message: "message must be a string" });
    }

    try {
      const { configDir, repoRoot } = await getRepoDirs(projectPath);
      if (repoRoot === null) {
        return res.status(404).json({ message: "Version control not initialized" });
      }

      await commitAll(repoRoot, configDir, message);
      res.json({ message: "Committed" });
    } catch (err) {
      if (isGitNotFoundError(err)) {
        return res.status(503).json({ code: "GIT_NOT_FOUND" });
      }
      next(err);
    }
  },
);

router.get(
  "/settings",
  async (req: Request, res: Response, next: NextFunction) => {
    const projectPath = requireProjectPath(req.query.projectPath, res);
    if (projectPath === null) return;

    try {
      const config = await getStrydeConfig(projectPath);
      res.json({ enabled: config.versionControl.enabled });
    } catch (err) {
      next(err);
    }
  },
);

router.put(
  "/settings",
  async (req: Request, res: Response, next: NextFunction) => {
    const { projectPath: rawPath, enabled } = req.body as {
      projectPath?: unknown;
      enabled?: unknown;
    };
    const projectPath = requireProjectPath(rawPath, res);
    if (projectPath === null) return;

    if (typeof enabled !== "boolean") {
      return res.status(400).json({ message: "enabled must be a boolean" });
    }

    try {
      await setStrydeConfig(projectPath, { versionControl: { enabled } });
      res.json({ message: "Settings updated" });
    } catch (err) {
      next(err);
    }
  },
);

// Returns configDir-relative file paths changed in a commit (or WORKDIR) under a directory.
router.get(
  "/diff-files",
  async (req: Request, res: Response, next: NextFunction) => {
    const projectPath = requireProjectPath(req.query.projectPath, res);
    if (projectPath === null) return;
    const dir = req.query.dir as string | undefined;
    const hash = req.query.hash as string | undefined;

    if (!dir || !hash) {
      return res.status(400).json({ message: "dir and hash query parameters are required" });
    }

    try {
      const { repoRoot, configDir } = await getRepoDirs(projectPath);
      if (repoRoot === null) {
        return res.status(404).json({ message: "Version control not initialized" });
      }

      const repoRelDir = resolveFilePath(repoRoot, configDir, dir);
      const repoFiles = await getChangedFilesInCommit(repoRoot, repoRelDir, hash);

      // Convert back to configDir-relative paths
      const prefix = path.relative(repoRoot, configDir);
      const configFiles = repoFiles.map((f) => {
        if (prefix && f.startsWith(prefix + path.sep)) return f.slice(prefix.length + 1);
        return f;
      });

      res.json({ files: configFiles });
    } catch (err) {
      if (isGitNotFoundError(err)) {
        return res.status(503).json({ code: "GIT_NOT_FOUND" });
      }
      next(err);
    }
  },
);

router.post(
  "/gitignore/protect",
  async (req: Request, res: Response, next: NextFunction) => {
    const { projectPath: rawPath } = req.body as { projectPath?: unknown };
    const projectPath = requireProjectPath(rawPath, res);
    if (projectPath === null) return;

    try {
      const { repoRoot } = await getRepoDirs(projectPath);
      if (repoRoot === null) {
        return res.status(404).json({ message: "Version control not initialized" });
      }

      await ensureLocalProtection(repoRoot);
      res.json({ message: "Protection ensured" });
    } catch (err) {
      if (isGitNotFoundError(err)) {
        return res.status(503).json({ code: "GIT_NOT_FOUND" });
      }
      next(err);
    }
  },
);

router.post(
  "/gitignore/unblock",
  async (req: Request, res: Response, next: NextFunction) => {
    const { projectPath: rawPath, gitignorePath } = req.body as {
      projectPath?: unknown;
      gitignorePath?: unknown;
    };
    const projectPath = requireProjectPath(rawPath, res);
    if (projectPath === null) return;

    if (typeof gitignorePath !== "string") {
      return res.status(400).json({ message: "gitignorePath must be a string" });
    }

    try {
      await removeClaudeIgnore(gitignorePath);
      res.json({ message: "Unblocked" });
    } catch (err) {
      next(err);
    }
  },
);

router.post(
  "/gitignore/stryde",
  async (req: Request, res: Response, next: NextFunction) => {
    const { projectPath: rawPath, ignore } = req.body as {
      projectPath?: unknown;
      ignore?: unknown;
    };
    const projectPath = requireProjectPath(rawPath, res);
    if (projectPath === null) return;

    if (typeof ignore !== "boolean") {
      return res.status(400).json({ message: "ignore must be a boolean" });
    }

    try {
      const { repoRoot } = await getRepoDirs(projectPath);
      if (repoRoot === null) {
        return res.status(404).json({ message: "Version control not initialized" });
      }

      if (ignore) {
        await ensureStrydeIgnored(repoRoot);
      }

      await setStrydeConfig(projectPath, { trackStryde: !ignore });
      res.json({ message: "Updated" });
    } catch (err) {
      if (isGitNotFoundError(err)) {
        return res.status(503).json({ code: "GIT_NOT_FOUND" });
      }
      next(err);
    }
  },
);

export default router;
