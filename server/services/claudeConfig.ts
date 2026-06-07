import { basename } from "path";
import { deleteDir, deleteFile, ensureDir, fileExists, listDir, readFileContent, writeFileContent } from "../lib/fileIO.js";
import { resolveHome, validateProjectPath } from "../lib/parsing.js";
import type { ClaudeConfig } from "../types/claudeConfig.js";

export interface ProjectInfo {
  path: string;
  name: string;
}

export async function createProject(
  rawPath: string,
): Promise<{ absolutePath: string; name: string }> {
  const resolved = resolveHome(rawPath);
  const absolutePath = validateProjectPath(resolved);

  if (await fileExists(`${absolutePath}/CLAUDE.md`)) {
    throw Object.assign(
      new Error("This directory is already a Claude Code project."),
      { code: "already_project" },
    );
  }

  await ensureDir(absolutePath);
  await writeFileContent(
    `${absolutePath}/CLAUDE.md`,
    "# Project Notes\n\nAdd project-specific instructions for Claude here.\n",
  );

  let config: ClaudeConfig = {};
  try {
    const raw = await readFileContent(resolveHome("~/.claude.json"));
    config = JSON.parse(raw) as ClaudeConfig;
  } catch (e) {
    const error = e as NodeJS.ErrnoException;
    if (error.code !== "ENOENT") throw error;
  }

  config.projects ??= {};
  config.projects[absolutePath] ??= {};
  await writeFileContent(resolveHome("~/.claude.json"), JSON.stringify(config, null, 2));

  return { absolutePath, name: basename(absolutePath) };
}

export async function deleteProject(rawPath: string): Promise<void> {
  const resolved = resolveHome(rawPath);
  const absolutePath = validateProjectPath(resolved);

  let raw: string;
  try {
    raw = await readFileContent(resolveHome("~/.claude.json"));
  } catch (e) {
    const error = e as NodeJS.ErrnoException;
    if (error.code === "ENOENT") {
      throw Object.assign(new Error("Project not found"), { code: "not_found" });
    }
    throw error;
  }

  const config = JSON.parse(raw) as ClaudeConfig;
  if (!(absolutePath in (config.projects ?? {}))) {
    throw Object.assign(new Error("Project not found"), { code: "not_found" });
  }

  try {
    await deleteDir(`${absolutePath}/.claude`);
  } catch (e) {
    const error = e as NodeJS.ErrnoException;
    if (error.code !== "ENOENT") throw error;
  }

  try {
    await deleteFile(`${absolutePath}/CLAUDE.md`);
  } catch (e) {
    const error = e as NodeJS.ErrnoException;
    if (error.code !== "ENOENT") throw error;
  }

  delete config.projects![absolutePath];
  await writeFileContent(resolveHome("~/.claude.json"), JSON.stringify(config, null, 2));
}

// Global config lives directly in ~/.claude; project config lives in <project>/.claude.
export function getConfigDir(projectPath: string): string {
  const globalDir = resolveHome("~/.claude");
  return projectPath === globalDir ? projectPath : `${projectPath}/.claude`;
}

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

export async function listSkills(projectPath: string): Promise<string[]> {
  const configDir = getConfigDir(projectPath);
  const listing = await listDir(`${configDir}/skills`);
  const dirs = listing?.dirs ?? [];
  const checks = await Promise.all(
    dirs.map((d) => fileExists(`${configDir}/skills/${d}/SKILL.md`))
  );
  return dirs.filter((_, i) => checks[i]);
}

export async function listAgents(projectPath: string): Promise<string[]> {
  const configDir = getConfigDir(projectPath);
  const listing = await listDir(`${configDir}/agents`);
  return listing?.files.filter((f) => f.endsWith(".md")).map((f) => f.slice(0, -3)) ?? [];
}

const GLOBAL_PROJECT_PATH = resolveHome("~/.claude");

function isGlobal(projectPath: string): boolean {
  return projectPath === GLOBAL_PROJECT_PATH;
}

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
  if (isGlobal(projectPath)) {
    return Object.keys(config.mcpServers ?? {});
  }
  return Object.keys(config.projects?.[projectPath]?.mcpServers ?? {});
}

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
  const servers = isGlobal(projectPath)
    ? (config.mcpServers ?? {})
    : (config.projects?.[projectPath]?.mcpServers ?? {});
  return key in servers ? servers[key] : null;
}

export async function setMcpServer(projectPath: string, key: string, value: unknown): Promise<void> {
  let config: ClaudeConfig = {};
  try {
    const raw = await readFileContent(resolveHome("~/.claude.json"));
    config = JSON.parse(raw) as ClaudeConfig;
  } catch (e) {
    const error = e as NodeJS.ErrnoException;
    if (error.code !== "ENOENT") throw error;
  }

  if (isGlobal(projectPath)) {
    config.mcpServers ??= {};
    config.mcpServers[key] = value;
  } else {
    config.projects ??= {};
    config.projects[projectPath] ??= {};
    config.projects[projectPath].mcpServers ??= {};
    config.projects[projectPath].mcpServers![key] = value;
  }

  await writeFileContent(resolveHome("~/.claude.json"), JSON.stringify(config, null, 2));
}

export async function createMcpServer(projectPath: string, key: string, value: unknown): Promise<void> {
  let config: ClaudeConfig = {};
  try {
    const raw = await readFileContent(resolveHome("~/.claude.json"));
    config = JSON.parse(raw) as ClaudeConfig;
  } catch (e) {
    const error = e as NodeJS.ErrnoException;
    if (error.code !== "ENOENT") throw error;
  }

  const servers = isGlobal(projectPath)
    ? (config.mcpServers ?? {})
    : (config.projects?.[projectPath]?.mcpServers ?? {});

  if (key in servers) {
    throw new Error(`MCP server "${key}" already exists`);
  }

  if (isGlobal(projectPath)) {
    config.mcpServers ??= {};
    config.mcpServers[key] = value;
  } else {
    config.projects ??= {};
    config.projects[projectPath] ??= {};
    config.projects[projectPath].mcpServers ??= {};
    config.projects[projectPath].mcpServers![key] = value;
  }

  await writeFileContent(resolveHome("~/.claude.json"), JSON.stringify(config, null, 2));
}

export async function deleteMcpServer(projectPath: string, key: string): Promise<void> {
  let config: ClaudeConfig = {};
  try {
    const raw = await readFileContent(resolveHome("~/.claude.json"));
    config = JSON.parse(raw) as ClaudeConfig;
  } catch (e) {
    const error = e as NodeJS.ErrnoException;
    if (error.code !== "ENOENT") throw error;
  }

  if (isGlobal(projectPath)) {
    if (!config.mcpServers || !(key in config.mcpServers)) {
      throw new Error(`MCP server "${key}" not found`);
    }
    delete config.mcpServers[key];
  } else {
    const servers = config.projects?.[projectPath]?.mcpServers;
    if (!servers || !(key in servers)) {
      throw new Error(`MCP server "${key}" not found`);
    }
    delete servers[key];
  }

  await writeFileContent(resolveHome("~/.claude.json"), JSON.stringify(config, null, 2));
}
