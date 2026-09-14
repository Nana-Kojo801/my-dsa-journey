import { v } from "convex/values";
import { query } from "./_generated/server";
import type { QueryCtx } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import type { Doc, Id } from "./_generated/dataModel";
import { todayStr } from "./lib/dates";

type Row = { profile: Doc<"profiles">; score: number; solved: number };

async function rankByDateRange(ctx: QueryCtx, fromDate: string | null, toDate: string): Promise<Row[]> {
  const profiles = await ctx.db.query("profiles").take(1000);
  const byUser = new Map<string, Row>();
  for (const p of profiles) {
    byUser.set(p.userId, { profile: p, score: 0, solved: 0 });
  }

  const subs =
    fromDate === null
      ? await ctx.db.query("submissions").withIndex("by_date").take(5000)
      : await ctx.db
          .query("submissions")
          .withIndex("by_date", (q) => q.gte("date", fromDate).lte("date", toDate))
          .take(5000);

  for (const s of subs) {
    const row = byUser.get(s.userId);
    if (row === undefined) continue;
    row.score += s.bestScore;
    row.solved += 1;
  }

  return [...byUser.values()].sort((a, b) => b.score - a.score);
}

type Filter = "Daily" | "Weekly" | "Monthly" | "Overall";

async function resolveFromDate(ctx: QueryCtx, filter: Filter, today: string): Promise<string | null> {
  if (filter === "Daily") return today;
  if (filter === "Weekly") {
    const todayQuestion = await ctx.db
      .query("questions")
      .withIndex("by_date", (q) => q.eq("date", today))
      .unique();
    if (todayQuestion !== null) {
      const weekDoc = await ctx.db
        .query("weeks")
        .withIndex("by_weekNumber", (q) => q.eq("weekNumber", todayQuestion.weekNumber))
        .unique();
      return weekDoc?.startDate ?? today;
    }
    return today;
  }
  if (filter === "Monthly") return today.slice(0, 7) + "-01";
  return null;
}

async function userSubmissionsBreakdown(ctx: QueryCtx, userId: Id<"users">, fromDate: string | null, toDate: string) {
  const profile = await ctx.db
    .query("profiles")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .unique();
  if (profile === null) return null;

  const subsAll = await ctx.db
    .query("submissions")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .order("desc")
    .take(500);
  const subs = subsAll.filter((s) => (fromDate === null || s.date >= fromDate) && s.date <= toDate);

  const submissions = await Promise.all(
    subs.map(async (s) => ({ submission: s, question: await ctx.db.get(s.questionId) })),
  );

  return {
    handle: profile.handle,
    currentStreak: profile.currentStreak,
    submissions,
  };
}

