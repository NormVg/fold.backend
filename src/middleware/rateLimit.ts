import type { Request, Response, NextFunction } from "express";
import { sendError } from "../utils/response.js";

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// In-memory store (use Redis in production for distributed systems)
const store = new Map<string, RateLimitEntry>();

/**
 * Rate limiting middleware factory
 */
export function rateLimit(options: {
  windowMs?: number;
  maxRequests?: number;
  message?: string;
  keyGenerator?: (req: Request) => string;
}) {
  const {
    windowMs = 60 * 1000, // 1 minute
    maxRequests = 100,
    message = "Too many requests, please try again later",
    keyGenerator = (req) => req.ip || "unknown",
  } = options;

  // Cleanup old entries periodically
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of store) {
      if (entry.resetTime <= now) {
        store.delete(key);
      }
    }
  }, windowMs);

  return (req: Request, res: Response, next: NextFunction): void => {
    const key = keyGenerator(req);
    const now = Date.now();

    let entry = store.get(key);

    if (!entry || entry.resetTime <= now) {
      entry = {
        count: 1,
        resetTime: now + windowMs,
      };
      store.set(key, entry);
    } else {
      entry.count++;
    }

    // Set rate limit headers
    res.set({
      "X-RateLimit-Limit": maxRequests.toString(),
      "X-RateLimit-Remaining": Math.max(0, maxRequests - entry.count).toString(),
      "X-RateLimit-Reset": new Date(entry.resetTime).toISOString(),
    });

    if (entry.count > maxRequests) {
      res.set("Retry-After", Math.ceil((entry.resetTime - now) / 1000).toString());
      sendError(res, message, 429);
      return;
    }

    next();
  };
}

/**
 * Strict rate limiter for auth endpoints
 */
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 10,
  message: "Too many authentication attempts, please try again in 15 minutes",
});

/**
 * General API rate limiter
 */
export const apiRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 100,
});
