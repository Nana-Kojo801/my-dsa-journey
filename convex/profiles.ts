import { v, ConvexError } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

function monthKey(ts: number): string {
  return new Date(ts).toISOString().slice(0, 7);
}

export const ensureProfile = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Not authenticated");

    const existing = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();
    if (existing !== null) return existing._id;

    const user = await ctx.db.get(userId);
    if (user === null) {
      throw new ConvexError("Your session no longer matches an account. Sign in again.");
    }
    const handle = user.name ?? `runner${userId.slice(0, 6)}`;

    const anyProfile = await ctx.db.query("profiles").take(1);
    const isFirstUser = anyProfile.length === 0;

    const now = Date.now();
    return await ctx.db.insert("profiles", {
      userId,
      handle,
      handleLower: handle.toLowerCase(),
      isAdmin: isFirstUser,
      currentStreak: 0,
      longestStreak: 0,
      freezesRemaining: 2,
      freezeMonthKey: monthKey(now),
      totalScore: 0,
      joinedAt: now,
    });
  },
});

export const getMyProfile = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) return null;
    return await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();
  },
});

export const renameHandle = mutation({
  args: { newHandle: v.string() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Not authenticated");

    const handle = args.newHandle.trim().toLowerCase();
    if (!/^[a-z0-9_]{3,20}$/.test(handle)) {
      throw new Error("Handle must be 3-20 lowercase letters, numbers, or underscores.");
    }

    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();
    if (profile === null) throw new Error("Profile not found");

    if (handle !== profile.handleLower) {
      const clash = await ctx.db
        .query("profiles")
        .withIndex("by_handleLower", (q) => q.eq("handleLower", handle))
        .unique();
      if (clash !== null) throw new Error("That handle is already taken.");
    }

    await ctx.db.patch(profile._id, { handle, handleLower: handle });
    await ctx.db.patch(userId, { name: handle });
    return handle;
  },
});
