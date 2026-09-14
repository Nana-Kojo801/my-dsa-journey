import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const postComment = mutation({
  args: { questionId: v.id("questions"), body: v.string(), parentId: v.optional(v.id("comments")) },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Not authenticated");
    const body = args.body.trim();
    if (body.length === 0) throw new Error("Comment can't be empty.");
    if (body.length > 4000) throw new Error("Comment is too long.");

    return await ctx.db.insert("comments", {
      questionId: args.questionId,
      userId,
      parentId: args.parentId,
      body,
      createdAt: Date.now(),
    });
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
