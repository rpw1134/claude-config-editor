import { resolve, join } from "path";
import { stat } from "fs/promises";
import Anthropic from "@anthropic-ai/sdk";
import {
  listAgents,
  listSkills,
  getProjectContent,
  getConfigDir,
  listMcpServers,
} from "../services/claudeConfig.js";
import { getHooks } from "../services/hooksService.js";
import { readFileContent, listDir } from "../lib/fileIO.js";
import { listMcpRegistryNames, getMcpRegistryServer } from "./mcpRegistry.js";
import { getArtifactGuide, ARTIFACT_TYPES } from "./knowledge/index.js";

export const TOOLS: Anthropic.Tool[] = [
  {
    name: "get_artifact_guide",
    description:
      "Load the detailed format spec, frontmatter schema, and examples for ONE artifact type before you create or edit it. Call this only for the type(s) the user actually asked for — never preload guides for types you don't need.",
    input_schema: {
      type: "object",
      properties: {
        type: {
          type: "string",
          enum: ARTIFACT_TYPES as unknown as string[],
          description: "The artifact type to load the guide for",
        },
      },
      required: ["type"],
    },
  },
  {
    name: "list_agents",
    description: "List all agents in the selected project",
    input_schema: { type: "object", properties: {}, required: [] },
  },
  {
    name: "list_skills",
    description: "List all skills in the selected project",
    input_schema: { type: "object", properties: {}, required: [] },
  },
  {
    name: "get_agent",
    description: "Get the content of a specific agent",
    input_schema: {
      type: "object",
      properties: { name: { type: "string", description: "Agent name" } },
      required: ["name"],
    },
  },
  {
    name: "get_skill",
    description: "Get the content of a specific skill SKILL.md",
    input_schema: {
      type: "object",
      properties: { name: { type: "string", description: "Skill name" } },
      required: ["name"],
    },
  },
  {
    name: "get_claude_md",
    description: "Get the project's CLAUDE.md content",
    input_schema: { type: "object", properties: {}, required: [] },
  },
  {
    name: "list_mcp_servers",
    description: "List all MCP servers configured in the selected project",
    input_schema: { type: "object", properties: {}, required: [] },
  },
  {
    name: "get_hooks",
    description:
      "Get the current hooks configuration to understand what already exists. Do NOT copy existing hooks into your artifact — only output new hook groups. The app merges automatically.",
    input_schema: { type: "object", properties: {}, required: [] },
  },
  {
    name: "list_directory",
    description:
      "List files and subdirectories at a path within the project root. Use '.' for the project root. Blocked dirs (node_modules, .git, dist, build, etc.) are hidden automatically.",
    input_schema: {
      type: "object",
      properties: {
        path: {
          type: "string",
          description:
            "Path relative to the project root. Defaults to '.' (root).",
        },
      },
      required: [],
    },
  },
  {
    name: "read_file",
    description:
      "Read the contents of a file within the project root. Limited to 100 KB. Binary files and files outside the project are rejected.",
    input_schema: {
      type: "object",
      properties: {
        path: {
          type: "string",
          description: "Path relative to the project root.",
        },
      },
      required: ["path"],
    },
  },
  {
    name: "get_skill_scripts",
    description:
      "List the script files inside a skill's scripts/ directory. Call this before creating a new script to see what already exists.",
    input_schema: {
      type: "object",
      properties: {
        name: { type: "string", description: "Skill name (kebab-case slug)" },
      },
      required: ["name"],
    },
  },
  {
    name: "list_mcp_registry",
    description:
      "List all available MCP server templates by name and description. Call this once the first time a user asks to create an MCP server to see what predefined templates are available.",
    input_schema: { type: "object", properties: {}, required: [] },
  },
  {
    name: "get_mcp_registry_server",
    description:
      "Get the full definition for a specific MCP server template by name. Use the name from list_mcp_registry.",
    input_schema: {
      type: "object",
      properties: {
        name: {
          type: "string",
          description: "MCP server template name from list_mcp_registry",
        },
      },
      required: ["name"],
    },
  },
];

