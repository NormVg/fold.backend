import type { Request, Response, NextFunction } from "express";
import * as userService from "../services/user.service.js";
import { sendSuccess } from "../utils/response.js";
import type { AuthenticatedRequest } from "../types/index.js";
import type {
  UpdateProfileInput,
  UpdatePreferencesInput,
  UpdateEmailInput,
} from "../validators/schemas.js";

/**
 * Get current user profile
 * GET /api/users/me
 */
export async function getMe(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }

    const user = await userService.getUserById(req.user.userId);

    if (!user) {
      res.status(404).json({ success: false, message: "User not found" });
      return;
    }

    sendSuccess(res, { user }, "Profile retrieved successfully");
  } catch (error) {
    next(error);
  }
}

/**
 * Update current user profile
 * PATCH /api/users/me
 */
export async function updateMe(
  req: AuthenticatedRequest & { body: UpdateProfileInput },
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }

    const user = await userService.updateProfile(req.user.userId, req.body);

    sendSuccess(res, { user }, "Profile updated successfully");
  } catch (error) {
    next(error);
  }
}

/**
 * Update user preferences
 * PATCH /api/users/me/preferences
 */
export async function updatePreferences(
  req: AuthenticatedRequest & { body: UpdatePreferencesInput },
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }

    const user = await userService.updatePreferences(req.user.userId, req.body);

    sendSuccess(res, { user }, "Preferences updated successfully");
  } catch (error) {
    next(error);
  }
}

/**
 * Update user email
 * PATCH /api/users/me/email
 */
export async function updateEmail(
  req: AuthenticatedRequest & { body: UpdateEmailInput },
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }

    const user = await userService.updateEmail(req.user.userId, req.body);

    sendSuccess(res, { user }, "Email updated successfully");
  } catch (error) {
    next(error);
  }
}

/**
 * Delete user account (soft delete)
 * DELETE /api/users/me
 */
export async function deleteMe(
  req: AuthenticatedRequest & { body: { password: string } },
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }

    const { password } = req.body;

    if (!password) {
      res.status(400).json({
        success: false,
        message: "Password is required to delete account",
      });
      return;
    }

    await userService.deleteAccount(req.user.userId, password);

    // Clear refresh token cookie
    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
    });

    sendSuccess(res, null, "Account deleted successfully");
  } catch (error) {
    next(error);
  }
}

/**
 * Get user statistics
 * GET /api/users/me/stats
 */
export async function getStats(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }

    const stats = await userService.getUserStats(req.user.userId);

    sendSuccess(res, { stats }, "Statistics retrieved successfully");
  } catch (error) {
    next(error);
  }
}

/**
 * Check if email is available
 * GET /api/users/check-email
 */
export async function checkEmail(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { email } = req.query;

    if (!email || typeof email !== "string") {
      res.status(400).json({
        success: false,
        message: "Email query parameter is required",
      });
      return;
    }

    const available = await userService.isEmailAvailable(email.toLowerCase());

    sendSuccess(res, { available }, "Email availability checked");
  } catch (error) {
    next(error);
  }
}
