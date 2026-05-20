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
    const { stdout } = await execFileAsync("git", args, { cwd });
    return stdout.trim();
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

export async function initRepo(dirPath: string): Promise<void> {
  await git(["init"], dirPath);
  await git(["add", "."], dirPath);
  try {
    await git(["commit", "-m", "Initial Stryde snapshot"], dirPath);
  } catch (err) {
    const error = err as NodeJS.ErrnoException & { code?: string | number };
    // Exit code 1 from commit means empty repo — not an error
    if (error.code !== 1) throw err;
  }
}

export async function commitAll(
  repoRoot: string,
  configDir: string,
  message: string,
): Promise<void> {
  const relativeConfigDir = path.relative(repoRoot, configDir);
  const paths = [relativeConfigDir];
  if (relativeConfigDir !== ".") {
    paths.push("CLAUDE.md");
  }
  await git(["add", ...paths], repoRoot);
  await git(["commit", "-m", message], repoRoot);
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
  const relativeConfigDir = path.relative(repoRoot, configDir);
  const paths = [relativeConfigDir];
  if (relativeConfigDir !== ".") {
    paths.push("CLAUDE.md");
  }
  const output = await git(["status", "--porcelain", ...paths], repoRoot);
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
