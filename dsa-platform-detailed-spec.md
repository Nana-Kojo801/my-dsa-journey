# DSA Journey Platform — Detailed Spec

## 1. Concept
A personal-accountability platform for a 4-month Data Structures & Algorithms (DSA) journey, built to be used by the creator and anyone who wants to join the same structured journey. It combines a fixed weekly curriculum with daily LeetCode practice, automated score extraction from screenshots, streaks, and leaderboards to gamify consistency.

## 2. Core Loop
- The platform is organized into **weeks**, each with one DSA **topic**.
- Each week has a **syllabus**: a detailed, hard-coded explanation of the topic (written to take a learner from beginner to competent on that topic). Users are also free to research further on their own.
- Each week contains **7 daily questions** tied to that topic, one per day of the week, increasing in difficulty across the week (Day 1 easiest → Day 7 hardest).
- Topics/weeks themselves also increase in difficulty as the 4 months progress.
- Each day, the user:
  1. Views that day's question (with a link out to the actual LeetCode problem).
  2. Solves it on LeetCode.
  3. Takes a screenshot of their LeetCode submission result (the panel showing runtime %, memory %, time complexity, space complexity).
  4. Uploads that screenshot to the platform.
  5. The platform sends the image to a vision-capable model (e.g. GPT-4o/vision) with a prompt to extract: runtime percentile, memory percentile, time complexity, space complexity.
  6. The extracted values are stored as that day's submission record. **The screenshot image itself is never stored** — it's used transiently for extraction only, then discarded.
  7. If extraction fails or looks wrong, the user is told extraction failed and can submit **feedback** describing what was wrong (see Feedback System below).

## 3. Resubmission Rule
Users may resubmit a solution for the same day's question (e.g. after optimizing). The platform keeps the **best** runtime/memory percentile achieved for leaderboard purposes, and always keeps the most recent extracted values as the "current" display record. There is no time-to-solve tracking (deemed unreliable/unfair — see Section 9).

## 4. Automated Daily Rollout
- The day's question is not published manually — it's pulled from that week's syllabus automatically via a **Convex scheduled/cron job** that runs once daily to advance to the next question.
- The UI (e.g. on the leaderboard/today's-question area) shows a **countdown timer** to the next rollout, so users can see how much time is left before the next day's question unlocks.

## 5. Gamification
- **Streaks**: consecutive days with a valid submission. Includes a small number of "streak freeze" tokens per month (e.g. 1–2) that auto-apply to cover a missed day without breaking the streak.
- **Leaderboards**: filterable by Daily / Weekly / Monthly / Overall (all-time). Each shows rank based on cumulative score (see Scoring below).
- **Weekly Reveal**: an animated, shareable recap at the end of each week (styled like a "wrapped" recap) — highlights that week's top performer(s), most improved, and the user's own personal stats for the week (best percentile, streak, questions completed).
- **Scoring**: a points system combining completion (points for solving the day's question at all) plus bonus points scaled to runtime/memory percentile achieved. Exact formula left flexible/configurable — should reward consistency over raw speed, since the "most improved" and "completion" angles matter as much as the top percentile.

## 6. Social Features
- **Per-question comment thread**: each daily question has its own comment section where users can discuss it, vent, encourage each other, etc.
- **Simple sharing loop**: users can share their weekly reveal externally (e.g. to LinkedIn) to invite others to join.

## 7. Accounts
- Simple username + password authentication. No social login needed. No public profile beyond what's needed for leaderboards/comments (display name).

## 8. Notifications
- Implemented as a PWA using Web Push (VAPID) — no native app needed.
- Notification triggers include (at minimum): daily reminder to submit, and being overtaken on a leaderboard.

## 9. Feedback System
- If a user believes the vision model misread their screenshot (wrong percentile/complexity extracted), they can flag it and submit a short feedback note.
- Feedback entries are stored with: user, day/question reference, what was extracted, what the user says is wrong, timestamp.
- Creator reviews feedback entries in aggregate to identify patterns in extraction failures and improve the extraction prompt over time.

## 10. Deliberate Non-Features (things considered and rejected)
- **No time-to-solve tracking**: there's no reliable way to know when a user actually started solving (they might open the tab and walk away), so this metric would be inaccurate and unfair. Dropped entirely.
- **No visible screenshot storage or display**: screenshots are used only transiently to extract text via the vision model, then discarded. Nothing is stored or shown — this avoids storage cost, moderation concerns, and privacy issues.
- **No emoji-reaction system on screenshots**: dropped once screenshots were removed from the visible product, since there's nothing to react to. (Comments per question serve the social/reaction function instead.)

## 11. Tech Stack
- **Frontend**: React + Tailwind CSS v4 (the new version — no `tailwind.config` file; config lives in CSS via `@theme`/`@import "tailwindcss"` — do not fall back to the old v3-style config).
- **Component library**: shadcn/ui as the base, customized/restyled by Claude Design rather than used with default styling.
- **Icons**: no icon library — Claude Design generates a fully custom, unique icon set for the app based on the design files (no Lucide/Heroicons/etc.).
- **Package manager**: pnpm (strictly — not npm or yarn).
- **Database**: Convex.
- **PWA**: the app is a PWA, with Web Push notifications via VAPID.

## 12. Content Structure Needed at Launch
- A full 4-month (≈17-week) syllabus: one topic per week, ordered by increasing difficulty, each with a detailed hard-coded explanation.
- 7 LeetCode questions per week (with direct links), one per day of the week (no rest days), ordered by increasing difficulty within the week, and increasing in difficulty week over week.
