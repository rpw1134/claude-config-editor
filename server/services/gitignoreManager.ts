import path from "path";
import { fileExists, readFileContent, writeFileEnsureDir } from "../utils/fileIO.js";

export interface GitignoreCheckResult {
  claudeIgnored: boolean;
  claudeIgnoredBy: string | null;
  localsProtected: boolean;
  strydeIgnored: boolean;
}

const CLAUDE_IGNORE_PATTERNS = new Set([
  ".claude",
  ".claude/",
  "**/.claude",
  "**/.claude/",
  "**/.claude/**",
]);

const LOCAL_PROTECT_PATTERNS = new Set([
  ".claude/settings.local.json",
  ".claude/*.local.json",
]);

function isContentLine(line: string): boolean {
  const trimmed = line.trim();
  return trimmed.length > 0 && !trimmed.startsWith("#");
}

function collectGitignorePaths(fromDir: string, repoRoot: string): string[] {
  const paths: string[] = [];
  let current = fromDir;
  while (true) {
    paths.push(path.join(current, ".gitignore"));
    if (current === repoRoot) break;
    const parent = path.dirname(current);
    if (parent === current) break; // filesystem root
    current = parent;
  }
  return paths;
}

export async function checkGitignore(
  repoRoot: string,
  claudeDir: string,
): Promise<GitignoreCheckResult> {
  const result: GitignoreCheckResult = {
    claudeIgnored: false,
    claudeIgnoredBy: null,
    localsProtected: false,
    strydeIgnored: false,
  };

  const gitignorePaths = collectGitignorePaths(claudeDir, repoRoot);

  for (const gitignorePath of gitignorePaths) {
    if (!(await fileExists(gitignorePath))) continue;

    let content: string;
    try {
      content = await readFileContent(gitignorePath);
    } catch {
      continue;
    }

    const lines = content.split("\n");
    for (const line of lines) {
      if (!isContentLine(line)) continue;
      const trimmed = line.trim();

      if (!result.claudeIgnored && CLAUDE_IGNORE_PATTERNS.has(trimmed)) {
        result.claudeIgnored = true;
        result.claudeIgnoredBy = gitignorePath;
      }

      if (!result.localsProtected && LOCAL_PROTECT_PATTERNS.has(trimmed)) {
        result.localsProtected = true;
      }

      if (!result.strydeIgnored && (trimmed === ".stryde" || trimmed === ".stryde/")) {
        result.strydeIgnored = true;
      }
    }
  }

  return result;
}

export async function ensureLocalProtection(repoRoot: string): Promise<void> {
  const gitignorePath = path.join(repoRoot, ".gitignore");
  let existing = "";
  try {
    existing = await readFileContent(gitignorePath);
  } catch (err) {
    const error = err as NodeJS.ErrnoException;
    if (error.code !== "ENOENT") throw err;
  }

  const linesToAdd: string[] = [];
  if (!existing.includes(".claude/settings.local.json")) {
    linesToAdd.push(".claude/settings.local.json");
  }
  if (!existing.includes(".claude/*.local.json")) {
    linesToAdd.push(".claude/*.local.json");
  }

  if (linesToAdd.length === 0) return;

  const header = "\n# Stryde — local-only Claude Code config\n";
  const toAppend = header + linesToAdd.join("\n") + "\n";
  await writeFileEnsureDir(gitignorePath, existing + toAppend);
}

export async function ensureStrydeIgnored(repoRoot: string): Promise<void> {
  const gitignorePath = path.join(repoRoot, ".gitignore");
  let existing = "";
  try {
    existing = await readFileContent(gitignorePath);
  } catch (err) {
    const error = err as NodeJS.ErrnoException;
    if (error.code !== "ENOENT") throw err;
  }

  const alreadyPresent = existing.split("\n").some((line) => {
    const t = line.trim();
    return t === ".stryde" || t === ".stryde/";
  });

  if (alreadyPresent) return;

  await writeFileEnsureDir(gitignorePath, existing + "\n.stryde/\n");
}

export async function removeClaudeIgnore(gitignorePath: string): Promise<void> {
  const content = await readFileContent(gitignorePath);
  const filtered = content
    .split("\n")
    .filter((line) => !CLAUDE_IGNORE_PATTERNS.has(line.trim()))
    .join("\n");
  await writeFileEnsureDir(gitignorePath, filtered);
}
