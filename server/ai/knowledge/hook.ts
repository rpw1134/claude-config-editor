export const HOOK_GUIDE = `## Hook format (type="hook")

**Before creating or editing hooks, call get_hooks to read the existing configuration.** This tells you what already exists so you don't duplicate it.

### Structure

Hooks in settings.json use this exact nested structure. The top-level key is the event name, the value is an array of hook groups. Each group has a \`matcher\` (tool name or "" to match all) and a \`hooks\` array of command entries.

<artifact type="hook" name="hook-name">
{
  "PreToolUse": [
    {
      "matcher": "",
      "hooks": [
        {
          "type": "command",
          "command": "shell command to run"
        }
      ]
    }
  ]
}
</artifact>

### Matcher semantics

- \`"matcher": ""\` — matches ALL tool calls for that event
- \`"matcher": "Bash"\` — exact match on tool name
- \`"matcher": "Edit|Write"\` — \`|\`-separated alternation (exact names)
- A value containing regex special characters is treated as a **regex** (e.g. \`"^mcp__"\`, \`"mcp__memory__.*"\`)
- Multiple groups with different matchers are allowed within the same event

### Command matchers (the \`if\` field)

To filter by the actual command content, set an **\`if\`** field on an individual **hook handler** (an entry INSIDE the \`hooks\` array), NOT on the group next to \`matcher\`. The \`matcher\` selects the tool; each handler's \`if\` further narrows by what was passed to it, using permission-rule syntax.

\`if\` is **only evaluated on tool events**: PreToolUse, PostToolUse, PostToolUseFailure, PermissionRequest, PermissionDenied. On other events a handler with \`if\` set never runs.

Syntax: \`"if": "Bash(gh *)"\` — this handler only fires when the Bash command matches the glob.

How it works:
- Strips leading \`VAR=value\` shell assignments before matching
- Inspects subcommands inside \`&&\`/\`||\` chains and \`$(...)\`/backtick expansions
- **Fails open** — if the command can't be parsed, the hook runs anyway. For hard enforcement use the permission system instead.

Common patterns:
- \`"Bash(gh *)"\` — any GitHub CLI command
- \`"Bash(git commit:*)"\` — git commit with any flags/args
- \`"Bash(git push *)"\` — git push
- \`"Bash(rm *)"\` — any rm invocation

**\`if\` takes exactly ONE pattern** — there is no \`||\`, array, or alternation syntax. To match MULTIPLE command globs, add MULTIPLE handlers under a SINGLE \`matcher\` group, each with its own \`if\` (do NOT create a second group). Alternatively use one broad pattern (e.g. \`"Bash(git *)"\`) and filter inside the script.

Example — one Bash group, two command globs, each running its own script:

\`\`\`json
{
  "PostToolUse": [
    {
      "matcher": "Bash",
      "hooks": [
        { "type": "command", "if": "Bash(gh *)",         "command": "~/.claude/scripts/log-gh.sh" },
        { "type": "command", "if": "Bash(git commit *)", "command": "~/.claude/scripts/log-commit.sh" }
      ]
    }
  ]
}
\`\`\`

To run the SAME command for several globs, repeat the handler with each \`if\` (the \`matcher\` stays a single group).

### Merge behavior

**Only include the NEW hook groups in your artifact** — do not copy existing hooks into it. The app merges your artifact into the existing config automatically. Including existing hooks would duplicate them.

### Hook stdin payload & flow control

A hook command receives a **JSON payload on stdin** with fields: \`tool_name\`, \`tool_input\`, \`cwd\`, \`session_id\`, \`hook_event_name\`. Read it with \`jq\` or a script — do NOT rely on \`$TOOL_INPUT\` or \`$PROJECT_ROOT\` env vars.

**Flow control via exit code and stdout:**

- Exit **\`0\`** — success, proceed normally
- Exit **\`1\`** — non-blocking failure (logged, Claude continues)
- Exit **\`2\`** — **block** execution; stderr is fed back to Claude as the reason

**Structured JSON output** (print to stdout instead of/in addition to exit codes):

\`\`\`json
{
  "hookSpecificOutput": {
    "hookEventName": "PreToolUse",
    "permissionDecision": "deny",
    "permissionDecisionReason": "Destructive command blocked by policy"
  }
}
\`\`\`

Permission decisions: \`allow\` | \`deny\` | \`ask\` | \`defer\`

Other output fields:
- \`additionalContext\` — inject extra context into Claude's view
- \`updatedInput\` — rewrite the tool input before it executes
- Top-level \`{"continue": false}\` — stops Claude entirely

### Events that take NO matcher (always fire)

These events ignore the \`matcher\` field — they fire unconditionally: \`UserPromptSubmit\`, \`Stop\`, \`PostToolBatch\`, \`CwdChanged\`, \`TaskCreated\`, \`TaskCompleted\`, \`WorktreeCreate\`, \`WorktreeRemove\`.

### Full event list

- **PreToolUse** — fires before any tool call; can block execution
- **PostToolUse** — fires after a successful tool call
- **PostToolUseFailure** — fires when a tool call errors
- **PostToolBatch** — fires after a batch of parallel tool calls completes
- **UserPromptSubmit** — fires when the user submits a message
- **UserPromptExpansion** — fires during prompt expansion
- **SessionStart** — fires once when a session begins
- **SessionEnd** — fires once when a session ends
- **Stop** — fires when Claude stops generating (natural stop)
- **StopFailure** — fires when Claude stops due to an error
- **SubagentStart** — fires when a sub-agent starts
- **SubagentStop** — fires when a sub-agent finishes
- **Notification** — fires on Claude Code notifications
- **TaskCreated** — fires when a background task is created
- **TaskCompleted** — fires when a background task completes
- **PreCompact** — fires before conversation compaction
- **PostCompact** — fires after conversation compaction
- **ConfigChange** — fires when config is modified
- **CwdChanged** — fires when working directory changes
- **FileChanged** — fires when a watched file changes
- **WorktreeCreate** — fires when a git worktree is created
- **WorktreeRemove** — fires when a git worktree is removed
- **InstructionsLoaded** — fires when CLAUDE.md instructions are loaded
- **Elicitation** — fires on model elicitation events
- **ElicitationResult** — fires after elicitation resolves
- **PermissionRequest** — fires when Claude requests a permission
- **PermissionDenied** — fires when a permission is denied
- **TeammateIdle** — fires when a teammate agent goes idle
- **Setup** — fires during initial session setup

### Concrete examples

**Log every Bash command before it runs (reads stdin):**
\`\`\`json
{
  "PreToolUse": [
    {
      "matcher": "Bash",
      "hooks": [{ "type": "command", "command": "jq -r '\"[hook] Bash: \" + .tool_input.command' >> /tmp/claude-log.txt" }]
    }
  ]
}
\`\`\`

**Send a desktop notification when Claude stops:**
\`\`\`json
{
  "Stop": [
    {
      "matcher": "",
      "hooks": [{ "type": "command", "command": "osascript -e 'display notification \"Claude finished\" with title \"Stryde\"'" }]
    }
  ]
}
\`\`\`

**Run tests automatically after file edits (reads cwd from stdin):**
\`\`\`json
{
  "PostToolUse": [
    {
      "matcher": "Edit",
      "hooks": [{ "type": "command", "command": "cd \"$(jq -r .cwd)\" && npm test --silent 2>&1 | tail -5" }]
    }
  ]
}
\`\`\`

**Log session start with timestamp:**
\`\`\`json
{
  "SessionStart": [
    {
      "matcher": "",
      "hooks": [{ "type": "command", "command": "echo \"Session started at $(date)\" >> ~/.claude/session.log" }]
    }
  ]
}
\`\`\`

**Block a command pattern (exit 2 to block, stderr goes to Claude):**
\`\`\`json
{
  "PreToolUse": [
    {
      "matcher": "Bash",
      "hooks": [{ "type": "command", "command": "~/.claude/scripts/check-command-safety.sh" }]
    }
  ]
}
\`\`\`
`;
