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
- \`"matcher": "Bash"\` — matches only when the Bash tool is used
- \`"matcher": "Edit"\` — matches only when the Edit tool is used
- Multiple groups with different matchers are allowed within the same event

### Merge behavior

**Only include the NEW hook groups in your artifact** — do not copy existing hooks into it. The app merges your artifact into the existing config automatically. Including existing hooks would duplicate them.

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

**Log every Bash command before it runs:**
\`\`\`json
{
  "PreToolUse": [
    {
      "matcher": "Bash",
      "hooks": [{ "type": "command", "command": "echo \"[hook] Bash: $TOOL_INPUT\" >> /tmp/claude-log.txt" }]
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

**Run tests automatically after file edits:**
\`\`\`json
{
  "PostToolUse": [
    {
      "matcher": "Edit",
      "hooks": [{ "type": "command", "command": "cd $PROJECT_ROOT && npm test --silent 2>&1 | tail -5" }]
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

**Block Bash on a pattern (PreToolUse can exit non-zero to block):**
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
