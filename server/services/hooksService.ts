import { readFileContent, writeFileEnsureDir } from "../utils/fileIO.js";
import { resolveHome } from "../utils/parsing.js";
import { getConfigDir } from "./claudeConfig.js";

function settingsPath(projectPath: string): string {
  return `${getConfigDir(projectPath)}/settings.json`;
}

export async function getHooks(projectPath: string): Promise<Record<string, unknown[]>> {
  const path = resolveHome(settingsPath(projectPath));
  try {
    const raw = await readFileContent(path);
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    return (parsed.hooks as Record<string, unknown[]>) ?? {};
  } catch (e) {
    const err = e as NodeJS.ErrnoException;
    if (err.code === "ENOENT") return {};
    throw e;
  }
}

export async function setHooks(projectPath: string, hooks: unknown): Promise<void> {
  const path = resolveHome(settingsPath(projectPath));
  let settings: Record<string, unknown> = {};
  try {
    const raw = await readFileContent(path);
    settings = JSON.parse(raw) as Record<string, unknown>;
  } catch (e) {
    const err = e as NodeJS.ErrnoException;
    if (err.code !== "ENOENT") throw e;
  }
  settings.hooks = hooks;
  await writeFileEnsureDir(path, JSON.stringify(settings, null, 2));
}
