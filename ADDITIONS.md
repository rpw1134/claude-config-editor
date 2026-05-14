## Needed Additions to allow for most customizability

### Global:

1. Likely need project to be a scope, kind of like in google cloud. User selects their project, can create a new project at a given path, and then al edits to agents and skills and mcp apply to that projects specific .claude directory

### Agents:

1. Can create agetns in projects for hierarchy
2. Can enable and disable agent usage in project
3. Change the color for the agent
4. Create agent groupings, as agent folders are scanned recursively
5. Generate a per session subagent in JSON that can be passed via CLI but are not available in general (claude --agents AGENT_JSON)
6. Front matter fields: description, prompt, tools, disallowedTools, model, permissionMode, mcpServers, hooks, maxTurns, skills, initialPrompt, memory, effort, background, isolation, and color. Likely incorperate these into some interactive builder
7.
