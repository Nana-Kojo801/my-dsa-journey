import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

crons.cron("daily rollover", "5 0 * * *", internal.streaks.dailyRolloverAction, {});
crons.cron("daily reminder", "0 20 * * *", internal.streaks.reminderAction, {});

export default crons;
