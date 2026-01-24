import { Router } from "express";
import * as memoryController from "../controllers/memory.controller.js";
import { authenticate } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import {
    createMemorySchema,
    updateMemorySchema,
    memoryIdParamSchema,
    memoryQuerySchema,
} from "../validators/memory.schemas.js";

const router = Router();

// All routes require authentication
router.use(authenticate);

// ============ Memory Routes ============

/**
 * @route   GET /api/memories/stats
 * @desc    Get memory statistics
 * @access  Private
 */
router.get("/stats", memoryController.getMemoryStats);

/**
 * @route   POST /api/memories
 * @desc    Create a new memory
 * @access  Private
 */
router.post("/", validate(createMemorySchema), memoryController.createMemory);

/**
 * @route   GET /api/memories
 * @desc    Get all memories for current user
 * @access  Private
 */
router.get("/", validate(memoryQuerySchema, "query"), memoryController.getMemories);

/**
 * @route   GET /api/memories/:memoryId
 * @desc    Get a specific memory
 * @access  Private
 */
router.get(
    "/:memoryId",
    validate(memoryIdParamSchema, "params"),
    memoryController.getMemory
);

/**
 * @route   PATCH /api/memories/:memoryId
 * @desc    Update a memory
 * @access  Private
 */
router.patch(
    "/:memoryId",
    validate(memoryIdParamSchema, "params"),
    validate(updateMemorySchema),
    memoryController.updateMemory
);

/**
 * @route   DELETE /api/memories/:memoryId
 * @desc    Delete a memory
 * @access  Private
 */
router.delete(
    "/:memoryId",
    validate(memoryIdParamSchema, "params"),
    memoryController.deleteMemory
);

export default router;
