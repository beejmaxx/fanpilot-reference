# Build a vocabulary of reasoning moves.

The useful pattern is the observation that makes an approach work. A heap is a tool; “only the best k candidates can affect the answer” is a reason to reach for one.

This guide starts with derivations, then develops the common algorithm families and their boundaries. It currently links 125 practice problems. It does not contain every LeetCode problem or claim a complete taxonomy.

## Start with a problem, then explain the change

Write down the simplest correct solution, the repeated work or unnecessary candidates, the observation that removes that work, and the invariant that makes the change safe. Only then choose the data structure and implementation.

For a first pass, read [how to use the guide](/patterns/how-to-use-this-book/), [derive and justify a solution](/patterns/derive-and-justify-a-solution/), and [the reasoning moves](/patterns/reasoning-moves-that-unlock-problems/). Use [the dependency-based curriculum](/patterns/a-curriculum-built-around-dependencies/) to choose your next topic.

## Separate learning from testing

In a learning session, use worked examples and increasingly specific hints. Close them and reconstruct the reasoning from a blank page. In a testing session, hide the topic and attempt an unfamiliar problem without help. Record those outcomes separately.

Revisit old problems after a delay, but also try a new variation. Remembering an implementation and selecting the right approach are different skills. The [transfer exercises](/patterns/transfer-exercises/) include changes that make a familiar method fail; [hints and answers](/patterns/hints-and-transfer-exercise-answers/) live on a separate page.

## The chapters

{{CHAPTER_LINKS}}

## Put the pieces together

The [LRU cache lab](/system-design/lru-cache/) combines lookup and recency order. The [file-system lab](/system-design/file-system/) combines hierarchical lookup, traversal, and search. Use them to practice maintaining several connected invariants rather than identifying a single tag.

Prefer paper? The [PDF edition](/leetcode-bible-patterns.pdf) is the original patterns manuscript. The web lessons are maintained separately and can grow beyond that snapshot.
