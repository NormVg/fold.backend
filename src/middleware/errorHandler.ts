import type { Request, Response, NextFunction } from "express";
import { env } from "../config/env.js";
import { sendError, sendServerError } from "../utils/response.js";

/**
 * Custom error class with status code
 */
export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Not found handler for undefined routes
 */
export function notFoundHandler(req: Request, res: Response): void {
  sendError(res, `Route ${req.method} ${req.originalUrl} not found`, 404);
}

/**
 * Global error handler middleware
 */
export function errorHandler(
  error: Error | AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  console.error("Error:", error);

  // Handle known operational errors
  if (error instanceof AppError) {
    sendError(res, error.message, error.statusCode);
    return;
  }

  // Handle Prisma errors
  if (error.name === "PrismaClientKnownRequestError") {
    const prismaError = error as { code?: string; meta?: { target?: string[] } };

    if (prismaError.code === "P2002") {
      const field = prismaError.meta?.target?.[0] || "field";
      sendError(res, `A record with this ${field} already exists`, 409);
      return;
    }

    if (prismaError.code === "P2025") {
      sendError(res, "Record not found", 404);
      return;
    }
  }

  // Handle validation errors
  if (error.name === "ValidationError") {
    sendError(res, error.message, 400);
    return;
  }

  // Handle JWT errors
  if (error.name === "JsonWebTokenError") {
    sendError(res, "Invalid token", 401);
    return;
  }

  if (error.name === "TokenExpiredError") {
    sendError(res, "Token expired", 401);
    return;
  }

  // Default to internal server error
  if (env.NODE_ENV === "development") {
    sendError(res, error.message, 500);
    return;
  }

  sendServerError(res, "Something went wrong");
}