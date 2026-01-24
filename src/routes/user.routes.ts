import { Router } from "express";
import * as userController from "../controllers/user.controller.js";
import { authenticate } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import {
  updateProfileSchema,
  updatePreferencesSchema,
  updateEmailSchema,
} from "../validators/schemas.js";

const router = Router();

// ============ Public Routes ============

/**
 * @route   GET /api/users/check-email
 * @desc    Check if email is available
 * @access  Public
 */
router.get("/check-email", userController.checkEmail);

// ============ Protected Routes ============

/**
 * @route   GET /api/users/me
 * @desc    Get current user profile
 * @access  Private
 */
router.get("/me", authenticate, userController.getMe);

/**
 * @route   PATCH /api/users/me
 * @desc    Update current user profile
 * @access  Private
 */
router.patch("/me", authenticate, validate(updateProfileSchema), userController.updateMe);

/**
 * @route   PATCH /api/users/me/preferences
 * @desc    Update user preferences
 * @access  Private
 */
router.patch(
  "/me/preferences",
  authenticate,
  validate(updatePreferencesSchema),
  userController.updatePreferences
);

/**
 * @route   PATCH /api/users/me/email
 * @desc    Update user email
 * @access  Private
 */
router.patch("/me/email", authenticate, validate(updateEmailSchema), userController.updateEmail);

/**
 * @route   DELETE /api/users/me
 * @desc    Delete user account (soft delete)
 * @access  Private
 */
router.delete("/me", authenticate, userController.deleteMe);

/**
 * @route   GET /api/users/me/stats
 * @desc    Get user statistics
 * @access  Private
 */
router.get("/me/stats", authenticate, userController.getStats);

export default router;
