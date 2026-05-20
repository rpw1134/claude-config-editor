# Version Control — Implementation Plan

Git-backed version history for all Claude Code config objects managed by Stryde:
agents, skills, MCP servers, hooks, and CLAUDE.md. Commits are explicit, conscious
actions — saves only write files. Users stage and commit from the Changes pane,
browse history, and restore previous versions per file, from a dedicated sidebar
panel and from per-item History tabs inside each editor.

---

## Design Decisions

### Where repos live

| Context                | Strategy                                                                                                                                                                 |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Global `~/.claude/`    | Always init a git repo directly inside `~/.claude/`                                                                                                                      |
| Per-project `.claude/` | Walk up from project root looking for `.git`. If found, use it (`.claude/` files are tracked within the existing repo). If not found, offer to init at the project root. |

Rationale: nesting a new `.git` inside a directory that already has a parent `.git`
creates untracked submodule noise. Per-project configs are expected to live in the
user's own git repo — we surface that, not fight it.

### gitignore management

Two checks run on init and as a health check whenever a project's VC status is
fetched. Walk up from the project's `.claude/` directory, collecting `.gitignore`
files up to the repo root (there may be multiple).

**Check A — is `.claude/` itself ignored?**
If any `.gitignore` contains a pattern that matches `.claude/` or `.claude/**`
(e.g. `.claude`, `.claude/`, `**/.claude/**`), the entire config directory is
invisible to git. Surface a warning in `VCInitPrompt` / `VCChangesPane`:

> "Your `.claude/` directory is excluded by `.gitignore` at `<path>`. Version
> control won't track any changes until this is removed."
> [Remove ignore entry]

"Remove ignore entry" edits the relevant `.gitignore` in place, deleting only
the matching line.

**Check B — are local files unprotected?**
If no `.gitignore` in the tree contains patterns covering
`.claude/settings.local.json` or `.claude/*.local.json`, offer to add them:

> "Local config files may contain tokens or personal settings. Add them to
> `.gitignore`?"
> [Add to .gitignore] [Skip]

"Add to .gitignore" appends to `.gitignore` at the repo root (creates it if absent):

```
# Stryde — local-only Claude Code config
.claude/settings.local.json
.claude/*.local.json
```

**Check C — should `.stryde/` be ignored?**
After creating `.stryde/` for the first time, check whether `.stryde/` is in any
`.gitignore` in the tree. If not, prompt:

> "The `.stryde/` directory stores Stryde settings for this project. Add it to
> `.gitignore`? (Recommended unless sharing with a team that also uses Stryde.)"
> [Add to .gitignore (recommended)] [Track with git]

This is a one-time prompt per project. The choice is stored in `.stryde/config.json`
(`"trackStryde": false`) so we don't prompt again.

All three checks are non-destructive except when the user explicitly confirms.
The gitignore check result is returned as part of `GET /api/vc/status`.

### Per-item opt-out

Creation flows for agents and skills show a "Track with version control" toggle
(visible only when VC is initialized for the project). Default: on. Writes
`tracked: false` into the frontmatter when off. Auto-commit skips files where
`tracked: false` is set.

CLAUDE.md, hooks, and MCP servers are always tracked when VC is enabled — no
per-item opt-out for these.

### Settings storage

Stored in `.stryde/config.json` (per-project) or `~/.stryde/config.json` (global).
A dedicated directory keeps Stryde's own state completely separate from Claude Code
config. Schema:

```json
{ "versionControl": { "enabled": true } }
```

**Global `~/.stryde/`** is created silently on first use — no permission prompt,
same as any tool creating `~/.config/appname/`.

**Per-project `.stryde/`** is created when the user first enables version control
for that project. No separate permission prompt — clicking "Enable version control"
is the consent. The gitignore check that runs immediately after covers whether
`.stryde/` itself should be tracked.

### Should `.stryde/` be tracked by the project's git repo?

Default: **no** — add `.stryde/` to the gitignore suggestions. It's Stryde-specific
tooling state, not Claude Code config. Users who want to share Stryde settings
across a team can opt in with "also track Stryde settings" during the init flow.
Mirrors the `.vscode/` convention: sometimes committed, usually not, user decides.

---

## Server

### New service: `server/services/versionControl.ts`

