import type { Response, NextFunction } from "express";
import * as badgeService from "../services/badge.service.js";
import { sendSuccess } from "../utils/response.js";
import type { AuthenticatedRequest } from "../types/index.js";
import type {
    CreateBadgeInput,
    UpdateBadgeInput,
    BadgeQueryInput,
} from "../validators/badge.schemas.js";

/**
 * Create a new badge
 * POST /api/badges
 */
export async function createBadge(
    req: AuthenticatedRequest & { body: CreateBadgeInput },
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        if (!req.user) {
            res.status(401).json({ success: false, message: "Unauthorized" });
            return;
        }

        const badge = await badgeService.createBadge(req.user.userId, req.body);

        sendSuccess(res, { badge }, "Badge created successfully", 201);
    } catch (error) {
        next(error);
    }
}

/**
 * Get badge by ID
 * GET /api/badges/:badgeId
 */
export async function getBadge(
    req: AuthenticatedRequest & { params: { badgeId: string } },
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        if (!req.user) {
            res.status(401).json({ success: false, message: "Unauthorized" });
            return;
        }

        const badge = await badgeService.getBadgeById(req.params.badgeId);

        if (!badge) {
            res.status(404).json({ success: false, message: "Badge not found" });
            return;
        }

        sendSuccess(res, { badge }, "Badge retrieved successfully");
    } catch (error) {
        next(error);
    }
}

/**
 * Get all badges for current user
 * GET /api/badges
 */
export async function getBadges(
    req: AuthenticatedRequest & { query: BadgeQueryInput },
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        if (!req.user) {
            res.status(401).json({ success: false, message: "Unauthorized" });
            return;
        }

        const result = await badgeService.getBadges(
            req.user.userId,
            req.query as BadgeQueryInput
        );

        sendSuccess(
            res,
            {
                badges: result.badges,
                pagination: {
                    page: result.page,
                    limit: result.limit,
                    total: result.total,
                    totalPages: Math.ceil(result.total / result.limit),
                },
            },
            "Badges retrieved successfully"
        );
    } catch (error) {
        next(error);
    }
}

/**
 * Update a badge
 * PATCH /api/badges/:badgeId
 */
export async function updateBadge(
    req: AuthenticatedRequest & {
        params: { badgeId: string };
        body: UpdateBadgeInput;
    },
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        if (!req.user) {
            res.status(401).json({ success: false, message: "Unauthorized" });
            return;
        }

        const badge = await badgeService.updateBadge(
            req.params.badgeId,
            req.user.userId,
            req.body
        );

        sendSuccess(res, { badge }, "Badge updated successfully");
    } catch (error) {
        next(error);
    }
}

/**
 * Delete a badge
 * DELETE /api/badges/:badgeId
 */
export async function deleteBadge(
    req: AuthenticatedRequest & { params: { badgeId: string } },
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        if (!req.user) {
            res.status(401).json({ success: false, message: "Unauthorized" });
            return;
        }

        await badgeService.deleteBadge(req.params.badgeId, req.user.userId);

        sendSuccess(res, null, "Badge deleted successfully");
    } catch (error) {
        next(error);
    }
}

/**
 * Get badge statistics
 * GET /api/badges/stats
 */
export async function getBadgeStats(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        if (!req.user) {
            res.status(401).json({ success: false, message: "Unauthorized" });
            return;
        }

        const stats = await badgeService.getBadgeStats(req.user.userId);

        sendSuccess(res, { stats }, "Badge statistics retrieved successfully");
    } catch (error) {
        next(error);
    }
}
