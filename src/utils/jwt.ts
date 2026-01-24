import jwt, { type SignOptions } from "jsonwebtoken";
import { env } from "../config/env.js";
import type { JwtPayload, TokenPair } from "../types/index.js";

/**
 * Parse duration string to seconds
 */
function parseDuration(duration: string): number {
  const unit = duration.slice(-1);
  const value = parseInt(duration.slice(0, -1), 10);

  switch (unit) {
    case "s":
      return value;
    case "m":
      return value * 60;
    case "h":
      return value * 60 * 60;
    case "d":
      return value * 24 * 60 * 60;
    default:
      return 7 * 24 * 60 * 60; // Default 7 days
  }
}

/**
 * Generate an access token
 */
export function generateAccessToken(userId: string, email: string): string {
  const payload: JwtPayload = {
    userId,
    email,
    type: "access",
  };

  const options: SignOptions = {
    expiresIn: parseDuration(env.JWT_ACCESS_EXPIRES_IN),
  };

  return jwt.sign(payload, env.JWT_ACCESS_SECRET, options);
}

/**
 * Generate a refresh token
 */
export function generateRefreshToken(userId: string, email: string): string {
  const payload: JwtPayload = {
    userId,
    email,
    type: "refresh",
  };

  const options: SignOptions = {
    expiresIn: parseDuration(env.JWT_REFRESH_EXPIRES_IN),
  };

  return jwt.sign(payload, env.JWT_REFRESH_SECRET, options);
}

/**
 * Generate both access and refresh tokens
 */
export function generateTokenPair(userId: string, email: string): TokenPair {
  return {
    accessToken: generateAccessToken(userId, email),
    refreshToken: generateRefreshToken(userId, email),
  };
}

/**
 * Verify an access token
 */
export function verifyAccessToken(token: string): JwtPayload | null {
  try {
    const payload = jwt.verify(token, env.JWT_ACCESS_SECRET) as JwtPayload;
    if (payload.type !== "access") {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

/**
 * Verify a refresh token
 */
export function verifyRefreshToken(token: string): JwtPayload | null {
  try {
    const payload = jwt.verify(token, env.JWT_REFRESH_SECRET) as JwtPayload;
    if (payload.type !== "refresh") {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

/**
 * Get expiration date from duration string (e.g., "7d", "15m")
 */
export function getExpirationDate(duration: string): Date {
  const now = new Date();
  const seconds = parseDuration(duration);
  return new Date(now.getTime() + seconds * 1000);
}
