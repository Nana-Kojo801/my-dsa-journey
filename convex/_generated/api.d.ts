/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as admin from "../admin.js";
import type * as auth from "../auth.js";
import type * as comments from "../comments.js";
import type * as crons from "../crons.js";
import type * as feedback from "../feedback.js";
import type * as http from "../http.js";
import type * as leaderboard from "../leaderboard.js";
import type * as lib_dates from "../lib/dates.js";
import type * as lib_scoring from "../lib/scoring.js";
import type * as lib_streak from "../lib/streak.js";
import type * as profiles from "../profiles.js";
import type * as pushSend from "../pushSend.js";
import type * as pushSubscriptions from "../pushSubscriptions.js";
import type * as seedData from "../seedData.js";
import type * as streaks from "../streaks.js";
import type * as submissions from "../submissions.js";
import type * as syllabus from "../syllabus.js";
import type * as vision from "../vision.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  admin: typeof admin;
  auth: typeof auth;
  comments: typeof comments;
  crons: typeof crons;
  feedback: typeof feedback;
  http: typeof http;
  leaderboard: typeof leaderboard;
  "lib/dates": typeof lib_dates;
  "lib/scoring": typeof lib_scoring;
  "lib/streak": typeof lib_streak;
  profiles: typeof profiles;
  pushSend: typeof pushSend;
  pushSubscriptions: typeof pushSubscriptions;
  seedData: typeof seedData;
  streaks: typeof streaks;
  submissions: typeof submissions;
  syllabus: typeof syllabus;
  vision: typeof vision;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