All git operations are wrapped here. Shells out to the `git` CLI via Node's
`child_process.execFile` (not `exec` — avoids shell injection).

```
isGitRepo(dirPath): Promise<boolean>
  → checks if `dirPath/.git` exists

initRepo(dirPath): Promise<void>
  → git init
  → git add .
  → git commit -m "Initial commit (Stryde)"

commitFile(repoRoot, relativeFilePath, message): Promise<void>
  → git add <relativeFilePath>
  → git commit -m <message>
  → no-op if nothing to commit (catch empty-commit exit code 1)

getStatus(repoRoot): Promise<ChangeEntry[]>
  → git status --porcelain
  → parses each line into { status: 'M'|'A'|'??', file: string }

getFileLog(repoRoot, relativeFilePath): Promise<Commit[]>
  → git log --pretty=format:"%H|%ai|%s" -- <file>
  → returns [{ hash, date, message }]

getFileDiff(repoRoot, relativeFilePath, hash): Promise<{ before: string, after: string }>
  → before: git show <hash>^:<file>  (parent commit content)
  → after:  git show <hash>:<file>   (this commit content)
  → if hash is the first commit, before = ""

restoreFile(repoRoot, relativeFilePath, hash): Promise<string>
  → git checkout <hash> -- <relativeFilePath>
  → reads and returns restored file content

findRepoRoot(dirPath): Promise<string | null>
  → git rev-parse --show-toplevel  (run from dirPath)
  → returns null if not in a git repo
```

Error handling: all functions catch `ENOENT` on git binary missing and throw a
structured error `{ code: 'GIT_NOT_FOUND' }` so the frontend can surface a clear
message.

### New service: `server/services/gitignoreManager.ts`

```
checkGitignore(repoRoot: string, claudeDir: string): Promise<GitignoreCheckResult>
  → walks .gitignore files from claudeDir up to repoRoot
  → returns {
      claudeIgnored: boolean,        // .claude/ is excluded
      claudeIgnoredBy: string|null,  // path of the .gitignore containing the match
      localsProtected: boolean,      // settings.local.json is already excluded
      strydeIgnored: boolean,        // .stryde/ is already excluded
    }

ensureLocalProtection(repoRoot: string): Promise<void>
  → appends .claude/settings.local.json and .claude/*.local.json
    to <repoRoot>/.gitignore if not already present

ensureStrydeIgnored(repoRoot: string): Promise<void>
  → appends .stryde/ to <repoRoot>/.gitignore if not already present

removeClaudeIgnore(gitignorePath: string): Promise<void>
  → reads the file, removes the line(s) matching .claude patterns, writes back
```

### New service: `server/services/strydeConfig.ts`

Reads/writes `.stryde/config.json`. For global context, path is `~/.stryde/`.
For per-project, path is `<projectRoot>/.stryde/`. Creates the directory on
first write (`ensureDir`).

```
getStrydeConfig(projectPath: string): Promise<StrydeConfig>
  → resolves .stryde/ dir (global or per-project from projectPath)
  → reads config.json or returns default { versionControl: { enabled: false }, trackStryde: null }

setStrydeConfig(projectPath: string, config: Partial<StrydeConfig>): Promise<void>
  → merges with existing config, writes <strydeDir>/config.json
  → calls ensureDir(<strydeDir>) first
```

`trackStryde: null` means the user hasn't been asked yet. `false` = ignore it.
`true` = track with git. The prompt only shows when `trackStryde === null`.

### New router: `server/routers/versionControl.ts`

Mounted at `/api/vc` in `server/server.ts`.

```
GET  /api/vc/status?projectPath=X
  → {
      initialized: bool,
      repoRoot: string | null,
      changes: ChangeEntry[],
      gitignore: {
        claudeIgnored: boolean,
        claudeIgnoredBy: string | null,
        localsProtected: boolean
      }
    }

POST /api/vc/init  { projectPath }
  → calls initRepo(configDir), ensureGitignoreEntries
  → enables VC in strydeConfig
  → 201

GET  /api/vc/log?projectPath=X&file=X
  → { commits: Commit[] }

GET  /api/vc/diff?projectPath=X&file=X&hash=X
  → { before: string, after: string }

POST /api/vc/restore  { projectPath, file, hash }
  → restores file, returns { content: string }

GET  /api/vc/settings?projectPath=X
  → { enabled: boolean }

PUT  /api/vc/settings  { projectPath, enabled: boolean }
  → updates strydeConfig

POST /api/vc/gitignore/protect  { projectPath }
  → calls ensureLocalProtection(repoRoot)

POST /api/vc/gitignore/unblock  { projectPath, gitignorePath }
  → calls removeClaudeIgnore(gitignorePath)

POST /api/vc/gitignore/stryde  { projectPath, ignore: boolean }
  → if ignore: calls ensureStrydeIgnored(repoRoot)
  → sets strydeConfig.trackStryde = !ignore
  → marks strydeTrackingDecided = true
```

