import { access, appendFile, mkdir, readdir, readFile, rm, unlink, writeFile } from "fs/promises";
import { dirname } from "path";
import type { DirListing } from "../types/fileIO.js";

/** Reads a file and returns its contents as a UTF-8 string. Throws with code ENOENT if not found. */
export async function readFileContent(path: string): Promise<string> {
  return readFile(path, "utf-8");
}

/** Writes content to a file, creating or overwriting it. Parent directory must already exist. */
export async function writeFileContent(
  path: string,
  content: string,
): Promise<void> {
  await writeFile(path, content, "utf-8");
}

/** Appends content to an existing file. Throws with code ENOENT if the file does not exist. */
export async function appendToFile(
  path: string,
  content: string,
): Promise<void> {
  await appendFile(path, content, "utf-8");
}

/** Returns true if the file exists and is accessible; false on ENOENT. Throws on other errors (e.g. EACCES). */
export async function fileExists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch (e) {
    const error = e as NodeJS.ErrnoException;
    if (error.code === "ENOENT") return false;
    throw error;
  }
}

/** Recursively creates a directory and any missing ancestors. No-ops if it already exists. */
export async function ensureDir(path: string): Promise<void> {
  await mkdir(path, { recursive: true });
}

/** Returns files and subdirectories in a directory separately, or null if it does not exist. Throws on other errors (e.g. EACCES). */
export async function listDir(path: string): Promise<DirListing | null> {
  try {
    const entries = await readdir(path, { withFileTypes: true });
    return {
      files: entries.filter((e) => e.isFile()).map((e) => e.name),
      dirs: entries.filter((e) => e.isDirectory()).map((e) => e.name),
    };
  } catch (e) {
    const error = e as NodeJS.ErrnoException;
    if (error.code === "ENOENT") return null;
    throw error;
  }
}

/** Writes content to a file, creating the parent directory tree if needed. */
export async function writeFileEnsureDir(
  path: string,
  content: string,
): Promise<void> {
  await ensureDir(dirname(path));
  await writeFile(path, content, "utf-8");
}

/** Deletes a single file. Throws with code ENOENT if not found. */
export async function deleteFile(path: string): Promise<void> {
  await unlink(path);
}

/** Deletes a directory and all its contents recursively. Throws if it doesn't exist. */
export async function deleteDir(path: string): Promise<void> {
  await rm(path, { recursive: true });
}
