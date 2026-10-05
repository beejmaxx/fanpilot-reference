# Learn the ideas that survive a new problem.

A free reference for turning requirements into useful observations, correct algorithms, and defensible designs. Start with a question you cannot yet answer independently.

{{LEARNING_PATHS}}

## Two designs to take apart

**[An LRU cache](/system-design/lru-cache/).** Combine fast lookup with recency order. Predict an eviction, run the operation, and check the invariants. Then change the rules: threads, TTL, byte limits, and admission.

**[An in-memory file system](/system-design/file-system/).** Model paths as a hierarchy. Create directories, append and read files, and see how lookup, traversal, and composable search answer different questions.

## A useful way to study

Start with the simplest correct approach. Name the work that makes it expensive. Find an observation that removes that work. State what must remain true. Then test both the implementation and your ability to reconstruct the reasoning.

The patterns guide includes **32 chapters, 125 linked practice problems, and eight Rust examples**. The two interactive design lessons are an initial foundation for the system-design section; this is a growing reference, not a completed encyclopedia.

Use [unfamiliar transfer exercises](/patterns/transfer-exercises/) to distinguish remembering a solution from understanding an idea. Keep the [review worksheet](/patterns/review-pages-and-contribution-method/) nearby.

## Where the ideas come from

The guide cites published curricula, primary algorithm references, and research on learning. The explanations and interactive lessons are written for this project. Read the [sources](/patterns/sources-and-further-reading/) and the [research notes](/research/) for what was reviewed and what remains unverified.
