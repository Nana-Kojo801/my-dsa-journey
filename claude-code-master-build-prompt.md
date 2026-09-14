You are building "DSA Journey" — a personal accountability platform for a 4-month structured DSA (Data Structures & Algorithms) practice journey, combining a weekly curriculum, daily LeetCode practice verified via screenshot vision-extraction, streaks, and leaderboards.

Full functional spec: see `dsa-platform-detailed-spec.md` in this repo/folder — read it fully before starting. It defines the concept, core loop, gamification, social features, accounts, notifications, feedback system, deliberate non-features, and tech stack. Treat it as the source of truth for what the app does.

## Design — strict requirement
Look in the `ui-design` folder for the design of the app and **strictly follow it** — layouts, components, spacing, colors, typography, and the custom icon set are all defined there. Do not introduce your own design decisions, default shadcn/ui styling, or a generic icon library where the `ui-design` folder already shows what to use. If something is genuinely not covered by the design files (an edge case, an empty state, etc.), stay consistent with the existing visual language rather than inventing a new style.

## Step 1 — Generate the syllabus first
Before writing application code, generate the full 4-month syllabus content. Use the instructions in `claude-code-syllabus-prompt.md` in this repo/folder exactly as written — this requires real research into DSA topic ordering and canonical LeetCode questions per topic, not assumptions. Output the syllabus as structured, parseable content (JSON or similar) so it can be loaded into Convex as seed data. Show the topic-ordering reasoning before finalizing it. Do not proceed to Step 2 until the syllabus is generated.

## Step 2 — Build the platform
Using the syllabus from Step 1 as seed content, and strictly following the spec files and the `ui-design` folder, build the full application per the tech stack defined in the spec:
- React + Tailwind CSS v4 (v4 syntax only — no `tailwind.config` file, use `@theme`/`@import "tailwindcss"` in CSS)
- shadcn/ui as the base, restyled to match `ui-design` (not default shadcn styling)
- Custom icon set only, as defined in `ui-design` — no icon libraries
- pnpm as the package manager (not npm/yarn)
- Convex as the database, including the scheduled/cron job that auto-advances to the next day's question and seeds/reads the syllabus
- PWA with Web Push (VAPID) notifications

Build all pages/screens and core mechanics from `dsa-platform-detailed-spec.md`, including:
- Daily question flow with screenshot upload → vision-model extraction (runtime %, memory %, time/space complexity) → no screenshot ever stored
- Extraction failure handling + feedback submission flow
- Resubmission logic (best percentile kept, latest values shown as current)
- Streaks with monthly streak-freeze tokens
- Daily/Weekly/Monthly/Overall leaderboards
- Weekly reveal recap (top performer, most improved, personal recap)
- Per-question comment threads
- Countdown timer to next day's question rollout
- Username/password auth

## Notes
- This is for real personal use starting immediately — it needs to actually work end-to-end, not just look complete.
- Ask before making assumptions on anything the spec, syllabus, or `ui-design` folder doesn't clearly resolve, rather than guessing silently on core mechanics (e.g. scoring formula specifics).
