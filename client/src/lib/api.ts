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

export async function fetchSkills(): Promise<string[]> {
  const data = await get<{ skills: string[] }>('/api/claude-config/skills');
  return data.skills;
}

export async function fetchAgents(): Promise<string[]> {
  const data = await get<{ agents: string[] }>('/api/claude-config/agents');
  return data.agents;
}

export async function fetchMcpServers(): Promise<string[]> {
  const data = await get<{ mcpServers: string[] }>('/api/claude-config/mcp-servers');
  return data.mcpServers;
}

export async function fetchAgentContent(name: string): Promise<string> {
  const data = await get<{ content: string }>(`/api/agents/${encodeURIComponent(name)}`);
  return data.content;
}

export async function fetchSkillContent(name: string): Promise<string> {
  const data = await get<{ content: string }>(`/api/skills/${encodeURIComponent(name)}`);
  return data.content;
}

export async function updateAgentContent(name: string, content: string): Promise<void> {
  await put(`/api/agents/${encodeURIComponent(name)}`, { content });
}

export async function updateSkillContent(name: string, content: string): Promise<void> {
  await put(`/api/skills/${encodeURIComponent(name)}`, { content });
}

export async function createAgent(name: string, content: string): Promise<void> {
  await post("/api/agents", { name, content });
}

export async function createSkill(name: string, content: string): Promise<void> {
  await post("/api/skills", { name, content });
}

export async function fetchMcpServerContent(name: string): Promise<string> {
  const data = await get<{ content: string }>(`/api/mcp-servers/${encodeURIComponent(name)}`);
  return data.content;
}

export async function updateMcpServerContent(name: string, content: string): Promise<void> {
  await put(`/api/mcp-servers/${encodeURIComponent(name)}`, { content });
}

export async function createMcpServer(name: string, content: string): Promise<void> {
  await post("/api/mcp-servers", { name, content });
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
