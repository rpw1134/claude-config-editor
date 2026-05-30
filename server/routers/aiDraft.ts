import express from "express";
import type { NextFunction, Request, Response, Router } from "express";
import Anthropic from "@anthropic-ai/sdk";
import { getStrydeProfile } from "../services/strydeProfile.js";
import {
  listAgents,
  listSkills,
  getProjectContent,
  getConfigDir,
  listMcpServers,
} from "../services/claudeConfig.js";
import { getHooks } from "../services/hooksService.js";
import { readFileContent } from "../utils/fileIO.js";

const router: Router = express.Router();

const SYSTEM_PROMPT = `You are an AI assistant embedded in Stryde, a tool for managing Claude Code configuration files.

You help users create and edit agents, skills, links, MCP servers, and hooks.

## Clarify before creating

Before generating any artifact, make sure you have the key details:
- **Purpose / description** — what should this do?
- **Model** — which Claude model? Options: claude-opus-4-8 (most capable), claude-sonnet-4-6 (balanced), claude-haiku-4-5-20251001 (fastest/cheapest)
- **Effort** — how thorough? (low / medium / high)
- **Any guidelines** — constraints, tone, special instructions?

If the user's first message already answers these, don't re-ask — proceed directly. For optional fields like tool allowlists and tags, use sensible defaults.

## Check existing agents/skills on first creation request

The first time in a conversation that a user asks to create or edit an agent or skill, call list_agents and list_skills before responding. Use this to spot naming conventions, similar existing items, and patterns worth following.

## Editing agents and skills

To edit an existing agent or skill:
1. Call get_agent or get_skill to read the current content
2. Apply the requested changes
3. Output an artifact with the SAME name and type as the original

The frontend detects the name match and updates the draft in place. Saving the draft writes to disk. You do NOT need a separate edit tool — just use the same artifact format with the same name.

## Artifact format

Wrap all created/edited files in XML artifact tags:

<artifact type="agent|skill|claude-md|link|mcp|hook" name="kebab-case-name">
...content...
</artifact>

### Agent (type="agent")
---
name: Agent Name
description: What this agent does
model: claude-opus-4-8
tools: []
---

System prompt body here.

### Skill (type="skill")
---
name: Skill Name
description: What this skill does
author: ""
tags: []
---

Skill instructions here.

### Link (type="link")

A link is magic — it connects an agent to a skill and defines when the agent invokes it. Keep it minimal. After creating, confirm with one sentence.

<artifact type="link" name="agent-skill-link">
agent: agent-name
skill: skill-name
trigger: when the user says X / always loaded / after every response
</artifact>

### MCP Server (type="mcp")

<artifact type="mcp" name="server-name">
{
  "type": "stdio",
  "command": "npx",
  "args": ["-y", "@scope/package"],
  "env": { "TOKEN": "$TOKEN" }
}
</artifact>

For HTTP/SSE servers use "type": "sse" with "url" instead of command/args.

### Hook (type="hook")

<artifact type="hook" name="hook-name">
{
  "event": "PreToolUse",
  "command": "shell command to run"
}
</artifact>

Hook events: PreToolUse, PostToolUse, Stop, SubagentStop, Notification

Always explain what you created after the closing artifact tag.
Respond conversationally outside artifact tags.`;

const TOOLS: Anthropic.Tool[] = [
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
    description: "Get the current hooks configuration to avoid overwriting existing hooks",
    input_schema: { type: "object", properties: {}, required: [] },
  },
];

function sendEvent(res: Response, type: string, data: object): void {
  res.write(`event: ${type}\ndata: ${JSON.stringify(data)}\n\n`);
}

