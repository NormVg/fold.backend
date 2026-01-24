import type { Request, Response, NextFunction } from "express";
import * as authService from "../services/auth.service.js";
import { sendSuccess, sendCreated, sendNoContent } from "../utils/response.js";
import type { AuthenticatedRequest } from "../types/index.js";
import type {
  RegisterInput,
  LoginInput,
  RefreshTokenInput,
  GoogleAuthInput,
  ChangePasswordInput,
} from "../validators/schemas.js";

/**
 * Register a new user
 * POST /api/auth/register
 */
export async function register(
  req: Request<object, object, RegisterInput>,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userAgent = req.headers["user-agent"];
    const ipAddress = req.ip || req.socket.remoteAddress;

    const result = await authService.register(req.body, userAgent, ipAddress);

    // Set refresh token as HTTP-only cookie
    setRefreshTokenCookie(res, result.tokens.refreshToken);

    sendCreated(
      res,
      {
        user: result.user,
        accessToken: result.tokens.accessToken,
      },
      "Registration successful"
    );
  } catch (error) {
    next(error);
  }
}

/**
 * Login with email and password
 * POST /api/auth/login
 */
export async function login(
  req: Request<object, object, LoginInput>,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userAgent = req.headers["user-agent"];
    const ipAddress = req.ip || req.socket.remoteAddress;

    const result = await authService.login(req.body, userAgent, ipAddress);

    // Set refresh token as HTTP-only cookie
    setRefreshTokenCookie(res, result.tokens.refreshToken);

    sendSuccess(
      res,
      {
        user: result.user,
        accessToken: result.tokens.accessToken,
      },
      "Login successful"
    );
  } catch (error) {
    next(error);
  }
}

/**
 * Login/Register with Google OAuth
 * POST /api/auth/google
 */
export async function googleAuth(
  req: Request<object, object, GoogleAuthInput>,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userAgent = req.headers["user-agent"];
    const ipAddress = req.ip || req.socket.remoteAddress;

    const result = await authService.googleAuth(req.body, userAgent, ipAddress);

    // Set refresh token as HTTP-only cookie
    setRefreshTokenCookie(res, result.tokens.refreshToken);

    sendSuccess(
      res,
      {
        user: result.user,
        accessToken: result.tokens.accessToken,
      },
      "Google authentication successful"
    );
  } catch (error) {
    next(error);
  }
}

/**
 * Refresh access token
 * POST /api/auth/refresh
 */
export async function refreshToken(
  req: Request<object, object, RefreshTokenInput>,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Get refresh token from cookie or body
    const token = req.cookies?.refreshToken || req.body.refreshToken;

    if (!token) {
      res.status(400).json({
        success: false,
        message: "Refresh token is required",
      });
      return;
    }

    const userAgent = req.headers["user-agent"];
    const ipAddress = req.ip || req.socket.remoteAddress;

    const tokens = await authService.refreshTokens(token, userAgent, ipAddress);

    // Set new refresh token as HTTP-only cookie
    setRefreshTokenCookie(res, tokens.refreshToken);

    sendSuccess(
      res,
      {
        accessToken: tokens.accessToken,
      },
      "Token refreshed successfully"
    );
  } catch (error) {
    next(error);
  }
}

/**
 * Logout current session
 * POST /api/auth/logout
 */
export async function logout(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const token = req.cookies?.refreshToken || req.body.refreshToken;

    if (token) {
      await authService.logout(token);
    }

    // Clear refresh token cookie
    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
    });

    sendSuccess(res, null, "Logged out successfully");
  } catch (error) {
    next(error);
  }
}

/**
 * Logout from all devices
 * POST /api/auth/logout-all
 */
export async function logoutAll(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }

    await authService.logoutAll(req.user.userId);

    // Clear refresh token cookie
    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
    });

    sendSuccess(res, null, "Logged out from all devices");
  } catch (error) {
    next(error);
  }
}

/**
 * Change password
 * POST /api/auth/change-password
 */
export async function changePassword(
  req: AuthenticatedRequest & { body: ChangePasswordInput },
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }

    await authService.changePassword(req.user.userId, req.body);

    // Clear refresh token cookie (force re-login)
    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
    });

    sendSuccess(res, null, "Password changed successfully. Please log in again.");
  } catch (error) {
    next(error);
  }
}

/**
 * Get active sessions
 * GET /api/auth/sessions
 */
export async function getSessions(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }

    const sessions = await authService.getActiveSessions(req.user.userId);

    sendSuccess(res, { sessions }, "Sessions retrieved successfully");
  } catch (error) {
    next(error);
  }
}

/**
 * Revoke a specific session
 * DELETE /api/auth/sessions/:sessionId
 */
export async function revokeSession(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }

    const sessionId = req.params.sessionId;

    if (!sessionId || typeof sessionId !== "string") {
      res.status(400).json({ success: false, message: "Session ID is required" });
      return;
    }

    await authService.revokeSession(req.user.userId, sessionId);

    sendNoContent(res);
  } catch (error) {
    next(error);
  }
}

// ============ Helper Functions ============

function setRefreshTokenCookie(res: Response, token: string): void {
  res.cookie("refreshToken", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: "/",
  });
}
