import type { Response } from "express";
import type { ApiResponse } from "../types/index.js";

/**
 * Send a success response
 */
export function sendSuccess<T>(
  res: Response,
  data: T,
  message = "Success",
  statusCode = 200
): Response {
  const response: ApiResponse<T> = {
    success: true,
    message,
    data,
  };
  return res.status(statusCode).json(response);
}

/**
 * Send an error response
 */
export function sendError(
  res: Response,
  message: string,
  statusCode = 400,
  errors?: Record<string, string[]>
): Response {
  const response: ApiResponse = {
    success: false,
    message,
    errors,
  };
  return res.status(statusCode).json(response);
}

/**
 * Send a created response (201)
 */
export function sendCreated<T>(res: Response, data: T, message = "Created successfully"): Response {
  return sendSuccess(res, data, message, 201);
}

/**
 * Send a no content response (204)
 */
export function sendNoContent(res: Response): Response {
  return res.status(204).send();
}

/**
 * Send unauthorized response (401)
 */
export function sendUnauthorized(res: Response, message = "Unauthorized"): Response {
  return sendError(res, message, 401);
}

/**
 * Send forbidden response (403)
 */
export function sendForbidden(res: Response, message = "Forbidden"): Response {
  return sendError(res, message, 403);
}

/**
 * Send not found response (404)
 */
export function sendNotFound(res: Response, message = "Resource not found"): Response {
  return sendError(res, message, 404);
}

/**
 * Send internal server error response (500)
 */
export function sendServerError(res: Response, message = "Internal server error"): Response {
  return sendError(res, message, 500);
}
