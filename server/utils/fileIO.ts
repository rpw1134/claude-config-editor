import { access, appendFile, mkdir, readdir, readFile, rm, unlink, writeFile } from "fs/promises";
import { dirname } from "path";
import type { DirListing } from "../types/fileIO.js";

export async function readFileContent(path: string): Promise<string> {
  return readFile(path, "utf-8");
}

export async function writeFileContent(
  path: string,
  content: string,
): Promise<void> {
  await writeFile(path, content, "utf-8");
}

export async function appendToFile(
  path: string,
  content: string,
): Promise<void> {
  await appendFile(path, content, "utf-8");
}

/** Returns true if accessible, false on ENOENT. Throws on other errors (e.g. EACCES). */
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

export async function ensureDir(path: string): Promise<void> {
  await mkdir(path, { recursive: true });
}

/** Returns null if the directory does not exist. Throws on other errors (e.g. EACCES). */
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

export async function writeFileEnsureDir(
  path: string,
  content: string,
): Promise<void> {
  await ensureDir(dirname(path));
  await writeFile(path, content, "utf-8");
}

export async function deleteFile(path: string): Promise<void> {
  await unlink(path);
}

export async function deleteDir(path: string): Promise<void> {
  await rm(path, { recursive: true });
}
