import { prisma } from "../config/database.js";
import { AppError } from "../middleware/errorHandler.js";
import type {
    CreateBadgeInput,
    UpdateBadgeInput,
    BadgeQueryInput,
} from "../validators/badge.schemas.js";

// Badge select fields
const badgeSelectFields = {
    id: true,
    userId: true,
    name: true,
    slug: true,
    description: true,
    iconUrl: true,
    createdAt: true,
    updatedAt: true,
};

export type BadgeData = {
    id: string;
    userId: string;
    name: string;
    slug: string;
    description: string | null;
    iconUrl: string | null;
    createdAt: Date;
    updatedAt: Date;
};

/**
 * Create a new badge
 */
export async function createBadge(
    userId: string,
    data: CreateBadgeInput
): Promise<BadgeData> {
    // Check if slug already exists
    const existingBadge = await prisma.badge.findUnique({
        where: { slug: data.slug },
    });

    if (existingBadge) {
        throw new AppError("Badge with this slug already exists", 409);
    }

    const badge = await prisma.badge.create({
        data: {
            userId,
            name: data.name,
            slug: data.slug,
            description: data.description,
            iconUrl: data.iconUrl,
        },
        select: badgeSelectFields,
    });

    return badge;
}

/**
 * Get badge by ID
 */
export async function getBadgeById(badgeId: string): Promise<BadgeData | null> {
    const badge = await prisma.badge.findUnique({
        where: { id: badgeId },
        select: badgeSelectFields,
    });

    return badge;
}

/**
 * Get badge by slug
 */
export async function getBadgeBySlug(slug: string): Promise<BadgeData | null> {
    const badge = await prisma.badge.findUnique({
        where: { slug },
        select: badgeSelectFields,
    });

    return badge;
}

/**
 * Get all badges for a user with pagination
 */
export async function getBadges(
    userId: string,
    query: BadgeQueryInput
): Promise<{ badges: BadgeData[]; total: number; page: number; limit: number }> {
    const { page, limit, sortOrder } = query;
    const skip = (page - 1) * limit;

    const where = { userId };

    const [badges, total] = await Promise.all([
        prisma.badge.findMany({
            where,
            select: badgeSelectFields,
            orderBy: { createdAt: sortOrder },
            skip,
            take: limit,
        }),
        prisma.badge.count({ where }),
    ]);

    return { badges, total, page, limit };
}

/**
 * Update a badge
 */
export async function updateBadge(
    badgeId: string,
    userId: string,
    data: UpdateBadgeInput
): Promise<BadgeData> {
    const badge = await prisma.badge.findFirst({
        where: { id: badgeId, userId },
    });

    if (!badge) {
        throw new AppError("Badge not found", 404);
    }

    const updateData: Record<string, unknown> = {};

    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.iconUrl !== undefined) updateData.iconUrl = data.iconUrl;

    const updatedBadge = await prisma.badge.update({
        where: { id: badgeId },
        data: updateData,
        select: badgeSelectFields,
    });

    return updatedBadge;
}

/**
 * Delete a badge
 */
export async function deleteBadge(badgeId: string, userId: string): Promise<void> {
    const badge = await prisma.badge.findFirst({
        where: { id: badgeId, userId },
    });

    if (!badge) {
        throw new AppError("Badge not found", 404);
    }

    await prisma.badge.delete({
        where: { id: badgeId },
    });
}

/**
 * Award a badge to a user (for admin use or system events)
 */
export async function awardBadge(
    userId: string,
    badgeSlug: string,
    badgeData: { name: string; description?: string; iconUrl?: string }
): Promise<BadgeData> {
    // Check if user already has this badge
    const existingBadge = await prisma.badge.findFirst({
        where: { userId, slug: badgeSlug },
    });

    if (existingBadge) {
        throw new AppError("User already has this badge", 409);
    }

    const badge = await prisma.badge.create({
        data: {
            userId,
            slug: badgeSlug,
            name: badgeData.name,
            description: badgeData.description,
            iconUrl: badgeData.iconUrl,
        },
        select: badgeSelectFields,
    });

    return badge;
}

/**
 * Get badge statistics for a user
 */
export async function getBadgeStats(userId: string) {
    const total = await prisma.badge.count({ where: { userId } });

    const recentBadges = await prisma.badge.findMany({
        where: { userId },
        select: badgeSelectFields,
        orderBy: { createdAt: "desc" },
        take: 5,
    });

    return {
        total,
        recentBadges,
    };
}
