import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

const FIELD = v.union(
  v.literal("RUNTIME %"),
  v.literal("MEMORY %"),
  v.literal("RUNTIME VALUE"),
  v.literal("MEMORY VALUE"),
  v.literal("ALL OF IT"),
);

export const submitFeedback = mutation({
  args: {
    questionId: v.id("questions"),
    field: FIELD,
    userNote: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Not authenticated");
    const note = args.userNote.trim();
    if (note.length === 0) throw new Error("Describe what the reader got wrong.");

    const submission = await ctx.db
      .query("submissions")
      .withIndex("by_user_question", (q) => q.eq("userId", userId).eq("questionId", args.questionId))
      .unique();

    const summary = submission
      ? `runtime ${submission.runtimeValue ?? "—"} (${submission.runtimePercentile}%) / memory ${submission.memoryValue ?? "—"} (${submission.memoryPercentile}%)`
      : "extraction failed before a submission was recorded";

    return await ctx.db.insert("feedbackReports", {
      userId,
      questionId: args.questionId,
      submissionId: submission?._id,
      field: args.field,
      extractedSummary: summary,
      userNote: note,
      status: "open",
      createdAt: Date.now(),
    });
  },
});

export const listOpenFeedback = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) return null;
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();
    if (profile === null || !profile.isAdmin) return null;

    const reports = await ctx.db
      .query("feedbackReports")
      .withIndex("by_status", (q) => q.eq("status", "open"))
      .order("desc")
      .take(200);

    return await Promise.all(
      reports.map(async (r) => {
        const [reporter, question] = await Promise.all([
          ctx.db
            .query("profiles")
            .withIndex("by_user", (q) => q.eq("userId", r.userId))
            .unique(),
          ctx.db.get(r.questionId),
        ]);
        return { ...r, reporterHandle: reporter?.handle ?? "deleted_runner", question };
      }),
    );
  },
});

export const resolveFeedback = mutation({
  args: { reportId: v.id("feedbackReports") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Not authenticated");
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();
    if (profile === null || !profile.isAdmin) throw new Error("Admin only.");
    await ctx.db.patch(args.reportId, { status: "resolved" });
  },
});

export const submitGeneralFeedback = mutation({
  args: { message: v.string() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Not authenticated");
    const message = args.message.trim();
    if (message.length === 0) throw new Error("Write something first.");

    return await ctx.db.insert("siteFeedback", {
      userId,
      message,
      status: "open",
      createdAt: Date.now(),
    });
  },
});

export const listGeneralFeedback = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) return null;
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();
    if (profile === null || !profile.isAdmin) return null;

    const items = await ctx.db.query("siteFeedback").order("desc").take(300);
    return await Promise.all(
      items.map(async (f) => {
        const author = await ctx.db
          .query("profiles")
          .withIndex("by_user", (q) => q.eq("userId", f.userId))
          .unique();
        return { ...f, authorHandle: author?.handle ?? "deleted_runner" };
      }),
    );
  },
});

export const resolveGeneralFeedback = mutation({
  args: { feedbackId: v.id("siteFeedback") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Not authenticated");
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();
    if (profile === null || !profile.isAdmin) throw new Error("Admin only.");
    await ctx.db.patch(args.feedbackId, { status: "resolved" });
  },
});
