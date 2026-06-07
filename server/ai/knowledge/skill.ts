export const SKILL_GUIDE = `## Skill format (type="skill")

Full frontmatter schema — only include fields you actually need:

\`\`\`
---
name: skill-slug                  # kebab-case; the /command name comes from the DIRECTORY name, not this field
description: |                    # REQUIRED — what this skill does; used by Claude Code to pick it
  One or two sentences.
when_to_use: |                    # RECOMMENDED — precise trigger conditions for Claude Code routing
  Invoke this skill when the user asks to...
argument-hint: "file path"        # shown to the user on invocation; describes expected args
arguments: [issue, format]        # named positional args usable as $issue, $format in the body
user-invocable: true              # true = user can call /skill-name directly
disable-model-invocation: false   # true = Claude will NOT auto-load/auto-invoke this skill; user can still run it manually with /name
allowed-tools: [Bash, Read]       # tool allowlist when this skill runs
disallowed-tools: [WebSearch]     # deny these tools while the skill is active
model: claude-sonnet-4-6          # claude-opus-4-8 | claude-sonnet-4-6 | claude-haiku-4-5-20251001
effort: medium                    # low | medium | high | xhigh | max
context: fork                     # fork = isolated context window separate from parent session
agent: Explore                    # when context: fork, which subagent type runs it (Explore | Plan | general-purpose | custom agent name)
paths: ["src/api/**/*.ts"]        # glob patterns; restrict AUTO-activation to matching files only
shell: bash                       # bash | powershell — for inline command execution
---
\`\`\`

Skill instructions here. This is what Claude reads when the skill is invoked — write it like a detailed runbook.

### Arguments & dynamic content

The skill body can reference runtime arguments and dynamic values:

- \`$ARGUMENTS\` — all arguments as a single string
- \`$1\`, \`$2\` — positional args (0-indexed: \`$0\` is the first)
- \`$name\` — named arg from the \`arguments\` frontmatter list (e.g. \`$issue\`, \`$format\`)
- \`!command\` (backtick syntax) — dynamic injection: the command runs at skill-load time and its stdout is inlined into the body before Claude sees it

### Routing & structure

- The \`/command\` name users type comes from the **skill directory name**, not the frontmatter \`name\` field.
- \`description\` + \`when_to_use\` combined are capped at ~1,536 chars — keep them tight and keyword-rich so Claude routes correctly.
- Keep SKILL.md focused and under ~500 lines. Push large reference material (API docs, checklists, etc.) into sibling \`.md\` files in the skill directory — Claude loads them on demand, not at startup.

Example (no scripts):

<artifact type="skill" name="my-skill">
<skill.md>
---
name: My Skill
description: Does X when triggered.
when_to_use: Invoke when the user asks to do X or mentions Y.
user-invocable: true
allowed-tools: [Bash, Read]
effort: medium
---

## Steps

1. Do this first
2. Then do this
</skill.md>
</artifact>

Example (with scripts):

<artifact type="skill" name="my-skill">
<skill.md>
---
name: My Skill
description: Runs analysis on the codebase.
user-invocable: true
allowed-tools: [Bash]
---

Run \`\${CLAUDE_SKILL_DIR}/scripts/analyze.py\` to generate the report.
</skill.md>
<scripts>
<script name="analyze.py">
#!/usr/bin/env python3
# script content here
</script>
</scripts>
</artifact>

Scripts live at \`\${CLAUDE_SKILL_DIR}/scripts/<filename>\` (\`CLAUDE_SKILL_DIR\` resolves correctly for personal, project, and plugin skills). Supported extensions: .sh, .py, .js, .ts. Always wrap SKILL.md content in \`<skill.md>...</skill.md>\` tags when the artifact includes scripts. Check existing scripts with \`get_skill_scripts\` before creating new ones.
`;