function normalizeApiError(err: unknown): string {
  if (err instanceof Anthropic.APIError) {
    if (err.status === 529) return "Claude's API is busy right now — please try again in a moment.";
    if (err.status === 401) return "Invalid API key. Check your key in Settings → Profile.";
    if (err.status === 429) return "Rate limit reached — please wait a moment and try again.";
    return err.message || `API error (${err.status})`;
  }
  if (err instanceof Error) {
    // Some SDK versions serialize the full response body as err.message
    try {
      const parsed = JSON.parse(err.message) as Record<string, unknown>;
      const inner = parsed?.error as Record<string, unknown> | undefined;
      if (inner?.type === "overloaded_error") return "Claude's API is busy right now — please try again in a moment.";
      if (inner?.type === "rate_limit_error") return "Rate limit reached — please wait a moment and try again.";
      if (inner?.type === "authentication_error") return "Invalid API key. Check your key in Settings → Profile.";
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
    default:
      return `Unknown tool: ${name}`;
  }
}

type ParserState = "chat" | "buffering";

interface ArtifactMeta {
  type: string;
  name: string;
}

function parseArtifactOpenTag(tag: string): ArtifactMeta {
  const typeMatch = tag.match(/type="([^"]+)"/);
  const nameMatch = tag.match(/name="([^"]+)"/);
  return {
    type: typeMatch?.[1] ?? "",
    name: nameMatch?.[1] ?? "",
  };
}

function processTextChunk(
  text: string,
  state: ParserState,
  artifactBuffer: string,
  chatBuffer: string,
  artifactType: string,
  artifactName: string,
  res: Response,
): {
  state: ParserState;
  artifactBuffer: string;
  chatBuffer: string;
  artifactType: string;
  artifactName: string;
} {
  if (state === "chat") {
    chatBuffer += text;

    const tagStart = chatBuffer.indexOf("<artifact");
    if (tagStart === -1) {
      // No full artifact tag — check if the end of the buffer could be a partial "<artifact" prefix.
      // Only hold back the minimum needed to guard against a tag split across chunks.
      const lastAngle = chatBuffer.lastIndexOf("<");
      if (lastAngle !== -1 && "<artifact".startsWith(chatBuffer.slice(lastAngle))) {
        // Could be the start of an artifact tag — flush up to lastAngle, hold the rest.
        if (lastAngle > 0) {
          sendEvent(res, "token", { text: chatBuffer.slice(0, lastAngle) });
          chatBuffer = chatBuffer.slice(lastAngle);
        }
      } else {
        // Definitely not an artifact tag — flush everything immediately.
        if (chatBuffer.length > 0) {
          sendEvent(res, "token", { text: chatBuffer });
          chatBuffer = "";
        }
      }
      return { state, artifactBuffer, chatBuffer, artifactType, artifactName };
    }

    // We have at least the start of an artifact tag. Check if we have the closing >.
    const tagEnd = chatBuffer.indexOf(">", tagStart);
    if (tagEnd === -1) {
      // Tag not yet complete — flush text before the tag start and wait.
      if (tagStart > 0) {
        sendEvent(res, "token", { text: chatBuffer.slice(0, tagStart) });
        chatBuffer = chatBuffer.slice(tagStart);
      }
      return { state, artifactBuffer, chatBuffer, artifactType, artifactName };
    }

    // Full opening tag available.
    const beforeTag = chatBuffer.slice(0, tagStart);
    if (beforeTag) sendEvent(res, "token", { text: beforeTag });

    const openTag = chatBuffer.slice(tagStart, tagEnd + 1);
    const meta = parseArtifactOpenTag(openTag);
    artifactType = meta.type;
    artifactName = meta.name;

    sendEvent(res, "artifact-start", { type: artifactType, name: artifactName });

    chatBuffer = chatBuffer.slice(tagEnd + 1);
    state = "buffering";
    artifactBuffer = chatBuffer;
    chatBuffer = "";

    // Immediately check if the closing tag is already in the buffer.
    return processBufferingState(
      "",
      state,
      artifactBuffer,
      chatBuffer,
      artifactType,
      artifactName,
      res,
    );
  }

  // state === "buffering"
  return processBufferingState(
    text,
    state,
    artifactBuffer,
    chatBuffer,
    artifactType,
    artifactName,
    res,
  );
}

