import express from "express";
import path from "path";
import type { NextFunction, Request, Response, Router } from "express";
import {
  fileExists,
  listDir,
  readFileContent,
  writeFileEnsureDir,
} from "../lib/fileIO.js";
import { getConfigDir, getMcpServer, createMcpServer } from "../services/claudeConfig.js";

const router: Router = express.Router();

type ResourceType = "agent" | "skill" | "mcp" | "grid";

interface ForkBody {
  resourceType?: unknown;
  name?: unknown;
  sourceProjectPath?: unknown;
  destProjectPath?: unknown;
}

function validateForkBody(
  body: ForkBody,
  res: Response,
): {
  resourceType: ResourceType;
  name: string;
  sourceProjectPath: string;
  destProjectPath: string;
} | null {
  const { resourceType, name, sourceProjectPath, destProjectPath } = body;

  const validTypes: ResourceType[] = ["agent", "skill", "mcp", "grid"];
  if (!validTypes.includes(resourceType as ResourceType)) {
    res.status(400).json({ message: "resourceType must be one of: agent, skill, mcp, grid" });
    return null;
  }
  if (typeof name !== "string" || !name.trim()) {
    res.status(400).json({ message: "name must be a non-empty string" });
    return null;
  }
  if (name.includes("/") || name.includes("\\") || name.includes("..")) {
    res.status(400).json({ message: "name must not contain path separators" });
    return null;
  }
  if (typeof sourceProjectPath !== "string" || !sourceProjectPath) {
    res.status(400).json({ message: "sourceProjectPath is required" });
    return null;
  }
  if (typeof destProjectPath !== "string" || !destProjectPath) {
    res.status(400).json({ message: "destProjectPath is required" });
    return null;
  }
  if (sourceProjectPath === destProjectPath) {
    res.status(400).json({ message: "sourceProjectPath and destProjectPath must differ" });
    return null;
  }

  return {
    resourceType: resourceType as ResourceType,
    name: name.trim(),
    sourceProjectPath,
    destProjectPath,
  };
}

async function forkAgent(name: string, srcPath: string, destPath: string): Promise<"ok" | "conflict" | "notfound"> {
  const srcFile = `${getConfigDir(srcPath)}/agents/${name}.md`;
  const destFile = `${getConfigDir(destPath)}/agents/${name}.md`;

  if (!(await fileExists(srcFile))) return "notfound";
  if (await fileExists(destFile)) return "conflict";

  const content = await readFileContent(srcFile);
  await writeFileEnsureDir(destFile, content);
  return "ok";
}

async function forkSkill(name: string, srcPath: string, destPath: string): Promise<"ok" | "conflict" | "notfound"> {
  const srcDir = `${getConfigDir(srcPath)}/skills/${name}`;
  const destSkillFile = `${getConfigDir(destPath)}/skills/${name}/SKILL.md`;

  if (!(await fileExists(`${srcDir}/SKILL.md`))) return "notfound";
  if (await fileExists(destSkillFile)) return "conflict";

  // Copy all files in the skill directory
  const listing = await listDir(srcDir);
  const files = listing?.files ?? [];
  const scripts = await listDir(`${srcDir}/scripts`);

  for (const file of files) {
    const content = await readFileContent(`${srcDir}/${file}`);
    await writeFileEnsureDir(`${getConfigDir(destPath)}/skills/${name}/${file}`, content);
  }

  if (scripts) {
    for (const script of scripts.files) {
      const content = await readFileContent(`${srcDir}/scripts/${script}`);
      await writeFileEnsureDir(`${getConfigDir(destPath)}/skills/${name}/scripts/${script}`, content);
    }
  }

  return "ok";
}

async function forkMcp(name: string, srcPath: string, destPath: string): Promise<"ok" | "conflict" | "notfound"> {
  const server = await getMcpServer(srcPath, name);
  if (server === null) return "notfound";

  const existing = await getMcpServer(destPath, name);
  if (existing !== null) return "conflict";

  await createMcpServer(destPath, name, server);
  return "ok";
}

async function forkGrid(name: string, srcPath: string, destPath: string): Promise<"ok" | "conflict" | "notfound"> {
  const srcFile = path.join(srcPath, ".stryde", "grids", `${name}.json`);
  const destFile = path.join(destPath, ".stryde", "grids", `${name}.json`);

  if (!(await fileExists(srcFile))) return "notfound";
  if (await fileExists(destFile)) return "conflict";

  const content = await readFileContent(srcFile);
  await writeFileEnsureDir(destFile, content);
  return "ok";
}

router.post(
  "/",
  async (req: Request, res: Response, next: NextFunction) => {
    const validated = validateForkBody(req.body as ForkBody, res);
    if (!validated) return;

    const { resourceType, name, sourceProjectPath, destProjectPath } = validated;

    try {
      let result: "ok" | "conflict" | "notfound";

      if (resourceType === "agent") {
        result = await forkAgent(name, sourceProjectPath, destProjectPath);
      } else if (resourceType === "skill") {
        result = await forkSkill(name, sourceProjectPath, destProjectPath);
      } else if (resourceType === "mcp") {
        result = await forkMcp(name, sourceProjectPath, destProjectPath);
      } else {
        result = await forkGrid(name, sourceProjectPath, destProjectPath);
      }

      if (result === "notfound") {
        return res.status(404).json({ message: `${resourceType} "${name}" not found in source project` });
      }
      if (result === "conflict") {
        return res.status(409).json({ message: `${resourceType} "${name}" already exists in the destination project` });
      }

      res.status(201).json({ message: `${resourceType} "${name}" forked successfully` });
    } catch (err) {
      next(err);
    }
  },
);

export default router;
