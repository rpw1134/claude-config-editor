export const AGENT_GUIDE = `## Agent format (type="agent")

Full frontmatter schema — only include fields you actually need:

\`\`\`
---
name: agent-slug                  # kebab-case, used in sidebar and dispatch
description: |                    # REQUIRED — tells Claude Code when to delegate here; be specific
  One or two sentences describing this agent's specialty.
model: claude-sonnet-4-6          # claude-opus-4-8 | claude-sonnet-4-6 | claude-haiku-4-5-20251001 | opus | sonnet | haiku | inherit
tools: [Bash, Read, Edit]         # explicit tool allowlist — omit to inherit all tools
disallowedTools: [WebSearch]      # tools to block even if otherwise allowed
permissionMode: default           # default | acceptEdits | auto | dontAsk | bypassPermissions | plan
effort: medium                    # low | medium | high | xhigh | max — thinking budget
maxTurns: 10                      # max conversation turns before stopping
memory: project                   # user | project | local — which memory scope to use (see "Agent memory" below)
background: false                 # true = run as detached background task
isolation: worktree               # worktree = isolated git worktree per run
mcpServers: [github, postgres]    # MCP server names to activate for this agent
skills: [code-review, deploy]     # preloads the FULL content of these skills into the subagent at startup
hooks:                            # subagent-scoped lifecycle hooks; a Stop hook here applies as SubagentStop
  Stop:
    - matcher: ""
      hooks:
        - type: command
          command: echo "subagent done"
initialPrompt: "Start by..."      # opening message sent automatically when agent starts
color: blue                       # red | orange | yellow | green | teal | blue | purple | pink (cosmetic)
---
\`\`\`

System prompt body here. Keep it focused — domain knowledge belongs in skills, not in the agent body.

### Agent memory

When \`memory:\` is set, Claude Code automatically:
- Creates a persistent memory directory for the agent
- Auto-loads the first ~200 lines / 25 KB of its \`MEMORY.md\` into the agent at startup
- Auto-enables Read/Write/Edit so the agent can curate its own memory file

Memory scope and on-disk locations:
- \`project\` → \`.claude/agent-memory/<name>/\` — committed to git, shared with the team
- \`user\` → \`~/.claude/agent-memory/<name>/\` — personal, persists across all projects
- \`local\` → \`.claude/agent-memory-local/<name>/\` — personal + gitignored (default for sensitive notes)

**Best practice:** explicitly tell the agent in its system-prompt body to *check its memory before starting and update it when done*. Without that instruction the memory directory exists but goes unused — the agent won't consult it automatically.

### Gotchas

- Subagents **cannot spawn other subagents** — the Agent tool is stripped in subagent context.
- Agents are loaded at **session startup only** — changes take effect on the next session.
- Write \`description\` with explicit trigger phrasing (e.g. "Use proactively when…" or "Delegate here whenever…") so Claude auto-delegates correctly. Vague descriptions cause missed routing.

Example:

<artifact type="agent" name="my-agent">
---
name: My Agent
description: Handles X tasks for Y domain.
model: claude-sonnet-4-6
tools: [Bash, Read, Edit]
effort: medium
color: blue
---

You are an expert in X. When given a task...
</artifact>
`;
