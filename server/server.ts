import express, { NextFunction, Request, Response } from "express";
import { readFileContent } from "./utils/fileIO";
import { resolveHome } from "./utils/parsing";

const app = express();
const PORT = 3000;

// Middleware to parse JSON bodies
app.use(express.json());

// Dummy routes so I remember how express works 💀
app.get("/api/health", (req, res) => {
  res.send("Server healthy.");
});

app.get("/api/files", async (req, res, next) => {
  try {
    const fileName = resolveHome(req.query.fileName as string) || "unknown";
    const fileContent = await readFileContent(fileName);
    res.send(fileContent);
  } catch (err) {
    next(err);
  }
});

app.post("/api/users", (req, res) => {
  const newUser = req.body;
  res.status(201).json({ message: "User created", user: newUser });
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