Saves write files only. No existing save routers are modified for VC.
Commits happen exclusively when the user submits the commit form in `VCChangesPane`.

---

## Frontend

### New context: `client/src/contexts/VersionControlContext.tsx`

```typescript
interface GitignoreStatus {
  claudeIgnored: boolean;
  claudeIgnoredBy: string | null;
  localsProtected: boolean;
  strydeIgnored: boolean;
  strydeTrackingDecided: boolean; // true once user has answered the .stryde/ prompt
}

interface VCStatus {
  initialized: boolean;
  repoRoot: string | null;
  changes: ChangeEntry[];
  gitignore: GitignoreStatus;
}

interface VersionControlContextValue {
  status: VCStatus | null;
  changeCount: number;
  refresh: () => void;
  isLoading: boolean;
}
```

- Fetches `/api/vc/status` on mount, on window focus, and when `vcRefreshKey`
  bumps (new key added to `ShellContext`).
- `vcRefreshKey` is bumped after every save (so the badge reflects fresh `git status`
  output) but no commit is triggered — the save and the commit are decoupled.
- Exposed via `useVersionControl()` hook.
- Provider wraps inside `ShellContext.Provider` in `App.tsx`.

### New refresh key in `ShellContext`

Add `vcRefreshKey: number` and `onBumpVcRefresh: () => void` to `ShellContextValue`.
Existing save flows call `onBumpVcRefresh()` after each successful save so the
badge count stays current.

### Sidebar changes (`Sidebar.tsx`)

Add `"version-control"` to the `activeTab` detection block:

```typescript
if (pathname.startsWith(`${base}/version-control`)) return "version-control";
```

Add to the nav area (between Hooks and the bottom spacer):

```tsx
<NavButton
  icon={<VersionControlIcon badge={changeCount} />}
  label="Version Control"
  active={activeTab === "version-control"}
  disabled={!hasProject}
  collapsed={collapsed}
  onClick={() => navigateTo("version-control")}
/>
```

`NavButton` gets an optional `badge?: number` prop. When `badge > 0`, renders a
small count pill in the top-right corner of the icon wrapper:

```tsx
// Inside NavButton icon span, when badge is set:
<span className="relative w-5 h-5 shrink-0 flex items-center justify-center">
  {icon}
  {badge != null && badge > 0 && (
    <span
      className="absolute -top-1 -right-1 min-w-3.5 h-3.5 px-0.75
                     flex items-center justify-center rounded-full
                     bg-(--accent) text-[9px] font-bold text-white
                     animate-pulse leading-none"
    >
      {badge > 99 ? "99+" : badge}
    </span>
  )}
</span>
```

When collapsed, the badge is still visible (it's positioned relative to the icon,
not the label). When the count is 0, no badge renders.

### New icon: `VersionControlIcon`

Add to `components/Icons/index.tsx`. A git-branch style icon (two nodes connected
with a fork), 20×20, `stroke="currentColor"` consistent with all other icons.

### New route in `App.tsx`

```tsx
<Route path="/:projectId/version-control" element={<VCContent />} />
```

Imported from `routes/VCRoutes.tsx`.

### New route file: `client/src/routes/VCRoutes.tsx`

Exports `VCContent` — the full-page version control view. Reads `projectPath` from
route params, delegates to `VersionControlPage`.

### New component directory: `client/src/components/VersionControl/`

#### `VersionControlPage.tsx`

Top-level: reads `useVersionControl()` and `useShell()`. Branches on
`status.initialized`:

- If not initialized → renders `VCInitPrompt`
- If initialized → renders `VCChangesPane`

