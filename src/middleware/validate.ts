import type { Request, Response, NextFunction } from "express";
import { type ZodSchema, ZodError } from "zod";
import { sendError } from "../utils/response.js";

/**
 * Middleware factory for request validation using Zod schemas
 */
export function validate(schema: ZodSchema, source: "body" | "query" | "params" = "body") {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const data = schema.parse(req[source]);
      req[source] = data;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errors: Record<string, string[]> = {};

        error.issues.forEach((err) => {
          const path = err.path.join(".");
          if (!errors[path]) {
            errors[path] = [];
          }
          errors[path].push(err.message);
        });

        sendError(res, "Validation failed", 400, errors);
        return;
      }

      sendError(res, "Invalid request data", 400);
    }
  };
}

/**
 * Validate multiple sources at once
 */
export function validateMultiple(schemas: {
  body?: ZodSchema;
  query?: ZodSchema;
  params?: ZodSchema;
}) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      if (schemas.body) {
        req.body = schemas.body.parse(req.body);
      }
      if (schemas.query) {
        req.query = schemas.query.parse(req.query) as typeof req.query;
      }
      if (schemas.params) {
        req.params = schemas.params.parse(req.params) as typeof req.params;
      }
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errors: Record<string, string[]> = {};

        error.issues.forEach((err) => {
          const path = err.path.join(".");
          if (!errors[path]) {
            errors[path] = [];
          }
          errors[path].push(err.message);
        });

        sendError(res, "Validation failed", 400, errors);
        return;
      }

      sendError(res, "Invalid request data", 400);
    }
  };
}
