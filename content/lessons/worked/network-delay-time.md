# Network Delay Time

*Worked lesson · Dijkstra's minimum frontier · LC 743*

**Difficulty: Medium.** Prerequisites: directed adjacency lists and heaps. Related chapter: [weighted shortest paths](/patterns/weighted-shortest-paths/).

## 1. The problem

Each `[u,v,w]` is a **directed** link taking w time units. Nodes are labeled `1..n`, and all weights are **nonnegative**, including zero. A signal starts at k and spreads along links. Return the earliest time when **every** node has received it, or −1 if any node is unreachable. Ordered endpoint pairs are unique. Preserve the input. [LeetCode 743](https://leetcode.com/problems/network-delay-time/).

| Input: times, n, k | Answer | Why |
|---|---:|---|
| `[[1,2,4],[1,3,1],[3,2,1]], 3, 1` | 2 | Node 2 receives via 3, faster than its direct link |
| `[[1,2,4]], 2, 2` | −1 | The arrow cannot be traversed backward |
| `[[1,2,0]], 2, 1` | 0 | A zero-time link delivers immediately |

## 2. A correct baseline

Repeatedly improve all edges, allowing one more edge per round. Any shortest route can be chosen simple under nonnegative weights, so at most n−1 edges suffice.

```python
def baseline(times, n, k):
    distance = [float('inf')] * (n + 1)
    distance[k] = 0
    for _ in range(n - 1):
        updated = distance.copy()
        for u, v, weight in times:
            updated[v] = min(updated[v], distance[u] + weight)
        distance = updated
    answer = max(distance[1:])
    return -1 if answer == float('inf') else answer

assert baseline([[1, 2, 4], [1, 3, 1], [3, 2, 1]], 3, 1) == 2
assert baseline([[1, 2, 4]], 2, 2) == -1
assert baseline([[1, 2, 0]], 2, 1) == 0
```

This Bellman–Ford baseline takes O(n(n + E)) time, counting the copied distance array and E edge scans per round, and O(n) extra space. **Bottleneck:** scanning every edge in every round, even when its source's best distance has not changed.

## 3. The observation

The smallest tentative arrival time is final. Any route reaching that node through an unsettled node must first reach a frontier at least as expensive, and nonnegative edges cannot reduce its cost. Settle the cheapest node, then inspect only its outgoing links. A min-heap selects that frontier node; old entries can remain in the heap and be skipped when popped.

The network answer is the **maximum** shortest arrival time, because signals travel concurrently. Summing all arrival times would model a different task.

## 4. The solution and a trace

```python
from heapq import heappop, heappush

class Solution:
    def networkDelayTime(self, times: list[list[int]], n: int, k: int) -> int:
        """Nodes 1..n, source in range, unique directed links with weights >= 0."""
        graph = [[] for _ in range(n + 1)]
        for u, v, weight in times:
            graph[u].append((v, weight))
        distance = [float('inf')] * (n + 1)
        distance[k] = 0
        settled = [False] * (n + 1)
        pending = [(0, k)]
        while pending:
            arrival, node = heappop(pending)
            if settled[node] or arrival != distance[node]:
                continue
            settled[node] = True  # Its shortest arrival is now final.
            for neighbor, weight in graph[node]:
                candidate = arrival + weight
                if not settled[neighbor] and candidate < distance[neighbor]:
                    distance[neighbor] = candidate
                    heappush(pending, (candidate, neighbor))
        answer = max(distance[1:])
        return -1 if answer == float('inf') else answer

solve = Solution().networkDelayTime
assert solve([[1, 2, 4], [1, 3, 1], [3, 2, 1]], 3, 1) == 2
assert solve([[1, 2, 4]], 2, 2) == -1
assert solve([[1, 2, 0]], 2, 1) == 0
```

For the first example, the heap is shown in pop order and distances omit unused index 0:

| Event | Distances for 1,2,3 | Heap afterward |
|---|---|---|
| Initialize | `[0,∞,∞]` | `[(0,1)]` |
| Settle 1 | `[0,4,1]` | `[(1,3),(4,2)]` |
| Settle 3 | `[0,2,1]` | `[(2,2),(4,2)]` |
| Settle 2 | `[0,2,1]` | `[(4,2)]` |
| Skip old entry for 2 | `[0,2,1]` | `[]` |

## 5. Why it works

Each finite tentative distance is the length of a discovered route, so it never underestimates the true shortest distance. When the smallest heap entry is settled, a hypothetical shorter route would cross from the settled set into an unsettled node. That crossing was already relaxed, yielding a frontier no more expensive than the hypothetical route. Nonnegative weights make this contradict the chosen minimum. Thus every settled distance is exact. Reachable nodes are eventually discovered and settled; undiscovered ones remain infinite. Taking the maximum exact distance gives the first time all nodes have received the signal.

## 6. Cost, edge cases, and failure

Building adjacency lists costs O(n + E). Each node's edges are scanned once, causing at most E improvements and heap insertions. Time is O(n + E log(E + 1)), also bounded by O((n + E) log(n + 1)) for unique endpoint pairs. Extra space is O(n + E), including stale heap entries. Zero-weight cycles are safe because only strict improvements are pushed. Empty links with n = 1 return zero as an extension beyond the official nonempty-times constraint.

Negative weights destroy finalization, even without a negative cycle:

```python
negative = [[1, 2, 2], [1, 3, 5], [3, 2, -10], [2, 4, 10]]
assert solve(negative, 4, 1) == 12  # Outside contract: settles 2 too early.
assert baseline(negative, 4, 1) == 5  # True arrivals: 0, -5, 5, 5.
assert solve([], 1, 1) == 0
```

{{DEEP_DIVE}}

#### Check it against the baseline

```python
import random
rng = random.Random(743)
for _ in range(700):
    n = rng.randrange(1, 9)
    times = [[u, v, rng.randrange(6)]
             for u in range(1, n + 1) for v in range(1, n + 1)
             if u != v and rng.randrange(4) == 0]
    k = rng.randrange(1, n + 1)
    before = [edge[:] for edge in times]
    assert solve(times, n, k) == baseline(times, n, k)
    assert times == before
assert solve([[i, i + 1, 100] for i in range(1, 100)], 100, 1) == 9900
```

#### Related problems

| Problem | What changes | What follows |
|---|---|---|
| [Shortest Path in Binary Matrix](https://leetcode.com/problems/shortest-path-in-binary-matrix/) | Every step has equal cost | BFS layers replace the heap |
| [Cheapest Flights Within K Stops](https://leetcode.com/problems/cheapest-flights-within-k-stops/) | A path has a stop budget | One distance per node is insufficient; retain the budget state |

#### Reconstruct it

Prove why the cheapest frontier is final before writing a heap loop. Explain stale entries, zero weights, and why the final answer takes a maximum of shortest distances.

{{END_DEEP_DIVE}}
