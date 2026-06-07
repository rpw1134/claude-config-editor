import path from "path";
import { readFileContent, writeFileEnsureDir } from "../lib/fileIO.js";
import { resolveHome } from "../lib/parsing.js";

export interface StrydeConfig {
  versionControl: { enabled: boolean };
  trackStryde: boolean | null;
}

const DEFAULT_CONFIG: StrydeConfig = {
  versionControl: { enabled: false },
  trackStryde: null,
};

const GLOBAL_CLAUDE_DIR = resolveHome("~/.claude");

export function getStrydeDir(projectPath: string): string {
  return projectPath === GLOBAL_CLAUDE_DIR
    ? resolveHome("~/.stryde")
    : path.join(projectPath, ".stryde");
}

export async function getStrydeConfig(projectPath: string): Promise<StrydeConfig> {
  const strydeDir = getStrydeDir(projectPath);
  const configPath = path.join(strydeDir, "config.json");

  let raw: string;
  try {
    raw = await readFileContent(configPath);
  } catch (err) {
    const error = err as NodeJS.ErrnoException;
    if (error.code === "ENOENT") return { ...DEFAULT_CONFIG };
    throw err;
  }

  const parsed = JSON.parse(raw) as Partial<StrydeConfig>;
  return {
    versionControl: parsed.versionControl ?? DEFAULT_CONFIG.versionControl,
    trackStryde: parsed.trackStryde ?? DEFAULT_CONFIG.trackStryde,
  };
}

export async function setStrydeConfig(
  projectPath: string,
  update: Partial<StrydeConfig>,
): Promise<void> {
  const current = await getStrydeConfig(projectPath);
  const merged: StrydeConfig = {
    versionControl: update.versionControl ?? current.versionControl,
    trackStryde: update.trackStryde !== undefined ? update.trackStryde : current.trackStryde,
  };

  const strydeDir = getStrydeDir(projectPath);
  const configPath = path.join(strydeDir, "config.json");
  await writeFileEnsureDir(configPath, JSON.stringify(merged, null, 2));
}
