import type { Response } from "express";

export type ParserState = "chat" | "buffering";

export interface ArtifactMeta {
  type: string;
  name: string;
}

export interface ParserContext {
  state: ParserState;
  artifactBuffer: string;
  chatBuffer: string;
  artifactType: string;
  artifactName: string;
}

export function sendEvent(res: Response, type: string, data: object): void {
  res.write(`event: ${type}\ndata: ${JSON.stringify(data)}\n\n`);
}

export function parseArtifactOpenTag(tag: string): ArtifactMeta {
  const typeMatch = tag.match(/type="([^"]+)"/);
  const nameMatch = tag.match(/name="([^"]+)"/);
  return {
    type: typeMatch?.[1] ?? "",
    name: nameMatch?.[1] ?? "",
  };
}

export function processTextChunk(
  text: string,
  ctx: ParserContext,
  res: Response,
): ParserContext {
  if (ctx.state === "chat") {
    let chatBuffer = ctx.chatBuffer + text;

    const tagStart = chatBuffer.indexOf("<artifact");
    if (tagStart === -1) {
      const lastAngle = chatBuffer.lastIndexOf("<");
      if (lastAngle !== -1 && "<artifact".startsWith(chatBuffer.slice(lastAngle))) {
        if (lastAngle > 0) {
          sendEvent(res, "token", { text: chatBuffer.slice(0, lastAngle) });
          chatBuffer = chatBuffer.slice(lastAngle);
        }
      } else {
        if (chatBuffer.length > 0) {
          sendEvent(res, "token", { text: chatBuffer });
          chatBuffer = "";
        }
      }
      return { ...ctx, chatBuffer };
    }

    const tagEnd = chatBuffer.indexOf(">", tagStart);
    if (tagEnd === -1) {
      if (tagStart > 0) {
        sendEvent(res, "token", { text: chatBuffer.slice(0, tagStart) });
        chatBuffer = chatBuffer.slice(tagStart);
      }
      return { ...ctx, chatBuffer };
    }

    const beforeTag = chatBuffer.slice(0, tagStart);
    if (beforeTag) sendEvent(res, "token", { text: beforeTag });

    const openTag = chatBuffer.slice(tagStart, tagEnd + 1);
    const meta = parseArtifactOpenTag(openTag);

    sendEvent(res, "artifact-start", { type: meta.type, name: meta.name });

    const afterTag = chatBuffer.slice(tagEnd + 1);
    const next: ParserContext = {
      state: "buffering",
      artifactBuffer: afterTag,
      chatBuffer: "",
      artifactType: meta.type,
      artifactName: meta.name,
    };

    return processBufferingState("", next, res);
  }

  return processBufferingState(text, ctx, res);
}

export function processBufferingState(
  text: string,
  ctx: ParserContext,
  res: Response,
): ParserContext {
  const artifactBuffer = ctx.artifactBuffer + text;
  const closeTag = "</artifact>";
  const closeIdx = artifactBuffer.indexOf(closeTag);

  if (closeIdx === -1) {
    return { ...ctx, artifactBuffer };
  }

  const content = artifactBuffer.slice(0, closeIdx).trim();
  sendEvent(res, "artifact-end", { type: ctx.artifactType, name: ctx.artifactName, content });

  const remaining = artifactBuffer.slice(closeIdx + closeTag.length);
  const reset: ParserContext = {
    state: "chat",
    artifactBuffer: "",
    chatBuffer: "",
    artifactType: "",
    artifactName: "",
  };

  if (remaining) {
    return processTextChunk(remaining, reset, res);
  }

  return reset;
}
