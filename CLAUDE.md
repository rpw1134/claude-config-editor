# Claude Config Studio

## What this is

A local tool for managing Claude Code configuration files (`~/.claude/`). Reads, validates, and edits `CLAUDE.md`, `settings.json`, agents, and skills through a structured UI instead of hand-editing YAML/JSON.

Open source, local-first, no telemetry. The user's `~/.claude/` directory is the source of truth — the app reads and writes it directly.

## Status

Pre-v0. Greenfield. Scaffolding.

## Build plan

**Phase 1 (now): local web app.** Vite + React frontend, small Node/Express backend handling file I/O on `~/.claude/`. Runs on localhost. Ships the idea fast without learning desktop packaging.

**Phase 2 (later): port to desktop.** Tauri shell wrapping the same frontend, replacing the Express backend with Rust commands. Same architecture, native packaging.

Frontend is written once. The "backend" boundary (file I/O calls) is the only thing that swaps — keep that layer thin and well-defined so the port is mechanical.

All styles (unless impossible or stated otherwise) should be writtten in Tailwind. Do not use inline styles if avoidable.

## Stack

- **Vite + React + TypeScript + TailwindCSS** — frontend
- **Monaco editor** — editing pane (syntax highlighting, validation)
- **Express** — phase 1 backend for file I/O
- **Tauri (Rust)** — phase 2 desktop shell

## v0 scope

Minimum useful version. Three things only:

1. **Tree view** of `~/.claude/` — list `CLAUDE.md`, `settings.json`, `agents/*.md`, `skills/*/SKILL.md`
2. **Editor pane** — open a file, edit it, save back to disk
3. **Validation** — YAML frontmatter parses, required fields present, JSON valid

No templates, no git, no sharing, no live session integration, no MCP UI, no hooks UI. All deferred.

## Non-goals (for now)

- Cloud sync, accounts, teams
- Telemetry of any kind
- Bundled opinionated content (agent/skill library) — separate repo later
- Supporting anything other than Claude Code config

## User context

Side project. I know web frontend basics. New to desktop app development and new to Rust — relevant in phase 2, not phase 1. Prefer learning the why before the how for new concepts; for straightforward web/React work, just write the code.

## Working agreement

- Default to the engineer agent for implementation
- Switch to the tutor agent when I'm learning a new concept (Tauri internals, Rust patterns, IPC model — mostly phase 2)
- Small, reversible steps. Show the plan before non-trivial changes.
- Run it before declaring done — `npm run build`, actually launch the app
- Keep the file I/O layer isolated so the phase 2 port stays mechanical

## Repo layout (to be created)

TBD. Expect roughly:

- `client/` — React frontend (survives the phase 2 port)
- `server/` — Express backend (phase 1 only; replaced by Tauri commands in phase 2)
- `README.md`
- `LICENSE` (MIT)

## Open questions

- Project name (placeholder: "Claude Config Studio")
- License confirmation (leaning MIT)
- Phase 2 platform priority: macOS-only initially or cross-platform from day 1

## Frontend Architecture

### Directory structure

```
client/src/
  contexts/          # App-wide React contexts (ShellContext, SkillDraftContext, SkillLayoutContext)
  routes/            # Route content components (AgentRoutes, McpRoutes, ProjectRoutes, SkillRoutes)
    skill/           # SkillLayout (with draft store + nav blocker), SkillFormContent, SkillFileContent, ScriptEditorContent
  lib/               # Pure functions with no React: api, frontmatter, markdown, mcp, navigation, validation
  components/
    Icons/           # All SVG icons — index.tsx exports every icon in the app
    Layout/          # Sidebar, NavButton, CreateNewDropdown, CollapsedCreateMenu, Shell, LayoutRoute
    Shared/          # Cross-cutting UI: UnsavedModal, DiscardModal, Accordion, StepDots, Toast, ProjectPicker, forms/
    Agent/           # AgentCreateFlow, AgentFormEditor, constants.ts, steps/, tabs/
    Mcp/             # McpEditorPane, tabs/ConfigureTab, tabs/McpSettingsTab
    Modals/          # McpCreateModal (thin orchestrator), CreateNewModal, CreateProjectModal, DeleteProjectModal
      mcp/           # Step components for McpCreateModal: StepName, StepType, StepJsonMode, StepConfigure, StepReview, shared.tsx
    Skill/           # Skill* components
    Editor/          # Editor, EditorPane, parts/
    Pages/           # LandingPage, WelcomePane, ProjectSettingsPage
    sections/        # Sidebar list sections
```

### One component per file

Never define components inline inside another component file. If a component grows large enough to extract, it goes in its own file. Helper sub-components that are 5-10 lines and used exclusively by one parent can live in the same file.

### Shared components

Key reusable components in `components/Shared/`:

- `UnsavedModal` — "Leave without saving?" blocker dialog, used in SkillLayout and McpEditorPane
- `DiscardModal` — Configurable "discard changes?" dialog with `title`, `message`, `confirmLabel` props
- `Accordion` — Collapsible section used in agent create flow (AccordionSection)
- `StepDots` — Step indicator dots for multi-step flows
- `Toast` — Bottom-right notification
- `forms/Toggle` — Boolean toggle switch with `{checked, onChange, disabled}` API

### Icons

All SVG icon components live in `components/Icons/index.tsx`. Never define icons inline inside component files. If a new icon is needed, add it to Icons/index.tsx and import from there.

### Lib functions

Pure functions (no React hooks or JSX) live in `lib/`:

- `navigation.ts` — `encodeProject`, `decodeProject` for URL path encoding
- `validation.ts` — `validateName`, `NAME_PATTERN` for form validation
- `markdown.ts` — `renderMarkdown`, `inlineMarkdown` for system prompt preview
- `mcp.ts` — `detectAuthType`, `extractToken`, `buildStdioJson`, `buildHttpJson`, `parseEnv`, `envToRaw`, `buildMcpJson`
- `api.ts` — All HTTP calls to the Express backend
- `frontmatter.ts` — Parse and serialize SKILL.md frontmatter

### Contexts

App-wide state lives in `contexts/`:

- `ShellContext` — `useShell()`: project selection, recents, refresh keys, toast, create-new handler
- `SkillDraftContext` — `useSkillDrafts()`: draft cache that persists across tab switches within a skill
- `SkillLayoutContext` — `useSkillLayout()`: unified dirty/save/preview state for the skill layout

### Routes

Route content components (the actual page contents rendered by `<Route element={...}>`) live in `routes/`. They import from contexts, components, and lib. They should not contain shared UI — only wiring.

- `AgentRoutes.tsx` — AgentsLandingContent, AgentCreateContent, AgentEditorContent
- `McpRoutes.tsx` — McpLandingContent, McpEditorContent
- `ProjectRoutes.tsx` — ProjectWelcomeContent, ClaudeMdContent, ProjectSettingsContent, HooksContent
- `SkillRoutes.tsx` — thin re-export hub: SkillsLandingContent, SkillEditorContent, ScriptsTabContent (inline); re-exports SkillLayout, SkillFileContent, ScriptEditorContent from `routes/skill/`
- `routes/skill/` — extracted pieces of SkillRoutes: SkillLayout, SkillFormContent, SkillFileContent, ScriptEditorContent

### File size guideline

Aim for under 200 lines per file. Files over 300 lines are a sign of mixed concerns — extract sub-components or helpers. Files over 500 lines are always wrong.

### No god files

If a file grows large, extract immediately:
1. Pure helper functions → `lib/`
2. Shared UI → `components/Shared/`
3. Icons → `components/Icons/`
4. Route content → `routes/`
5. Sub-components → own file in the same directory
