import { execFile } from "child_process";
import { promisify } from "util";
import path from "path";
import { fileExists, readFileContent } from "../utils/fileIO.js";

const execFileAsync = promisify(execFile);

export interface ChangeEntry {
  status: "M" | "A" | "??";
  file: string;
}

export interface Commit {
  hash: string;
  date: string;
  message: string;
}

async function git(args: string[], cwd: string): Promise<string> {
  try {
    const { stdout } = await execFileAsync("git", args, { cwd, maxBuffer: 10 * 1024 * 1024 });
    // Use trimEnd, not trim: git status --porcelain lines can start with a
    // meaningful space (e.g. " M path") and trim() would strip that leading space
    // from the first line, corrupting the XY status code parsing.
    return stdout.trimEnd();
  } catch (err) {
    const error = err as NodeJS.ErrnoException & { stderr?: string; code?: string | number };
    if (error.code === "ENOENT") {
      throw Object.assign(new Error("git not found"), { code: "GIT_NOT_FOUND" });
    }
    const stderr = error.stderr ?? "";
    if (stderr.includes("nothing to commit")) {
      return "";
    }
    throw err;
  }
}

export async function isGitRepo(dirPath: string): Promise<boolean> {
  return fileExists(`${dirPath}/.git`);
}

export async function findRepoRoot(fromDir: string): Promise<string | null> {
  try {
    const result = await git(["rev-parse", "--show-toplevel"], fromDir);
    return result || null;
  } catch {
    return null;
  }
}

export async function initRepo(dirPath: string, stagePaths: string[] = ["."]): Promise<void> {
  await git(["init"], dirPath);
  for (const p of stagePaths) {
    try {
      await git(["add", p], dirPath);
    } catch {
      // path may not exist yet — skip silently
    }
  }
  try {
    await git(
      ["-c", "user.name=Stryde", "-c", "user.email=stryde@local", "commit", "-m", "Initial Stryde snapshot"],
      dirPath,
    );
  } catch (err) {
    const error = err as NodeJS.ErrnoException & { code?: string | number };
    // Exit code 1 from commit means nothing to stage — not an error
    if (error.code !== 1) throw err;
  }
}

export async function commitAll(
  repoRoot: string,
  configDir: string,
  message: string,
): Promise<void> {
  const rel = path.relative(repoRoot, configDir);
  // When configDir IS the repo root, rel is "" — use "." so git accepts it.
  const relativeConfigDir = rel === "" ? "." : rel;
  const paths = [relativeConfigDir];
  if (relativeConfigDir !== ".") {
    paths.push("CLAUDE.md");
  }
  await git(["add", ...paths], repoRoot);
  await git(
    ["-c", "user.name=Stryde", "-c", "user.email=stryde@local", "commit", "-m", message],
    repoRoot,
  );
}

function parseStatusCode(xy: string): ChangeEntry["status"] {
  if (xy === "??" ) return "??";
  if (xy === "A " ) return "A";
  if (xy === "M " || xy === " M") return "M";
  return "M";
}

export async function getStatus(
  repoRoot: string,
  configDir: string,
): Promise<ChangeEntry[]> {
  const rel = path.relative(repoRoot, configDir);
  // When configDir IS the repo root, rel is "" — use "." so git accepts it.
  const relativeConfigDir = rel === "" ? "." : rel;
  const paths = [relativeConfigDir];
  if (relativeConfigDir !== ".") {
    paths.push("CLAUDE.md");
  }
  // -uall expands untracked directories to individual files instead of showing "?? .claude/"
  const output = await git(["status", "--porcelain", "-uall", ...paths], repoRoot);
  if (!output) return [];

  return output.split("\n").map((line) => {
    const xy = line.slice(0, 2);
    const file = line.slice(3);
    return { status: parseStatusCode(xy), file };
  });
}

export async function getFileLog(
  repoRoot: string,
  relativeFilePath: string,
): Promise<Commit[]> {
  const output = await git(
    ["log", "--pretty=format:%H|%aI|%s", "--", relativeFilePath],
    repoRoot,
  );
  if (!output) return [];

  return output.split("\n").flatMap((line) => {
    if (!line.trim()) return [];
    const [hash, date, ...rest] = line.split("|");
    return [{ hash: hash ?? "", date: date ?? "", message: rest.join("|") }];
  });
}

export async function getFileDiff(
  repoRoot: string,
  relativeFilePath: string,
  hash: string,
): Promise<{ before: string; after: string }> {
  if (hash === "WORKDIR") {
    let before = "";
    let after = "";
    try {
      before = await git(["show", `HEAD:${relativeFilePath}`], repoRoot);
    } catch { before = ""; }
    try {
      after = await readFileContent(path.join(repoRoot, relativeFilePath));
    } catch { after = ""; }
    return { before, after };
  }

  let after = "";
  let before = "";

  try {
    after = await git(["show", `${hash}:${relativeFilePath}`], repoRoot);
  } catch {
    after = "";
  }

  try {
    before = await git(["show", `${hash}^:${relativeFilePath}`], repoRoot);
  } catch {
    before = "";
  }

  return { before, after };
}

export async function restoreFile(
  repoRoot: string,
  relativeFilePath: string,
  hash: string,
): Promise<string> {
  await git(["checkout", hash, "--", relativeFilePath], repoRoot);
  return readFileContent(path.join(repoRoot, relativeFilePath));
}

// Returns repoRoot-relative file paths changed in a commit (or WORKDIR) under a directory.
export async function getChangedFilesInCommit(
  repoRoot: string,
  repoRelDir: string,
  hash: string,
): Promise<string[]> {
  if (hash === "WORKDIR") {
    const output = await git(["status", "--porcelain", "-uall", "--", repoRelDir], repoRoot);
    if (!output) return [];
    return output.split("\n").map((l) => l.slice(3)).filter(Boolean);
  }
  const output = await git(
    ["diff-tree", "--no-commit-id", "-r", "--name-only", hash, "--", repoRelDir],
    repoRoot,
  );
  if (!output) return [];
  return output.split("\n").filter(Boolean);
}
