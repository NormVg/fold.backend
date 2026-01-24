import type { Response, NextFunction } from "express";
import { verifyAccessToken } from "../utils/jwt.js";
import { sendUnauthorized, sendForbidden } from "../utils/response.js";
import { prisma } from "../config/database.js";
import type { AuthenticatedRequest, UserStatus } from "../types/index.js";

/**
 * Middleware to authenticate requests using JWT access token
 */
export async function authenticate(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      sendUnauthorized(res, "Access token is required");
      return;
    }

    const token = authHeader.substring(7);
    const payload = verifyAccessToken(token);

    if (!payload) {
      sendUnauthorized(res, "Invalid or expired access token");
      return;
    }

    // Verify user exists and is active
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, email: true, status: true },
    });

    if (!user) {
      sendUnauthorized(res, "User not found");
      return;
    }

    if (user.status !== "active") {
      sendForbidden(res, `Account is ${user.status}`);
      return;
    }

    req.user = {
      userId: user.id,
      email: user.email,
    };

    next();
  } catch (error) {
    console.error("Authentication error:", error);
    sendUnauthorized(res, "Authentication failed");
  }
}

/**
 * Middleware to check if user has specific status
 */
export function requireStatus(...allowedStatuses: UserStatus[]) {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    if (!req.user) {
      sendUnauthorized(res, "User not authenticated");
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: { status: true },
    });

    if (!user || !allowedStatuses.includes(user.status as UserStatus)) {
      sendForbidden(res, "Access denied for current account status");
      return;
    }

    next();
  };
}

/**
 * Optional authentication - doesn't fail if no token, but populates user if valid
 */
export async function optionalAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      next();
      return;
    }

    const token = authHeader.substring(7);
    const payload = verifyAccessToken(token);

    if (payload) {
      const user = await prisma.user.findUnique({
        where: { id: payload.userId },
        select: { id: true, email: true, status: true },
      });

      if (user && user.status === "active") {
        req.user = {
          userId: user.id,
          email: user.email,
        };
      }
    }

    next();
  } catch {
    // Silently fail and continue without auth
    next();
  }
}
