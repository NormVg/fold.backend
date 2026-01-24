import { z } from "zod";

// ============ Story Schemas ============

export const visibilityEnum = z.enum(["private", "friends", "public"]);

// Story Page Media Schemas
export const storyPageVideoSchema = z.object({
    videoUrl: z.string().url("Invalid video URL"),
    videoDurationSec: z.number().int().positive().optional(),
});

export const storyPageAudioSchema = z.object({
    audioUrl: z.string().url("Invalid audio URL"),
    audioDurationSec: z.number().int().positive().optional(),
});

export const storyPageImageSchema = z.object({
    imageUrl: z.string().url("Invalid image URL"),
    imageSize: z.number().int().positive().optional(),
});

// Story Page Schema
export const createStoryPageSchema = z.object({
    pageText: z.string().max(50000).optional(),
    pageNumber: z.number().int().positive(),
    videos: z.array(storyPageVideoSchema).optional(),
    audios: z.array(storyPageAudioSchema).optional(),
    images: z.array(storyPageImageSchema).optional(),
});

export const updateStoryPageSchema = z.object({
    pageText: z.string().max(50000).optional().nullable(),
    videos: z.array(storyPageVideoSchema).optional(),
    audios: z.array(storyPageAudioSchema).optional(),
    images: z.array(storyPageImageSchema).optional(),
});

// Story Schemas
export const createStorySchema = z.object({
    title: z.string().min(1).max(500).optional(),
    visibility: visibilityEnum.optional().default("private"),
    pages: z.array(createStoryPageSchema).optional(),
});

export const updateStorySchema = z.object({
    title: z.string().min(1).max(500).optional().nullable(),
    visibility: visibilityEnum.optional(),
});

export const storyIdParamSchema = z.object({
    storyId: z.string().uuid("Invalid story ID"),
});

export const storyPageIdParamSchema = z.object({
    storyId: z.string().uuid("Invalid story ID"),
    pageId: z.string().uuid("Invalid page ID"),
});

export const storyQuerySchema = z.object({
    page: z.string().optional().default("1").transform(Number).pipe(z.number().min(1)),
    limit: z.string().optional().default("20").transform(Number).pipe(z.number().min(1).max(100)),
    visibility: visibilityEnum.optional(),
    sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
});

// Type exports
export type CreateStoryInput = z.infer<typeof createStorySchema>;
export type UpdateStoryInput = z.infer<typeof updateStorySchema>;
export type CreateStoryPageInput = z.infer<typeof createStoryPageSchema>;
export type UpdateStoryPageInput = z.infer<typeof updateStoryPageSchema>;
export type StoryQueryInput = z.infer<typeof storyQuerySchema>;
export type StoryPageVideoInput = z.infer<typeof storyPageVideoSchema>;
export type StoryPageAudioInput = z.infer<typeof storyPageAudioSchema>;
export type StoryPageImageInput = z.infer<typeof storyPageImageSchema>;
