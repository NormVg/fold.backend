import { Router } from "express";
import * as storyController from "../controllers/story.controller.js";
import { authenticate } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import {
    createStorySchema,
    updateStorySchema,
    createStoryPageSchema,
    updateStoryPageSchema,
    storyIdParamSchema,
    storyPageIdParamSchema,
    storyQuerySchema,
} from "../validators/story.schemas.js";

const router = Router();

// All routes require authentication
router.use(authenticate);

// ============ Story Routes ============

/**
 * @route   GET /api/stories/stats
 * @desc    Get story statistics
 * @access  Private
 */
router.get("/stats", storyController.getStoryStats);

/**
 * @route   POST /api/stories
 * @desc    Create a new story
 * @access  Private
 */
router.post("/", validate(createStorySchema), storyController.createStory);

/**
 * @route   GET /api/stories
 * @desc    Get all stories for current user
 * @access  Private
 */
router.get("/", validate(storyQuerySchema, "query"), storyController.getStories);

/**
 * @route   GET /api/stories/:storyId
 * @desc    Get a specific story with pages
 * @access  Private
 */
router.get(
    "/:storyId",
    validate(storyIdParamSchema, "params"),
    storyController.getStory
);

/**
 * @route   PATCH /api/stories/:storyId
 * @desc    Update a story
 * @access  Private
 */
router.patch(
    "/:storyId",
    validate(storyIdParamSchema, "params"),
    validate(updateStorySchema),
    storyController.updateStory
);

/**
 * @route   DELETE /api/stories/:storyId
 * @desc    Delete a story
 * @access  Private
 */
router.delete(
    "/:storyId",
    validate(storyIdParamSchema, "params"),
    storyController.deleteStory
);

// ============ Story Page Routes ============

/**
 * @route   POST /api/stories/:storyId/pages
 * @desc    Add a page to a story
 * @access  Private
 */
router.post(
    "/:storyId/pages",
    validate(storyIdParamSchema, "params"),
    validate(createStoryPageSchema),
    storyController.addStoryPage
);

/**
 * @route   GET /api/stories/:storyId/pages/:pageId
 * @desc    Get a story page
 * @access  Private
 */
router.get(
    "/:storyId/pages/:pageId",
    validate(storyPageIdParamSchema, "params"),
    storyController.getStoryPage
);

/**
 * @route   PATCH /api/stories/:storyId/pages/:pageId
 * @desc    Update a story page
 * @access  Private
 */
router.patch(
    "/:storyId/pages/:pageId",
    validate(storyPageIdParamSchema, "params"),
    validate(updateStoryPageSchema),
    storyController.updateStoryPage
);

/**
 * @route   DELETE /api/stories/:storyId/pages/:pageId
 * @desc    Delete a story page
 * @access  Private
 */
router.delete(
    "/:storyId/pages/:pageId",
    validate(storyPageIdParamSchema, "params"),
    storyController.deleteStoryPage
);

export default router;
