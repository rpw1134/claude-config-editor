import path from "path";
import { readFileContent, writeFileEnsureDir } from "../utils/fileIO.js";
import { resolveHome } from "../utils/parsing.js";

export interface StrydeProfile {
  apiKey: string | null;
}

const DEFAULT_PROFILE: StrydeProfile = {
  apiKey: null,
};

const STRYDE_DIR = resolveHome("~/.stryde");
const PROFILE_PATH = path.join(STRYDE_DIR, "profile.local.json");

export async function getStrydeProfile(): Promise<StrydeProfile> {
  let raw: string;
  try {
    raw = await readFileContent(PROFILE_PATH);
  } catch (err) {
    const error = err as NodeJS.ErrnoException;
    if (error.code === "ENOENT") return { ...DEFAULT_PROFILE };
    throw err;
  }

  const parsed = JSON.parse(raw) as Partial<StrydeProfile>;
  return {
    apiKey: parsed.apiKey ?? DEFAULT_PROFILE.apiKey,
  };
}

export async function setStrydeProfile(update: Partial<StrydeProfile>): Promise<void> {
  const current = await getStrydeProfile();
  const merged: StrydeProfile = {
    apiKey: update.apiKey !== undefined ? update.apiKey : current.apiKey,
  };
  await writeFileEnsureDir(PROFILE_PATH, JSON.stringify(merged, null, 2));
}
