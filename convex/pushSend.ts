"use node";

import { v } from "convex/values";
import webpush from "web-push";
import { internalAction } from "./_generated/server";
import { internal } from "./_generated/api";

function configureVapid() {
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT ?? "mailto:admin@dsajourney.local";
  if (!publicKey || !privateKey) throw new Error("VAPID keys are not configured on this deployment.");
  webpush.setVapidDetails(subject, publicKey, privateKey);
}

export const sendToUser = internalAction({
  args: { userId: v.id("users"), title: v.string(), body: v.string(), url: v.optional(v.string()) },
  handler: async (ctx, args) => {
    configureVapid();
    const subs = await ctx.runQuery(internal.pushSubscriptions.getForUser, { userId: args.userId });
    const payload = JSON.stringify({ title: args.title, body: args.body, url: args.url ?? "/" });

    await Promise.all(
      subs.map(async (sub) => {
        try {
          await webpush.sendNotification(
            { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
            payload,
          );
        } catch (err: unknown) {
          const statusCode = (err as { statusCode?: number }).statusCode;
          if (statusCode === 404 || statusCode === 410) {
            await ctx.runMutation(internal.pushSubscriptions.pruneEndpoint, { endpoint: sub.endpoint });
          }
        }
      }),
    );
  },
});

export const sendBatch = internalAction({
  args: {
    notifications: v.array(
      v.object({ userId: v.id("users"), title: v.string(), body: v.string(), url: v.optional(v.string()) }),
    ),
  },
  handler: async (ctx, args) => {
    configureVapid();
    for (const n of args.notifications) {
      await ctx.runAction(internal.pushSend.sendToUser, n);
    }
  },
});
