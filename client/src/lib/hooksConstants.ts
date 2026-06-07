export const HOOK_EVENTS = [
  "PreToolUse",
  "PostToolUse",
  "PostToolUseFailure",
  "UserPromptSubmit",
  "SessionStart",
  "SessionEnd",
  "Stop",
  "StopFailure",
  "Notification",
  "SubagentStart",
  "SubagentStop",
  "TaskCreated",
  "TaskCompleted",
  "PostToolBatch",
  "PreCompact",
  "PostCompact",
  "ConfigChange",
  "CwdChanged",
  "FileChanged",
  "WorktreeCreate",
  "WorktreeRemove",
  "InstructionsLoaded",
  "Elicitation",
  "ElicitationResult",
  "PermissionRequest",
  "PermissionDenied",
  "UserPromptExpansion",
  "TeammateIdle",
  "Setup",
] as const;

export type HookEvent = (typeof HOOK_EVENTS)[number];

export const HOOK_TYPES = ["command", "http", "prompt", "agent"] as const;
export type HookType = (typeof HOOK_TYPES)[number];

export const NO_MATCHER_EVENTS = new Set<string>([
  "UserPromptSubmit",
  "Stop",
  "PostToolBatch",
  "CwdChanged",
  "TaskCreated",
  "TaskCompleted",
  "WorktreeCreate",
  "WorktreeRemove",
]);

export const supportsMatcher = (event: string): boolean =>
  !NO_MATCHER_EVENTS.has(event);

export const IF_EVENTS = new Set<string>([
  "PreToolUse",
  "PostToolUse",
  "PostToolUseFailure",
  "PermissionRequest",
  "PermissionDenied",
]);

export const supportsIf = (event: string): boolean => IF_EVENTS.has(event);
