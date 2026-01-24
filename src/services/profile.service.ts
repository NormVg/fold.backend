import { prisma } from "../config/database.js";
import { AppError } from "../middleware/errorHandler.js";
import type { ProfileQueryInput } from "../validators/profile.schemas.js";

type DailyMood = {
    date: string;
    averageMood: number | null;
    totalPosts: number;
};

/**
 * Get full user profile with aggregated stats and graphs
 */
export async function getUserProfile(userId: string, query: ProfileQueryInput) {
    // 1. Fetch User Details
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
            email: true,
            name: true,
            avatarUrl: true,
            createdAt: true,
        },
    });

    if (!user) throw new AppError("User not found", 404);

    // 2. Parallel Fetching of Raw Data for Stats
    // We fetch counts and sums directly from DB where possible
    const [
        memoryStats,
        memoryDates,
        storyDates,
        storyPageVideoStats,
        storyPageAudioStats,
        storyPageImageCount,
        storyCount,
        badges
    ] = await Promise.all([
        // Memory Stats: Count, Sum Durations, Image Count
        prisma.memory.aggregate({
            where: { userId },
            _count: { id: true, imageUrl: true },
            _sum: { audioDurationSec: true, videoDurationSec: true },
        }),
        // Memory Dates for Streak
        prisma.memory.findMany({
            where: { userId },
            select: { createdAt: true },
            orderBy: { createdAt: "desc" },
        }),
        // Story Dates for Streak
        prisma.story.findMany({
            where: { userId },
            select: { createdAt: true },
            orderBy: { createdAt: "desc" },
        }),
        // Story Page Video Stats
        prisma.storyPageVideo.aggregate({
            where: { storyPage: { story: { userId } } },
            _sum: { videoDurationSec: true },
        }),
        // Story Page Audio Stats
        prisma.storyPageAudio.aggregate({
            where: { storyPage: { story: { userId } } },
            _sum: { audioDurationSec: true },
        }),
        // Story Page Image Stats (Count rows)
        prisma.storyPageImage.count({
            where: { storyPage: { story: { userId } } },
        }),
        // Story Count
        prisma.story.count({ where: { userId } }),
        // Badges
        prisma.badge.findMany({
            where: { userId },
            select: { name: true, slug: true, iconUrl: true, description: true, createdAt: true },
        }),
    ]);

    // --- Aggregate Totals ---
    const totalMemories = memoryStats._count.id;
    const totalStories = storyCount;

    const totalAudioSec = (memoryStats._sum.audioDurationSec || 0) + (storyPageAudioStats._sum.audioDurationSec || 0);
    const totalVideoSec = (memoryStats._sum.videoDurationSec || 0) + (storyPageVideoStats._sum.videoDurationSec || 0);

    // Total images = Memories with imageUrl + StoryPageImage rows
    // Note: _count.imageUrl counts non-null values
    const totalImages = (memoryStats._count.imageUrl || 0) + storyPageImageCount;

    const daysSinceJoined = Math.ceil((Date.now() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24));

    // --- Calculate Streak ---
    const allDates = [
        ...memoryDates.map(m => m.createdAt),
        ...storyDates.map(s => s.createdAt)
    ];
    const streak = calculateStreak(allDates);

    // --- Graphs ---
    // We need specific memory data for graphs (moods)

    // A. Monthly Consistency Graph
    const now = new Date();
    const targetYear = query.year || now.getFullYear();
    const targetMonth = query.month ? query.month - 1 : now.getMonth(); // 0-indexed in JS Date

    const monthlyGraph = await getMonthlyMoodGraph(userId, targetYear, targetMonth);

    // B. Line Graph (Recent or All-time)
    const lineGraph = await getLineGraph(userId, query.graphPeriod, user.createdAt);

    return {
        user: {
            email: user.email,
            name: user.name,
            profileImage: user.avatarUrl,
        },
        stats: {
            currentStreak: streak,
            totalMemories,
            totalStories,
            totalAudioSeconds: totalAudioSec,
            totalVideoSeconds: totalVideoSec,
            totalImages,
            daysSinceJoined,
        },
        badges,
        graphs: {
            monthlyConsistency: monthlyGraph,
            lineGraph,
        },
    };
}

/**
 * Calculate current post streak
 */
