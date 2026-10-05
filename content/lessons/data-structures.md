# Choose a structure from the operations.

A data structure is a set of tradeoffs. Start with the questions your algorithm repeatedly asks, then choose a representation that makes those questions cheap.

## The operation dictionary

| Repeated question | Useful structure | What you pay for |
| --- | --- | --- |
| What is at position i? | Array or vector | Middle insertions move later elements; growth may reallocate. |
| Have I seen this key, and how often? | Hash map or set | Expected lookup bounds; hashing and equality cost; no sorted order. |
| What remains unresolved most recently? | Stack | Efficient access at one end. |
| What should be processed next in arrival order? | Queue or deque | Efficient end operations; middle lookup needs something else. |
| Which candidate currently has minimum priority? | Heap | O(log n) updates; it does not give a fully sorted traversal for free. |
| What comes before or after this key? | Ordered search tree | O(log n) comparisons, plus the cost of comparing keys. |
| Can I remove this already-known item from an ordering? | Doubly linked list | You need a node reference; searching the list is still linear. |
| Which strings share this prefix? | Trie | Space for nodes or edges; decide what one edge represents. |
| Are these vertices in the same growing component? | Disjoint-set union | Ordinary DSU does not directly support arbitrary edge deletions. |
| What is the aggregate over a range after updates? | Fenwick or segment tree | Extra structure; the aggregate and update algebra must fit. |

## Follow the dependency

Learn [hashing and summaries](/patterns/hashing-and-sufficient-summaries/) before a top-k frequency problem. Learn [stacks and deques](/patterns/stacks-and-monotonic-deques/) before maintaining an extremum under expiry. Learn [heaps](/patterns/heaps-and-the-candidate-frontier/) before merging several sorted streams.

For hierarchical data, compare [recursive trees](/patterns/linked-lists-and-recursive-trees/) with [tries](/patterns/tries-and-string-structure/). In a character trie, an edge consumes a character. In a directory tree, it consumes a whole path component. The shared idea is incremental navigation through a structured key.

For graph connectivity and ordering, study [DSU and dependencies](/patterns/dependencies-and-merging-components/). For changing aggregates, study [range-query structures](/patterns/range-queries-under-updates/).

## Compose only when one structure is insufficient

In the [LRU cache](/system-design/lru-cache/), a map finds a node and a list maintains recency. A map alone cannot identify the oldest access cheaply. A list alone cannot locate a key cheaply. Their combination needs a new invariant: both views refer to exactly the same entries.

Try specifying operations without naming a structure: “insert an item, delete an arbitrary item, and return a uniformly random stored item.” Work out why an array plus a map of positions helps, and why deletion should update the moved item's position. Then attempt [LeetCode 380](https://leetcode.com/problems/insert-delete-getrandom-o1/).

## Questions to ask before coding

What grows? What expires? Are keys ordered? Do I need identity or equality? Can operations be processed offline? Does my proposed structure support deletion, or only insertion? Does an output require copying or sorting?

Answering those questions prevents a familiar collection from becoming an unjustified default. See the [Rust implementation guide](/patterns/rust-as-an-implementation-tool/) for ownership, integer, and string considerations.
