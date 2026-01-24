import type { Response, NextFunction } from "express";
import * as storyService from "../services/story.service.js";
import { sendSuccess } from "../utils/response.js";
import type { AuthenticatedRequest } from "../types/index.js";
import type {
    CreateStoryInput,
    UpdateStoryInput,
    CreateStoryPageInput,
    UpdateStoryPageInput,
    StoryQueryInput,
} from "../validators/story.schemas.js";

/**
 * Create a new story
 * POST /api/stories
 */
export async function createStory(
    req: AuthenticatedRequest & { body: CreateStoryInput },
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        if (!req.user) {
            res.status(401).json({ success: false, message: "Unauthorized" });
            return;
        }

        const story = await storyService.createStory(req.user.userId, req.body);

        sendSuccess(res, { story }, "Story created successfully", 201);
    } catch (error) {
        next(error);
    }
}

/**
 * Get story by ID
 * GET /api/stories/:storyId
 */
export async function getStory(
    req: AuthenticatedRequest & { params: { storyId: string } },
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        if (!req.user) {
            res.status(401).json({ success: false, message: "Unauthorized" });
            return;
        }

        const story = await storyService.getStoryById(
            req.params.storyId,
            req.user.userId
        );

        if (!story) {
            res.status(404).json({ success: false, message: "Story not found" });
            return;
        }

        sendSuccess(res, { story }, "Story retrieved successfully");
    } catch (error) {
        next(error);
    }
}

/**
 * Get all stories for current user
 * GET /api/stories
 */
export async function getStories(
    req: AuthenticatedRequest & { query: StoryQueryInput },
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        if (!req.user) {
            res.status(401).json({ success: false, message: "Unauthorized" });
            return;
        }

        const result = await storyService.getStories(
            req.user.userId,
            req.query as StoryQueryInput
        );

        sendSuccess(
            res,
            {
                stories: result.stories,
                pagination: {
                    page: result.page,
                    limit: result.limit,
                    total: result.total,
                    totalPages: Math.ceil(result.total / result.limit),
                },
            },
            "Stories retrieved successfully"
        );
    } catch (error) {
        next(error);
    }
}

/**
 * Update a story
 * PATCH /api/stories/:storyId
 */
export async function updateStory(
    req: AuthenticatedRequest & {
        params: { storyId: string };
        body: UpdateStoryInput;
    },
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        if (!req.user) {
            res.status(401).json({ success: false, message: "Unauthorized" });
            return;
        }

        const story = await storyService.updateStory(
            req.params.storyId,
            req.user.userId,
            req.body
        );

        sendSuccess(res, { story }, "Story updated successfully");
    } catch (error) {
        next(error);
    }
}

/**
 * Delete a story
 * DELETE /api/stories/:storyId
 */
export async function deleteStory(
    req: AuthenticatedRequest & { params: { storyId: string } },
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        if (!req.user) {
            res.status(401).json({ success: false, message: "Unauthorized" });
            return;
        }

        await storyService.deleteStory(req.params.storyId, req.user.userId);

        sendSuccess(res, null, "Story deleted successfully");
    } catch (error) {
        next(error);
    }
}

/**
 * Add a page to a story
 * POST /api/stories/:storyId/pages
 */
export async function addStoryPage(
    req: AuthenticatedRequest & {
        params: { storyId: string };
        body: CreateStoryPageInput;
    },
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        if (!req.user) {
            res.status(401).json({ success: false, message: "Unauthorized" });
            return;
        }

        const page = await storyService.addStoryPage(
            req.params.storyId,
            req.user.userId,
            req.body
        );

        sendSuccess(res, { page }, "Page added successfully", 201);
    } catch (error) {
        next(error);
    }
}

/**
 * Get a story page
 * GET /api/stories/:storyId/pages/:pageId
 */
export async function getStoryPage(
    req: AuthenticatedRequest & {
        params: { storyId: string; pageId: string };
    },
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        if (!req.user) {
            res.status(401).json({ success: false, message: "Unauthorized" });
            return;
        }

        const page = await storyService.getStoryPageById(
            req.params.storyId,
            req.params.pageId,
            req.user.userId
        );

        if (!page) {
            res.status(404).json({ success: false, message: "Page not found" });
            return;
        }

        sendSuccess(res, { page }, "Page retrieved successfully");
    } catch (error) {
        next(error);
    }
}

/**
 * Update a story page
 * PATCH /api/stories/:storyId/pages/:pageId
 */
export async function updateStoryPage(
    req: AuthenticatedRequest & {
        params: { storyId: string; pageId: string };
        body: UpdateStoryPageInput;
    },
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        if (!req.user) {
            res.status(401).json({ success: false, message: "Unauthorized" });
            return;
        }

        const page = await storyService.updateStoryPage(
            req.params.storyId,
            req.params.pageId,
            req.user.userId,
            req.body
        );

        sendSuccess(res, { page }, "Page updated successfully");
    } catch (error) {
        next(error);
    }
}

/**
 * Delete a story page
 * DELETE /api/stories/:storyId/pages/:pageId
 */
export async function deleteStoryPage(
    req: AuthenticatedRequest & {
        params: { storyId: string; pageId: string };
    },
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        if (!req.user) {
            res.status(401).json({ success: false, message: "Unauthorized" });
            return;
        }

        await storyService.deleteStoryPage(
            req.params.storyId,
            req.params.pageId,
            req.user.userId
        );

        sendSuccess(res, null, "Page deleted successfully");
    } catch (error) {
        next(error);
    }
}

/**
 * Get story statistics
 * GET /api/stories/stats
 */
export async function getStoryStats(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        if (!req.user) {
            res.status(401).json({ success: false, message: "Unauthorized" });
            return;
        }

        const stats = await storyService.getStoryStats(req.user.userId);

        sendSuccess(res, { stats }, "Story statistics retrieved successfully");
    } catch (error) {
        next(error);
    }
}
