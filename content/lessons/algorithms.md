# Find the transformation, then the algorithm.

An algorithm becomes easier to discover when you can explain exactly what changes between a slow correct solution and a faster one. The vocabulary below organizes those changes.

## Remove repeated work

**Repeated lookup:** compute the key you need and retain a useful summary. Read [hashing](/patterns/hashing-and-sufficient-summaries/).

**Overlapping range computation:** express a range through boundary summaries, or update an existing window incrementally. Compare [prefix sums](/patterns/prefix-sums-and-algebraic-transformations/) with [sliding windows](/patterns/sliding-windows-and-monotone-validity/).

**Repeated futures:** two different histories can share a result if the remaining choices depend on the same sufficient state. Read [dynamic programming](/patterns/dynamic-programming-from-sufficient-state/).

## Remove candidates safely

**An ordered comparison rules out many pairs:** use [two pointers](/patterns/two-pointers-and-safe-elimination/) and state what cannot contain the answer after each move.

**Feasibility changes only once:** use [binary search over a boundary](/patterns/binary-search-over-a-boundary/). The hard part may be proving the decision procedure, not writing the search loop.

**A candidate is worse under every shared future:** use dominance. It appears in [monotone deques](/patterns/stacks-and-monotonic-deques/), greedy proofs, and DP state compression. Compare the candidates under the same continuation before discarding one.

## Change the model

Treat legal moves as [graph edges](/patterns/graph-modeling-and-traversal/). Treat prerequisites as [a dependency graph](/patterns/dependencies-and-merging-components/). Treat a last action as a boundary between independent subproblems in [interval DP](/patterns/dynamic-programming-families/).

When no safe shortcut is available, make enumeration precise. [Backtracking](/patterns/backtracking-and-the-search-tree/) defines a search tree, then prunes only branches that cannot produce a valid or better answer.

## Practice choosing, not just executing

Read [the reasoning moves](/patterns/reasoning-moves-that-unlock-problems/) and [the observation map](/patterns/a-map-of-useful-observations/). Then compare [deceptively similar problems](/patterns/similar-looking-problems-with-different-rules/).

After learning a family, use the [untagged transfer exercises](/patterns/transfer-exercises/). Before looking at a solution, write the baseline, bottleneck, enabling observation, invariant, and counterexample to your first idea.

The [advanced-family directory](/patterns/advanced-families-and-when-they-become-useful/) identifies next topics such as flow, binary lifting, digit DP, and geometry. It is a guide to further study, not a replacement for a derivation of those techniques.
