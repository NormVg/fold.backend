import { z } from "zod";

// ============ Memory Schemas ============

export const moodEnum = z.enum(["v.sad", "sad", "normal", "happy", "v.happy"]);
export const visibilityEnum = z.enum(["private", "friends", "public"]);

export const createMemorySchema = z.object({
    mood: moodEnum,

    // Text (Mandatory)
    textContent: z.string().min(1, "Text content is required").max(10000),

    // Audio
    audioUrl: z.string().url("Invalid audio URL").optional(),
    audioDurationSec: z.number().int().positive().optional(),

    // Image
    imageUrl: z.string().url("Invalid image URL").optional(),
    imageWidth: z.number().int().positive().optional(),
    imageHeight: z.number().int().positive().optional(),

    // Video
    videoUrl: z.string().url("Invalid video URL").optional(),
    videoDurationSec: z.number().int().positive().optional(),

    // Location
    latitude: z.number().min(-90).max(90).optional(),
    longitude: z.number().min(-180).max(180).optional(),
    locationName: z.string().max(500).optional(),

    // Visibility
    visibility: visibilityEnum.optional().default("private"),
});

export const updateMemorySchema = z.object({
    mood: moodEnum.optional(),

    // Text
    textContent: z.string().min(1).max(10000).optional().nullable(),

    // Audio
    audioUrl: z.string().url("Invalid audio URL").optional().nullable(),
    audioDurationSec: z.number().int().positive().optional().nullable(),

    // Image
    imageUrl: z.string().url("Invalid image URL").optional().nullable(),
    imageWidth: z.number().int().positive().optional().nullable(),
    imageHeight: z.number().int().positive().optional().nullable(),

    // Video
    videoUrl: z.string().url("Invalid video URL").optional().nullable(),
    videoDurationSec: z.number().int().positive().optional().nullable(),

    // Location
    latitude: z.number().min(-90).max(90).optional().nullable(),
    longitude: z.number().min(-180).max(180).optional().nullable(),
    locationName: z.string().max(500).optional().nullable(),

    // Visibility
    visibility: visibilityEnum.optional(),
});

export const memoryIdParamSchema = z.object({
    memoryId: z.string().uuid("Invalid memory ID"),
});

export const memoryQuerySchema = z.object({
    page: z.string().optional().default("1").transform(Number).pipe(z.number().min(1)),
    limit: z.string().optional().default("20").transform(Number).pipe(z.number().min(1).max(100)),
    mood: moodEnum.optional(),
    visibility: visibilityEnum.optional(),
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
    sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
});

// Type exports
export type CreateMemoryInput = z.infer<typeof createMemorySchema>;
export type UpdateMemoryInput = z.infer<typeof updateMemorySchema>;
export type MemoryQueryInput = z.infer<typeof memoryQuerySchema>;
