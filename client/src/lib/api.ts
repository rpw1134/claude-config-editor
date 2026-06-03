const BASE_URL = 'http://localhost:3000';

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`);
  if (!res.ok) {
    throw new Error(`${res.status} ${res.statusText} — ${path}`);
  }
  return res.json() as Promise<T>;
}

async function post(path: string, body: Record<string, unknown>): Promise<void> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    throw new Error(`${res.status} ${res.statusText} — ${path}`);
  }
}

async function del(path: string): Promise<void> {
  const res = await fetch(`${BASE_URL}${path}`, { method: "DELETE" });
  if (!res.ok) {
    throw new Error(`${res.status} ${res.statusText} — ${path}`);
  }
}

async function put(path: string, body: Record<string, unknown>): Promise<void> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    throw new Error(`${res.status} ${res.statusText} — ${path}`);
  }
}

export async function fetchSkills(projectPath: string): Promise<string[]> {
  const data = await get<{ skills: string[] }>(
    `/api/stryde/skills?projectPath=${encodeURIComponent(projectPath)}`
  );
  return data.skills;
}

export async function fetchAgents(projectPath: string): Promise<string[]> {
  const data = await get<{ agents: string[] }>(
    `/api/stryde/agents?projectPath=${encodeURIComponent(projectPath)}`
  );
  return data.agents;
}

export async function fetchMcpServers(projectPath: string): Promise<string[]> {
  const data = await get<{ mcpServers: string[] }>(
    `/api/stryde/mcp-servers?projectPath=${encodeURIComponent(projectPath)}`
  );
  return data.mcpServers;
}

export async function fetchAgentContent(projectPath: string, name: string): Promise<string> {
  const data = await get<{ content: string }>(
    `/api/agents/${encodeURIComponent(name)}?projectPath=${encodeURIComponent(projectPath)}`
  );
  return data.content;
}

export async function fetchSkillContent(projectPath: string, name: string): Promise<string> {
  const data = await get<{ content: string }>(
    `/api/skills/${encodeURIComponent(name)}?projectPath=${encodeURIComponent(projectPath)}`
  );
  return data.content;
}

export async function updateAgentContent(projectPath: string, name: string, content: string): Promise<void> {
  await put(`/api/agents/${encodeURIComponent(name)}`, { projectPath, content });
}

export async function updateSkillContent(projectPath: string, name: string, content: string): Promise<void> {
  await put(`/api/skills/${encodeURIComponent(name)}`, { projectPath, content });
}

export async function createAgent(projectPath: string, name: string, content: string): Promise<void> {
  await post("/api/agents", { projectPath, name, content });
}

export async function deleteAgent(projectPath: string, name: string): Promise<void> {
  await del(`/api/agents/${encodeURIComponent(name)}?projectPath=${encodeURIComponent(projectPath)}`);
}

export async function createSkill(projectPath: string, name: string, content: string): Promise<void> {
  await post("/api/skills", { projectPath, name, content });
}

export async function deleteSkill(projectPath: string, name: string): Promise<void> {
  await del(`/api/skills/${encodeURIComponent(name)}?projectPath=${encodeURIComponent(projectPath)}`);
}

export async function fetchMcpServerContent(projectPath: string, name: string): Promise<string> {
  const data = await get<{ content: string }>(
    `/api/mcp-servers/${encodeURIComponent(name)}?projectPath=${encodeURIComponent(projectPath)}`
  );
  return data.content;
}

export async function updateMcpServerContent(projectPath: string, name: string, content: string): Promise<void> {
  await put(`/api/mcp-servers/${encodeURIComponent(name)}`, { projectPath, content });
}

export async function createMcpServer(projectPath: string, name: string, content: string): Promise<void> {
  await post("/api/mcp-servers", { projectPath, name, content });
}

export interface ProjectInfo {
  path: string;
  name: string;
}

export async function fetchProjects(): Promise<ProjectInfo[]> {
  const data = await get<{ projects: ProjectInfo[] }>('/api/projects');
  return data.projects;
}

export async function fetchProjectContent(projectPath: string): Promise<string> {
  const data = await get<{ content: string }>(`/api/projects/file?path=${encodeURIComponent(projectPath)}`);
  return data.content;
}

export async function updateProjectContent(projectPath: string, content: string): Promise<void> {
  await put(`/api/projects/file?path=${encodeURIComponent(projectPath)}`, { content });
}

export async function fetchSkillFiles(projectPath: string, name: string): Promise<string[]> {
  const data = await get<{ files: string[] }>(
    `/api/skills/${encodeURIComponent(name)}/files?projectPath=${encodeURIComponent(projectPath)}`
  );
  return data.files;
}

export async function fetchSkillFile(projectPath: string, name: string, file: string): Promise<string> {
  const data = await get<{ content: string }>(
    `/api/skills/${encodeURIComponent(name)}/file?projectPath=${encodeURIComponent(projectPath)}&file=${encodeURIComponent(file)}`
  );
  return data.content;
}

export async function updateSkillFile(projectPath: string, name: string, file: string, content: string): Promise<void> {
  await put(`/api/skills/${encodeURIComponent(name)}/file`, { projectPath, file, content });
}

export async function createSkillFile(projectPath: string, name: string, file: string): Promise<void> {
  await post(`/api/skills/${encodeURIComponent(name)}/file`, { projectPath, file });
}

export async function deleteSkillFile(projectPath: string, name: string, file: string): Promise<void> {
  await del(
    `/api/skills/${encodeURIComponent(name)}/file?projectPath=${encodeURIComponent(projectPath)}&file=${encodeURIComponent(file)}`
  );
}

export async function fetchSkillScripts(projectPath: string, name: string): Promise<string[]> {
  const data = await get<{ scripts: string[] }>(
    `/api/skills/${encodeURIComponent(name)}/scripts?projectPath=${encodeURIComponent(projectPath)}`
  );
  return data.scripts;
}

export async function fetchSkillScript(projectPath: string, name: string, file: string): Promise<string> {
  const data = await get<{ content: string }>(
    `/api/skills/${encodeURIComponent(name)}/script?projectPath=${encodeURIComponent(projectPath)}&file=${encodeURIComponent(file)}`
  );
  return data.content;
}

export async function createSkillScript(projectPath: string, name: string, file: string, content: string): Promise<void> {
  await post(`/api/skills/${encodeURIComponent(name)}/script`, { projectPath, file, content });
}

export async function updateSkillScript(projectPath: string, name: string, file: string, content: string): Promise<void> {
  await put(`/api/skills/${encodeURIComponent(name)}/script`, { projectPath, file, content });
}

export async function deleteSkillScript(projectPath: string, name: string, file: string): Promise<void> {
  await del(
    `/api/skills/${encodeURIComponent(name)}/script?projectPath=${encodeURIComponent(projectPath)}&file=${encodeURIComponent(file)}`
  );
}

export async function deleteMcpServer(projectPath: string, name: string): Promise<void> {
  await del(`/api/mcp-servers/${encodeURIComponent(name)}?projectPath=${encodeURIComponent(projectPath)}`);
}

export async function deleteProject(projectPath: string): Promise<void> {
  const res = await fetch(`${BASE_URL}/api/projects?projectPath=${encodeURIComponent(projectPath)}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({})) as { message?: string; code?: string };
    throw Object.assign(new Error(body.message ?? `${res.status} ${res.statusText}`), { code: body.code });
  }
}

