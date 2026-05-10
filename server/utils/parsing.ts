import { homedir } from "os";

/** Replaces a leading ~ with the current user's home directory. */
export function resolveHome(path: string): string {
  return path.replace(/^~/, homedir());
}
