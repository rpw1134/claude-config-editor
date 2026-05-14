## Needed Additions to allow for most customizability

### Global:

1. Likely need project to be a scope, kind of like in google cloud. User selects their project, can create a new project at a given path, and then al edits to agents and skills and mcp apply to that projects specific .claude directory
2. Configurable alias to run clauude code with different command line arguments, think a global and default config. Things like NAME_OF_PRODUCT = claude --agent default_agent --tools...

### Agents:

1. Can create agetns in projects for hierarchy
2. Can enable and disable agent usage in project
3. Change the color for the agent
4. Create agent groupings, as agent folders are scanned recursively
5. Generate a per session subagent in JSON that can be passed via CLI but are not available in general (claude --agents AGENT_JSON)
6. Front matter fields: description, prompt, tools, disallowedTools, model, permissionMode, mcpServers, hooks, maxTurns, skills, initialPrompt, memory, effort, background, isolation, and color. Likely incorperate these into some interactive builder

   | Field           | Required | Description                                                                                                                                                                                                                                                                                                      |
   | --------------- | -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
   | name            | Yes      | Unique identifier using lowercase letters and hyphens. Hooks receive this value as `agent_type`. The filename does not have to match.                                                                                                                                                                            |
   | description     | Yes      | When Claude should delegate to this subagent.                                                                                                                                                                                                                                                                    |
   | tools           | No       | Tools the subagent can use. Inherits all tools if omitted. To preload Skills into context, use the `skills` field rather than listing Skill here.                                                                                                                                                                |
   | disallowedTools | No       | Tools to deny, removed from inherited or specified list.                                                                                                                                                                                                                                                         |
   | model           | No       | Model to use: `sonnet`, `opus`, `haiku`, a full model ID (e.g. `claude-opus-4-7`), or `inherit`. Defaults to `inherit`.                                                                                                                                                                                          |
   | permissionMode  | No       | Permission mode: `default`, `acceptEdits`, `auto`, `dontAsk`, `bypassPermissions`, or `plan`. Ignored for plugin subagents.                                                                                                                                                                                      |
   | maxTurns        | No       | Maximum number of agentic turns before the subagent stops.                                                                                                                                                                                                                                                       |
   | skills          | No       | Skills to preload into the subagent's context at startup. Full skill content is injected, not just the description. Subagents can still invoke unlisted skills through the Skill tool.                                                                                                                           |
   | mcpServers      | No       | MCP servers available to this subagent. Each entry is either a server name referencing an already-configured server (e.g. `"slack"`) or an inline definition with the server name as key and a full MCP server config as value. Ignored for plugin subagents. Only to be used for servers not globally available |
   | hooks           | No       | Lifecycle hooks scoped to this subagent. Ignored for plugin subagents.                                                                                                                                                                                                                                           |
   | memory          | No       | Persistent memory scope: `user`, `project`, or `local`. Enables cross-session learning.                                                                                                                                                                                                                          |
   | background      | No       | Set to `true` to always run this subagent as a background task. Default: `false`.                                                                                                                                                                                                                                |
   | effort          | No       | Effort level: `low`, `medium`, `high`, `xhigh`, `max`. Overrides session effort level. Default: inherits from session. Available levels depend on the model.                                                                                                                                                     |
   | isolation       | No       | Set to `worktree` to run in a temporary git worktree. Auto-cleaned up if no changes made.                                                                                                                                                                                                                        |
   | color           | No       | Display color in task list and transcript: `red`, `blue`, `green`, `yellow`, `purple`, `orange`, `pink`, or `cyan`.                                                                                                                                                                                              |
   | initialPrompt   | No       | Auto-submitted as the first user turn when run as the main session agent (via `--agent` or the agent setting). Commands and skills are processed. Prepended to any user-provided prompt.                                                                                                                         |

7. Allow users to turn off certain agents in settings.json : {
   "permissions": {
   "deny": ["Agent(Explore)", "Agent(my-custom-agent)"]
   }
   }

### MCP Servers:

1. Common MCP server widgets to add by default
2. Environment variable editor to edit the environment variables associated
3. Builder for mcp, ie name, type, command, args
