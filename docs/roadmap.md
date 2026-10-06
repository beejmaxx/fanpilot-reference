# Roadmap

Goal: the most useful free guide to data structures, algorithms, LeetCode-style problems, system design, and software-engineering interviews. Measured by whether a reader can solve an unfamiliar problem and defend the solution, not by page count.

Each phase is reviewed before the next begins. Nothing is bulk-generated.

## Phase 1: foundation (done, 2026-10-06)

- Content audit and source-of-truth decision (`docs/content-audit.md`).
- Section-aware builder: worked lessons, grouped navigation.
- Problem library: 4,072 problems, topic filters, links to the chapters and lessons that teach each one.
- Two exemplar worked lessons forming a deceptive pair, with executed Python checks.

## Phase 2: core technique lessons

One worked lesson per technique, in dependency order. Each pairs with the existing chapter.

1. Hashing: two-sum family and grouping by a canonical key
2. Two pointers on sorted input (with the "why not a hash map" contrast)
3. Binary search over a boundary (first-true search, then search on answer)
4. Stack: matching and next-greater element (monotonic stack)
5. Monotonic deque: sliding window maximum
6. Heap: top k and merging k sorted lists
7. Intervals: merge, insert, and meeting rooms (greedy with exchange argument)
8. Linked lists: reversal and cycle detection
9. Trees: recursion with return values (depth, balance, diameter)
10. Binary search tree validity and ordered traversal
11. Graph traversal: grid islands (BFS and DFS) and shortest steps
12. Topological sort: course schedule
13. Union-find: connected components and redundant edge
14. Dijkstra, with the negative-edge counterexample
15. Backtracking: subsets, permutations, pruning
16. 1D dynamic programming: house robber and coin change
17. 2D dynamic programming: edit distance and LCS
18. Trie: prefix search and word search II
19. Bit manipulation: single number and counting bits
20. Range queries: prefix sums to Fenwick tree

## Phase 3: deeper sections

- **Data structures:** one page per structure (array, hash table, linked list, stack/queue, heap, BST/ordered map, trie, graph representations, union-find, Fenwick/segment tree): operations, invariants, Python implementation, costs, and when not to use it.
- **System design case studies:** rate limiter, URL shortener, key-value store, news feed, chat, job queue, search autocomplete. Each with contract, estimates, baseline, a pressure that changes it, failure drills ("a replica lags; what does the user see?"), and changed-requirement exercises.
- **Interviews:** running a 45-minute coding round, communicating while solving, testing out loud, behavioural questions, and a study plan grounded in the research page's evidence.

## Phase 4: practice tools

- **Untagged practice:** a random problem from the library with its topics hidden; write the baseline and observation, then reveal guide links.
- **Interactive traces:** reusable step-through widgets (sliding window, binary search, BFS, Dijkstra), built like the LRU lab.
- **Spaced review:** a browser-only list (no accounts) that resurfaces lessons for reconstruction after a delay.
- **Search index:** move page text out of every page into a separate file once the site grows past about 100 pages.

## Not planned

- Accounts, databases, or comments.
- GitHub Actions or automatic deployment. Checks and deploys are run by hand.
- Copying problem statements, company frequency lists, or unlicensed solution code.
