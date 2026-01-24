import { prisma } from "../config/database.js";
import { AppError } from "../middleware/errorHandler.js";
import type {
    CreateMemoryInput,
    UpdateMemoryInput,
    MemoryQueryInput,
} from "../validators/memory.schemas.js";
import type { Memory } from "../generated/prisma/client.js";

// Memory data returned
const memorySelectFields = {
    id: true,
    userId: true,
    mood: true,
    textContent: true,
    audioUrl: true,
    audioDurationSec: true,
    imageUrl: true,
    imageWidth: true,
    imageHeight: true,
    videoUrl: true,
    videoDurationSec: true,
    latitude: true,
    longitude: true,
    locationName: true,
    visibility: true,
    createdAt: true,
    updatedAt: true,
};

export type MemoryData = Memory;

/**
 * Create a new memory
 */
export async function createMemory(
    userId: string,
    data: CreateMemoryInput
): Promise<MemoryData> {
    const memory = await prisma.memory.create({
        data: {
            userId,
            mood: data.mood,
            textContent: data.textContent,
            audioUrl: data.audioUrl,
            audioDurationSec: data.audioDurationSec,
            imageUrl: data.imageUrl,
            imageWidth: data.imageWidth,
            imageHeight: data.imageHeight,
            videoUrl: data.videoUrl,
            videoDurationSec: data.videoDurationSec,
            latitude: data.latitude,
            longitude: data.longitude,
            locationName: data.locationName,
            visibility: data.visibility,
        },
        select: memorySelectFields,
    });

    return memory as MemoryData;
}

/**
 * Get memory by ID
 */
export async function getMemoryById(
    memoryId: string,
    userId: string
): Promise<MemoryData | null> {
    const memory = await prisma.memory.findFirst({
        where: {
            id: memoryId,
            userId,
        },
        select: memorySelectFields,
    });

    return memory as MemoryData | null;
}

/**
 * Get all memories for a user with pagination and filters
 */
export async function getMemories(
    userId: string,
    query: MemoryQueryInput
): Promise<{ memories: MemoryData[]; total: number; page: number; limit: number }> {
    const { page, limit, mood, visibility, startDate, endDate, sortOrder } = query;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = { userId };

    if (mood) {
        where.mood = mood;
    }

    if (visibility) {
        where.visibility = visibility;
    }

    if (startDate || endDate) {
        where.createdAt = {};
        if (startDate) {
            (where.createdAt as Record<string, Date>).gte = new Date(startDate);
        }
        if (endDate) {
            (where.createdAt as Record<string, Date>).lte = new Date(endDate);
        }
    }

    const [memories, total] = await Promise.all([
        prisma.memory.findMany({
            where,
            select: memorySelectFields,
            orderBy: { createdAt: sortOrder },
            skip,
            take: limit,
        }),
        prisma.memory.count({ where }),
    ]);

    return { memories: memories as MemoryData[], total, page, limit };
}

/**
 * Update a memory
 */
export async function updateMemory(
    memoryId: string,
    userId: string,
    data: UpdateMemoryInput
): Promise<MemoryData> {
    const memory = await prisma.memory.findFirst({
        where: { id: memoryId, userId },
    });

    if (!memory) {
        throw new AppError("Memory not found", 404);
    }

    const updateData: Record<string, unknown> = {};

    if (data.mood !== undefined) updateData.mood = data.mood;
    if (data.textContent !== undefined) updateData.textContent = data.textContent;
    if (data.audioUrl !== undefined) updateData.audioUrl = data.audioUrl;
    if (data.audioDurationSec !== undefined) updateData.audioDurationSec = data.audioDurationSec;
    if (data.imageUrl !== undefined) updateData.imageUrl = data.imageUrl;
    if (data.imageWidth !== undefined) updateData.imageWidth = data.imageWidth;
    if (data.imageHeight !== undefined) updateData.imageHeight = data.imageHeight;
    if (data.videoUrl !== undefined) updateData.videoUrl = data.videoUrl;
    if (data.videoDurationSec !== undefined) updateData.videoDurationSec = data.videoDurationSec;
    if (data.latitude !== undefined) updateData.latitude = data.latitude;
    if (data.longitude !== undefined) updateData.longitude = data.longitude;
    if (data.locationName !== undefined) updateData.locationName = data.locationName;
    if (data.visibility !== undefined) updateData.visibility = data.visibility;

    const updatedMemory = await prisma.memory.update({
        where: { id: memoryId },
        data: updateData,
        select: memorySelectFields,
    });

    return updatedMemory as MemoryData;
}

/**
 * Delete a memory
 */
export async function deleteMemory(memoryId: string, userId: string): Promise<void> {
    const memory = await prisma.memory.findFirst({
        where: { id: memoryId, userId },
    });

    if (!memory) {
        throw new AppError("Memory not found", 404);
    }

    await prisma.memory.delete({
        where: { id: memoryId },
    });
}

/**
 * Get memory statistics for a user
 */
export async function getMemoryStats(userId: string) {
    const [total, byMood, byVisibility] = await Promise.all([
        prisma.memory.count({ where: { userId } }),
        prisma.memory.groupBy({
            by: ["mood"],
            where: { userId },
            _count: { mood: true },
        }),
        prisma.memory.groupBy({
            by: ["visibility"],
            where: { userId },
            _count: { visibility: true },
        }),
    ]);

    const moodStats = byMood.reduce(
        (acc: Record<string, number>, item: { mood: string; _count: { mood: number } }) => {
            acc[item.mood] = item._count.mood;
            return acc;
        },
        {} as Record<string, number>
    );

    const visibilityStats = byVisibility.reduce(
        (acc: Record<string, number>, item: { visibility: string; _count: { visibility: number } }) => {
            acc[item.visibility] = item._count.visibility;
            return acc;
        },
        {} as Record<string, number>
    );

    return {
        total,
        byMood: moodStats,
        byVisibility: visibilityStats,
    };
}
