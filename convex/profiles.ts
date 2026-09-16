import { v, ConvexError } from "convex/values";
import { action, internalQuery, mutation, query } from "./_generated/server";
import { getAuthUserId, retrieveAccount, modifyAccountCredentials } from "@convex-dev/auth/server";
import { internal } from "./_generated/api";

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

    const allProfiles = await ctx.db.query("profiles").take(5000);
    const isFirstUser = allProfiles.length === 0;

    const now = Date.now();
    const profileId = await ctx.db.insert("profiles", {
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

    if (!isFirstUser) {
      const admins = allProfiles.filter((p) => p.isAdmin);
      for (const admin of admins) {
        await ctx.scheduler.runAfter(0, internal.pushSend.sendToUser, {
          userId: admin.userId,
          title: "New runner joined",
          body: `${handle} just signed up.`,
          url: "/admin",
        });
      }
    }

    return profileId;
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

export const getPublicProfile = query({
  args: { handle: v.string() },
  handler: async (ctx, args) => {
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_handleLower", (q) => q.eq("handleLower", args.handle.toLowerCase()))
      .unique();
    return profile;
  },
});

export const searchHandles = query({
  args: { prefix: v.string() },
  handler: async (ctx, args) => {
    const prefix = args.prefix.toLowerCase().slice(0, 20);
    if (prefix.length === 0) {
      const results = await ctx.db.query("profiles").withIndex("by_handleLower").take(8);
      return results.map((p) => p.handle);
    }
    const results = await ctx.db
      .query("profiles")
      .withIndex("by_handleLower", (q) => q.gte("handleLower", prefix).lt("handleLower", prefix + "￿"))
      .take(8);
    return results.map((p) => p.handle);
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

export const getMyPasswordAccountId = internalQuery({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const account = await ctx.db
      .query("authAccounts")
      .withIndex("userIdAndProvider", (q) => q.eq("userId", args.userId).eq("provider", "password"))
      .unique();
    return account?.providerAccountId ?? null;
  },
});

export const changePassword = action({
  args: { currentPassword: v.string(), newPassword: v.string() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new ConvexError("Not authenticated");
    if (args.newPassword.length < 8) {
      throw new ConvexError("New passphrase needs at least 8 characters.");
    }

    const accountId: string | null = await ctx.runQuery(internal.profiles.getMyPasswordAccountId, { userId });
    if (accountId === null) throw new ConvexError("No password account found.");

    try {
      await retrieveAccount(ctx, { provider: "password", account: { id: accountId, secret: args.currentPassword } });
    } catch {
      throw new ConvexError("Current passphrase is incorrect.");
    }

    await modifyAccountCredentials(ctx, {
      provider: "password",
      account: { id: accountId, secret: args.newPassword },
    });
  },
});
