import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { internal } from "./_generated/api";

export const postComment = mutation({
  args: { questionId: v.id("questions"), body: v.string(), parentId: v.optional(v.id("comments")) },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Not authenticated");
    const body = args.body.trim();
    if (body.length === 0) throw new Error("Comment can't be empty.");
    if (body.length > 4000) throw new Error("Comment is too long.");

    const hourAgo = Date.now() - 60 * 60 * 1000;
    const recent = await ctx.db
      .query("comments")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter((q) => q.gte(q.field("createdAt"), hourAgo))
      .take(11);
    if (recent.length >= 10) throw new Error("Slow down — max 10 comments per hour.");

    const commentId = await ctx.db.insert("comments", {
      questionId: args.questionId,
      userId,
      parentId: args.parentId,
      body,
      createdAt: Date.now(),
    });

    // Notify parent comment author on reply
    if (args.parentId !== undefined) {
      const parent = await ctx.db.get(args.parentId);
      if (parent !== null && parent.userId !== userId) {
        const replierProfile = await ctx.db
          .query("profiles")
          .withIndex("by_user", (q) => q.eq("userId", userId))
          .unique();
        const question = await ctx.db.get(args.questionId);
        const replierHandle = replierProfile?.handle ?? "Someone";
        const stageTitle = question?.title ?? "a stage";
        await ctx.scheduler.runAfter(0, internal.pushSend.sendToUser, {
          userId: parent.userId,
          title: `${replierHandle} replied to your note`,
          body: `On "${stageTitle}": ${body.slice(0, 80)}${body.length > 80 ? "…" : ""}`,
          url: `/question/${args.questionId}/comments`,
        });
      }
    }

    return commentId;
  },
});

export const deleteComment = mutation({
  args: { commentId: v.id("comments") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Not authenticated");
    const comment = await ctx.db.get(args.commentId);
    if (comment === null) throw new Error("Comment not found");

    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();
    const isAdmin = profile?.isAdmin ?? false;

    if (comment.userId !== userId && !isAdmin) throw new Error("Not your comment");

    // delete replies first
    const replies = await ctx.db
      .query("comments")
      .withIndex("by_parent", (q) => q.eq("parentId", args.commentId))
      .take(200);
    for (const r of replies) await ctx.db.delete(r._id);
    await ctx.db.delete(args.commentId);
  },
});

export const getComments = query({
  args: { questionId: v.id("questions") },
  handler: async (ctx, args) => {
    const all = await ctx.db
      .query("comments")
      .withIndex("by_question", (q) => q.eq("questionId", args.questionId))
      .order("asc")
      .take(500);

    const handles = new Map<string, string>();
    for (const c of all) {
      if (!handles.has(c.userId)) {
        const profile = await ctx.db
          .query("profiles")
          .withIndex("by_user", (q) => q.eq("userId", c.userId))
          .unique();
        handles.set(c.userId, profile?.handle ?? "deleted_runner");
      }
    }

    const withHandle = all.map((c) => ({ ...c, handle: handles.get(c.userId) ?? "deleted_runner" }));
    const top = withHandle.filter((c) => c.parentId === undefined);
    const repliesByParent = new Map<string, typeof withHandle>();
    for (const c of withHandle) {
      if (c.parentId === undefined) continue;
      const list = repliesByParent.get(c.parentId) ?? [];
      list.push(c);
      repliesByParent.set(c.parentId, list);
    }

    return top
      .sort((a, b) => b.createdAt - a.createdAt)
      .map((c) => ({ ...c, replies: repliesByParent.get(c._id) ?? [] }));
  },
});
