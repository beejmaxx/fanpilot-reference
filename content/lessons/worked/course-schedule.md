# Course Schedule

*Worked lesson · Topological removal · LC 207*

**Difficulty: Medium.** Prerequisites: adjacency lists and queues. Related chapter: [dependencies and merging components](/patterns/dependencies-and-merging-components/).

## 1. The problem

Courses have labels `0` through `numCourses - 1`. A pair `[course, prerequisite]` requires the prerequisite **before** that course. Return whether an order exists that completes **all** courses, including isolated ones. Pairs are unique; leave the input unchanged. [LeetCode 207](https://leetcode.com/problems/course-schedule/).

| Input | Answer | Why |
|---|---|---|
| `2, [[1,0]]` | True | Take 0, then 1 |
| `2, [[1,0],[0,1]]` | False | Neither course can start |
| `3, []` | True | No prerequisites; any order works |
| `1, [[0,0]]` | False | A course cannot precede itself |

## 2. A correct baseline

Try every order, checking each prerequisite's position.

```python
from itertools import permutations

def baseline(num_courses, prerequisites):
    for order in permutations(range(num_courses)):
        position = {course: i for i, course in enumerate(order)}
        if all(position[pre] < position[course] for course, pre in prerequisites):
            return True
    return False

assert baseline(2, [[1, 0]])
assert not baseline(2, [[1, 0], [0, 1]])
assert baseline(3, [])
assert not baseline(1, [[0, 0]])
```

For V courses and E pairs, worst-case time is O(V! · (V + E)); extra space is O(V). **Bottleneck:** enumerating orders whose next course still has an unfinished prerequisite.

## 3. The observation

A course with no unfinished prerequisites is safe to take now. Completing it reduces the unfinished counts of its dependents. Store an edge from **prerequisite to course**, and an indegree counting each course's remaining prerequisites. A queue holds the courses whose counts reach zero. If the queue empties too early, the remaining courses contain a dependency cycle.

## 4. The solution and a trace

```python
from collections import deque

class Solution:
    def canFinish(self, numCourses: int, prerequisites: list[list[int]]) -> bool:
        """Positive course count; unique [course, prerequisite] pairs in range."""
        dependents = [[] for _ in range(numCourses)]
        remaining = [0] * numCourses
        for course, pre in prerequisites:
            dependents[pre].append(course)
            remaining[course] += 1
        # Ready courses have no prerequisites outside the completed set.
        ready = deque(i for i in range(numCourses) if remaining[i] == 0)
        completed = 0
        while ready:
            pre = ready.popleft()
            completed += 1
            for course in dependents[pre]:
                remaining[course] -= 1
                if remaining[course] == 0:
                    ready.append(course)
        return completed == numCourses

solve = Solution().canFinish
assert solve(2, [[1, 0]])
assert not solve(2, [[1, 0], [0, 1]])
assert solve(3, [])
assert not solve(1, [[0, 0]])
```

For `4, [[1,0],[2,0],[3,1],[3,2]]`, arrays are indexed by course:

| Event | Remaining counts | Queue afterward | Completed |
|---|---|---|---:|
| Initialize | `[0,1,1,2]` | `[0]` | 0 |
| Take 0 | `[0,0,0,2]` | `[1,2]` | 1 |
| Take 1 | `[0,0,0,1]` | `[2]` | 2 |
| Take 2 | `[0,0,0,0]` | `[3]` | 3 |
| Take 3 | `[0,0,0,0]` | `[]` | 4 |

## 5. Why it works

The remaining count always equals the number of a course's incoming edges from uncompleted courses. Processing one prerequisite removes exactly its outgoing edges. Each queued course is therefore safe, so completing all V courses constructs a valid order. If uncompleted courses remain with no zero count, follow an incoming edge within that finite remaining set repeatedly: some course repeats, giving a directed cycle. No valid order can place every member of that cycle after its predecessor. Thus early exhaustion proves impossibility.

## 6. Cost, edge cases, and failure

Every course enters the queue at most once, and every edge is processed once: O(V + E) time and O(V + E) extra space. Isolated courses must be counted; disconnected cycles still prevent finishing all courses. The input is not mutated. An undirected cycle test would reject valid dependencies:

```python
# The underlying triangle is cyclic, but its directed dependencies are a DAG.
assert solve(3, [[1, 0], [2, 0], [2, 1]])
assert not solve(4, [[1, 0], [3, 2], [2, 3]])  # A separate cyclic component.
```

{{DEEP_DIVE}}

#### Check it against the baseline

```python
import random
rng = random.Random(207)
for _ in range(350):
    n = rng.randrange(1, 7)
    pairs = [[a, b] for a in range(n) for b in range(n) if rng.randrange(5) == 0]
    before = [pair[:] for pair in pairs]
    assert solve(n, pairs) == baseline(n, pairs)
    assert pairs == before
assert solve(2000, [[i, i - 1] for i in range(1, 2000)])
```

#### Related problems

| Problem | What changes | What follows |
|---|---|---|
| [Course Schedule II](https://leetcode.com/problems/course-schedule-ii/) | Return an actual order | Record the queue's removal sequence |
| [Redundant Connection](https://leetcode.com/problems/redundant-connection/) | Undirected connectivity | Union-find detects a different kind of cycle; it cannot certify directed prerequisites |

#### Reconstruct it

Translate one prerequisite pair into an arrow before building the arrays. Explain exactly what the count means after several removals, and prove why a stuck nonempty remainder contains a cycle.

{{END_DEEP_DIVE}}
