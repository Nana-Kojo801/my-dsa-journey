import { v } from "convex/values";
import { internalAction, internalMutation, internalQuery, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import { recomputeStreak } from "./lib/streak";
import { todayStr, monthKey, addDaysStr } from "./lib/dates";

type Notification = { userId: Id<"users">; title: string; body: string; url?: string };

export const processRollover = internalMutation({
  args: { now: v.number() },
  handler: async (ctx, args) => {
    const today = todayStr(args.now);
    const yesterday = addDaysStr(today, -1);
    const currentMonthKey = monthKey(args.now);

    const yesterdayQuestion = await ctx.db
      .query("questions")
      .withIndex("by_date", (q) => q.eq("date", yesterday))
      .unique();

    const profiles = await ctx.db.query("profiles").take(1000);

    for (const profile of profiles) {
      if (profile.freezeMonthKey !== currentMonthKey) {
        await ctx.db.patch(profile._id, { freezesRemaining: 2, freezeMonthKey: currentMonthKey });
      }

      if (yesterdayQuestion !== null) {
        const existingDay = await ctx.db
          .query("streakDays")
          .withIndex("by_user_date", (q) => q.eq("userId", profile.userId).eq("date", yesterday))
          .unique();

        if (existingDay === null) {
          const freezesLeft =
            profile.freezeMonthKey === currentMonthKey ? profile.freezesRemaining : 2;
          if (profile.currentStreak > 0 && freezesLeft > 0) {
            await ctx.db.insert("streakDays", { userId: profile.userId, date: yesterday, status: "freeze" });
            const fresh = await ctx.db.get(profile._id);
            if (fresh !== null) {
              await ctx.db.patch(profile._id, { freezesRemaining: fresh.freezesRemaining - 1 });
            }
          } else {
            await ctx.db.insert("streakDays", { userId: profile.userId, date: yesterday, status: "missed" });
          }
        }

        await recomputeStreak(ctx, profile.userId, yesterday);
      }
    }

    const ranked = (await ctx.db.query("profiles").withIndex("by_totalScore").order("desc").take(1000)).map(
      (p, i) => ({ ...p, newRank: i + 1 }),
    );

    const notifications: Notification[] = [];
    for (const p of ranked) {
      if (p.lastKnownRank !== undefined && p.newRank > p.lastKnownRank && p.totalScore > 0) {
        notifications.push({
          userId: p.userId,
          title: "Someone passed you on the board",
          body: `You're now rank ${p.newRank} overall.`,
          url: "/board",
        });
      }
      if (p.lastKnownRank !== p.newRank) {
        await ctx.db.patch(p._id, { lastKnownRank: p.newRank });
      }
    }

    return notifications;
  },
});

export const getPendingReminders = internalQuery({
  args: { today: v.string() },
  handler: async (ctx, args) => {
    const question = await ctx.db
      .query("questions")
      .withIndex("by_date", (q) => q.eq("date", args.today))
      .unique();
    if (question === null) return [];

    const profiles = await ctx.db.query("profiles").take(1000);
    const pending: Notification[] = [];
    for (const p of profiles) {
      const submitted = await ctx.db
        .query("submissions")
        .withIndex("by_user_question", (q) => q.eq("userId", p.userId).eq("questionId", question._id))
        .unique();
      if (submitted === null) {
        pending.push({
          userId: p.userId,
          title: "Today's stage is still open",
          body: `${question.title} closes at midnight.`,
          url: "/today",
        });
      }
    }
    return pending;
  },
});

export const getMyRecentDays = query({
  args: { today: v.string(), days: v.number() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) return [];
    const bounded = Math.min(Math.max(args.days, 1), 90);
    const out: { date: string; status: "cleared" | "freeze" | "missed" | "future" | "unplayed" }[] = [];
    for (let i = bounded - 1; i >= 0; i--) {
      const date = addDaysStr(args.today, -i);
      const entry = await ctx.db
        .query("streakDays")
        .withIndex("by_user_date", (q) => q.eq("userId", userId).eq("date", date))
        .unique();
      out.push({ date, status: entry?.status ?? "unplayed" });
    }
    return out;
  },
});

export const dailyRolloverAction = internalAction({
  args: {},
  handler: async (ctx) => {
    const notifications = await ctx.runMutation(internal.streaks.processRollover, { now: Date.now() });
    if (notifications.length > 0) {
      await ctx.runAction(internal.pushSend.sendBatch, { notifications });
    }
  },
});

export const reminderAction = internalAction({
  args: {},
  handler: async (ctx) => {
    const today = todayStr(Date.now());
    const notifications = await ctx.runQuery(internal.streaks.getPendingReminders, { today });
    if (notifications.length > 0) {
      await ctx.runAction(internal.pushSend.sendBatch, { notifications });
    }
  },
});
