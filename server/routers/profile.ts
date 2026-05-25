import express from "express";
import type { NextFunction, Request, Response, Router } from "express";
import { getStrydeProfile, setStrydeProfile } from "../services/strydeProfile.js";

const router: Router = express.Router();

// GET /api/profile → { apiKey: string | null }
router.get("/", async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const profile = await getStrydeProfile();
    res.json({ apiKey: profile.apiKey });
  } catch (err) {
    next(err);
  }
});

// PUT /api/profile  body: { apiKey: string } → { ok: true }
router.put("/", async (req: Request, res: Response, next: NextFunction) => {
  const { apiKey } = req.body as { apiKey?: unknown };
  if (typeof apiKey !== "string" || apiKey.trim() === "") {
    return res.status(400).json({ message: "apiKey must be a non-empty string" });
  }
  try {
    await setStrydeProfile({ apiKey: apiKey.trim() });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

export default router;
