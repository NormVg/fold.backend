import { Router } from "express";
import * as authController from "../controllers/auth.controller.js";
import { authenticate } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { authRateLimiter } from "../middleware/rateLimit.js";
import {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  googleAuthSchema,
  changePasswordSchema,
} from "../validators/schemas.js";

const router = Router();

// ============ Public Routes ============

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post("/register", authRateLimiter, validate(registerSchema), authController.register);

/**
 * @route   POST /api/auth/login
 * @desc    Login with email and password
 * @access  Public
 */
router.post("/login", authRateLimiter, validate(loginSchema), authController.login);

/**
 * @route   POST /api/auth/google
 * @desc    Login/Register with Google OAuth
 * @access  Public
 */
router.post("/google", authRateLimiter, validate(googleAuthSchema), authController.googleAuth);

/**
 * @route   POST /api/auth/refresh
 * @desc    Refresh access token using refresh token
 * @access  Public (requires valid refresh token)
 */
router.post("/refresh", validate(refreshTokenSchema), authController.refreshToken);

/**
 * @route   POST /api/auth/logout
 * @desc    Logout current session
 * @access  Public
 */
router.post("/logout", authController.logout);

// ============ Protected Routes ============

/**
 * @route   POST /api/auth/logout-all
 * @desc    Logout from all devices
 * @access  Private
 */
router.post("/logout-all", authenticate, authController.logoutAll);

/**
 * @route   POST /api/auth/change-password
 * @desc    Change password
 * @access  Private
 */
router.post(
  "/change-password",
  authenticate,
  validate(changePasswordSchema),
  authController.changePassword
);

/**
 * @route   GET /api/auth/sessions
 * @desc    Get active sessions
 * @access  Private
 */
router.get("/sessions", authenticate, authController.getSessions);

/**
 * @route   DELETE /api/auth/sessions/:sessionId
 * @desc    Revoke a specific session
 * @access  Private
 */
router.delete("/sessions/:sessionId", authenticate, authController.revokeSession);

export default router;