#### `VCInitPrompt.tsx`

Empty-state screen shown before git is initialized.

- Heading: "Version Control"
- Body: two-sentence explanation of what it does
- If a git repo already exists (detected from status): shows "Git repository found
  at `<repoRoot>`. Enable version history for this project?" with an Enable button.
- If no git repo: shows "No git repository found. Initialize one to start tracking
  changes." with an "Initialize Git Repository" button.
- On confirm: calls `POST /api/vc/init`, bumps `vcRefreshKey`.
- After init, if `gitignore.claudeIgnored === true`: shows a warning banner
  explaining the issue and offering to remove the ignore entry.
- After init, if `gitignore.localsProtected === false`: shows a prompt offering
  to protect local config files.
- After init, if `gitignore.strydeTrackingDecided === false`: shows the one-time
  prompt asking whether to ignore `.stryde/` or track it.

#### `VCChangesPane.tsx`

Main view when initialized.

Layout:

```
┌─────────────────────────────────────────────────┐
│  [!] .claude/ is excluded by .gitignore          │  ← only if claudeIgnored
│      at ~/project/.gitignore  [Remove ignore]    │
├─────────────────────────────────────────────────┤
│  [i] Local config files are unprotected.         │  ← only if !localsProtected
│      [Add to .gitignore]  [Skip]                 │
├─────────────────────────────────────────────────┤
│  [?] Track .stryde/ with git?                    │  ← only if !strydeTrackingDecided
│      [Ignore (recommended)]  [Track with git]    │
├─────────────────────────────────────────────────┤
│  Version Control                                 │
├─────────────────────────────────────────────────┤
│  Changes (N)                                     │
│  ├─ M  agents/my-agent.md           [diff]       │
│  ├─ ??  skills/new-skill/SKILL.md   [diff]       │
│  └─ M  settings.json                [diff]       │
│                                                  │
│  [____commit message input__________]            │
│  [Commit]                                        │
└─────────────────────────────────────────────────┘
```

- "M" = Modified (yellow dot), "??" = Untracked (grey dot), "A" = Added (green dot)
- Each row has a "View diff" icon button → expands inline `VCDiffViewer`
- Commit message input + Commit button: calls `POST /api/vc/commit` then bumps
  `vcRefreshKey`
- Empty state (no changes): "All changes committed." with a checkmark
- Warning banners shown persistently until resolved — not dismissable without action

#### `VCDiffViewer.tsx`

Monaco diff editor (read-only) showing before/after for a specific file at a
specific commit hash.

Props: `{ projectPath, filePath, hash, commitMessage, date, onClose }`

Fetches from `GET /api/vc/diff`. Renders `@monaco-editor/react` in `diff` mode
with `readOnly: true`.

#### `VCHistoryTab.tsx`

Reusable tab content dropped into each editor's tab bar.

Props: `{ projectPath, filePath }`

Fetches from `GET /api/vc/log`. Renders a list:

```
┌──────────────────────────────────────────────────┐
│  2026-05-20 14:32   Update agent: my-agent  [↺]  │
│  2026-05-19 09:10   Create agent: my-agent  [↺]  │
└──────────────────────────────────────────────────┘
```

- `[↺]` restore button: calls `POST /api/vc/restore`, then calls the parent editor's
  `onContentChange` callback to reload the editor with restored content.
- Clicking the row (not the restore button) expands an inline `VCDiffViewer`.
- Empty state: "No version history yet." if log is empty.
- Restore confirmation: a `DiscardModal`-style confirmation before overwriting.

### History tab integration

Each integration follows the same pattern: add `"history"` to the tab list,
render `<VCHistoryTab projectPath={...} filePath={...} />` when active.

#### Agent editor

`AgentFormEditor.tsx` — add "History" as a fourth tab alongside Identity, Prompt,
Settings. `filePath` = `agents/<name>.md` relative to the project's `.claude/` dir.

#### Skill editor

`SkillTabBar.tsx` — add `{ id: "history", label: "History" }` to `TABS`.
New route `/:name/history` added to the skill nested routes in `App.tsx`.
`SkillRoutes.tsx` exports a `SkillHistoryContent` that renders `VCHistoryTab`.
`filePath` = `skills/<name>/SKILL.md`.

