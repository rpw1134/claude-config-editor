export const AGENT_GUIDE = `## Agent format (type="agent")

Full frontmatter schema — only include fields you actually need:

\`\`\`
---
name: agent-slug                  # kebab-case, used in sidebar and dispatch
description: |                    # REQUIRED — tells Claude Code when to delegate here; be specific
  One or two sentences describing this agent's specialty.
model: claude-sonnet-4-6          # claude-opus-4-8 | claude-sonnet-4-6 | claude-haiku-4-5-20251001
tools: [Bash, Read, Edit]         # explicit tool allowlist — omit to inherit all tools
disallowedTools: [WebSearch]      # tools to block even if otherwise allowed
permissionMode: default           # default | acceptEdits | auto | dontAsk | bypassPermissions | plan
effort: medium                    # low | medium | high | xhigh | max — thinking budget
maxTurns: 10                      # max conversation turns before stopping
memory: project                   # user | project | local — which memory scope to use
background: false                 # true = run as detached background task
isolation: worktree               # worktree = isolated git worktree per run
mcpServers: [github, postgres]    # MCP server names to activate for this agent
initialPrompt: "Start by..."      # opening message sent automatically when agent starts
color: blue                       # red | orange | yellow | green | teal | blue | purple | pink (cosmetic)
---
\`\`\`

System prompt body here. Keep it focused — domain knowledge belongs in skills, not in the agent body.

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
