# Full-catalog continuation

Repository: `/Users/bijan/code/projects/fanpilot-reference`.
Original solution corpus: `/Users/bijan/code/studies/learning/leet_rust/all_leetcode`.

## Objective and current scope

The user means **all 4,072 entries in the frozen catalog**, with readable solutions
and original explanations. The twenty technique groups in `docs/roadmap.md` help
choose prerequisites; they are not a stopping point. Work in reviewable chunks.
The user will switch to Sol after reviewing this batch. Claude handles design
and navigation; this continuation should focus on content.

Use Python for Algorithms and Pandas, SQL for Database, JavaScript/TypeScript for
language-specific questions. Keep platform IDs internally for linking and
reconciliation; organize readers' navigation around titles and concepts.

## State at handoff

- 22 registered worked lessons; 4,050 catalog entries still have no lesson.
- The original twelve and the next ten have passed automated checks.
- Neither batch has a recorded source-hash human approval yet; do not invent it.
- `data/lesson-batches.json` records both batches as awaiting review.
- `data/lesson-progress.json` inventories every catalog entry.
- `data/lesson-verification.json` records commands and exact lesson-source hashes.
- New lessons were committed individually. No changes are deployed or pushed.

The newest ten are Valid Anagram, Longest Substring Without Repeating Characters,
Move Zeroes, Maximum Subarray, Merge Intervals, Reverse Linked List, Maximum Depth
of Binary Tree, Number of Islands, House Robber, and Trapping Rain Water.
Their own displayed tests include 7,500 seeded random reference comparisons,
1,093 exhaustive small rain-water cases, node-identity checks, a 5,000-node
linked chain, a 10,000-node tree chain and a 300×300 land grid.

Validation completed: 89 printed Python blocks; existing extra reference tests;
7 lab tests; 65 generated routes and 361 internal-link targets; desktop/mobile,
search, labs, problem-library and no-JavaScript checks. Separately verified all
10 new solution-browser panels, descriptions, examples, highlighted code and
lesson links. Passing tests is evidence about code, not human content approval.

## Authoring contract

Read `docs/lesson-template.md` and existing lessons before editing. Steps 1–6
stay visible: original problem statement and examples, baseline+bottleneck,
observation, solution+trace, short correctness argument, complexity+failure case.
Only extra checks, related problems and reconstruction prompts are collapsed
between `{{DEEP_DIVE}}` and `{{END_DEEP_DIVE}}`.

Files: `content/lessons/worked/<slug>.md`. Preserve the exact subtitle format
`*Worked lesson · Technique · LC number*`. Use the numbered template headings.
The solution browser extracts the first Python block under `The solution and a
trace`; include all imports and required node/helper types in that block so the
copied code is self-contained. LeetCode wrappers should match platform methods.
Do not claim official acceptance. Label any behavior outside the official
contract, such as accepting empty input.

Register each lesson in EXTRA in `scripts/build.py`; content additions should
change only those registrations. Do not redesign `src/` or
`scripts/solution_browser.py` while Claude owns them. Layout changes from
side-by-side to stacked panels are CSS concerns, not content rewrites.

Use local references where they contain the needed contract. Local solutions
are reference material, not permission to copy unlicensed/adapted code into
MIT examples. Write original Python and prose; link statements instead of
reproducing them. Verify missing contracts/difficulty from primary sources.
Do not copy private `python_practice/` attempts or tutoring records.

## Continuing after review

Choose the next batch of ten (five for unusually complex Hard problems).
Favor small related clusters and useful contrasting variants, filling missing
techniques first and eventually the complete catalog. The learner may authorize
larger runs later. Respect the present request to review between batches.

For each lesson: verify its printed code against a simpler independent baseline,
include edge cases and a seeded generated comparison, and commit separately.
State mutation, tie/output-order, empty-input and numeric assumptions explicitly.
Do not mark human approval based on test results.

Run before handing off a batch:

```sh
python3 scripts/build.py
python3 scripts/check-lessons.py
npm test
```

With the preview server running, `python3 scripts/catalog-progress.py --verify`
runs these plus `npm run test:site` and `npm run test:solutions` and updates
source-hash receipts. The latter checks every registered solution and its copyable
code, mobile layout, deep links, asynchronous loading, retries and request races.
Also review presentation at `/solutions/#<lesson-slug>`; passing interaction
checks does not establish explanation quality.

## Static-site scaling for Claude

Stay with static HTML/JSON and browser JavaScript. A database is not required for
publishing thousands of lessons. The initial scaling work is now implemented:
each page embeds its own outline; search fetches a separate index on the first
query; the browser loads its index and one problem payload at a time, keeping
five recent payloads. The build generates content-addressed JSON from the
existing Markdown and retains current/previous asset versions. At 22 lessons,
the homepage is about 12.3 KiB and browser shell 1.8 KiB, plus a 4 KiB solution
index and a selected payload of 3.3–8.2 KiB, uncompressed. Full-text search data
is currently 250 KiB; consider sharding it if measured search performance becomes
poor as the catalog grows. Claude can continue navigation/design work separately.
Personal review state can stay local; a backend is a future choice for synced
accounts or remote code execution.

No Sites, GitHub Actions, accounts or database setup are requested. Deployments
remain manual. Keep system-design expansion separate from completing this catalog.

## Direct handoff to Sol in tmux pane 3 (2026-10-06)

The user explicitly wants Sol to do the remaining full-catalog content work to
save credits. The user corrected the infrastructure detour: prioritize adding
actual Python solutions and lessons, not more site optimization. Loading/search
work is finished and committed as `417077d`; its build, 89 Python blocks, seven
lab tests, 65-page site check, and all 22 solution-browser checks passed.

Three NEW draft files are untracked, not registered, not yet executed or reviewed:

- `content/lessons/worked/linked-list-cycle.md` (141)
- `content/lessons/worked/balanced-binary-tree.md` (110)
- `content/lessons/worked/diameter-of-binary-tree.md` (543)

Review and finish those rather than overwriting or recreating them. Complete
this ten-problem batch by adding Validate Binary Search Tree (98), Course
Schedule (207), Redundant Connection (684), Network Delay Time (743), Subsets
(78), Coin Change (322), and Edit Distance (72). Local Rust files in
`src/section01/pNNNN_*.rs` in the original corpus include problem contracts.
Write original Python/prose, using the exact existing lesson template. The tree
drafts deliberately use iterative postorder to handle deep trees in Python.

Then register each lesson, execute baseline/reference comparisons, build, run
site/solution checks, update batch/progress/verification records, and commit each
finished lesson separately. Tests are not human approval. Report concrete
problem names and counts frequently (the user requested periodic updates).
The intended scope remains all 4,072 catalog entries, in reviewable chunks;
this next ten is a batch, not the complete task. Avoid further infrastructure,
redesign, deployment, CI, or database work. Preserve Claude's design work.

Current published-content count before these drafts: 22 complete, 4,050 missing.
Preview: http://127.0.0.1:8765/solutions/ . A dev server is already listening;
restart it only if builder changes require it. Do not claim drafts as completed.
