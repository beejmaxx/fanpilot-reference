# Contributing

Help a reader discover, justify, or transfer an idea. Useful contributions include a clearer state definition, a counterexample, a missing assumption, an independent test, or a new worked design with explicit tradeoffs.

## A lesson's job

State the contract before choosing tools. Explain the simplest correct approach and its bottleneck. Identify the observation that permits a change, then justify the resulting invariant, recurrence, or greedy choice. Account for input, keys, output, and auxiliary space. Include a boundary where the technique fails and a changed-requirement exercise.

Keep untagged practice separate from hints and answers. Label generated exercises as original exercises; do not represent them as official platform questions. Distinguish an assisted reconstruction from an independent unfamiliar solve.

## Evidence and attribution

Write original teaching prose. Link to external problem statements and courses instead of importing them wholesale. Cite exact sources for technical or research claims and preserve third-party licensing. Clearly distinguish observed results, a source's claims, and our inference. Do not call a pattern taxonomy complete or a study schedule proven without corresponding evidence.

Use the research page to record what was actually reviewed. Public excerpts are not evidence of a review of an entire gated course. Test passing establishes implementation evidence for those cases, not educational effectiveness.

## Make a change

Edit Markdown under `content/`, assets under `src/`, or the build under `scripts/`. The two design lessons embed the exact model modules used in the labs and tests. Avoid a second printed implementation that can drift from the executable one.

Run the applicable checks from the README. Rust-example changes need `npm run test:patterns`. Lab behavior changes need `npm test`, with an independent reference or a counterexample when appropriate. Navigation, layout, and lab-control changes need the browser checks and visual inspection of the affected desktop/mobile screenshots. A prose correction needs a build and a check of the affected page and links.

New lesson routes are registered in `EXTRA` in `scripts/build.py`. Numbered pattern chapters are derived from the manuscript headings; changing a heading changes its URL. Preserve or deliberately redirect previously published URLs when renaming a page.

Do not hand-edit `dist/`, commit credentials, or include the separate Rust solution corpus. The PDF is a historical snapshot; editing the web manuscript does not update it. Regenerate and visually review a new PDF before replacing that asset.

Contributions to original prose and code are submitted under their respective project licenses: CC BY-SA 4.0 and MIT.
