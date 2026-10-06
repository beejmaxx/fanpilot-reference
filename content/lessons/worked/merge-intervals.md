# Merge Intervals

*Worked lesson · Sort then merge · LC 56*

**Difficulty: Medium.** Prerequisites: sorting and interval endpoints. Related chapter: [sorting-intervals-and-greedy-choices](/patterns/sorting-intervals-and-greedy-choices/).

## 1. The problem

Combine overlapping inclusive intervals into a new list of non-overlapping intervals covering exactly the same positions. Touching endpoints count as overlap. Each pair has start ≤ end; input may be unsorted. Keep the input and its inner lists unchanged. [LeetCode 56](https://leetcode.com/problems/merge-intervals/). Empty input is also supported.

| Input | Answer | Why |
|---|---|---|
| `[[8,10],[1,3],[2,6]]` | `[[1,6],[8,10]]` | The first two sorted intervals overlap |
| `[[1,3],[3,5]]` | `[[1,5]]` | Shared endpoint 3 |
| `[]` | `[]` | No intervals to cover |

## 2. A correct baseline

```python
def baseline(intervals):
    parts=[pair.copy() for pair in intervals]
    changed=True
    while changed:
        changed=False
        for i in range(len(parts)):
            for j in range(i+1,len(parts)):
                if max(parts[i][0],parts[j][0])<=min(parts[i][1],parts[j][1]):
                    parts[i]=[min(parts[i][0],parts[j][0]),max(parts[i][1],parts[j][1])]
                    parts.pop(j)
                    changed=True
                    break
            if changed:
                break
    return sorted(parts)

assert baseline([[8,10],[1,3],[2,6]])==[[1,6],[8,10]]
assert baseline([[1,3],[3,5]])==[[1,5]]
assert baseline([])==[]
```

O(n³) upper-bound time and O(n) space: each of at most n−1 merges can restart a pairwise search. **Bottleneck:** repeatedly searching the whole collection for overlaps.

## 3. The observation

Sort by start. Earlier completed groups cannot overlap a new interval if the last group cannot: they end even earlier. Compare only the last merged interval. Overlap extends its end with max; containment must never shrink it.

## 4. The solution and a trace

```python
class Solution:
    def merge(self, intervals: list[list[int]]) -> list[list[int]]:
        """Inclusive intervals, start <= end; return new sorted pairs."""
        merged=[]
        for start,end in sorted(intervals):
            if not merged or start>merged[-1][1]:
                merged.append([start,end])
            else:
                merged[-1][1]=max(merged[-1][1],end)
        return merged

solve=Solution().merge
assert solve([[8,10],[1,3],[2,6]])==[[1,6],[8,10]]
assert solve([[1,3],[3,5]])==[[1,5]]
assert solve([])==[]
```

| Next sorted interval | Output so far |
|---|---|
| `[1,3]` | `[[1,3]]` |
| `[2,6]` | `[[1,6]]` |
| `[8,10]` | `[[1,6],[8,10]]` |

## 5. Why it works

The output stays sorted, non-overlapping, and covers exactly the processed intervals. A disjoint new interval starts a new group. An overlapping one changes only the last group's end without altering its covered union. Sorted starts guarantee that no older completed group needs reopening.

## 6. Cost, edge cases, and failure

O(n log n) time and O(n) space including the sorted copy and output. Equal starts, singleton intervals and fully contained intervals work. Our implementation also handles negative endpoints, beyond the platform's nonnegative-endpoint restriction. Closed endpoints are important: use > for disjointness, not ≥.

```python
assert solve([[1,10],[2,3]])==[[1,10]]  # Assigning end=3 would incorrectly shrink coverage.
assert solve([[1,3],[3,5]])==[[1,5]]  # Treating equality as disjoint changes the contract.
```

{{DEEP_DIVE}}

#### Check it against the baseline

```python
import random,copy
rng=random.Random(56)
for _ in range(500):
    intervals=[]
    for _ in range(rng.randrange(10)):
        a,b=sorted([rng.randint(0,15),rng.randint(0,15)])
        intervals.append([a,b])
    before=copy.deepcopy(intervals)
    assert solve(intervals)==baseline(intervals)
    assert intervals==before
```

#### Related problems

| Problem | What changes | What follows |
|---|---|---|
| [Insert Interval](https://leetcode.com/problems/insert-interval/) | Existing intervals are already sorted and disjoint | Use a linear before/overlap/after scan |
| [Meeting Rooms II](https://leetcode.com/problems/meeting-rooms-ii/) | Need simultaneous room count, not union | Merging erases overlap multiplicity, so it cannot answer the new question |

#### Reconstruct it

Explain why only the final output interval can overlap the next input. Test a contained interval and a touching endpoint.

{{END_DEEP_DIVE}}
