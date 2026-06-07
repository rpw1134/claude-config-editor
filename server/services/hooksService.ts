import { readFileContent, writeFileEnsureDir } from "../lib/fileIO.js";
import { resolveHome } from "../lib/parsing.js";
import { getConfigDir } from "./claudeConfig.js";

function settingsPath(projectPath: string): string {
  return `${getConfigDir(projectPath)}/settings.json`;
}

interface NormalizedHookGroup {
  matcher: string;
  hooks: Array<Record<string, unknown>>;
}

function normalizeLegacyHookEntry(entry: unknown): NormalizedHookGroup {
  if (typeof entry !== "object" || entry === null) return { matcher: "", hooks: [] };
  const obj = entry as Record<string, unknown>;
  // Modern format: already has a hooks array — pass through as-is (handler-level `if` is preserved inside each hook object)
  if (Array.isArray(obj.hooks)) return obj as unknown as NormalizedHookGroup;
  // Legacy flat format: { command: "...", type?: "..." } — wrap it
  const hookEntry: Record<string, unknown> = { type: obj.type ?? "command" };
  // `if` belongs on the handler, not the group — migrate it here
  if (typeof obj.if === "string") hookEntry.if = obj.if;
  if (obj.command != null) hookEntry.command = obj.command;
  if (obj.url != null) hookEntry.url = obj.url;
  if (obj.timeout != null) hookEntry.timeout = obj.timeout;
  return {
    matcher: typeof obj.matcher === "string" ? obj.matcher : "",
    hooks: [hookEntry],
  };
}

export async function getHooks(projectPath: string): Promise<Record<string, unknown[]>> {
  const path = resolveHome(settingsPath(projectPath));
  try {
    const raw = await readFileContent(path);
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const rawHooks = (parsed.hooks as Record<string, unknown[]>) ?? {};
    const normalized: Record<string, unknown[]> = {};
    for (const [event, groups] of Object.entries(rawHooks)) {
      normalized[event] = Array.isArray(groups) ? groups.map(normalizeLegacyHookEntry) : [];
    }
    return normalized;
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
