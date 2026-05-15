interface ClaudeProject {
  mcpServers?: Record<string, unknown>;
}

export interface ClaudeConfig {
  mcpServers?: Record<string, unknown>;
  projects?: Record<string, ClaudeProject>;
}