function processBufferingState(
  text: string,
  state: ParserState,
  artifactBuffer: string,
  chatBuffer: string,
  artifactType: string,
  artifactName: string,
  res: Response,
): {
  state: ParserState;
  artifactBuffer: string;
  chatBuffer: string;
  artifactType: string;
  artifactName: string;
} {
  artifactBuffer += text;
  const closeTag = "</artifact>";
  const closeIdx = artifactBuffer.indexOf(closeTag);

  if (closeIdx === -1) {
    return { state, artifactBuffer, chatBuffer, artifactType, artifactName };
  }

  const content = artifactBuffer.slice(0, closeIdx).trim();
  sendEvent(res, "artifact-end", { type: artifactType, name: artifactName, content });

  const remaining = artifactBuffer.slice(closeIdx + closeTag.length);
  artifactBuffer = "";
  artifactType = "";
  artifactName = "";
  state = "chat";

  if (remaining) {
    return processTextChunk(
      remaining,
      state,
      artifactBuffer,
      "",
      artifactType,
      artifactName,
      res,
    );
  }

  return { state, artifactBuffer, chatBuffer, artifactType, artifactName };
}

type MessageParam = Anthropic.MessageParam;

async function runStream(
  client: Anthropic,
  messages: MessageParam[],
  projectPath: string,
  res: Response,
): Promise<void> {
  let state: ParserState = "chat";
  let artifactBuffer = "";
  let artifactType = "";
  let artifactName = "";
  let chatBuffer = "";

  const stream = client.messages.stream({
    model: "claude-opus-4-7",
    max_tokens: 4096,
    system: [{ type: "text", text: SYSTEM_PROMPT, cache_control: { type: "ephemeral" } }],
    messages,
    tools: TOOLS,
  });

  await new Promise<void>((resolve, reject) => {
    stream.on("text", (text: string) => {
      const next = processTextChunk(
        text,
        state,
        artifactBuffer,
        chatBuffer,
        artifactType,
        artifactName,
        res,
      );
      state = next.state;
      artifactBuffer = next.artifactBuffer;
      chatBuffer = next.chatBuffer;
      artifactType = next.artifactType;
      artifactName = next.artifactName;
    });

    stream.on("error", (err: Error) => reject(err));

    stream.on("finalMessage", async (msg: Anthropic.Message) => {
      try {
        // Flush any remaining chat buffer
        if (chatBuffer) {
          sendEvent(res, "token", { text: chatBuffer });
          chatBuffer = "";
        }

        const toolUseBlocks = msg.content.filter(
          (b): b is Anthropic.ToolUseBlock => b.type === "tool_use",
        );

        if (toolUseBlocks.length === 0) {
          resolve();
          return;
        }

        // Execute all tool calls and collect results
        const toolResults: Anthropic.ToolResultBlockParam[] = await Promise.all(
          toolUseBlocks.map(async (block) => {
            sendEvent(res, "tool-call", { tool: block.name, args: block.input });
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

        // Continue with a follow-up call injecting tool results
        const updatedMessages: MessageParam[] = [
          ...messages,
          { role: "assistant", content: msg.content },
          { role: "user", content: toolResults },
        ];

        await runStream(client, updatedMessages, projectPath, res);
        resolve();
      } catch (err) {
        reject(err);
      }
    });
  });
}

router.post(
  "/chat",
  async (req: Request, res: Response, next: NextFunction) => {
    const { messages, projectPath } = req.body as {
      messages?: unknown;
      projectPath?: unknown;
    };

    if (!Array.isArray(messages)) {
      return res.status(400).json({ message: "messages must be an array" });
    }
    if (typeof projectPath !== "string" || projectPath.trim() === "") {
      return res.status(400).json({ message: "projectPath must be a non-empty string" });
    }

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders();

    try {
      const profile = await getStrydeProfile();
      if (!profile.apiKey) {
        sendEvent(res, "error", { message: "no_api_key" });
        res.end();
        return;
      }

      const client = new Anthropic({ apiKey: profile.apiKey });
      await runStream(client, messages as MessageParam[], projectPath.trim(), res);
      sendEvent(res, "done", {});
      res.end();
    } catch (err) {
      sendEvent(res, "error", { message: normalizeApiError(err) });
      res.end();
      next(err);
    }
  },
);

export default router;
