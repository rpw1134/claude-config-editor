import { AGENT_GUIDE } from "./agent.js";
import { SKILL_GUIDE } from "./skill.js";
import { MCP_GUIDE } from "./mcp.js";
import { HOOK_GUIDE } from "./hook.js";
import { CLAUDE_MD_GUIDE } from "./claudeMd.js";
import { LINK_GUIDE } from "./link.js";

export const ARTIFACT_TYPES = [
  "agent",
  "skill",
  "mcp",
  "hook",
  "claude-md",
  "link",
] as const;

export type ArtifactType = (typeof ARTIFACT_TYPES)[number];

const GUIDES: Record<ArtifactType, string> = {
  agent: AGENT_GUIDE,
  skill: SKILL_GUIDE,
  mcp: MCP_GUIDE,
  hook: HOOK_GUIDE,
  "claude-md": CLAUDE_MD_GUIDE,
  link: LINK_GUIDE,
};

export function getArtifactGuide(type: string): string | null {
  if (ARTIFACT_TYPES.includes(type as ArtifactType)) {
    return GUIDES[type as ArtifactType];
  }
  return null;
}
