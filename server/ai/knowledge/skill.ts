export const SKILL_GUIDE = `## Skill format (type="skill")

Full frontmatter schema — only include fields you actually need:

\`\`\`
---
name: skill-slug                  # kebab-case, used as /skill-name when invoked
description: |                    # REQUIRED — what this skill does; used by Claude Code to pick it
  One or two sentences.
when_to_use: |                    # RECOMMENDED — precise trigger conditions for Claude Code routing
  Invoke this skill when the user asks to...
argument-hint: "file path"        # shown to the user on invocation; describes expected args
user-invocable: true              # true = user can call /skill-name directly
disable-model-invocation: false   # true = run without calling the model (scripts only)
allowed-tools: [Bash, Read]       # tool allowlist when this skill runs
model: claude-sonnet-4-6          # claude-opus-4-8 | claude-sonnet-4-6 | claude-haiku-4-5-20251001
effort: medium                    # low | medium | high | xhigh | max
context: fork                     # fork = isolated context window separate from parent session
---
\`\`\`

Skill instructions here. This is what Claude reads when the skill is invoked — write it like a detailed runbook.

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

Run \`scripts/analyze.py\` to generate the report.
</skill.md>
<scripts>
<script name="analyze.py">
#!/usr/bin/env python3
# script content here
</script>
</scripts>
</artifact>

Scripts live at \`~/.claude/skills/<skill-name>/scripts/<filename>\`. Supported extensions: .sh, .py, .js, .ts. Always wrap SKILL.md content in \`<skill.md>...</skill.md>\` tags when the artifact includes scripts. Check existing scripts with \`get_skill_scripts\` before creating new ones.
`;
