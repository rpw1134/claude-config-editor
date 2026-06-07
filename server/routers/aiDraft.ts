import express from "express";
import type { NextFunction, Request, Response, Router } from "express";
import Anthropic from "@anthropic-ai/sdk";
import { getStrydeProfile } from "../services/strydeProfile.js";
import { sendEvent } from "../ai/parser.js";
import { runStream, normalizeApiError } from "../ai/stream.js";

type MessageParam = Anthropic.MessageParam;

const router: Router = express.Router();

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
      const finalHistory = await runStream(
        client,
        messages as MessageParam[],
        projectPath.trim(),
        res,
      );
      sendEvent(res, "history", { messages: finalHistory });
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
