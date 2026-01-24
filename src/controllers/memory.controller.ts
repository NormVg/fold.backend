import type { Response, NextFunction } from "express";
import * as memoryService from "../services/memory.service.js";
import { sendSuccess } from "../utils/response.js";
import type { AuthenticatedRequest } from "../types/index.js";
import type {
    CreateMemoryInput,
    UpdateMemoryInput,
    MemoryQueryInput,
} from "../validators/memory.schemas.js";

/**
 * Create a new memory
 * POST /api/memories
 */
export async function createMemory(
    req: AuthenticatedRequest & { body: CreateMemoryInput },
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        if (!req.user) {
            res.status(401).json({ success: false, message: "Unauthorized" });
            return;
        }

        const memory = await memoryService.createMemory(req.user.userId, req.body);

        sendSuccess(res, { memory }, "Memory created successfully", 201);
    } catch (error) {
        next(error);
    }
}

/**
 * Get memory by ID
 * GET /api/memories/:memoryId
 */
export async function getMemory(
    req: AuthenticatedRequest & { params: { memoryId: string } },
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        if (!req.user) {
            res.status(401).json({ success: false, message: "Unauthorized" });
            return;
        }

        const memory = await memoryService.getMemoryById(
            req.params.memoryId,
            req.user.userId
        );

        if (!memory) {
            res.status(404).json({ success: false, message: "Memory not found" });
            return;
        }

        sendSuccess(res, { memory }, "Memory retrieved successfully");
    } catch (error) {
        next(error);
    }
}

/**
 * Get all memories for current user
 * GET /api/memories
 */
export async function getMemories(
    req: AuthenticatedRequest & { query: MemoryQueryInput },
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        if (!req.user) {
            res.status(401).json({ success: false, message: "Unauthorized" });
            return;
        }

        const result = await memoryService.getMemories(
            req.user.userId,
            req.query as MemoryQueryInput
        );

        sendSuccess(
            res,
            {
                memories: result.memories,
                pagination: {
                    page: result.page,
                    limit: result.limit,
                    total: result.total,
                    totalPages: Math.ceil(result.total / result.limit),
                },
            },
            "Memories retrieved successfully"
        );
    } catch (error) {
        next(error);
    }
}

/**
 * Update a memory
 * PATCH /api/memories/:memoryId
 */
export async function updateMemory(
    req: AuthenticatedRequest & {
        params: { memoryId: string };
        body: UpdateMemoryInput;
    },
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        if (!req.user) {
            res.status(401).json({ success: false, message: "Unauthorized" });
            return;
        }

        const memory = await memoryService.updateMemory(
            req.params.memoryId,
            req.user.userId,
            req.body
        );

        sendSuccess(res, { memory }, "Memory updated successfully");
    } catch (error) {
        next(error);
    }
}

/**
 * Delete a memory
 * DELETE /api/memories/:memoryId
 */
export async function deleteMemory(
    req: AuthenticatedRequest & { params: { memoryId: string } },
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        if (!req.user) {
            res.status(401).json({ success: false, message: "Unauthorized" });
            return;
        }

        await memoryService.deleteMemory(req.params.memoryId, req.user.userId);

        sendSuccess(res, null, "Memory deleted successfully");
    } catch (error) {
        next(error);
    }
}

/**
 * Get memory statistics
 * GET /api/memories/stats
 */
export async function getMemoryStats(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        if (!req.user) {
            res.status(401).json({ success: false, message: "Unauthorized" });
            return;
        }

        const stats = await memoryService.getMemoryStats(req.user.userId);

        sendSuccess(res, { stats }, "Memory statistics retrieved successfully");
    } catch (error) {
        next(error);
    }
}
