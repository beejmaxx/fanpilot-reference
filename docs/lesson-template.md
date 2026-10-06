# Worked lesson template

Use the two existing lessons in `content/lessons/worked/` as models. A lesson teaches one problem completely and earns the reader's trust by showing the reasoning, not just the code.

## File and registration

- Path: `content/lessons/worked/<slug>.md`, with the URL `/worked/<slug>/`.
- Register it in `EXTRA` in `scripts/build.py` with the group `'Worked lessons'`.
- First line after the `#` title: `*Worked lesson · <Technique> · LC <number>*`. The build uses this line to link the problem library to the lesson.
- One short paragraph naming the prerequisite and the related pattern chapter.

## Sections

1. **The problem.** State it in your own words (do not copy the platform statement), then link it. Give a table of three or more examples with explanations, including an empty or no-answer case. Point out the words that matter ("contiguous", "at least", "positive").
2. **A correct baseline.** Readable Python with assertions on the examples. Give its cost, then name **the bottleneck**: the specific repeated work or unnecessary candidates.
3. **The observation.** The fact about the input that removes the bottleneck, and the property it depends on. If a tempting technique fails, show the failure here with a small counterexample in code.
4. **The solution and a trace.** Python with a docstring stating preconditions, a comment on the key variable's meaning, and assertions. A trace table on one example, with a row per state change.
5. **Why it works.** An invariant plus an argument that the answer is neither too small nor too large (or that every item is counted exactly once). Name where the input property is used.
6. **Cost, edge cases, and failure.** Time and space with the counting argument. Edge cases specific to this problem. A counterexample where the technique breaks, as asserted code. A seeded random comparison against the baseline.
7. **Related problems.** A table: problem link, what changes, what follows. Include at least one deceptive pair.
8. **Reconstruct it.** Two or three sentences telling the reader what to reproduce from a blank page.

## Rules

- Python 3 standard library only. Each lesson's blocks run in order as one program under `npm run test:lessons`; keep blocks self-contained with that in mind.
- Deliberately wrong code is allowed when it teaches, but must be labelled in a comment and asserted to give the wrong answer.
- Claims about LeetCode constraints must match the linked problem. Do not claim official acceptance.
- Write original prose. Cite any source you relied on beyond common knowledge.
- Review a lesson as a learner would: can each step be predicted from the previous one?
