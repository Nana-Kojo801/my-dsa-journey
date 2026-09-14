You are generating the full syllabus content for a 4-month DSA (Data Structures & Algorithms) accountability platform. This is a content-generation task, not a coding task — do not write application code in this step, just produce the syllabus data.

## Context
- Start date: today.
- Duration: 4 months from the start date, broken into weekly blocks (assume ~16-17 weeks depending on exact date math — calculate the real number of weeks between the start date and the 4-month end date, don't assume a round number).
- Each week = one DSA topic.
- Each week has exactly 7 LeetCode questions tied to that topic, one per day (7 days/week, no rest days), ordered from easiest to hardest within the week.
- Topics themselves must also increase in overall difficulty as the weeks progress (early weeks = foundational topics with easier questions, later weeks = advanced topics with harder questions).

## What you need to research before generating anything
Do not rely purely on your own assumptions — actually research this properly:
1. **The standard/best-practice ordering of DSA topics** for someone going from beginner to advanced (e.g. what topic should logically come before another — arrays before two pointers, before sliding window, before hashing, before trees, before graphs, before DP, etc.). Look at how well-regarded structured DSA study plans order topics (e.g. widely-used roadmaps, courses, or curated LeetCode study plans like NeetCode's roadmap, Blind 75/Grind 75 progression, or similar reputable sources).
2. **Specific, well-regarded LeetCode questions for each topic**, ordered from easier to harder, checking actual LeetCode difficulty ratings (Easy/Medium/Hard) and, where possible, acceptance rate or reputation as a "canonical" question for that topic. Avoid picking obscure or poorly-rated questions — prefer questions that are commonly recommended in known study plans for that topic.
3. Make sure the questions assigned within a week actually match that week's topic (not just similarly named).
4. Make sure difficulty is monotonically non-decreasing both within a week (day 1 easiest → day 5 hardest) and across the whole 4 months (later weeks should not be easier than earlier weeks on average).

## What to produce
A structured syllabus artifact (e.g. a JSON or Markdown file — your call, but keep it structured/parseable since it will later be loaded into a database) containing, for every week:
- Week number
- Start date and end date of that week (real calendar dates, computed from today as day 1)
- Topic name
- A detailed written explanation of the topic, thorough enough to take a beginner to competent understanding of that specific topic (this is the actual content a user will read to learn the topic that week — it needs to be genuinely good, not a one-paragraph summary)
- The 7 LeetCode questions for that week, each with: question title, direct LeetCode URL, difficulty (Easy/Medium/Hard), and a one-line note on why it was chosen / what concept it reinforces

## Important
- Verify LeetCode URLs are real, correct, and point to the actual named problem — do not fabricate problem names or links.
- Show your topic-ordering reasoning briefly before the syllabus output (a short list of the topic order and why), so it can be sanity-checked before being treated as final.
- Once the syllabus is generated, stop — do not proceed to build the application itself in this step.