export async function createProject(path: string): Promise<{ absolutePath: string; name: string }> {
  const res = await fetch(`${BASE_URL}/api/projects/create`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ path }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({})) as { message?: string; code?: string };
    throw Object.assign(new Error(body.message ?? `${res.status} ${res.statusText}`), { code: body.code });
  }
  return res.json() as Promise<{ absolutePath: string; name: string }>;
}

export type HooksConfig = Record<string, Array<Record<string, unknown>>>;

export async function fetchHooks(projectPath: string): Promise<HooksConfig> {
  const data = await get<{ hooks: HooksConfig }>(
    `/api/hooks?projectPath=${encodeURIComponent(projectPath)}`
  );
  return data.hooks;
}

export async function updateHooks(projectPath: string, hooks: HooksConfig): Promise<void> {
  await put(`/api/hooks`, { projectPath, hooks });
}

// ── Version control ────────────────────────────────────────────────────────────

export interface ChangeEntry {
  status: 'M' | 'A' | '??';
  file: string;
}

export interface Commit {
  hash: string;
  date: string;
  message: string;
}

export interface GitignoreStatus {
  claudeIgnored: boolean;
  claudeIgnoredBy: string | null;
  localsProtected: boolean;
  strydeIgnored: boolean;
}

export interface VCStatus {
  initialized: boolean;
  repoRoot: string | null;
  configDir: string;
  changes: ChangeEntry[];
  gitignore: GitignoreStatus;
}

