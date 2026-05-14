import { fileExists, listDir, readFileContent, writeFileContent } from "../utils/fileIO.js";
import { resolveHome } from "../utils/parsing.js";
import type { ClaudeConfig } from "../types/claudeConfig.js";

/** Returns skill directory names under ~/.claude/skills/ that contain a SKILL.md file. */
export async function listSkills(): Promise<string[]> {
  const listing = await listDir(resolveHome("~/.claude/skills"));
  const dirs = listing?.dirs ?? [];
  const checks = await Promise.all(
    dirs.map((d) => fileExists(resolveHome(`~/.claude/skills/${d}/SKILL.md`)))
  );
  return dirs.filter((_, i) => checks[i]);
}

/** Returns agent file names under ~/.claude/agents/. */
export async function listAgents(): Promise<string[]> {
  const listing = await listDir(resolveHome("~/.claude/agents"));
  return listing?.files.filter((f) => f.endsWith(".md")).map((f) => f.slice(0, -3)) ?? [];
}

/** Returns the keys of global mcpServers from ~/.claude.json. */
export async function listMcpServers(): Promise<string[]> {
  let raw: string;
  try {
    raw = await readFileContent(resolveHome("~/.claude.json"));
  } catch (e) {
    const error = e as NodeJS.ErrnoException;
    if (error.code === "ENOENT") return [];
    throw error;
  }

  const config = JSON.parse(raw) as ClaudeConfig;
  const globalProject = config.projects?.[resolveHome("~/.claude")];
  return Object.keys(globalProject?.mcpServers ?? {});
}

/** Returns the config object for one MCP server, or null if the key doesn't exist. */
export async function getMcpServer(key: string): Promise<unknown | null> {
  let raw: string;
  try {
    raw = await readFileContent(resolveHome("~/.claude.json"));
  } catch (e) {
    const error = e as NodeJS.ErrnoException;
    if (error.code === "ENOENT") return null;
    throw error;
  }

  const config = JSON.parse(raw) as ClaudeConfig;
  const servers = config.projects?.[resolveHome("~/.claude")]?.mcpServers ?? {};
  return key in servers ? servers[key] : null;
}

/** Replaces (or creates) one MCP server key. Reads the file, updates the key, writes back. */
export async function setMcpServer(key: string, value: unknown): Promise<void> {
  let config: ClaudeConfig = {};
  try {
    const raw = await readFileContent(resolveHome("~/.claude.json"));
    config = JSON.parse(raw) as ClaudeConfig;
  } catch (e) {
    const error = e as NodeJS.ErrnoException;
    if (error.code !== "ENOENT") throw error;
  }

  const projectKey = resolveHome("~/.claude");
  config.projects ??= {};
  config.projects[projectKey] ??= {};
  config.projects[projectKey].mcpServers ??= {};
  config.projects[projectKey].mcpServers![key] = value;

  await writeFileContent(resolveHome("~/.claude.json"), JSON.stringify(config, null, 2));
}

/** Adds a new MCP server key. Throws with a message if the key already exists. */
export async function createMcpServer(key: string, value: unknown): Promise<void> {
  let config: ClaudeConfig = {};
  try {
    const raw = await readFileContent(resolveHome("~/.claude.json"));
    config = JSON.parse(raw) as ClaudeConfig;
  } catch (e) {
    const error = e as NodeJS.ErrnoException;
    if (error.code !== "ENOENT") throw error;
  }

  const projectKey = resolveHome("~/.claude");
  const servers = config.projects?.[projectKey]?.mcpServers ?? {};
  if (key in servers) {
    throw new Error(`MCP server "${key}" already exists`);
  }

  config.projects ??= {};
  config.projects[projectKey] ??= {};
  config.projects[projectKey].mcpServers ??= {};
  config.projects[projectKey].mcpServers![key] = value;

  await writeFileContent(resolveHome("~/.claude.json"), JSON.stringify(config, null, 2));
}
