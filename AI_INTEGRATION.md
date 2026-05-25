# AI Draft — Implementation Plan

## What this is

A stateless AI-assisted creation tab ("AI Draft") that lets users describe what they want (agent, skill, etc.) in a chat interface. The AI produces structured artifacts — draft configs the user reviews and saves. Sessions are ephemeral; exiting discards all unsaved drafts.

---

## Key Decisions

| Topic | Decision |
|-------|----------|
| Tab title | "AI Draft" (branding TBD — "Blueprint" is leading candidate) |
| Session state | Stateless — in-memory only, cleared on tab exit |
| Multi-artifact | One session can produce multiple artifacts |
| Streaming | Chat text streams; artifact content is batched |
| Artifact format | XML tags in model output: `<artifact type="agent" name="...">...</artifact>` |
| Save flow | Save or discard from the artifact sidebar — no form editor |
| Preview format | Both markdown and form (pre-filled fields) |
| API key storage | `.stryde/profile.local.json` — always gitignored, never committed |
| API key entry | Settings > Profile tab (to be built) |
| Claude API call | Backend proxy — Express reads key from profile.local.json, streams back to frontend via SSE |
| Context tools | Tool-based only — AI fetches project context on demand (e.g., "look at this agent") |
| Grid support | Deferred |

---

## Architecture

### Streaming + Artifact Parsing

The model streams a single response. The frontend parser runs a two-state machine over incoming chunks:

- **`chat` state**: append tokens to chat display. If the accumulated tail starts with `<artifact`, switch to `buffering` and hold the fragment.
- **`buffering` state**: accumulate silently. On `</artifact>`, finalize the artifact (parse type, name, content), increment badge, return to `chat`.

A ~50-char lookahead buffer prevents false positives when `<artifact` is split across chunk boundaries.

The system prompt instructs the model to:
1. Respond conversationally outside artifact tags
2. Always wrap generated configs inside `<artifact type="..." name="...">...</artifact>`
3. Explain what it created after the closing tag

### Artifact Types

| `type` value | Maps to | Content format |
|---|---|---|
| `agent` | Agent `.md` | YAML frontmatter + system prompt body |
| `skill` | `SKILL.md` | YAML frontmatter + instructions body |
| `claude-md` | `CLAUDE.md` | Plain markdown |
| `settings` | `settings.json` fragment | JSON |

### API Key Flow

1. Backend reads `.stryde/profile.local.json` on each request (no caching — key may change)
2. If missing, returns `402` with `{ error: "no_api_key" }` — frontend shows "Enter your API key in Settings > Profile"
3. Frontend never receives or stores the key

---

## Components to Build

### Backend

| File | Purpose |
|------|---------|
| `server/services/strydeProfile.ts` | Read/write `.stryde/profile.local.json` (apiKey field) |
| `server/routers/profile.ts` | `GET /api/profile`, `PUT /api/profile` |
| `server/routers/aiDraft.ts` | `POST /api/ai-draft/chat` — streams SSE back to client |
| Update `gitignoreManager.ts` | Ensure `profile.local.json` is added to `.gitignore` when VC is enabled |
| Update `server.ts` | Mount `/api/profile` and `/api/ai-draft` routers |

### Frontend

| File | Purpose |
|------|---------|
| `contexts/AIDraftContext.tsx` | Session state: messages, artifacts, sidebar open/closed, unsaved count |
| `components/AIDraft/ChatInterface.tsx` | Message list + input bar |
| `components/AIDraft/MessageBubble.tsx` | Renders user and assistant messages |
| `components/AIDraft/ArtifactBadge.tsx` | File icon with numeric badge (unsaved count) |
| `components/AIDraft/ArtifactSidebar.tsx` | Right panel — artifact list with < > navigation |
| `components/AIDraft/ArtifactCard.tsx` | Single artifact preview (markdown + form tabs) |
| `lib/artifactParser.ts` | Streaming state machine — emits `chat-token` and `artifact-complete` events |
| `lib/api.ts` | Add `streamAIDraftChat()` and `fetchProfile()` / `updateProfile()` |
| `routes/AIDraftRoutes.tsx` | Route content component wiring AIDraftContext |
| `components/Pages/ProfileSettingsPage.tsx` | API key entry (Settings > Profile tab) |

### Navigation Changes

- Add "AI Draft" entry to sidebar (below Skills or as a separate section)
- Add Profile tab to whatever settings nav exists
- ArtifactBadge floats in the AI Draft layout, opens ArtifactSidebar on click

---

## Unsaved Warning

When navigating away from an active AI Draft session with unsaved artifacts:

```
There are still {n} unsaved artifacts. Leaving will discard all drafts.
[Stay]  [Leave and discard]
```

Reuses the existing `UnsavedModal` component with custom message props.

---

## Tools (AI can call these)

Defined in the system prompt as tool specs. The backend executes them against the existing services.

| Tool | Description |
|------|-------------|
| `get_agent(name)` | Fetch an agent's current content |
| `get_skill(name)` | Fetch a skill's current SKILL.md |
| `list_agents()` | List all agents in the selected project |
| `list_skills()` | List all skills in the selected project |
| `get_claude_md()` | Fetch the project's CLAUDE.md |

Tools are only invoked when the user explicitly asks for context ("look at this agent", "what skills do I have"). No passive loading.

---

## Implementation Phases

### Phase 1 — API key infrastructure
- `strydeProfile.ts` service + `profile.ts` router
- `ProfileSettingsPage.tsx` (Settings > Profile tab)
- `gitignoreManager.ts` update for `profile.local.json`

### Phase 2 — Backend streaming proxy
- `aiDraft.ts` router: accept messages array + project path, call Claude API with SSE, proxy stream back
- System prompt construction (artifact format instructions + tool definitions)
- Tool execution in backend (delegates to existing services)

### Phase 3 — Chat UI
- `AIDraftContext.tsx` + `ChatInterface.tsx` + `MessageBubble.tsx`
- Wire to streaming endpoint; plain text only (no artifact handling yet)
- `AIDraftRoutes.tsx` + sidebar nav entry

### Phase 4 — Artifact parser
- `artifactParser.ts` state machine
- Integrate into chat stream handler — splits tokens into chat display vs. artifact buffer
- On artifact complete: add to context, increment badge

### Phase 5 — Artifact sidebar
- `ArtifactBadge.tsx` (badge on file icon)
- `ArtifactSidebar.tsx` with < > navigation
- `ArtifactCard.tsx` with markdown and form preview tabs

### Phase 6 — Save / discard flow
- Save button calls appropriate backend endpoint (POST /api/agents, POST /api/skills, etc.) with artifact content
- Discard removes from context
- Unsaved warning on navigation (using `UnsavedModal`)

### Phase 7 — Tools
- Wire tool call/result cycle in backend streaming handler
- Frontend renders tool calls as a subtle inline status in chat ("Looking up agent my-researcher…")
