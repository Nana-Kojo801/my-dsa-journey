import { v } from "convex/values";
import { internalMutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import type { Id } from "./_generated/dataModel";
import { computeScore } from "./lib/scoring";
import { recomputeStreak } from "./lib/streak";
import { todayStr } from "./lib/dates";

export const recordSubmission = internalMutation({
  args: {
    userId: v.id("users"),
    questionId: v.id("questions"),
    runtimePercentile: v.number(),
    memoryPercentile: v.number(),
    runtimeValue: v.string(),
    memoryValue: v.string(),
  },
  handler: async (ctx, args) => {
    const question = await ctx.db.get(args.questionId);
    if (question === null) throw new Error("Question not found");

    const now = Date.now();
    const score = computeScore(args.runtimePercentile, args.memoryPercentile);

    const existing = await ctx.db
      .query("submissions")
      .withIndex("by_user_question", (q) =>
        q.eq("userId", args.userId).eq("questionId", args.questionId),
      )
      .unique();

    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .unique();
    if (profile === null) throw new Error("Profile not found");

    let bestRuntimePercentile = args.runtimePercentile;
    let bestMemoryPercentile = args.memoryPercentile;
    let bestScore = score;
    let scoreDelta = score;

    if (existing !== null) {
      bestRuntimePercentile = Math.max(existing.bestRuntimePercentile, args.runtimePercentile);
      bestMemoryPercentile = Math.max(existing.bestMemoryPercentile, args.memoryPercentile);
      bestScore = Math.max(existing.bestScore, score);
      scoreDelta = bestScore - existing.bestScore;

      await ctx.db.patch(existing._id, {
        runtimePercentile: args.runtimePercentile,
        memoryPercentile: args.memoryPercentile,
        runtimeValue: args.runtimeValue,
        memoryValue: args.memoryValue,
        bestRuntimePercentile,
        bestMemoryPercentile,
        bestScore,
        submissionCount: existing.submissionCount + 1,
        updatedAt: now,
      });
    } else {
      await ctx.db.insert("submissions", {
        userId: args.userId,
        questionId: args.questionId,
        weekNumber: question.weekNumber,
        dayNumber: question.dayNumber,
        date: question.date,
        runtimePercentile: args.runtimePercentile,
        memoryPercentile: args.memoryPercentile,
        runtimeValue: args.runtimeValue,
        memoryValue: args.memoryValue,
        bestRuntimePercentile,
        bestMemoryPercentile,
        bestScore,
        submissionCount: 1,
        createdAt: now,
        updatedAt: now,
      });
    }

    if (scoreDelta !== 0) {
      await ctx.db.patch(profile._id, { totalScore: profile.totalScore + scoreDelta });
    }

    const dayEntry = await ctx.db
      .query("streakDays")
      .withIndex("by_user_date", (q) => q.eq("userId", args.userId).eq("date", question.date))
      .unique();
    if (dayEntry === null) {
      await ctx.db.insert("streakDays", { userId: args.userId, date: question.date, status: "cleared" });
    } else if (dayEntry.status !== "cleared") {
      await ctx.db.patch(dayEntry._id, { status: "cleared" });
    }

    await recomputeStreak(ctx, args.userId, todayStr(now));

    return {
      current: {
        runtimePercentile: args.runtimePercentile,
        memoryPercentile: args.memoryPercentile,
        runtimeValue: args.runtimeValue,
        memoryValue: args.memoryValue,
      },
      best: existing !== null ? { runtimePercentile: bestRuntimePercentile, memoryPercentile: bestMemoryPercentile } : null,
    };
  },
});

export const recordExtractionFailure = internalMutation({
  args: { userId: v.id("users"), questionId: v.id("questions"), reason: v.string() },
  handler: async (ctx, args) => {
    await ctx.db.insert("extractionFailures", {
      userId: args.userId,
      questionId: args.questionId,
      reason: args.reason,
      createdAt: Date.now(),
    });
  },
});

export const getMySubmission = query({
  args: { questionId: v.id("questions") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) return null;
    return await ctx.db
      .query("submissions")
      .withIndex("by_user_question", (q) => q.eq("userId", userId).eq("questionId", args.questionId))
      .unique();
  },
});

export const getMySubmissionsForWeek = query({
  args: { weekNumber: v.number() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) return [];
    return await ctx.db
      .query("submissions")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter((q) => q.eq(q.field("weekNumber"), args.weekNumber))
      .take(7);
  },
});

export const getMyHistory = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) return [];
    const subs = await ctx.db
      .query("submissions")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .take(200);
    const withQuestions = await Promise.all(
      subs.map(async (s) => ({ submission: s, question: await ctx.db.get(s.questionId) })),
    );
    return withQuestions;
  },
});

export const getQuestionSubmissionCount = query({
  args: { questionId: v.id("questions") },
  handler: async (ctx, args) => {
    const subs = await ctx.db
      .query("submissions")
      .withIndex("by_question", (q) => q.eq("questionId", args.questionId))
      .take(1000);
    return subs.length;
  },
});

export const getDayLeaderboardRows = query({
  args: { questionId: v.id("questions") },
  handler: async (ctx, args) => {
    const subs = await ctx.db
      .query("submissions")
      .withIndex("by_question", (q) => q.eq("questionId", args.questionId))
      .take(500);
    const rows = await Promise.all(
      subs.map(async (s) => {
        const profile = await ctx.db
          .query("profiles")
          .withIndex("by_user", (q) => q.eq("userId", s.userId as Id<"users">))
          .unique();
        return { submission: s, profile };
      }),
    );
    return rows
      .filter((r) => r.profile !== null)
      .sort((a, b) => b.submission.bestScore - a.submission.bestScore);
  },
});
