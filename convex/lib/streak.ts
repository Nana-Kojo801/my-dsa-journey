import type { MutationCtx } from "../_generated/server";
import type { Id } from "../_generated/dataModel";
import { addDaysStr } from "./dates";

const MAX_LOOKBACK_DAYS = 400;

export async function recomputeStreak(
  ctx: MutationCtx,
  userId: Id<"users">,
  todayDate: string,
): Promise<void> {
  let streak = 0;
  let cursor = todayDate;
  for (let i = 0; i < MAX_LOOKBACK_DAYS; i++) {
    const day = await ctx.db
      .query("streakDays")
      .withIndex("by_user_date", (q) => q.eq("userId", userId).eq("date", cursor))
      .unique();
    if (day === null || day.status === "missed") break;
    streak++;
    cursor = addDaysStr(cursor, -1);
  }

  const profile = await ctx.db
    .query("profiles")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .unique();
  if (profile === null) return;

  await ctx.db.patch(profile._id, {
    currentStreak: streak,
    longestStreak: Math.max(profile.longestStreak, streak),
  });
}
