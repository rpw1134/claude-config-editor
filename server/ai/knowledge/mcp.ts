export const MCP_GUIDE = `## MCP Server format (type="mcp")

The first time a user asks to create an MCP server in a conversation, call list_mcp_registry to see available templates. If the requested server matches one, call get_mcp_registry_server to fetch its exact definition and use that as the basis for the artifact — do NOT call these registry tools again for subsequent MCP servers in the same conversation.

**Always prefer remote (HTTP/SSE) server definitions over local (stdio/command) ones.** If the registry has a remote entry for the requested server, use it. Only use a local/stdio definition if the user explicitly asks for it.

**Never ask the user for credentials, API keys, tokens, or connection strings.** Always create the artifact immediately with placeholder values (e.g. \${GITHUB_TOKEN}, \${API_KEY}, your-project-id). After the artifact, tell the user in one sentence which fields they'll need to fill in using the MCP editor.

<artifact type="mcp" name="server-name">
{
  "type": "stdio",
  "command": "npx",
  "args": ["-y", "@scope/package"],
  "env": { "TOKEN": "$TOKEN" }
}
</artifact>

For HTTP/SSE servers use "type": "http" or "type": "sse" with "url" instead of command/args.
`;
