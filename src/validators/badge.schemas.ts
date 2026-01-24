import { z } from "zod";

// ============ Badge Schemas ============

export const createBadgeSchema = z.object({
    name: z.string().min(1).max(255),
    slug: z
        .string()
        .min(1)
        .max(255)
        .regex(/^[a-z0-9-]+$/, "Slug must contain only lowercase letters, numbers, and hyphens"),
    description: z.string().max(1000).optional(),
    iconUrl: z.string().url("Invalid icon URL").optional(),
});

export const updateBadgeSchema = z.object({
    name: z.string().min(1).max(255).optional(),
    description: z.string().max(1000).optional().nullable(),
    iconUrl: z.string().url("Invalid icon URL").optional().nullable(),
});

export const badgeIdParamSchema = z.object({
    badgeId: z.string().uuid("Invalid badge ID"),
});

export const badgeQuerySchema = z.object({
    page: z.string().optional().default("1").transform(Number).pipe(z.number().min(1)),
    limit: z.string().optional().default("20").transform(Number).pipe(z.number().min(1).max(100)),
    sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
});

// Type exports
export type CreateBadgeInput = z.infer<typeof createBadgeSchema>;
export type UpdateBadgeInput = z.infer<typeof updateBadgeSchema>;
export type BadgeQueryInput = z.infer<typeof badgeQuerySchema>;
