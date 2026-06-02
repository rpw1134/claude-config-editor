import type { Response } from "express";
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
import { readFileContent, listDir } from "../utils/fileIO.js";
import { SYSTEM_PROMPT, TOOLS } from "./aiDraftPrompt.js";
import { listMcpRegistryNames, getMcpRegistryServer } from "./mcpRegistry.js";
import {
  sendEvent,
  processTextChunk,
  type ParserContext,
} from "./aiDraftParser.js";

type MessageParam = Anthropic.MessageParam;

export function normalizeApiError(err: unknown): string {
  if (err instanceof Anthropic.APIError) {
    if (err.status === 529)
      return "Claude's API is busy right now — please try again in a moment.";
    if (err.status === 401)
      return "Invalid API key. Check your key in Settings → Profile.";
    if (err.status === 429)
      return "Rate limit reached — please wait a moment and try again.";
    return err.message || `API error (${err.status})`;
  }
  if (err instanceof Error) {
    try {
      const parsed = JSON.parse(err.message) as Record<string, unknown>;
      const inner = parsed?.error as Record<string, unknown> | undefined;
      if (inner?.type === "overloaded_error")
        return "Claude's API is busy right now — please try again in a moment.";
      if (inner?.type === "rate_limit_error")
        return "Rate limit reached — please wait a moment and try again.";
      if (inner?.type === "authentication_error")
        return "Invalid API key. Check your key in Settings → Profile.";
      return (inner?.message as string) ?? err.message;
    } catch {
      return err.message;
    }
  }
  return "Unknown error";
}

async function executeToolCall(
  name: string,
  input: Record<string, unknown>,
  projectPath: string,
): Promise<string> {
  switch (name) {
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
      if (!target.startsWith(projectRoot)) return "Error: path is outside the project root.";
      const BLOCKED = new Set(["node_modules", ".git", "dist", "build", ".cache", ".next", ".nuxt", "vendor", "coverage", "__pycache__", ".venv", "venv"]);
      const listing = await listDir(target);
      if (!listing) return `Directory not found: ${rel}`;
      const filteredDirs = listing.dirs.filter((d) => !BLOCKED.has(d));
      return JSON.stringify({ path: rel, dirs: filteredDirs, files: listing.files });
    }
    case "read_file": {
      const projectRoot = resolve(projectPath);
      const filePath = input.path as string;
      const target = resolve(join(projectRoot, filePath));
      if (!target.startsWith(projectRoot)) return "Error: path is outside the project root.";
      const BLOCKED_NAMES = new Set([".env", ".env.local", ".env.production", ".env.development"]);
      const fileName = target.split("/").pop() ?? "";
      if (BLOCKED_NAMES.has(fileName) || fileName.startsWith(".env")) return "Error: reading environment/secret files is not allowed.";
      const BINARY_EXTS = new Set([".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg", ".ico", ".woff", ".woff2", ".ttf", ".eot", ".pdf", ".zip", ".tar", ".gz", ".lock"]);
      const ext = fileName.includes(".") ? "." + fileName.split(".").pop()! : "";
      if (BINARY_EXTS.has(ext)) return `Error: binary or lock file (${ext}) cannot be read.`;
      const MAX_BYTES = 100 * 1024;
      const info = await stat(target).catch(() => null);
      if (!info) return `File not found: ${filePath}`;
      if (!info.isFile()) return `Not a file: ${filePath}`;
      if (info.size > MAX_BYTES) return `Error: file is too large (${Math.round(info.size / 1024)} KB > 100 KB limit).`;
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

export async function runStream(
  client: Anthropic,
  messages: MessageParam[],
  projectPath: string,
  res: Response,
): Promise<MessageParam[]> {
  let ctx: ParserContext = {
    state: "chat",
    artifactBuffer: "",
    chatBuffer: "",
    artifactType: "",
    artifactName: "",
  };

  const stream = client.messages.stream({
    model: "claude-sonnet-4-6",
    max_tokens: 4096,
    system: [
      {
        type: "text",
        text: SYSTEM_PROMPT,
        cache_control: { type: "ephemeral" },
      },
    ],
    messages,
    tools: TOOLS,
  });

  return new Promise<MessageParam[]>((resolve, reject) => {
    stream.on("text", (text: string) => {
      ctx = processTextChunk(text, ctx, res);
    });

    stream.on("error", (err: Error) => reject(err));

    stream.on("finalMessage", async (msg: Anthropic.Message) => {
      try {
        if (ctx.chatBuffer) {
          sendEvent(res, "token", { text: ctx.chatBuffer });
          ctx = { ...ctx, chatBuffer: "" };
        }

        const toolUseBlocks = msg.content.filter(
          (b): b is Anthropic.ToolUseBlock => b.type === "tool_use",
        );

        if (toolUseBlocks.length === 0) {
          resolve([...messages, { role: "assistant", content: msg.content }]);
          return;
        }

        const toolResults: Anthropic.ToolResultBlockParam[] = await Promise.all(
          toolUseBlocks.map(async (block) => {
            sendEvent(res, "tool-call", {
              tool: block.name,
              args: block.input,
            });
            const result = await executeToolCall(
              block.name,
              block.input as Record<string, unknown>,
              projectPath,
            );
            sendEvent(res, "tool-result", { tool: block.name, result });
            return {
              type: "tool_result" as const,
              tool_use_id: block.id,
              content: result,
            };
          }),
        );

        const updatedMessages: MessageParam[] = [
          ...messages,
          { role: "assistant", content: msg.content },
          { role: "user", content: toolResults },
        ];

        const finalMessages = await runStream(
          client,
          updatedMessages,
          projectPath,
          res,
        );
        resolve(finalMessages);
      } catch (err) {
        reject(err);
      }
    });
  });
}
