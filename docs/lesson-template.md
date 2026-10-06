# Worked lesson template

Use the existing lessons in `content/lessons/worked/` as models. A lesson teaches one problem completely and earns the reader's trust by showing the reasoning, not just the code.

## File and registration

- Path: `content/lessons/worked/<slug>.md`, with the URL `/worked/<slug>/`.
- Register it in `EXTRA` in `scripts/build.py` with the group `'Worked lessons'`.
- First line after the `#` title: `*Worked lesson · <Technique> · LC <number>*`. The build uses this line to link the problem library to the lesson.
- One short paragraph that opens with the official difficulty, `**Difficulty: Easy.**` (or Medium, Hard), and names the prerequisite and the related pattern chapter.

## Sections

The derivation is the lesson, so steps 1–6 are always visible. Use these headings, numbered: the [solution browser](/solutions/) reads `The problem` and the first code block under `The solution and a trace`.

1. **The problem.** State it in your own words (do not copy the platform statement), then link it. Give a table of three or more examples with explanations, including an empty or no-answer case. Point out the words that matter ("contiguous", "at least", "positive").
2. **A correct baseline.** Readable Python with assertions on the examples. Give its cost, then name **the bottleneck**: the specific repeated work or unnecessary candidates.
3. **The observation.** The fact about the input that removes the bottleneck, and the property it depends on. If a tempting technique fails, show the failure here with a small counterexample in code (it may get its own numbered section before the observation).
4. **The solution and a trace.** Python with a docstring stating preconditions, a comment on the key variable's meaning, and assertions. A trace table on one example, with a row per state change.
5. **Why it works.** An invariant plus an argument that the answer is neither too small nor too large (or that every item is counted exactly once). Name where the input property is used.
6. **Cost, edge cases, and failure.** Time and space with the counting argument. Edge cases specific to this problem. A counterexample where the technique breaks, as asserted code.

Then a collapsed block for the extras, between standalone `{{DEEP_DIVE}}` and `{{END_DEEP_DIVE}}` lines, using fourth-level headings:

- **Check it against the baseline.** A seeded random comparison of the solution with the baseline.
- **Related problems.** A table: problem link, what changes, what follows. Include at least one deceptive pair. Alternatives worth knowing can go here too.
- **Reconstruct it.** Two or three sentences telling the reader what to reproduce from a blank page.

Never move steps 2–6 into the collapsed block. A reader who skips it should still see why the solution is what it is.

## Rules

- Python 3 standard library only. Each lesson's blocks run in order as one program under `npm run test:lessons`; keep blocks self-contained with that in mind.
- Deliberately wrong code is allowed when it teaches, but must be labelled in a comment and asserted to give the wrong answer.
- Claims about LeetCode constraints must match the linked problem. Do not claim official acceptance.
- Write original prose. Cite any source you relied on beyond common knowledge.
- Review a lesson as a learner would: can each step be predicted from the previous one?
