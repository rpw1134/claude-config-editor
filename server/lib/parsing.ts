import { homedir } from "os";
import { resolve } from "path";
import type { Response } from "express";

export function resolveHome(path: string): string {
  return path.replace(/^~/, homedir());
}

export function validateProjectPath(raw: unknown): string {
  if (typeof raw !== "string" || raw.trim() === "") {
    throw new Error("projectPath is required and must be a non-empty string");
  }
  // resolve() normalises "..", but we also reject it literally to be explicit.
  if (raw.split("/").includes("..") || raw.split("\\").includes("..")) {
    throw new Error("projectPath must not contain '..' segments");
  }
  return resolve(raw);
}

/**
 * Validates projectPath and sends a 400 response on failure.
 * Returns the resolved path on success, or null if a response was already sent.
 * Callers must return immediately when this returns null.
 */
export function requireProjectPath(raw: unknown, res: Response): string | null {
  try {
    return validateProjectPath(raw);
  } catch (e) {
    res.status(400).json({ message: (e as Error).message });
    return null;
  }
}
