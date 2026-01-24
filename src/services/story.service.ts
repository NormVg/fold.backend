import { prisma } from "../config/database.js";
import { AppError } from "../middleware/errorHandler.js";
import type {
    CreateStoryInput,
    UpdateStoryInput,
    CreateStoryPageInput,
    UpdateStoryPageInput,
    StoryQueryInput,
} from "../validators/story.schemas.js";

// Story select fields with nested pages and media
const storySelectFields = {
    id: true,
    userId: true,
    title: true,
    visibility: true,
    createdAt: true,
    updatedAt: true,
    pages: {
        select: {
            id: true,
            pageText: true,
            pageNumber: true,
            isAttachedVideos: true,
            isAttachedImages: true,
            isAttachedAudios: true,
            videos: {
                select: {
                    id: true,
                    videoUrl: true,
                    videoDurationSec: true,
                },
            },
            audios: {
                select: {
                    id: true,
                    audioUrl: true,
                    audioDurationSec: true,
                },
            },
            images: {
                select: {
                    id: true,
                    imageUrl: true,
                    imageSize: true,
                },
            },
        },
        orderBy: { pageNumber: "asc" as const },
    },
};

const storyListSelectFields = {
    id: true,
    userId: true,
    title: true,
    visibility: true,
    createdAt: true,
    updatedAt: true,
    _count: {
        select: { pages: true },
    },
};

export type StoryPageData = {
    id: string;
    pageText: string | null;
    pageNumber: number;
    isAttachedVideos: boolean;
    isAttachedImages: boolean;
    isAttachedAudios: boolean;
    videos: Array<{ id: string; videoUrl: string; videoDurationSec: number | null }>;
    audios: Array<{ id: string; audioUrl: string; audioDurationSec: number | null }>;
    images: Array<{ id: string; imageUrl: string; imageSize: number | null }>;
};

export type StoryData = {
    id: string;
    userId: string;
    title: string | null;
    visibility: string;
    createdAt: Date;
    updatedAt: Date;
    pages: StoryPageData[];
};

export type StoryListData = {
    id: string;
    userId: string;
    title: string | null;
    visibility: string;
    createdAt: Date;
    updatedAt: Date;
    _count: { pages: number };
};

/**
 * Create a new story with optional pages
 */
export async function createStory(
    userId: string,
    data: CreateStoryInput
): Promise<StoryData> {
    const story = await prisma.story.create({
        data: {
            userId,
            title: data.title,
            visibility: data.visibility,
            pages: data.pages
                ? {
                    create: data.pages.map((page) => ({
                        pageText: page.pageText,
                        pageNumber: page.pageNumber,
                        isAttachedVideos: (page.videos?.length ?? 0) > 0,
                        isAttachedImages: (page.images?.length ?? 0) > 0,
                        isAttachedAudios: (page.audios?.length ?? 0) > 0,
                        videos: page.videos
                            ? { create: page.videos }
                            : undefined,
                        audios: page.audios
                            ? { create: page.audios }
                            : undefined,
                        images: page.images
                            ? { create: page.images }
                            : undefined,
                    })),
                }
                : undefined,
        },
        select: storySelectFields,
    });

    return story as StoryData;
}

/**
 * Get story by ID
 */
export async function getStoryById(
    storyId: string,
    userId: string
): Promise<StoryData | null> {
    const story = await prisma.story.findFirst({
        where: {
            id: storyId,
            userId,
        },
        select: storySelectFields,
    });

    return story as StoryData | null;
}

/**
 * Get all stories for a user with pagination
 */
export async function getStories(
    userId: string,
    query: StoryQueryInput
): Promise<{ stories: StoryListData[]; total: number; page: number; limit: number }> {
    const { page, limit, visibility, sortOrder } = query;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = { userId };

    if (visibility) {
        where.visibility = visibility;
    }

    const [stories, total] = await Promise.all([
        prisma.story.findMany({
            where,
            select: storyListSelectFields,
            orderBy: { createdAt: sortOrder },
            skip,
            take: limit,
        }),
        prisma.story.count({ where }),
    ]);

    return { stories, total, page, limit };
}

/**
 * Update a story
 */
export async function updateStory(
    storyId: string,
    userId: string,
    data: UpdateStoryInput
): Promise<StoryData> {
    const story = await prisma.story.findFirst({
        where: { id: storyId, userId },
    });

    if (!story) {
        throw new AppError("Story not found", 404);
    }

    const updateData: Record<string, unknown> = {};

    if (data.title !== undefined) updateData.title = data.title;
    if (data.visibility !== undefined) updateData.visibility = data.visibility;

    const updatedStory = await prisma.story.update({
        where: { id: storyId },
        data: updateData,
        select: storySelectFields,
    });

    return updatedStory as StoryData;
}

/**
 * Delete a story
 */
export async function deleteStory(storyId: string, userId: string): Promise<void> {
    const story = await prisma.story.findFirst({
        where: { id: storyId, userId },
    });

    if (!story) {
        throw new AppError("Story not found", 404);
    }

    await prisma.story.delete({
        where: { id: storyId },
    });
}

/**
 * Add a page to a story
 */