#### CLAUDE.md editor

`EditorPane.tsx` currently has no tabs. Add a minimal two-tab bar:
`Edit | History`. When History is active, render `VCHistoryTab` instead of Monaco.
`filePath` = `CLAUDE.md`.

#### MCP editor

`McpEditorPane.tsx` — add "History" tab alongside Configure and Settings.
`filePath` = path to the relevant entry in `.claude.json` / `settings.json`.
(MCP entries are stored in JSON, not individual files — history for the whole
settings file is tracked; `filePath` points to `settings.json`.)

#### Hooks editor

`HooksPage.tsx` — add "History" tab.
`filePath` = `settings.json` (hooks live in settings.json).

---

## New API entries in `lib/api.ts`

```typescript
fetchVcStatus(projectPath): Promise<VCStatus>
fetchVcInit(projectPath): Promise<void>
fetchVcLog(projectPath, filePath): Promise<Commit[]>
fetchVcDiff(projectPath, filePath, hash): Promise<{ before: string, after: string }>
postVcRestore(projectPath, filePath, hash): Promise<{ content: string }>
postVcCommit(projectPath, message): Promise<void>
fetchVcSettings(projectPath): Promise<{ enabled: boolean }>
putVcSettings(projectPath, enabled): Promise<void>
postVcGitignoreProtect(projectPath): Promise<void>
postVcGitignoreUnblock(projectPath, gitignorePath): Promise<void>
postVcGitignoreStryde(projectPath, ignore: boolean): Promise<void>
```

---

## File list — new files

```
server/
  routers/versionControl.ts
  services/versionControl.ts      ← git CLI wrapper
  services/gitignoreManager.ts    ← check A/B/C + fix functions
  services/strydeConfig.ts        ← reads/writes .stryde/config.json

client/src/
  contexts/VersionControlContext.tsx
  routes/VCRoutes.tsx
  components/VersionControl/
    VersionControlPage.tsx
    VCInitPrompt.tsx
    VCChangesPane.tsx
    VCDiffViewer.tsx
    VCHistoryTab.tsx
```

## File list — modified files

```
server/
  server.ts                          ← mount /api/vc router

client/src/
  App.tsx                            ← add VCContent route, VersionControlContext provider, vcRefreshKey
  contexts/ShellContext.tsx          ← add vcRefreshKey, onBumpVcRefresh
  lib/api.ts                         ← add VC fetch functions
  components/Icons/index.tsx         ← add VersionControlIcon + badge
  components/Layout/Sidebar.tsx      ← add VC NavButton entry
  components/Layout/NavButton.tsx    ← add optional badge prop
  components/Agent/AgentFormEditor.tsx ← add History tab
  components/Skill/SkillTabBar.tsx   ← add History tab
  components/Editor/EditorPane.tsx   ← add Edit/History tab bar for CLAUDE.md
  components/Mcp/McpEditorPane.tsx   ← add History tab
  components/Hooks/HooksPage.tsx     ← add History tab
  components/Agent/steps/* (create)  ← add "Track with version control" toggle
  components/Skill/* (create)        ← add "Track with version control" toggle
```

---

## Implementation order

1. **Server foundation** — `versionControl.ts` service + `gitignoreManager.ts` + `strydeConfig.ts`
2. **API router** — `/api/vc` endpoints including gitignore check/fix endpoints, mount in `server.ts`
3. **Frontend context** — `VersionControlContext`, `ShellContext` additions (`vcRefreshKey`, `onBumpVcRefresh`), `api.ts` functions
4. **Sidebar badge** — `NavButton` badge prop, `VersionControlIcon`, Sidebar entry, bump `vcRefreshKey` after each save
5. **VC main page** — `VCInitPrompt` (with gitignore banners), `VCChangesPane` (with gitignore banners), `VCDiffViewer`, route wiring
6. **History tabs** — `VCHistoryTab`, then integrate into each editor (agent → skill → CLAUDE.md → MCP → hooks)
7. **Per-item opt-out** — creation flow toggles (agent create, skill create)

---

## Out of scope (this iteration)

- Branch management or multiple branches
- Push/pull to remote
- Merge conflict resolution
- Diffing MCP or hooks at the individual-key level (whole-file diff only)
- Version history for deleted items (log is only shown in the item's own editor)