async function postJson<T>(path: string, body: Record<string, unknown>): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    throw new Error(`${res.status} ${res.statusText} — ${path}`);
  }
  return res.json() as Promise<T>;
}

export async function fetchVcStatus(projectPath: string): Promise<VCStatus> {
  return get<VCStatus>(`/api/vc/status?projectPath=${encodeURIComponent(projectPath)}`);
}

export async function postVcInit(projectPath: string): Promise<void> {
  await post("/api/vc/init", { projectPath });
}

export async function fetchVcLog(projectPath: string, file: string): Promise<Commit[]> {
  const data = await get<{ commits: Commit[] }>(
    `/api/vc/log?projectPath=${encodeURIComponent(projectPath)}&file=${encodeURIComponent(file)}`
  );
  return data.commits;
}

export async function fetchVcDiff(
  projectPath: string,
  file: string,
  hash: string
): Promise<{ before: string; after: string }> {
  return get<{ before: string; after: string }>(
    `/api/vc/diff?projectPath=${encodeURIComponent(projectPath)}&file=${encodeURIComponent(file)}&hash=${encodeURIComponent(hash)}`
  );
}

export async function postVcRestore(
  projectPath: string,
  file: string,
  hash: string
): Promise<{ content: string }> {
  return postJson<{ content: string }>("/api/vc/restore", { projectPath, file, hash });
}

export async function postVcCommit(projectPath: string, message: string): Promise<void> {
  await post("/api/vc/commit", { projectPath, message });
}

export async function fetchVcSettings(projectPath: string): Promise<{ enabled: boolean }> {
  return get<{ enabled: boolean }>(
    `/api/vc/settings?projectPath=${encodeURIComponent(projectPath)}`
  );
}

export async function putVcSettings(projectPath: string, enabled: boolean): Promise<void> {
  await put("/api/vc/settings", { projectPath, enabled });
}

export async function postVcGitignoreProtect(projectPath: string): Promise<void> {
  await post("/api/vc/gitignore/protect", { projectPath });
}

export async function postVcGitignoreUnblock(
  projectPath: string,
  gitignorePath: string
): Promise<void> {
  await post("/api/vc/gitignore/unblock", { projectPath, gitignorePath });
}


export async function fetchVcDiffFiles(
  projectPath: string,
  dir: string,
  hash: string,
): Promise<string[]> {
  const data = await get<{ files: string[] }>(
    `/api/vc/diff-files?projectPath=${encodeURIComponent(projectPath)}&dir=${encodeURIComponent(dir)}&hash=${encodeURIComponent(hash)}`
  );
  return data.files;
}

// ── Profile ───────────────────────────────────────────────────────────────────

export async function fetchProfile(): Promise<{ apiKey: string | null }> {
  return get<{ apiKey: string | null }>('/api/profile');
}

export async function updateProfile(apiKey: string): Promise<void> {
  await put('/api/profile', { apiKey });
}

// ── Grids ──────────────────────────────────────────────────────────────────────

import type { GridData, GridSummary } from '../types/grids';
export type { GridData, GridSummary };

export async function listGrids(projectPath: string): Promise<GridSummary[]> {
  return get<GridSummary[]>(`/api/grids?projectPath=${encodeURIComponent(projectPath)}`);
}

export async function getGrid(projectPath: string, name: string): Promise<GridData> {
  return get<GridData>(`/api/grids/${encodeURIComponent(name)}?projectPath=${encodeURIComponent(projectPath)}`);
}

export async function createGrid(projectPath: string, name: string, description: string, model?: string): Promise<void> {
  await post('/api/grids', { projectPath, name, description, model });
}

export async function updateGrid(projectPath: string, name: string, data: GridData): Promise<void> {
  await put(`/api/grids/${encodeURIComponent(name)}`, { projectPath, data });
}

export async function deleteGrid(projectPath: string, name: string): Promise<void> {
  await del(`/api/grids/${encodeURIComponent(name)}?projectPath=${encodeURIComponent(projectPath)}`);
}
