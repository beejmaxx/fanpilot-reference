# Full-catalog lessons

The target is every problem in `data/problems.json`, not only the twenty core
technique groups. The core roadmap is a prerequisite map for selecting batches.
The catalog snapshot has 4,072 entries: 3,665 Algorithms, 323 Database,
69 JavaScript / TypeScript and 15 Pandas. Use Python for Algorithms and Pandas, SQL for Database, and JavaScript/TypeScript
for language-specific problems, as chosen by the learner.

## Organization

Use titles, technique families, official difficulty and prerequisites for reader
navigation. Keep platform IDs internally for exact source links, deduplication
and coverage reconciliation. They are not a learning sequence or a measure of
progress. A lesson's source slug remains stable even if its displayed title changes.

## Batch size and review

Start with ten problems per new batch; use five if the batch has several complex
Hard problems. These sizes are working limits for review, not learning claims.
Select small related groups so a reviewer can compare assumptions and variations,
while filling gaps across the catalog over time. Do not mechanically walk IDs.

The existing twelve lessons form the pilot review. Their code checks pass, but
passing checks does not establish human content approval. Review description,
contract, difficulty, baseline, optimized Python, trace, correctness, complexity,
edge cases and counterexamples. Inspect actual browser statements and code.
Record approval only for the reviewed source hash. Changed content needs review again.

After each batch: run the lesson checks, build, lab checks and browser checks;
commit each lesson separately; provide links and a short review summary. Stop
before starting the next batch so the learner/Claude can review the current one.
This review cadence was explicitly requested by the learner.

## Tracking

- `data/lesson-batches.json` lists the pilot and proposed next ten problems.
- `data/lesson-progress.json` reconciles every catalog entry with registered lessons.
- `scripts/catalog-progress.py` regenerates it without importing the builder.
- `data/lesson-reviews.json`, when present, records manual review using problem ID,
  `source_sha256` and `status: approved` or `needs_changes`. Do not invent approvals.

Run `python3 scripts/catalog-progress.py` after a lesson is added or edited.
Use `python3 scripts/catalog-progress.py --verify` to run checks and record
source-hash receipts in `data/lesson-verification.json`. Browser checks require
the preview server at the configured URL.
`verification_status: not_recorded` means the ledger has no durable test receipt;
it does not mean the current implementation failed. Keep test evidence distinct
from whether a person has reviewed the explanation.

## Proposed next batch

| Title | Main teaching move | Difficulty |
|---|---|---|
| Valid Anagram | Count only the information comparison needs | Easy |
| Longest Substring Without Repeating Characters | Repair a window when a duplicate enters | Medium |
| Move Zeroes | Preserve order while compacting in place | Easy |
| Maximum Subarray | Extend the best previous ending or restart | Medium |
| Merge Intervals | Sort to make overlap comparisons local | Medium |
| Reverse Linked List | Save the next node before changing its link | Easy |
| Maximum Depth of Binary Tree | Return a summary from each subtree | Easy |
| Number of Islands | Mark a connected region before counting another | Medium |
| House Robber | Summarize the choices affected by adjacency | Medium |
| Trapping Rain Water | Use boundary heights to finalize water locally | Hard |

Difficulty labels are verified against platform pages when each lesson is authored.
The batch is a proposal, not a claim that its lessons are written or approved.
