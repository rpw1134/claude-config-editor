export type ModelOption =
  | "claude-opus-4-7"
  | "claude-sonnet-4-6"
  | "claude-haiku-4-5-20251001";

export const MODELS: { value: ModelOption; label: string; note: string }[] = [
  { value: "claude-opus-4-7", label: "Claude Opus 4.7", note: "Most capable" },
  {
    value: "claude-sonnet-4-6",
    label: "Claude Sonnet 4.6",
    note: "Balanced — default",
  },
  {
    value: "claude-haiku-4-5-20251001",
    label: "Claude Haiku 4.5",
    note: "Fastest",
  },
];

export const DEFAULT_MODEL: ModelOption = "claude-sonnet-4-6";

export type PermissionMode =
  | "default"
  | "acceptEdits"
  | "auto"
  | "dontAsk"
  | "bypassPermissions"
  | "plan";

export type EffortLevel = "low" | "medium" | "high" | "xhigh" | "max";

export type MemoryScope = "user" | "project" | "local";

export const PERMISSION_MODES: { value: PermissionMode; note: string }[] = [
  { value: "default", note: "Standard prompting" },
  { value: "acceptEdits", note: "Auto-accept file edits" },
  { value: "auto", note: "Auto-approve safe actions" },
  { value: "dontAsk", note: "Skip most confirmations" },
  { value: "bypassPermissions", note: "No permission checks" },
  { value: "plan", note: "Plan mode only" },
];

export const EFFORT_LEVELS: { value: EffortLevel; note: string }[] = [
  { value: "low", note: "" },
  { value: "medium", note: "" },
  { value: "high", note: "" },
  { value: "xhigh", note: "Extra high" },
  { value: "max", note: "Maximum" },
];

export const MEMORY_SCOPES: { value: MemoryScope; note: string }[] = [
  { value: "user", note: "Cross-project user memories" },
  { value: "project", note: "Per-project memories" },
  { value: "local", note: "Local session only" },
];

export interface ColorSwatch {
  name: string;
  bg: string;
  ring: string;
}

export const COLORS: ColorSwatch[] = [
  { name: "red", bg: "#ef4444", ring: "rgba(239,68,68,0.35)" },
  { name: "orange", bg: "#f97316", ring: "rgba(249,115,22,0.35)" },
  { name: "yellow", bg: "#eab308", ring: "rgba(234,179,8,0.35)" },
  { name: "green", bg: "#22c55e", ring: "rgba(34,197,94,0.35)" },
  { name: "teal", bg: "#14b8a6", ring: "rgba(20,184,166,0.35)" },
  { name: "blue", bg: "#3b82f6", ring: "rgba(59,130,246,0.35)" },
  { name: "purple", bg: "#a855f7", ring: "rgba(168,85,247,0.35)" },
  { name: "pink", bg: "#ec4899", ring: "rgba(236,72,153,0.35)" },
];

export function agentsDirDisplay(projectPath: string): string {
  const isGlobal = projectPath.endsWith("/.claude");
  if (isGlobal) return "~/.claude/agents/";
  const home = projectPath.match(/^(\/Users\/[^/]+|\/home\/[^/]+)\//)?.[1];
  const shortened = home ? projectPath.replace(home, "~") : projectPath;
  return `${shortened}/.claude/agents/`;
}
