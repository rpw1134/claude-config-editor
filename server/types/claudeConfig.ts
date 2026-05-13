interface ClaudeProject {
  mcpServers?: Record<string, unknown>;
}

export interface ClaudeConfig {
  projects?: Record<string, ClaudeProject>;
}
