import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import * as profileController from "../controllers/profile.controller.js";

const router = Router();

// Apply auth to all profile routes
router.use(authenticate);

/**
 * @route   GET /api/profile
 * @desc    Get user profile overview, stats, and graphs
 * @access  Private
 */
router.get(
    "/",
    profileController.getProfile
);

export default router;
