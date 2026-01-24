import { Router } from "express";
import * as badgeController from "../controllers/badge.controller.js";
import { authenticate } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import {
    createBadgeSchema,
    updateBadgeSchema,
    badgeIdParamSchema,
    badgeQuerySchema,
} from "../validators/badge.schemas.js";

const router = Router();

// All routes require authentication
router.use(authenticate);

// ============ Badge Routes ============

/**
 * @route   GET /api/badges/stats
 * @desc    Get badge statistics
 * @access  Private
 */
router.get("/stats", badgeController.getBadgeStats);

/**
 * @route   POST /api/badges
 * @desc    Create a new badge
 * @access  Private
 */
router.post("/", validate(createBadgeSchema), badgeController.createBadge);

/**
 * @route   GET /api/badges
 * @desc    Get all badges for current user
 * @access  Private
 */
router.get("/", validate(badgeQuerySchema, "query"), badgeController.getBadges);

/**
 * @route   GET /api/badges/:badgeId
 * @desc    Get a specific badge
 * @access  Private
 */
router.get(
    "/:badgeId",
    validate(badgeIdParamSchema, "params"),
    badgeController.getBadge
);

/**
 * @route   PATCH /api/badges/:badgeId
 * @desc    Update a badge
 * @access  Private
 */
router.patch(
    "/:badgeId",
    validate(badgeIdParamSchema, "params"),
    validate(updateBadgeSchema),
    badgeController.updateBadge
);

/**
 * @route   DELETE /api/badges/:badgeId
 * @desc    Delete a badge
 * @access  Private
 */
router.delete(
    "/:badgeId",
    validate(badgeIdParamSchema, "params"),
    badgeController.deleteBadge
);

export default router;
