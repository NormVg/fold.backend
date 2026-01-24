import { z } from "zod";

export const profileQuerySchema = z.object({
    // For Monthly Consistency Graph
    month: z.coerce.number().min(1).max(12).optional(), // Default: Current Month inside service
    year: z.coerce.number().min(2000).max(2100).optional(), // Default: Current Year

    // For Line Graph
    // "7d" = last 7 days (default)
    // "all-time" = since account creation
    // Or user can pass a number of days e.g. "30"
    graphPeriod: z.union([
        z.literal("all-time"),
        z.coerce.number().positive(),
    ]).optional().default(7),
});

export type ProfileQueryInput = z.infer<typeof profileQuerySchema>;
