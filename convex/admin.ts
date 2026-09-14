import { query } from "./_generated/server";
import type { QueryCtx } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { todayStr, addDaysStr } from "./lib/dates";

const DAY_MS = 24 * 60 * 60 * 1000;

async function requireAdmin(ctx: QueryCtx): Promise<boolean> {
  const userId = await getAuthUserId(ctx);
  if (userId === null) return false;
  const profile = await ctx.db
    .query("profiles")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .unique();
  return profile !== null && profile.isAdmin;
}

function lastNDays(today: string, n: number): string[] {
  const days: string[] = [];
  for (let i = n - 1; i >= 0; i--) days.push(addDaysStr(today, -i));
  return days;
}

export const getStats = query({
  args: {},
  handler: async (ctx) => {
    if (!(await requireAdmin(ctx))) return null;

    const now = Date.now();
    const today = todayStr(now);

    const profiles = await ctx.db.query("profiles").take(5000);
    const submissions = await ctx.db.query("submissions").take(5000);
    const failures = await ctx.db.query("extractionFailures").take(5000);
    const comments = await ctx.db.query("comments").take(5000);
    const pushSubs = await ctx.db.query("pushSubscriptions").take(5000);
    const openFeedback = await ctx.db
      .query("feedbackReports")
      .withIndex("by_status", (q) => q.eq("status", "open"))
      .collect();
    const allFeedback = await ctx.db.query("feedbackReports").take(5000);
    const openSiteFeedback = await ctx.db
      .query("siteFeedback")
      .withIndex("by_status", (q) => q.eq("status", "open"))
      .collect();
    const allSiteFeedback = await ctx.db.query("siteFeedback").take(5000);
    const weeks = await ctx.db.query("weeks").collect();

    const totalUsers = profiles.length;
    const newUsers7d = profiles.filter((p) => now - p.joinedAt <= 7 * DAY_MS).length;
    const newUsers30d = profiles.filter((p) => now - p.joinedAt <= 30 * DAY_MS).length;
    const activeStreaks = profiles.filter((p) => p.currentStreak > 0).length;
    const totalScore = profiles.reduce((sum, p) => sum + p.totalScore, 0);
    const avgScore = totalUsers > 0 ? totalScore / totalUsers : 0;
    const longestStreakEver = Math.max(0, ...profiles.map((p) => p.longestStreak));

    const totalSubmissions = submissions.length;
    const submissionsToday = submissions.filter((s) => s.date === today).length;
    const totalFailures = failures.length;
    const readAttempts = totalSubmissions + totalFailures;
    const extractionSuccessRate = readAttempts > 0 ? totalSubmissions / readAttempts : 1;

    const days = lastNDays(today, 14);
    const signupsByDay = days.map((date) => ({
      date,
      count: profiles.filter((p) => todayStr(p.joinedAt) === date).length,
    }));
    const submissionsByDay = days.map((date) => ({
      date,
      count: submissions.filter((s) => s.date === date).length,
    }));

    return {
      totalUsers,
      newUsers7d,
      newUsers30d,
      activeStreaks,
      totalScore,
      avgScore,
      longestStreakEver,
      totalSubmissions,
      submissionsToday,
      totalFailures,
      extractionSuccessRate,
      openFeedbackCount: openFeedback.length,
      totalFeedbackCount: allFeedback.length,
      openSiteFeedbackCount: openSiteFeedback.length,
      totalSiteFeedbackCount: allSiteFeedback.length,
      commentsCount: comments.length,
      pushSubscriberCount: pushSubs.length,
      totalWeeks: weeks.length,
      signupsByDay,
      submissionsByDay,
    };
  },
});

export const getAllRunners = query({
  args: {},
  handler: async (ctx) => {
    if (!(await requireAdmin(ctx))) return null;
    const profiles = await ctx.db.query("profiles").withIndex("by_totalScore").order("desc").take(1000);
    return profiles.map((p, i) => ({
      rank: i + 1,
      handle: p.handle,
      isAdmin: p.isAdmin,
      totalScore: p.totalScore,
      currentStreak: p.currentStreak,
      longestStreak: p.longestStreak,
      freezesRemaining: p.freezesRemaining,
      joinedAt: p.joinedAt,
    }));
  },
});

export const getExtractionFailures = query({
  args: {},
  handler: async (ctx) => {
    if (!(await requireAdmin(ctx))) return null;
    const failures = await ctx.db.query("extractionFailures").order("desc").take(100);
    return await Promise.all(
      failures.map(async (f) => {
        const [reporter, question] = await Promise.all([
          ctx.db
            .query("profiles")
            .withIndex("by_user", (q) => q.eq("userId", f.userId))
            .unique(),
          ctx.db.get(f.questionId),
        ]);
        return { ...f, reporterHandle: reporter?.handle ?? "deleted_runner", question };
      }),
    );
  },
});
