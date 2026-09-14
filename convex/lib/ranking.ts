import type { MutationCtx } from "../_generated/server";
import type { Id } from "../_generated/dataModel";

export type RankNotification = { userId: Id<"users">; title: string; body: string; url?: string };

// Recomputes overall rank for every profile and returns a push notification
// for anyone whose rank got worse (someone passed them) since the last check,
// patching lastKnownRank as it goes. Called both after each submission (for
// near-real-time "someone passed you" alerts) and from the daily rollover
// cron (as a catch-all for any drift, e.g. freeze/streak changes).
export async function checkRankChanges(ctx: MutationCtx): Promise<RankNotification[]> {
  const ranked = (await ctx.db.query("profiles").withIndex("by_totalScore").order("desc").take(1000)).map(
    (p, i) => ({ ...p, newRank: i + 1 }),
  );

  const notifications: RankNotification[] = [];
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
}