function calculateStreak(dates: Date[]): number {
    if (dates.length === 0) return 0;

    // Normalize to YYYY-MM-DD strings to handle distinct days
    const uniqueDays = Array.from(new Set(
        dates.map(d => d.toISOString().split("T")[0])
    )).sort((a, b) => String(b).localeCompare(String(a))); // Descending

    if (uniqueDays.length === 0) return 0;

    const todayStr = new Date().toISOString().split("T")[0];
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split("T")[0];

    // If no post today or yesterday, streak is broken -> 0
    // Unless we want to be lenient and check if streak *was* active yesterday?
    // "Current streak" usually means active. If I didn't post today yet, is streak 0?
    // Usually streak persists until the day ends. So if last post was yesterday, streak is active (count is X).
    // If last post was today, streak is active (count is X).
    // If last post was day before yesterday, streak is broken.

    const lastPost = uniqueDays[0];
    if (lastPost !== todayStr && lastPost !== yesterdayStr) {
        return 0; // Streak broken
    }

    let streak = 0;
    let checkDate = new Date(lastPost); // Start from the last active day

    for (const day of uniqueDays) {
        const expectedStr = checkDate.toISOString().split("T")[0];
        if (day === expectedStr) {
            streak++;
            // Move checkDate back 1 day
            checkDate.setDate(checkDate.getDate() - 1);
        } else {
            break; // Gap found
        }
    }

    return streak;
}

/**
 * Get Monthly Mood Consistency Data
 */
async function getMonthlyMoodGraph(userId: string, year: number, month: number) {
    // Range: Start of month to End of month (or today if current month)
    const startOfMonth = new Date(year, month, 1);
    const endOfMonth = new Date(year, month + 1, 0, 23, 59, 59, 999); // last day of month

    // Fetch memories in range
    const memories = await prisma.memory.findMany({
        where: {
            userId,
            createdAt: {
                gte: startOfMonth,
                lte: endOfMonth,
            },
        },
        select: {
            mood: true,
            createdAt: true,
        },
    });

    // Group by day
    const daysInMonth = endOfMonth.getDate();
    const result: DailyMood[] = [];

    for (let d = 1; d <= daysInMonth; d++) {
        const currentDayDate = new Date(year, month, d);
        const dayStr = currentDayDate.toISOString().split("T")[0];

        // Find memories for this day
        // Note: In JS, dates are local or UTC? Prisma returns UTC Date objects.
        // If we use toISOString().split('T')[0], we get UTC date.
        // Assuming simplistic UTC matching for now or consistent timezone.

        const relevantMemories = memories.filter(m =>
            m.createdAt.toISOString().split("T")[0] === dayStr
        );

        let average: number | null = null;
        if (relevantMemories.length > 0) {
            const sum = relevantMemories.reduce((acc, m) => acc + m.mood, 0);
            average = parseFloat((sum / relevantMemories.length).toFixed(2));
        }

        result.push({
            date: dayStr,
            averageMood: average,
            totalPosts: relevantMemories.length,
        });
    }

    return result;
}

/**
 * Get Line Graph Data (Last N days or All-time)
 */
async function getLineGraph(
    userId: string,
    period: "all-time" | number,
    accountCreationDate: Date
) {
    const endDate = new Date();
    let startDate: Date;

    if (period === "all-time") {
        startDate = accountCreationDate;
    } else {
        // Last N days
        startDate = new Date();
        startDate.setDate(endDate.getDate() - (period as number));
    }

    // Set start properly 00:00
    startDate.setHours(0, 0, 0, 0);

    const memories = await prisma.memory.findMany({
        where: {
            userId,
            createdAt: {
                gte: startDate,
                lte: endDate,
            },
        },
        select: {
            mood: true,
            createdAt: true,
        },
        orderBy: { createdAt: "asc" }
    });

    // If line graph, we generally just want the data points that EXIST, 
    // or a continuous line? Usually continuous.

    // Group by day similar to above
    // Efficient grouping via Map
    const grouped = new Map<string, number[]>();

    memories.forEach(m => {
        const dayStr = m.createdAt.toISOString().split("T")[0];
        if (!grouped.has(dayStr)) grouped.set(dayStr, []);
        grouped.get(dayStr)!.push(m.mood);
    });

    // Iterate from start to end day
    const result: { date: string; value: number | null }[] = [];

    // Determine loop range
    // Safe iteration: clone start
    const iterDate = new Date(startDate);
    const nowStr = new Date().toISOString().split("T")[0];

    while (iterDate <= endDate || iterDate.toISOString().split("T")[0] === nowStr) {
        const dayStr = iterDate.toISOString().split("T")[0];
        const moods = grouped.get(dayStr);

        let average: number | null = null;
        if (moods && moods.length > 0) {
            const sum = moods.reduce((a, b) => a + b, 0);
            average = parseFloat((sum / moods.length).toFixed(2));
        }

        result.push({ date: dayStr, value: average });

        // Break loop if we just processed today (to avoid infinite or overshooting due to time comparisons)
        if (dayStr === nowStr) break;

        iterDate.setDate(iterDate.getDate() + 1);
    }

    return result;
}