export async function addStoryPage(
    storyId: string,
    userId: string,
    data: CreateStoryPageInput
): Promise<StoryPageData> {
    const story = await prisma.story.findFirst({
        where: { id: storyId, userId },
    });

    if (!story) {
        throw new AppError("Story not found", 404);
    }

    // Check if page number already exists
    const existingPage = await prisma.storyPage.findUnique({
        where: {
            storyId_pageNumber: {
                storyId,
                pageNumber: data.pageNumber,
            },
        },
    });

    if (existingPage) {
        throw new AppError("Page number already exists", 409);
    }

    const page = await prisma.storyPage.create({
        data: {
            storyId,
            pageText: data.pageText,
            pageNumber: data.pageNumber,
            isAttachedVideos: (data.videos?.length ?? 0) > 0,
            isAttachedImages: (data.images?.length ?? 0) > 0,
            isAttachedAudios: (data.audios?.length ?? 0) > 0,
            videos: data.videos ? { create: data.videos } : undefined,
            audios: data.audios ? { create: data.audios } : undefined,
            images: data.images ? { create: data.images } : undefined,
        },
        select: {
            id: true,
            pageText: true,
            pageNumber: true,
            isAttachedVideos: true,
            isAttachedImages: true,
            isAttachedAudios: true,
            videos: {
                select: { id: true, videoUrl: true, videoDurationSec: true },
            },
            audios: {
                select: { id: true, audioUrl: true, audioDurationSec: true },
            },
            images: {
                select: { id: true, imageUrl: true, imageSize: true },
            },
        },
    });

    return page;
}

/**
 * Get story page by ID
 */
export async function getStoryPageById(
    storyId: string,
    pageId: string,
    userId: string
): Promise<StoryPageData | null> {
    const story = await prisma.story.findFirst({
        where: { id: storyId, userId },
    });

    if (!story) {
        throw new AppError("Story not found", 404);
    }

    const page = await prisma.storyPage.findFirst({
        where: { id: pageId, storyId },
        select: {
            id: true,
            pageText: true,
            pageNumber: true,
            isAttachedVideos: true,
            isAttachedImages: true,
            isAttachedAudios: true,
            videos: {
                select: { id: true, videoUrl: true, videoDurationSec: true },
            },
            audios: {
                select: { id: true, audioUrl: true, audioDurationSec: true },
            },
            images: {
                select: { id: true, imageUrl: true, imageSize: true },
            },
        },
    });

    return page;
}

/**
 * Update a story page
 */
export async function updateStoryPage(
    storyId: string,
    pageId: string,
    userId: string,
    data: UpdateStoryPageInput
): Promise<StoryPageData> {
    // Verify story belongs to user
    const story = await prisma.story.findFirst({
        where: { id: storyId, userId },
    });

    if (!story) {
        throw new AppError("Story not found", 404);
    }

    const page = await prisma.storyPage.findFirst({
        where: { id: pageId, storyId },
    });

    if (!page) {
        throw new AppError("Page not found", 404);
    }

    // Use transaction to update page and replace media
    const updatedPage = await prisma.$transaction(async (tx) => {
        // Delete existing media if new media is provided
        if (data.videos !== undefined) {
            await tx.storyPageVideo.deleteMany({ where: { storyPageId: pageId } });
        }
        if (data.audios !== undefined) {
            await tx.storyPageAudio.deleteMany({ where: { storyPageId: pageId } });
        }
        if (data.images !== undefined) {
            await tx.storyPageImage.deleteMany({ where: { storyPageId: pageId } });
        }

        // Update page
        return tx.storyPage.update({
            where: { id: pageId },
            data: {
                pageText: data.pageText !== undefined ? data.pageText : page.pageText,
                isAttachedVideos: data.videos !== undefined ? data.videos.length > 0 : page.isAttachedVideos,
                isAttachedImages: data.images !== undefined ? data.images.length > 0 : page.isAttachedImages,
                isAttachedAudios: data.audios !== undefined ? data.audios.length > 0 : page.isAttachedAudios,
                videos: data.videos ? { create: data.videos } : undefined,
                audios: data.audios ? { create: data.audios } : undefined,
                images: data.images ? { create: data.images } : undefined,
            },
            select: {
                id: true,
                pageText: true,
                pageNumber: true,
                isAttachedVideos: true,
                isAttachedImages: true,
                isAttachedAudios: true,
                videos: {
                    select: { id: true, videoUrl: true, videoDurationSec: true },
                },
                audios: {
                    select: { id: true, audioUrl: true, audioDurationSec: true },
                },
                images: {
                    select: { id: true, imageUrl: true, imageSize: true },
                },
            },
        });
    });

    return updatedPage;
}

/**
 * Delete a story page
 */
export async function deleteStoryPage(
    storyId: string,
    pageId: string,
    userId: string
): Promise<void> {
    const story = await prisma.story.findFirst({
        where: { id: storyId, userId },
    });

    if (!story) {
        throw new AppError("Story not found", 404);
    }

    const page = await prisma.storyPage.findFirst({
        where: { id: pageId, storyId },
    });

    if (!page) {
        throw new AppError("Page not found", 404);
    }

    await prisma.storyPage.delete({
        where: { id: pageId },
    });
}

/**
 * Get story statistics for a user
 */
export async function getStoryStats(userId: string) {
    const [totalStories, totalPages, byVisibility] = await Promise.all([
        prisma.story.count({ where: { userId } }),
        prisma.storyPage.count({
            where: { story: { userId } },
        }),
        prisma.story.groupBy({
            by: ["visibility"],
            where: { userId },
            _count: { visibility: true },
        }),
    ]);

    const visibilityStats = byVisibility.reduce(
        (acc: Record<string, number>, item: { visibility: string; _count: { visibility: number } }) => {
            acc[item.visibility] = item._count.visibility;
            return acc;
        },
        {} as Record<string, number>
    );

    return {
        totalStories,
        totalPages,
        byVisibility: visibilityStats,
    };
}
