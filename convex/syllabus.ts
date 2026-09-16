import { v } from "convex/values";
import { internalMutation, query } from "./_generated/server";
import { SYLLABUS } from "./seedData";

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export const seed = internalMutation({
  args: {},
  handler: async (ctx) => {
    const already = await ctx.db.query("weeks").take(1);
    if (already.length > 0) {
      return { skipped: true, reason: "weeks table is not empty" };
    }

    let weekCount = 0;
    let questionCount = 0;
    for (const week of SYLLABUS) {
      const weekId = await ctx.db.insert("weeks", {
        weekNumber: week.weekNumber,
        startDate: week.startDate,
        endDate: week.endDate,
        topic: week.topic,
        explanation: week.explanation,
        codeSnippet: week.codeSnippet,
        codeCaption: week.codeCaption,
        pitfall: week.pitfall,
      });
      weekCount++;
      for (const q of week.questions) {
        await ctx.db.insert("questions", {
          weekId,
          weekNumber: week.weekNumber,
          dayNumber: q.dayNumber,
          date: addDays(week.startDate, q.dayNumber - 1),
          title: q.title,
          url: q.url,
          difficulty: q.difficulty,
          note: q.note,
        });
        questionCount++;
      }
    }
    return { skipped: false, weekCount, questionCount };
  },
});

export const wipeAndReseed = internalMutation({
  args: {},
  handler: async (ctx): Promise<{ weekCount: number; questionCount: number }> => {
    for (const q of await ctx.db.query("questions").take(1000)) {
      await ctx.db.delete(q._id);
    }
    for (const w of await ctx.db.query("weeks").take(1000)) {
      await ctx.db.delete(w._id);
    }
    let weekCount = 0;
    let questionCount = 0;
    for (const week of SYLLABUS) {
      const weekId = await ctx.db.insert("weeks", {
        weekNumber: week.weekNumber,
        startDate: week.startDate,
        endDate: week.endDate,
        topic: week.topic,
        explanation: week.explanation,
        codeSnippet: week.codeSnippet,
        codeCaption: week.codeCaption,
        pitfall: week.pitfall,
      });
      weekCount++;
      for (const q of week.questions) {
        await ctx.db.insert("questions", {
          weekId,
          weekNumber: week.weekNumber,
          dayNumber: q.dayNumber,
          date: addDays(week.startDate, q.dayNumber - 1),
          title: q.title,
          url: q.url,
          difficulty: q.difficulty,
          note: q.note,
        });
        questionCount++;
      }
    }
    return { weekCount, questionCount };
  },
});

export const listWeeks = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("weeks").withIndex("by_weekNumber").order("asc").take(200);
  },
});

export const getWeek = query({
  args: { weekNumber: v.number() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("weeks")
      .withIndex("by_weekNumber", (q) => q.eq("weekNumber", args.weekNumber))
      .unique();
  },
});

export const getQuestionsForWeek = query({
  args: { weekNumber: v.number() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("questions")
      .withIndex("by_week_day", (q) => q.eq("weekNumber", args.weekNumber))
      .order("asc")
      .take(7);
  },
});

export const getQuestion = query({
  args: { questionId: v.id("questions") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.questionId);
  },
});

export const getQuestionByDate = query({
  args: { date: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("questions")
      .withIndex("by_date", (q) => q.eq("date", args.date))
      .unique();
  },
});

export const getTodayContext = query({
  args: { today: v.string() },
  handler: async (ctx, args) => {
    const question = await ctx.db
      .query("questions")
      .withIndex("by_date", (q) => q.eq("date", args.today))
      .unique();
    if (question === null) return { question: null, week: null };
    const week = await ctx.db
      .query("weeks")
      .withIndex("by_weekNumber", (q) => q.eq("weekNumber", question.weekNumber))
      .unique();
    return { question, week };
  },
});

export const getAllWeeks = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("weeks").withIndex("by_weekNumber").order("asc").take(100);
  },
});

export const getSeasonBounds = query({
  args: {},
  handler: async (ctx) => {
    const first = await ctx.db.query("weeks").withIndex("by_weekNumber").order("asc").first();
    const last = await ctx.db.query("weeks").withIndex("by_weekNumber").order("desc").first();
    return { first, last };
  },
});
