# Redundant Connection

*Worked lesson · Union-find connectivity · LC 684*

**Difficulty: Medium.** Prerequisites: undirected paths and connected components. Related chapter: [dependencies and merging components](/patterns/dependencies-and-merging-components/).

## 1. The problem

An **undirected** graph began as a tree on labels `1..n`, then received one new edge between distinct nodes. The input contains n distinct edges. Return an edge whose removal restores a tree; among possible answers, choose the one **last in input order**. Preserve the input and endpoint order. We additionally return `[]` for empty input. [LeetCode 684](https://leetcode.com/problems/redundant-connection/).

| Edges | Answer | Why |
|---|---|---|
| `[[1,2],[1,3],[2,3]]` | `[2,3]` | Last edge on the triangle |
| `[[1,2],[2,3],[3,4],[1,4],[1,5]]` | `[1,4]` | `[1,5]` is a bridge, so cannot be removed |
| `[[2,3],[1,3],[1,2]]` | `[1,2]` | Input order, not endpoint size, decides |
| `[]` | `[]` | Empty-input extension; no edge to return |

## 2. A correct baseline

Try removing each edge, starting from the end, and test connectivity. Under the promised input, a connected remainder has n−1 edges and therefore is a tree.

```python
def baseline(edges):
    n = len(edges)
    for removed in range(n - 1, -1, -1):
        graph = [[] for _ in range(n + 1)]
        for i, (u, v) in enumerate(edges):
            if i != removed:
                graph[u].append(v)
                graph[v].append(u)
        seen, pending = {1}, [1]
        while pending:
            for v in graph[pending.pop()]:
                if v not in seen:
                    seen.add(v)
                    pending.append(v)
        if len(seen) == n:
            return edges[removed][:]
    return []

assert baseline([[1, 2], [1, 3], [2, 3]]) == [2, 3]
assert baseline([[1, 2], [2, 3], [3, 4], [1, 4], [1, 5]]) == [1, 4]
assert baseline([[2, 3], [1, 3], [1, 2]]) == [1, 2]
assert baseline([]) == []
```

O(n²) worst-case time, O(n) extra space. **Bottleneck:** reconstructing and traversing almost the same graph for each removal candidate.

## 3. The observation

Process edges forward instead. If two endpoints are already connected, the new edge closes a cycle. Otherwise merge their components. Union-find stores only component membership, which is sufficient for this question.

A tree plus one edge has exactly one cycle. The edge that first closes it is the **last cycle edge in input order**: before that edge, all other edges of its cycle are already present. Later edges are bridges attached to that component. This explains why the first failed merge satisfies the tie rule.

## 4. The solution and a trace

```python
class Solution:
    def findRedundantConnection(self, edges: list[list[int]]) -> list[int]:
        """Simple undirected tree plus one edge, labels 1..len(edges); [] extends it."""
        parent = list(range(len(edges) + 1))
        size = [1] * len(parent)
        def find(node):
            while node != parent[node]:
                parent[node] = parent[parent[node]]  # Halve the path to its root.
                node = parent[node]
            return node
        for u, v in edges:
            a, b = find(u), find(v)
            if a == b:
                return [u, v]
            # Attach the smaller component to the larger representative.
            if size[a] < size[b]:
                a, b = b, a
            parent[b] = a
            size[a] += size[b]
        return []

solve = Solution().findRedundantConnection
assert solve([[1, 2], [1, 3], [2, 3]]) == [2, 3]
assert solve([[1, 2], [2, 3], [3, 4], [1, 4], [1, 5]]) == [1, 4]
assert solve([[2, 3], [1, 3], [1, 2]]) == [1, 2]
assert solve([]) == []
```

For the first example:

| Edge | Roots before merge | Components afterward | Action |
|---|---|---|---|
| Start | — | `{1}, {2}, {3}` | Initialize |
| `[1,2]` | 1, 2 | `{1,2}, {3}` | Merge at root 1 |
| `[1,3]` | 1, 3 | `{1,2,3}` | Merge at root 1 |
| `[2,3]` | 1, 1 | Unchanged | Return this edge |

## 5. Why it works

After each successful merge, two nodes share a representative exactly when the processed edges connect them. Initially each node is alone; joining distinct components preserves this invariant. A failed merge witnesses an existing path plus the new edge, hence a cycle. The unique-cycle property makes that edge the last removable cycle edge. Removing it leaves the original connected graph connected and with n−1 edges, so it is a tree. Bridges cannot be answers because removing one disconnects the graph.

## 6. Cost, edge cases, and failure

There are n edges and two finds per edge. Union by size with path halving gives O(n α(n)) amortized time, where α is the inverse Ackermann function, and O(n) space. Size is meaningful only at representatives. The result is a fresh list; input edges are unchanged. The contract's one-extra-edge promise supplies the tie argument.

Union-find does not detect **directed** cycles: connected endpoints do not imply a path in the required direction.

```python
edges = [[1, 2], [1, 3], [2, 3]]
assert solve(edges) == [2, 3]
assert all(u < v for u, v in edges)  # As arrows, 1,2,3 is a valid topological order.
# Thus treating this DSU result as a directed-cycle witness would be wrong.
```

{{DEEP_DIVE}}

#### Check it against the baseline

```python
import random
from itertools import combinations, permutations
rng = random.Random(684)
for _ in range(500):
    n = rng.randrange(3, 15)
    edges = [[rng.randrange(1, v), v] for v in range(2, n + 1)]
    used = {tuple(edge) for edge in edges}
    choices = [pair for pair in combinations(range(1, n + 1), 2) if pair not in used]
    edges.append(list(rng.choice(choices)))
    rng.shuffle(edges)
    before = [edge[:] for edge in edges]
    actual = solve(edges)
    assert actual == baseline(edges)
    assert edges == before and all(actual is not edge for edge in edges)
# All 360 orderings of simple four-node, four-edge graphs are connected here.
for chosen in combinations(combinations(range(1, 5), 2), 4):
    for order in permutations(chosen):
        edges = [list(edge) for edge in order]
        assert solve(edges) == baseline(edges)
```

#### Related problems

| Problem | What changes | What follows |
|---|---|---|
| [Number of Provinces](https://leetcode.com/problems/number-of-provinces/) | Count final components | Decrease the count on successful merges |
| [Course Schedule](/worked/course-schedule/) | Edges are directed dependencies | Indegrees or DFS path states replace undirected connectivity |

#### Reconstruct it

Explain what a representative certifies and why a failed merge closes a cycle. Then derive the input-order tie rule from the unique cycle, rather than assuming the last input edge is always removable.

{{END_DEEP_DIVE}}
