const BASE_URL = 'http://localhost:3000';

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`);
  if (!res.ok) {
    throw new Error(`${res.status} ${res.statusText} — ${path}`);
  }
  return res.json() as Promise<T>;
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
