export const CLAUDE_MD_GUIDE = `## CLAUDE.md format (type="claude-md")

CLAUDE.md is a plain markdown file containing project instructions for Claude Code. It lives at the root of the project's config directory and is loaded automatically into every Claude Code session for that project.

### Before editing

Call get_claude_md first to read the current content. Never overwrite it blind — always start from what's there.

### Format

Plain markdown. No frontmatter, no special schema. Write it like a README for Claude: describe the project, state conventions, list constraints, and give Claude any context it needs to work effectively.

Common sections:
- Project purpose / tech stack
- File/directory conventions
- Coding standards and style rules
- Things Claude should always or never do
- Commands to know (run, test, build)

### Scope & precedence

Three layers, each overrides the one above it:

1. **User** — \`~/.claude/CLAUDE.md\` — personal defaults across all projects
2. **Project** — \`./CLAUDE.md\` or \`./.claude/CLAUDE.md\` — shared team instructions (commit this)
3. **Local** — \`./CLAUDE.local.md\` — personal project overrides (gitignore this)

Project instructions appear after user instructions in context, so they take precedence.

### Rules (.claude/rules/)

For large or path-specific guidance, prefer splitting content into files under \`.claude/rules/\` with a \`paths:\` frontmatter glob (e.g. \`paths: ["src/api/**/*.ts"]\`). These files load **lazily** — only when Claude touches a matching file — saving context on unrelated tasks. CLAUDE.md stays lean; the rules directory holds the detail.

### Imports

CLAUDE.md can pull in other files with \`@path/to/file\` or \`@~/file\` (path resolves relative to the importing file; ~5 hops max; first use prompts for approval). Imports are organizational — the full imported file still loads into context, so don't import large files you don't always need.

### Tips

- Block-level HTML comments \`<!-- ... -->\` are stripped before context injection — free space for maintainer notes that Claude never sees.
- Keep CLAUDE.md under ~200 lines. Long files waste context on every session.
- CLAUDE.md is **context, not enforcement** — Claude can still deviate. To actually block actions, use PreToolUse hooks. For multi-step procedures, use skills.

### The three memory systems (brief)

- **CLAUDE.md** — you write it; provides persistent project context to Claude.
- **Agent \`memory:\` frontmatter** — tells a subagent which scoped memory directory to use; the agent reads/writes its own \`MEMORY.md\` there.
- **Claude's auto-memory** — Claude Code writes this at \`~/.claude/projects/<project>/memory/\` based on your feedback; loaded automatically per-project.

### Output

Output the **complete file** as the artifact body — not a diff, not a partial snippet. The app replaces the file entirely on save.

<artifact type="claude-md" name="claude-md">
# Project Name

Short description of what this project does.

## Stack

- Language / framework
- Key dependencies

## Conventions

- ...

## Commands

- \`npm run dev\` — start dev server
- \`npm test\` — run tests
</artifact>
`;
