import { useState } from "react";
import type { ToolCall } from "../../types/aiDraft";
import { ChevronDownIcon } from "../Icons";

// ── Label helpers ─────────────────────────────────────────────────────────────

function describeToolCall(tool: string, args: object): string {
  const a = args as Record<string, unknown>;

  // Dynamic labels that need args
  if (tool === "get_agent" && typeof a.name === "string") return `Agent "${a.name}"`;
  if (tool === "get_skill" && typeof a.name === "string") return `Skill "${a.name}"`;
  if (tool === "get_skill_scripts" && typeof a.name === "string") return `Skill scripts "${a.name}"`;
  if (tool === "get_mcp_registry_server" && typeof a.name === "string") return `MCP template "${a.name}"`;
  if (tool === "get_artifact_guide" && typeof a.type === "string") return `Reading ${a.type} guide`;
  if (tool === "list_directory") {
    const path = typeof a.path === "string" ? a.path : ".";
    return `Listing ${path}`;
  }
  if (tool === "read_file" && typeof a.path === "string") return `Reading ${a.path}`;

  // Static labels
  const map: Record<string, string> = {
    list_agents: "Listing agents",
    list_skills: "Listing skills",
    get_claude_md: "Reading CLAUDE.md",
    list_mcp_servers: "Listing MCP servers",
    get_hooks: "Reading hooks",
    list_mcp_registry: "Browsing MCP registry",
    edit_agent: "Editing agent",
    edit_skill: "Editing skill",
    create_mcp_server: "Creating MCP server",
    create_hook: "Creating hook",
  };
  return map[tool] ?? tool.replace(/_/g, " ");
}

// ── Sub-components ────────────────────────────────────────────────────────────

interface ToolRowProps {
  tc: ToolCall;
}

const ToolRow = ({ tc }: ToolRowProps) => {
  const done = tc.result !== undefined;
  return (
    <div className="flex items-center gap-2 py-0.5">
      <span className="shrink-0 w-3 flex items-center justify-center">
        {done ? (
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none" className="text-(--text-muted)/50">
            <circle cx="5" cy="5" r="4.5" stroke="currentColor" strokeWidth="0.8" />
            <path d="M2.5 5l1.6 1.6 3.1-3.1" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        ) : (
          <span className="block w-1.5 h-1.5 rounded-full bg-(--text-muted)/40" />
        )}
      </span>
      <span className={`text-[12px] font-sans ${done ? "text-(--text-muted)/60" : "text-(--text-muted)"}`}>
        {describeToolCall(tc.tool, tc.args)}
      </span>
    </div>
  );
};

// ── ToolStack ─────────────────────────────────────────────────────────────────

export interface ToolStackProps {
  toolCalls: ToolCall[];
}

export const ToolStack = ({ toolCalls }: ToolStackProps) => {
  const [expanded, setExpanded] = useState(false);

  if (toolCalls.length === 0) return null;

  const anyPending = toolCalls.some((tc) => tc.result === undefined);
  // Show the most recent tool call as the header label
  const latest = toolCalls[toolCalls.length - 1];
  const headerLabel = describeToolCall(latest.tool, latest.args);

  return (
    <div className="my-2 select-none">
      {/* Header row — always visible */}
      <button
        onClick={() => setExpanded((prev) => !prev)}
        className="flex items-center gap-1.5 cursor-pointer group"
        aria-expanded={expanded}
      >
        <span
          className={`text-[13px] font-sans transition-colors ${
            anyPending ? "thinking-text" : "text-(--text-muted)"
          }`}
        >
          {headerLabel}
        </span>
        <span
          className={`text-(--text-muted)/60 transition-transform duration-200 group-hover:text-(--text-muted) ${
            expanded ? "rotate-180" : "rotate-0"
          }`}
        >
          <ChevronDownIcon />
        </span>
      </button>

      {/* Expanded list — all tool calls in chronological order */}
      <div
        className={`grid transition-[grid-template-rows,opacity] duration-200 ease-out ${
          expanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        }`}
      >
        <div className="overflow-hidden">
          <div className="mt-1.5 ml-0.5 flex flex-col gap-0.5">
            {toolCalls.map((tc, i) => (
              <ToolRow key={i} tc={tc} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
