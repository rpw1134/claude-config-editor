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
