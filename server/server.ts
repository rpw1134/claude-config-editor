import cors from "cors";
import express from "express";
import type { NextFunction, Request, Response } from "express";
import {
  fileExists,
  listDir,
  readFileContent,
  writeFileEnsureDir,
} from "./utils/fileIO.js";
import { resolveHome } from "./utils/parsing.js";
import claudeConfigRouter from "./routers/claudeConfig.js";
import agentsRouter from "./routers/agents.js";
import skillsRouter from "./routers/skills.js";
import mcpServersRouter from "./routers/mcpServers.js";
import projectsRouter from "./routers/projects.js";
import hooksRouter from "./routers/hooks.js";
import vcRouter from "./routers/versionControl.js";
import gridsRouter from "./routers/grids.js";
import profileRouter from "./routers/profile.js";
import aiDraftRouter from "./routers/aiDraft.js";

const app = express();
const PORT = 3000;

// Middleware to parse JSON bodies
app.use(express.json());
app.use(
  cors({
    origin: /^http:\/\/localhost:\d+$/,
  }),
);

app.use("/api/stryde", claudeConfigRouter);
app.use("/api/agents", agentsRouter);
app.use("/api/skills", skillsRouter);
app.use("/api/mcp-servers", mcpServersRouter);
app.use("/api/projects", projectsRouter);
app.use("/api/hooks", hooksRouter);
app.use("/api/vc", vcRouter);
app.use("/api/grids", gridsRouter);
app.use("/api/profile", profileRouter);
app.use("/api/ai-draft", aiDraftRouter);

// Dummy routes so I remember how express works 💀
app.get("/api/health", (req, res) => {
  res.send("Server healthy.");
});

app.get("/api/files", async (req, res, next) => {
  try {
    const queryFilePath = req.query.filePath as string;
    if (!queryFilePath) {
      return res
        .status(400)
        .json({ message: "Missing filePath query parameter" });
    }
    const fileName = resolveHome(req.query.filePath as string) || "unknown";
    const fileContent = await readFileContent(fileName);
    res.send(fileContent);
  } catch (err) {
    next(err);
  }
});

app.post("/api/files", async (req, res, next) => {
  const { fileName, content } = req.body;
  if (await fileExists(resolveHome(fileName))) {
    return res.status(400).json({ message: "File already exists" });
  }
  await writeFileEnsureDir(resolveHome(fileName), content);
  res.status(201).json({ message: "File created" });
});

app.get("/api/directory", async (req, res) => {
  const { directoryPath } = req.query;
  if (!directoryPath) {
    return res
      .status(400)
      .json({ message: "Missing directoryPath query parameter" });
  }
  const dirPath = resolveHome(directoryPath as string);
  const listing = await listDir(dirPath);
  if (listing === null) {
    return res.status(404).json({ message: "Directory not found" });
  }
  res.json(listing);
});

const FS_STATUS: Record<string, number> = {
  ENOENT: 404,
  EACCES: 403,
};

app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err.stack);
  const statusCode = FS_STATUS[err.code] ?? err.statusCode ?? err.status ?? 500;
  res.status(statusCode).json({
    status: "error",
    message: err.message || "Internal Server Error",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
