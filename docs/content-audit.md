# Content audit

Audited 2026-10-06 before any bulk lesson writing. Repositories compared:

- Website: `/Users/bijan/code/projects/fanpilot-reference`
- Corpus and original Bible: `/Users/bijan/code/studies/learning/leet_rust/all_leetcode`

## Source of truth

`content/patterns.md` and the corpus's `book/leetcode-bible.md` are the same manuscript: 1,156 lines each, identical headings, and only one textual difference. The website's sources section wraps bare URLs in angle brackets (chapter 31, `S1`–`S16`). No chapter, example, or problem link exists in one and not the other.

**Decision:** the website's `content/patterns.md` is canonical from now on. `book/leetcode-bible.md` and the PDF are historical snapshots. Edit the website first; regenerate a PDF only as a deliberate, reviewed release.

## What the corpus contains, and what it does not

| Asset | Size | Usable on the site? |
| --- | --- | --- |
| Problem catalog (`catalog/doocs-coverage.json`) | 4,072 problems, 177 topic tags | Yes, as metadata. Imported to `data/problems.json` (doocs index, CC BY-SA 4.0, attributed). |
| Rust solutions, `src/section01`–`04` | about 2,900 files | Not as published code. Provenance and licence are unrecorded, and the corpus has no git history yet. |
| Rust solutions, `src/imported/` | 199 files | Possible with attribution (warycat/rustgym, MIT), but solutions alone are not lessons. |
| Python, SQL, TS, JS, shell solutions | 511 files | Mostly adapted from doocs (CC BY-SA 4.0). Publishing requires keeping that licence on each file. |
| Company lists (`hxu296`, `liquidslr`, `krishnadey30`, `jobream`) | thousands of rows | No. Derived from LeetCode Premium data and quickly outdated. |
| `python_practice/` | 18 exercises plus tutoring notes | No. A learner's private attempts and progress records; its AGENTS.md says to keep it separate. Website exercises must be original. |

Having a solution file does not mean a problem has a lesson. Across the corpus, no solution file contains a problem statement, a baseline, a trace, or a correctness argument.

## Quality of the existing website content

Strengths:

- Accurate and careful. Claims are hedged, sources are cited with their limits, and boundaries of each technique are stated.
- Strong reasoning frame: chapters 2–4 (derivation, reasoning moves, observation map) and chapter 25 (similar-looking problems) are the site's distinctive material.
- Two interactive design labs with tested models.

Gaps measured against the seven-step lesson format (`docs/lesson-template.md`):

| Step | Chapters 5–23 today |
| --- | --- |
| 1. Problem with concrete examples | Rarely. Problems are linked, not stated. |
| 2. Baseline and bottleneck | Mentioned in a sentence, almost never shown as code. |
| 3. Enabling observation | Present and good, but compressed. |
| 4. Readable solution and trace | 8 of 19 chapters have code (Rust); 1 has anything like a trace. |
| 5. Invariant or proof | Stated briefly in most chapters. |
| 6. Complexity, edge cases, failure | Complexity usually; a counterexample in about half. |
| 7. Related problems changing one constraint | Practice lists without notes on what changes. |

Each technique chapter is 300–420 words. They read as dense summaries for someone who already half-knows the technique, not as first teaching. Other gaps:

- No learner-facing Python. All code is Rust.
- Data structures page is a single table plus links; there are no per-structure lessons (operations, invariants, implementation, costs).
- System design has the requirements checklist and two local labs. There are no distributed-service case studies (rate limiter, URL shortener, key-value store, feed, chat, queue).
- No interview-process material: how to run a 45-minute coding round, communication, behavioural questions, study plans.
- Search embeds every page's text in every page. Fine at 45 pages (home page is about 190 KB); it will need a separate index file as lessons grow.

## Plan that follows from the audit

1. **Keep chapters as the condensed layer.** Add worked lessons as a separate deep layer instead of inflating chapters. Chapters link to their lessons.
2. **Two exemplar lessons first (done):** `worked/shortest-subarray-reaching-a-sum` and `worked/subarrays-summing-to-k`, a deceptive pair. Review these before writing more; the template should change if the exemplars reveal problems.
3. **Then one lesson per core technique, in dependency order** (see `docs/roadmap.md`), each reviewed before the next batch.
4. **Original Python only.** Every block runs under `npm run test:lessons`, with a random comparison against a baseline.
5. **Do not import solution code wholesale.** Revisit only after the corpus is under version control with per-file provenance.
