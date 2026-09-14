# DSA Journey Platform — Functional Description (No Design Direction)

This document describes only what the application does and what each screen needs to contain and support. It intentionally contains no layout, styling, or visual design direction — that is left entirely to the designer.

## Accounts
- Username + password signup and login.
- Logged-out visitors can view the landing page, but submitting, commenting, and personal stats require login.

## Pages / Screens

### 1. Landing Page
Purpose: introduce the "DSA Journey" and show live activity to attract and orient visitors.
Must be able to:
- Explain what the journey is (4-month structured DSA practice).
- Show a leaderboard with a filter/toggle between: Daily, Weekly, Monthly, Overall (all-time).
- Link to sign up / log in.

### 2. Today's Question Page
Purpose: the daily core-loop screen a logged-in user lands on.
Must be able to:
- Show the current day's topic (i.e. this week's topic) and the specific question assigned for today.
- Show a link out to the actual LeetCode problem.
- Allow the user to upload a screenshot for extraction.
- Trigger the vision-model extraction process and display the extracted values (runtime %, memory %, time complexity, space complexity) back to the user once processed.
- Clearly indicate if extraction failed, and let the user submit feedback describing what was wrong (see Feedback below).
- Allow resubmission for the same day's question; when resubmitted, retain the best percentile achieved for leaderboard purposes while showing the latest extracted values as current.
- Show/link to that question's comment thread.

### 3. Weekly Syllabus / Topic Page
Purpose: where a user learns the week's topic before attempting the questions.
Must be able to:
- Display the full written explanation of the current (or any past) week's topic.
- List that week's 5 questions in order, each linking to its own Today's Question-style page (even for past days), each showing whether the user has completed it.

### 4. All Weeks / Curriculum Overview Page
Purpose: a browsable index of the whole 4-month program.
Must be able to:
- List all weeks in order with their topic names and a completion/progress indicator per week.
- Let the user click into any week's syllabus page (past or, optionally, upcoming).

### 5. Leaderboard Page
Purpose: dedicated, fuller version of the leaderboard shown on the landing page.
Must be able to:
- Show rankings filterable by Daily / Weekly / Monthly / Overall.
- Show each ranked user's relevant stats (score, streak, etc. as defined by the scoring system).

### 6. Weekly Reveal Page
Purpose: an end-of-week recap, generated once a week closes.
Must be able to:
- Show that week's top performer(s) and a "most improved" callout.
- Show the logged-in user's own personal recap for that week (questions completed, best percentiles, streak status).
- Be shareable (e.g. produce a link or shareable view a user could post externally).

### 7. Profile / Personal Stats Page
Purpose: a user's own dashboard of their journey so far.
Must be able to:
- Show current streak, streak freezes remaining/used, total score, and history of completed questions with their extracted stats.
- Show which week/day they're currently on.

### 8. Question Comments Page/Section
Purpose: social discussion per daily question.
Must be able to:
- Show a comment thread scoped to one specific day's question.
- Allow logged-in users to post and view comments.

### 9. Feedback Page/Flow
Purpose: let users report bad vision-model extractions so the creator can improve it.
Must be able to:
- Let a user submit a feedback note tied to a specific submission (which question/day, what was extracted, what they say is wrong).
- (Admin-only, not necessarily a full page) A way for the creator to view submitted feedback entries in aggregate.

## Notifications (PWA / Push)
- The app should support push notifications (Web Push/VAPID) for at least: a daily reminder to complete that day's question, and an alert when the user is overtaken on a leaderboard.

## Explicitly Not Included
- No storage or display of uploaded screenshots — used only transiently for extraction, then discarded.
- No time-to-solve tracking.
- No reactions on screenshots (there is nothing visible to react to).