const BLOCKED_DIRS = new Set([
  "node_modules", ".git", "dist", "build", ".cache",
  ".next", ".nuxt", "vendor", "coverage", "__pycache__", ".venv", "venv",
]);
const BLOCKED_ENV_NAMES = new Set([
  ".env", ".env.local", ".env.production", ".env.development",
]);
const BINARY_EXTS = new Set([
  ".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg", ".ico",
  ".woff", ".woff2", ".ttf", ".eot", ".pdf", ".zip", ".tar", ".gz", ".lock",
]);
const MAX_FILE_BYTES = 100 * 1024;

export async function executeToolCall(
  name: string,
  input: Record<string, unknown>,
  projectPath: string,
): Promise<string> {
  switch (name) {
    case "get_artifact_guide": {
      const type = input.type as string;
      const guide = getArtifactGuide(type);
      return guide ?? `No guide available for artifact type "${type}".`;
    }
    case "list_agents": {
      const agents = await listAgents(projectPath);
      return JSON.stringify(agents);
    }
    case "list_skills": {
      const skills = await listSkills(projectPath);
      return JSON.stringify(skills);
    }
    case "get_agent": {
      const agentName = input.name as string;
      const filePath = `${getConfigDir(projectPath)}/agents/${agentName}.md`;
      try {
        return await readFileContent(filePath);
      } catch {
        return `Agent "${agentName}" not found.`;
      }
    }
    case "get_skill": {
      const skillName = input.name as string;
      const filePath = `${getConfigDir(projectPath)}/skills/${skillName}/SKILL.md`;
      try {
        return await readFileContent(filePath);
      } catch {
        return `Skill "${skillName}" not found.`;
      }
    }
    case "get_skill_scripts": {
      const skillName = input.name as string;
      const scriptsDir = `${getConfigDir(projectPath)}/skills/${skillName}/scripts`;
      const listing = await listDir(scriptsDir);
      return JSON.stringify(listing?.files ?? []);
    }
    case "get_claude_md": {
      const content = await getProjectContent(projectPath);
      return content ?? "No CLAUDE.md found for this project.";
    }
    case "list_mcp_servers": {
      const servers = await listMcpServers(projectPath);
      return JSON.stringify(servers);
    }
    case "get_hooks": {
      const hooks = await getHooks(projectPath);
      return JSON.stringify(hooks);
    }
    case "list_directory": {
      const projectRoot = resolve(projectPath);
      const rel = (input.path as string | undefined) ?? ".";
      const target = resolve(join(projectRoot, rel));
      if (!target.startsWith(projectRoot))
        return "Error: path is outside the project root.";
      const listing = await listDir(target);
      if (!listing) return `Directory not found: ${rel}`;
      const filteredDirs = listing.dirs.filter((d) => !BLOCKED_DIRS.has(d));
      return JSON.stringify({ path: rel, dirs: filteredDirs, files: listing.files });
    }
    case "read_file": {
      const projectRoot = resolve(projectPath);
      const filePath = input.path as string;
      const target = resolve(join(projectRoot, filePath));
      if (!target.startsWith(projectRoot))
        return "Error: path is outside the project root.";
      const fileName = target.split("/").pop() ?? "";
      if (BLOCKED_ENV_NAMES.has(fileName) || fileName.startsWith(".env"))
        return "Error: reading environment/secret files is not allowed.";
      const ext = fileName.includes(".") ? "." + fileName.split(".").pop()! : "";
      if (BINARY_EXTS.has(ext))
        return `Error: binary or lock file (${ext}) cannot be read.`;
      const info = await stat(target).catch(() => null);
      if (!info) return `File not found: ${filePath}`;
      if (!info.isFile()) return `Not a file: ${filePath}`;
      if (info.size > MAX_FILE_BYTES)
        return `Error: file is too large (${Math.round(info.size / 1024)} KB > 100 KB limit).`;
      return await readFileContent(target);
    }
    case "list_mcp_registry": {
      return JSON.stringify(listMcpRegistryNames());
    }
    case "get_mcp_registry_server": {
      const serverName = input.name as string;
      const template = getMcpRegistryServer(serverName);
      if (!template) return `No registry template found for "${serverName}".`;
      return JSON.stringify(template);
    }
    default:
      return `Unknown tool: ${name}`;
  }
}
