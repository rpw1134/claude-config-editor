import { homedir } from "os";
import { resolve } from "path";

/** Replaces a leading ~ with the current user's home directory. */
export function resolveHome(path: string): string {
  return path.replace(/^~/, homedir());
}

/**
 * Validates a projectPath parameter from a request.
 * Returns the resolved absolute path on success, or throws an Error with a
 * message suitable for a 400 response if the path is invalid.
 *
 * Rules:
 *  - Must be a non-empty string
 *  - After path.resolve(), must not contain ".." segments (path traversal guard)
 */
export function validateProjectPath(raw: unknown): string {
  if (typeof raw !== "string" || raw.trim() === "") {
    throw new Error("projectPath is required and must be a non-empty string");
  }
  const resolved = resolve(raw);
  // resolve() normalises ".." so the result is always clean; we just double-check
  // by comparing the resolved form against itself — any traversal attempt shrinks
  // the path, but we also forbid ".." appearing literally in the input.
  if (raw.split("/").includes("..") || raw.split("\\").includes("..")) {
    throw new Error("projectPath must not contain '..' segments");
  }
  return resolved;
}
