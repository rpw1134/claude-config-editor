export const MCP_GUIDE = `## MCP Server format (type="mcp")

The first time a user asks to create an MCP server in a conversation, call list_mcp_registry to see available templates. If the requested server matches one, call get_mcp_registry_server to fetch its exact definition and use that as the basis for the artifact — do NOT call these registry tools again for subsequent MCP servers in the same conversation.

**Always prefer remote (HTTP/SSE) server definitions over local (stdio/command) ones.** If the registry has a remote entry for the requested server, use it. Only use a local/stdio definition if the user explicitly asks for it.

**Never ask the user for credentials, API keys, tokens, or connection strings.** Always create the artifact immediately with placeholder values (e.g. \${GITHUB_TOKEN}, \${API_KEY}, your-project-id). After the artifact, tell the user in one sentence which fields they'll need to fill in using the MCP editor.

### Transports

**stdio** — spawns a local process:
\`\`\`json
{
  "type": "stdio",
  "command": "npx",
  "args": ["-y", "@scope/package"],
  "env": { "TOKEN": "\${TOKEN}" },
  "timeout": 30000
}
\`\`\`

**http / sse** — connects to a remote HTTP or SSE endpoint:
\`\`\`json
{
  "type": "http",
  "url": "https://api.example.com/mcp",
  "headers": { "Authorization": "Bearer \${API_TOKEN}" },
  "timeout": 15000
}
\`\`\`

**ws** — WebSocket transport:
\`\`\`json
{
  "type": "ws",
  "url": "wss://api.example.com/mcp",
  "headers": { "Authorization": "Bearer \${TOKEN}" },
  "timeout": 15000
}
\`\`\`

Minimal artifact form:

<artifact type="mcp" name="server-name">
{
  "type": "stdio",
  "command": "npx",
  "args": ["-y", "@scope/package"],
  "env": { "TOKEN": "\${TOKEN}" }
}
</artifact>

### Variable interpolation

\`\${VAR}\` and \`\${VAR:-default}\` work in \`command\`, \`args\`, \`env\`, \`url\`, and \`headers\`. Always use placeholder syntax so the user can fill values without editing raw JSON.

### Tools & permissions

A server's tools are exposed as \`mcp__<server>__<tool>\` (e.g. \`mcp__github__create_issue\`). Pre-approve with allowlist wildcards like \`mcp__github__*\`. Note: \`permissionMode: acceptEdits\` does **NOT** auto-approve MCP tools — they require explicit allowlist entries.

### Lifecycle & approval

Project-scoped servers (defined in \`.mcp.json\`) require **user approval before first use** — they show "⏸ Pending approval" in the UI until approved via \`/mcp\`. After creating a project-scoped MCP artifact, include one sentence reminding the user to approve it.

The server name \`workspace\` is **reserved** — do not use it as a server name.
`;
