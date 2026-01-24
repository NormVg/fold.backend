import { Router, type Request, type Response } from "express";
import authRoutes from "./auth.routes.js";
import userRoutes from "./user.routes.js";
import memoryRoutes from "./memory.routes.js";
import storyRoutes from "./story.routes.js";
import badgeRoutes from "./badge.routes.js";
import profileRoutes from "./profile.routes.js";

const router = Router();

// Health check endpoint
router.get("/health", (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: "Server is healthy",
    timestamp: new Date().toISOString(),
  });
});

// API routes
router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/memories", memoryRoutes);
router.use("/stories", storyRoutes);
router.use("/badges", badgeRoutes);
router.use("/profile", profileRoutes);

export default router;
