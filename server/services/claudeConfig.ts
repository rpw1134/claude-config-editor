import { basename } from "path";
import { fileExists, listDir, readFileContent, writeFileContent } from "../utils/fileIO.js";
import { resolveHome } from "../utils/parsing.js";
import type { ClaudeConfig } from "../types/claudeConfig.js";

export interface ProjectInfo {
  path: string;
  name: string;
}

/**
 * Returns the config directory for a given projectPath.
 *  - If projectPath is ~/.claude itself, return it as-is (global config lives there).
 *  - Otherwise return projectPath/.claude (per-project config).
 */
export function getConfigDir(projectPath: string): string {
  const globalDir = resolveHome("~/.claude");
  return projectPath === globalDir ? projectPath : `${projectPath}/.claude`;
}

/** Returns all projects from ~/.claude.json that have a CLAUDE.md file. */
export async function listProjects(): Promise<ProjectInfo[]> {
  let raw: string;
  try {
    raw = await readFileContent(resolveHome("~/.claude.json"));
  } catch (e) {
    const error = e as NodeJS.ErrnoException;
    if (error.code === "ENOENT") return [];
    throw error;
  }

  const config = JSON.parse(raw) as ClaudeConfig;
  const projectPaths = Object.keys(config.projects ?? {});
  const globalKey = resolveHome("~/.claude");

  const checks = await Promise.all(
    projectPaths.map((p) => fileExists(`${p}/CLAUDE.md`))
  );

  return projectPaths
    .filter((_, i) => checks[i])
    .map((p) => ({
      path: p,
      name: p === globalKey ? "global" : basename(p),
    }));
}

/** Returns the content of {projectPath}/CLAUDE.md, or null if not found. */
export async function getProjectContent(projectPath: string): Promise<string | null> {
  let raw: string;
  try {
    raw = await readFileContent(resolveHome("~/.claude.json"));
  } catch (e) {
    const error = e as NodeJS.ErrnoException;
    if (error.code === "ENOENT") return null;
    throw error;
  }

  const config = JSON.parse(raw) as ClaudeConfig;
  if (!(projectPath in (config.projects ?? {}))) {
    throw new Error("Project not found");
  }

  try {
    return await readFileContent(`${projectPath}/CLAUDE.md`);
  } catch (e) {
    const error = e as NodeJS.ErrnoException;
    if (error.code === "ENOENT") return null;
    throw error;
  }
}

/** Writes content to {projectPath}/CLAUDE.md. Throws if directory or project doesn't exist. */
export async function setProjectContent(projectPath: string, content: string): Promise<void> {
  let raw: string;
  try {
    raw = await readFileContent(resolveHome("~/.claude.json"));
  } catch (e) {
    const error = e as NodeJS.ErrnoException;
    if (error.code === "ENOENT") throw new Error("Project not found");
    throw error;
  }

  const config = JSON.parse(raw) as ClaudeConfig;
  if (!(projectPath in (config.projects ?? {}))) {
    throw new Error("Project not found");
  }

  await writeFileContent(`${projectPath}/CLAUDE.md`, content);
}

/** Returns skill directory names under {configDir}/skills/ that contain a SKILL.md file. */
export async function listSkills(projectPath: string): Promise<string[]> {
  const configDir = getConfigDir(projectPath);
  const listing = await listDir(`${configDir}/skills`);
  const dirs = listing?.dirs ?? [];
  const checks = await Promise.all(
    dirs.map((d) => fileExists(`${configDir}/skills/${d}/SKILL.md`))
  );
  return dirs.filter((_, i) => checks[i]);
}

/** Returns agent file names (without .md) under {configDir}/agents/. */
export async function listAgents(projectPath: string): Promise<string[]> {
  const configDir = getConfigDir(projectPath);
  const listing = await listDir(`${configDir}/agents`);
  return listing?.files.filter((f) => f.endsWith(".md")).map((f) => f.slice(0, -3)) ?? [];
}

/** Returns the keys of mcpServers for the given projectPath from ~/.claude.json. */
export async function listMcpServers(projectPath: string): Promise<string[]> {
  let raw: string;
  try {
    raw = await readFileContent(resolveHome("~/.claude.json"));
  } catch (e) {
    const error = e as NodeJS.ErrnoException;
    if (error.code === "ENOENT") return [];
    throw error;
  }

  const config = JSON.parse(raw) as ClaudeConfig;
  const project = config.projects?.[projectPath];
  return Object.keys(project?.mcpServers ?? {});
}

/** Returns the config object for one MCP server under the given projectPath, or null if not found. */
export async function getMcpServer(projectPath: string, key: string): Promise<unknown | null> {
  let raw: string;
  try {
    raw = await readFileContent(resolveHome("~/.claude.json"));
  } catch (e) {
    const error = e as NodeJS.ErrnoException;
    if (error.code === "ENOENT") return null;
    throw error;
  }

  const config = JSON.parse(raw) as ClaudeConfig;
  const servers = config.projects?.[projectPath]?.mcpServers ?? {};
  return key in servers ? servers[key] : null;
}

/** Replaces (or creates) one MCP server key under the given projectPath. */
export async function setMcpServer(projectPath: string, key: string, value: unknown): Promise<void> {
  let config: ClaudeConfig = {};
  try {
    const raw = await readFileContent(resolveHome("~/.claude.json"));
    config = JSON.parse(raw) as ClaudeConfig;
  } catch (e) {
    const error = e as NodeJS.ErrnoException;
    if (error.code !== "ENOENT") throw error;
  }

  config.projects ??= {};
  config.projects[projectPath] ??= {};
  config.projects[projectPath].mcpServers ??= {};
  config.projects[projectPath].mcpServers![key] = value;

  await writeFileContent(resolveHome("~/.claude.json"), JSON.stringify(config, null, 2));
}

/** Adds a new MCP server key under the given projectPath. Throws if the key already exists. */
export async function createMcpServer(projectPath: string, key: string, value: unknown): Promise<void> {
  let config: ClaudeConfig = {};
  try {
    const raw = await readFileContent(resolveHome("~/.claude.json"));
    config = JSON.parse(raw) as ClaudeConfig;
  } catch (e) {
    const error = e as NodeJS.ErrnoException;
    if (error.code !== "ENOENT") throw error;
  }

  const servers = config.projects?.[projectPath]?.mcpServers ?? {};
  if (key in servers) {
    throw new Error(`MCP server "${key}" already exists`);
  }

  config.projects ??= {};
  config.projects[projectPath] ??= {};
  config.projects[projectPath].mcpServers ??= {};
  config.projects[projectPath].mcpServers![key] = value;

  await writeFileContent(resolveHome("~/.claude.json"), JSON.stringify(config, null, 2));
}

/** Removes an MCP server key under the given projectPath. Throws if the key does not exist. */
export async function deleteMcpServer(projectPath: string, key: string): Promise<void> {
  let config: ClaudeConfig = {};
  try {
    const raw = await readFileContent(resolveHome("~/.claude.json"));
    config = JSON.parse(raw) as ClaudeConfig;
  } catch (e) {
    const error = e as NodeJS.ErrnoException;
    if (error.code !== "ENOENT") throw error;
  }

  const servers = config.projects?.[projectPath]?.mcpServers;
  if (!servers || !(key in servers)) {
    throw new Error(`MCP server "${key}" not found`);
  }

  delete servers[key];
  await writeFileContent(resolveHome("~/.claude.json"), JSON.stringify(config, null, 2));
}
