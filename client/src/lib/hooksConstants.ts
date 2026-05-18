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
