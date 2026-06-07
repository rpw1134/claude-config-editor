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
