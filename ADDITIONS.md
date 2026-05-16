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

8. For memory, there are tips to follow to ge best access out of it. Should auto implement those for users if they want memory in their subagents

### MCP Servers:

1. Common MCP server widgets to add by default
2. Environment variable editor to edit the environment variables associated
3. Builder for mcp, ie name, type, command, args

### Skills:

1. Ability to define the following:
   my-skill/
   ├── SKILL.md (required - overview and navigation)
   ├── reference.md (detailed API docs - loaded when needed)
   ├── examples.md (usage examples - loaded when needed)
   └── scripts/
   └── helper.py (utility script - executed, not loaded)
   2.Types of content to add to skills:

- Reference content ie:things to follow
- Task content ie:what to do

3. Field Required Description
   name No Display name for the skill. If omitted, uses the directory name. Lowercase letters, numbers, and hyphens only (max 64 characters).
   description Recommended What the skill does and when to use it. Claude uses this to decide when to apply the skill. If omitted, uses the first paragraph of markdown content. Put the key use case first: the combined description and when_to_use text is truncated at 1,536 characters in the skill listing to reduce context usage.
   when_to_use No Additional context for when Claude should invoke the skill, such as trigger phrases or example requests. Appended to description in the skill listing and counts toward the 1,536-character cap.
   argument-hint No Hint shown during autocomplete to indicate expected arguments. Example: [issue-number] or [filename] [format].
   arguments No Named positional arguments for $name substitution in the skill content. Accepts a space-separated string or a YAML list. Names map to argument positions in order.
   disable-model-invocation No Set to true to prevent Claude from automatically loading this skill. Use for workflows you want to trigger manually with /name. Also prevents the skill from being preloaded into subagents. Default: false.
   user-invocable No Set to false to hide from the / menu. Use for background knowledge users shouldn’t invoke directly. Default: true.
   allowed-tools No Tools Claude can use without asking permission when this skill is active. Accepts a space-separated string or a YAML list.
   model No Model to use when this skill is active. The override applies for the rest of the current turn and is not saved to settings; the session model resumes on your next prompt. Accepts the same values as /model, or inherit to keep the active model.
   effort No Effort level when this skill is active. Overrides the session effort level. Default: inherits from session. Options: low, medium, high, xhigh, max; available levels depend on the model.
   context No Set to fork to run in a forked subagent context.
   agent No Which subagent type to use when context: fork is set.
   hooks No Hooks scoped to this skill’s lifecycle. See Hooks in skills and agents for configuration format.
   paths No Glob patterns that limit when this skill is activated. Accepts a comma-separated string or a YAML list. When set, Claude loads the skill automatically only when working with files matching the patterns. Uses the same format as path-specific rules.
   shell No Shell to use for !`command` and ```! blocks in this skill. Accepts bash (default) or powershell. Setting powershell runs inline shell commands via PowerShell on Windows. Requires CLAUDE_CODE_USE_POWERSHELL_TOOL=1.

4. Skills support string substitution for dynamic values in the skill content:
   Variable Description
   $ARGUMENTS	All arguments passed when invoking the skill. If $ARGUMENTS is not present in the content, arguments are appended as ARGUMENTS: <value>.
$ARGUMENTS[N] Access a specific argument by 0-based index, such as $ARGUMENTS[0] for the first argument.
$N Shorthand for $ARGUMENTS[N], such as $0 for the first argument or $1 for the second.
$name Named argument declared in the arguments frontmatter list. Names map to positions in order, so with arguments: [issue, branch] the placeholder $issue expands to the first argument and $branch to the second.
${CLAUDE_SESSION_ID} The current session ID. Useful for logging, creating session-specific files, or correlating skill output with sessions.
   ${CLAUDE_EFFORT}	The current effort level: low, medium, high, xhigh, or max. Use this to adapt skill instructions to the active effort setting.
${CLAUDE_SKILL_DIR} The directory containing the skill’s SKILL.md file. For plugin skills, this is the skill’s subdirectory within the plugin, not the plugin root. Use this in bash injection commands to reference scripts or files bundled with the skill, regardless of the current working directory.
5. When you or Claude invoke a skill, the rendered SKILL.md content enters the conversation as a single message and stays there for the rest of the session. Claude Code does not re-read the skill file on later turns, so write guidance that should apply throughout a task as standing instructions rather than one-time steps.
6. The !`<command>` syntax runs shell commands before the skill content is sent to Claude. The command output replaces the placeholder, so Claude receives actual data, not the command itself.
   This skill summarizes a pull request by fetching live PR data with the GitHub CLI. The !`gh pr diff` and other commands run first, and their output gets inserted into the prompt:
7. Skills and subagents work together in two directions:
   Approach System prompt Task Also loads
   Skill with context: fork From agent type (Explore, Plan, etc.) SKILL.md content CLAUDE.md
   Subagent with skills field Subagent’s markdown body Claude’s delegation message Preloaded skills + CLAUDE.md
   With context: fork, you write the task in your skill and pick an agent type to execute it. For the inverse (defining a custom subagent that uses skills as reference material), see Subagents.
8.
