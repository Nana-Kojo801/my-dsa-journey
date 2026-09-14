import { defineSchema, defineTable } from "convex/server";
import { authTables } from "@convex-dev/auth/server";
import { v } from "convex/values";

export default defineSchema({
  ...authTables,

  profiles: defineTable({
    userId: v.id("users"),
    handle: v.string(),
    handleLower: v.string(),
    isAdmin: v.boolean(),
    currentStreak: v.number(),
    longestStreak: v.number(),
    freezesRemaining: v.number(),
    freezeMonthKey: v.string(),
    totalScore: v.number(),
    lastKnownRank: v.optional(v.number()),
    joinedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_handleLower", ["handleLower"])
    .index("by_totalScore", ["totalScore"]),

  weeks: defineTable({
    weekNumber: v.number(),
    startDate: v.string(),
    endDate: v.string(),
    topic: v.string(),
    explanation: v.string(),
    codeSnippet: v.string(),
    codeCaption: v.string(),
    pitfall: v.string(),
  }).index("by_weekNumber", ["weekNumber"]),

  questions: defineTable({
    weekId: v.id("weeks"),
    weekNumber: v.number(),
    dayNumber: v.number(),
    date: v.string(),
    title: v.string(),
    url: v.string(),
    difficulty: v.union(v.literal("Easy"), v.literal("Medium"), v.literal("Hard")),
    note: v.string(),
  })
    .index("by_date", ["date"])
    .index("by_week_day", ["weekNumber", "dayNumber"]),

  submissions: defineTable({
    userId: v.id("users"),
    questionId: v.id("questions"),
    weekNumber: v.number(),
    dayNumber: v.number(),
    date: v.string(),
    runtimePercentile: v.number(),
    memoryPercentile: v.number(),
    runtimeValue: v.string(),
    memoryValue: v.string(),
    bestRuntimePercentile: v.number(),
    bestMemoryPercentile: v.number(),
    bestScore: v.number(),
    submissionCount: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user_question", ["userId", "questionId"])
    .index("by_question", ["questionId"])
    .index("by_user", ["userId"])
    .index("by_date", ["date"])
    .index("by_week", ["weekNumber"]),

  extractionFailures: defineTable({
    userId: v.id("users"),
    questionId: v.id("questions"),
    reason: v.string(),
    createdAt: v.number(),
  })
    .index("by_user_question", ["userId", "questionId"])
    .index("by_user", ["userId"]),

  streakDays: defineTable({
    userId: v.id("users"),
    date: v.string(),
    status: v.union(v.literal("cleared"), v.literal("freeze"), v.literal("missed")),
  })
    .index("by_user_date", ["userId", "date"])
    .index("by_user", ["userId"]),

  comments: defineTable({
    questionId: v.id("questions"),
    userId: v.id("users"),
    parentId: v.optional(v.id("comments")),
    body: v.string(),
    createdAt: v.number(),
  })
    .index("by_question", ["questionId"])
    .index("by_parent", ["parentId"])
    .index("by_user", ["userId"]),

  feedbackReports: defineTable({
    userId: v.id("users"),
    questionId: v.id("questions"),
    submissionId: v.optional(v.id("submissions")),
    field: v.union(
      v.literal("RUNTIME %"),
      v.literal("MEMORY %"),
      v.literal("RUNTIME VALUE"),
      v.literal("MEMORY VALUE"),
      v.literal("ALL OF IT"),
    ),
    extractedSummary: v.string(),
    userNote: v.string(),
    status: v.union(v.literal("open"), v.literal("resolved")),
    createdAt: v.number(),
  })
    .index("by_status", ["status"])
    .index("by_user", ["userId"]),

  siteFeedback: defineTable({
    userId: v.id("users"),
    message: v.string(),
    status: v.union(v.literal("open"), v.literal("resolved")),
    createdAt: v.number(),
  })
    .index("by_status", ["status"])
    .index("by_user", ["userId"]),

  pushSubscriptions: defineTable({
    userId: v.id("users"),
    endpoint: v.string(),
    p256dh: v.string(),
    auth: v.string(),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_endpoint", ["endpoint"]),

  appState: defineTable({
    key: v.string(),
    value: v.any(),
  }).index("by_key", ["key"]),
});
