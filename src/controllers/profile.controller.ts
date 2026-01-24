import type { Response, NextFunction } from "express";
import type { AuthenticatedRequest } from "../types/index.js";
import * as profileService from "../services/profile.service.js";
import { sendSuccess } from "../utils/response.js";
import { profileQuerySchema } from "../validators/profile.schemas.js";

/**
 * Get User Profile with comprehensive stats
 * GET /api/profile
 */
export async function getProfile(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        if (!req.user) {
            res.status(401).json({ success: false, message: "Unauthorized" });
            return;
        }

        // Since we use validate middleware, rq.query should be somewhat validated, 
        // but validate middleware usually validates body/query/params separately.
        // The query params might need transformation (string -> number).
        // The schema does coerce, so validation handles it if attached.

        // However, req.query values are strings in Express.
        // We can parse it manually with the schema to get typed result
        const query = profileQuerySchema.parse(req.query);

        const profileData = await profileService.getUserProfile(req.user.userId, query);

        sendSuccess(res, profileData, "Profile retrieved successfully");
    } catch (error) {
        next(error);
    }
}