export const getLeaderboard = query({
  args: {
    filter: v.union(v.literal("Daily"), v.literal("Weekly"), v.literal("Monthly"), v.literal("Overall")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    const today = todayStr(Date.now());
    const fromDate = await resolveFromDate(ctx, args.filter, today);

    const ranked = await rankByDateRange(ctx, fromDate, today);
    return ranked
      .filter((r) => r.score > 0 || args.filter === "Overall")
      .map((r, i) => ({
        rank: i + 1,
        userId: r.profile.userId,
        handle: r.profile.handle,
        score: r.score,
        solved: r.solved,
        currentStreak: r.profile.currentStreak,
        isMe: r.profile.userId === userId,
      }));
  },
});

export const getUserBreakdown = query({
  args: {
    userId: v.id("users"),
    filter: v.union(v.literal("Daily"), v.literal("Weekly"), v.literal("Monthly"), v.literal("Overall")),
  },
  handler: async (ctx, args) => {
    const today = todayStr(Date.now());
    const fromDate = await resolveFromDate(ctx, args.filter, today);
    return await userSubmissionsBreakdown(ctx, args.userId, fromDate, today);
  },
});

export const getUserWeekBreakdown = query({
  args: { userId: v.id("users"), weekNumber: v.number() },
  handler: async (ctx, args) => {
    const week = await ctx.db
      .query("weeks")
      .withIndex("by_weekNumber", (q) => q.eq("weekNumber", args.weekNumber))
      .unique();
    if (week === null) return null;
    return await userSubmissionsBreakdown(ctx, args.userId, week.startDate, week.endDate);
  },
});

export const getWeekReveal = query({
  args: { weekNumber: v.number() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    const week = await ctx.db
      .query("weeks")
      .withIndex("by_weekNumber", (q) => q.eq("weekNumber", args.weekNumber))
      .unique();
    if (week === null) return null;

    const weekSubs = await ctx.db
      .query("submissions")
      .withIndex("by_date", (q) => q.gte("date", week.startDate).lte("date", week.endDate))
      .take(5000);

    const priorSubs = await ctx.db
      .query("submissions")
      .withIndex("by_date", (q) => q.lt("date", week.startDate))
      .take(5000);

    type Agg = { userId: Id<"users">; score: number; stages: number; percentileSum: number };
    const byUser = new Map<Id<"users">, Agg>();
    for (const s of weekSubs) {
      const row = byUser.get(s.userId) ?? { userId: s.userId, score: 0, stages: 0, percentileSum: 0 };
      row.score += s.bestScore;
      row.stages += 1;
      row.percentileSum += (s.bestRuntimePercentile + s.bestMemoryPercentile) / 2;
      byUser.set(s.userId, row);
    }

    const priorAvgByUser = new Map<Id<"users">, { sum: number; count: number }>();
    for (const s of priorSubs) {
      const row = priorAvgByUser.get(s.userId) ?? { sum: 0, count: 0 };
      row.sum += (s.bestRuntimePercentile + s.bestMemoryPercentile) / 2;
      row.count += 1;
      priorAvgByUser.set(s.userId, row);
    }

    const profiles = await ctx.db.query("profiles").take(1000);
    const handleOf = new Map(profiles.map((p) => [p.userId, p.handle]));

    const weekBoard = [...byUser.values()]
      .sort((a, b) => b.score - a.score)
      .map((r, i) => ({
        rank: i + 1,
        userId: r.userId,
        handle: handleOf.get(r.userId) ?? "deleted_runner",
        score: r.score,
        stages: r.stages,
        avgPercentile: r.percentileSum / r.stages,
        isMe: r.userId === userId,
      }));

    const topPerformer = weekBoard[0] ?? null;

    let mostImproved: { handle: string; deltaPercentile: number; deltaRank: number } | null = null;
    for (const r of byUser.values()) {
      const prior = priorAvgByUser.get(r.userId);
      if (prior === undefined || prior.count === 0) continue;
      const priorAvg = prior.sum / prior.count;
      const thisAvg = r.percentileSum / r.stages;
      const delta = thisAvg - priorAvg;
      if (mostImproved === null || delta > mostImproved.deltaPercentile) {
        mostImproved = { handle: handleOf.get(r.userId) ?? "deleted_runner", deltaPercentile: delta, deltaRank: 0 };
      }
    }

    const questions = await ctx.db
      .query("questions")
      .withIndex("by_week_day", (q) => q.eq("weekNumber", args.weekNumber))
      .take(7);
    let hardest: { title: string; avg: number } | null = null;
    for (const q of questions) {
      const subs = weekSubs.filter((s) => s.questionId === q._id);
      if (subs.length === 0) continue;
      const avg = subs.reduce((sum, s) => sum + (s.bestRuntimePercentile + s.bestMemoryPercentile) / 2, 0) / subs.length;
      if (hardest === null || avg < hardest.avg) hardest = { title: q.title, avg };
    }

    return {
      week,
      weekBoard,
      topPerformer,
      mostImproved,
      hardest,
      totalRunners: profiles.length,
      runnersWhoFinished: [...byUser.values()].filter((r) => r.stages === 7).length,
      cohortAvgPercentile:
        weekSubs.length > 0
          ? weekSubs.reduce((sum, s) => sum + (s.bestRuntimePercentile + s.bestMemoryPercentile) / 2, 0) / weekSubs.length
          : 0,
    };
  },
});

export const getOverallLeaderboard = query({
  args: {},
  handler: async (ctx) => {
    const profiles = await ctx.db.query("profiles").withIndex("by_totalScore").order("desc").take(500);
    return profiles.map((p, i) => ({
      rank: i + 1,
      handle: p.handle,
      score: p.totalScore,
      currentStreak: p.currentStreak,
    }));
  },
});
