// Link artifacts are a session-only concept in Stryde's AI draft system.
// They do not create a new file on disk. Instead, "saving" a link artifact
// appends a "Linked Skill" section to an existing agent's system prompt body,
// wiring the agent to invoke a specific skill under a given trigger condition.
//
// Parsed fields: agent (agent slug), skill (skill slug), trigger (prose description).
// The frontend parses these as colon-separated key:value lines (one per line).

export const LINK_GUIDE = `## Link format (type="link")

A "link" artifact does not create a new file. It wires a skill into an agent by appending a "Linked Skill" section to the agent's system prompt body. The app handles this on save — you just provide the three fields.

### When to use

Use a link when the user wants to connect an existing (or newly drafted) skill to an agent, so the agent knows when and how to invoke it.

### Format

The artifact body is plain key:value lines:

<artifact type="link" name="descriptive-name">
agent: agent-slug
skill: skill-slug
trigger: short plain-English description of when to invoke the skill
</artifact>

- \`agent\` — the kebab-case slug of the agent to update (must already exist or be in the current session)
- \`skill\` — the kebab-case slug of the skill to link
- \`trigger\` — a brief phrase describing the condition (e.g. "the user asks to deploy")

### What happens on save

The app reads the agent's current content (from the session if it's a new draft, otherwise from disk), then appends:

\`\`\`
## Linked Skill: <skill>

When <trigger>, invoke the \`<skill>\` skill using \`/<skill>\`.
\`\`\`

The agent file is then written back to disk. The link artifact itself is never persisted as a file.

### Example

<artifact type="link" name="deploy-link">
agent: backend-engineer
skill: deploy-staging
trigger: the user asks to deploy or ship to staging
</artifact>
`;
