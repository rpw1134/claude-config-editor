import { listDir, readFileContent } from "../utils/fileIO.js";
import { resolveHome } from "../utils/parsing.js";
import type { ClaudeConfig } from "../types/claudeConfig.js";

/** Returns skill directory names under ~/.claude/skills/. */
export async function listSkills(): Promise<string[]> {
  const listing = await listDir(resolveHome("~/.claude/skills"));
  return listing?.dirs ?? [];
}

/** Returns agent file names under ~/.claude/agents/. */
export async function listAgents(): Promise<string[]> {
  const listing = await listDir(resolveHome("~/.claude/agents"));
  return listing?.files.filter((f) => f.endsWith(".md")) ?? [];
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
