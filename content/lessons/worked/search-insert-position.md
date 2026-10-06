# Search Insert Position

*Worked lesson · Binary search over a boundary · LC 35*

**Difficulty: Easy.** Prerequisites: sorted lists and index ranges. This introduces [binary search over a boundary](/patterns/binary-search-over-a-boundary/), before searching an answer space in harder problems.

## 1. The problem

Given a sorted list of distinct integers and a target, return the target's zero-based index if present. Otherwise return where it should be inserted to preserve sorted order. Return only an index; do not insert or change the list. This is [Search Insert Position](https://leetcode.com/problems/search-insert-position/) (LC 35).

| Numbers; target | Answer | Why |
|---|---:|---|
| `[1, 3, 5, 6]`; `5` | 2 | Target already occupies index 2 |
| `[1, 3, 5, 6]`; `2` | 1 | Insert between 1 and 3 |
| `[1, 3, 5, 6]`; `7` | 4 | Insert after the last element |

Our function also returns `0` for an empty list, an extension beyond the platform's nonempty input contract. Values may be negative. “Insertion position” can equal the list's length; it need not be an existing index.

## 2. A correct baseline

Walk until the first value at least as large as the target. If none exists, insert at the end.

```python
def baseline(nums, target):
    for i, number in enumerate(nums):
        if number >= target:
            return i
    return len(nums)

assert baseline([1, 3, 5, 6], 5) == 2
assert baseline([1, 3, 5, 6], 2) == 1
assert baseline([1, 3, 5, 6], 7) == 4
assert baseline([], 4) == 0
```

Time is O(n), with O(1) extra space. **The bottleneck:** checking every smaller value separately, even though one comparison in a sorted list can rule out many positions.

## 3. The observation

The predicate `nums[i] >= target` changes from false to true at most once. For `[1, 3, 5, 6]` and target 2, it is `[False, True, True, True]`. We want the first true position, or n if all positions are false.

If the middle value is too small, everything to its left is too small too. Otherwise the middle is a possible boundary, and we must keep searching to its left. Equality does not need a separate early-return case.

## 4. The solution and a trace

```python
class Solution:
    def searchInsert(self, nums: list[int], target: int) -> int:
        """For sorted distinct integers, return the target's insertion index."""
        left = 0
        right = len(nums)
        # Values before left are too small; values at or after right are large enough.
        while left < right:
            middle = (left + right) // 2
            if nums[middle] < target:
                left = middle + 1
            else:
                right = middle
        return left

solve = Solution().searchInsert
assert solve([1, 3, 5, 6], 5) == 2
assert solve([1, 3, 5, 6], 2) == 1
assert solve([1, 3, 5, 6], 7) == 4
assert solve([], 4) == 0
```

`right` starts one past the last element. We never index it directly; `middle` is always inside the remaining half-open range `[left, right)`.

Trace target `2` in `[1, 3, 5, 6]`:

| left, right | Middle/value | Update |
|---|---|---|
| `0, 4` | `2 / 5` | Large enough: `right = 2` |
| `0, 2` | `1 / 3` | Large enough: `right = 1` |
| `0, 1` | `0 / 1` | Too small: `left = 1` |
| `1, 1` | No candidates left | Return 1 |

## 5. Why it works

Throughout the search, every value before `left` is smaller than the target, and every value at or after `right` is at least the target. Sorted order justifies each update. On exit, the bounds meet at the first position whose value is large enough, or at n if there is none. That is exactly the existing target's index or its insertion position.

Both branches shrink the range: `middle + 1` excludes a known false position, while `right = middle` keeps that position as a possible boundary. Using `left = middle` could get stuck when only one position remains.

## 6. Cost, edge cases, and failure

The range approximately halves each time: O(log n) time for nonempty input and O(1) extra space. Targets before the first value return 0; targets after the last return n. Empty input skips the loop. Duplicates would make this return the first matching position, though the platform specifies distinct values.

Unsorted input destroys the false-then-true boundary:

```python
assert solve([3, 1, 2], 3) == 3  # Deliberately invalid input: 3 already exists at index 0.
assert baseline([3, 1, 2], 3) == 0
```

Neither function promises a sorted insertion result on unsorted input; the example shows why this search cannot be reused as an arbitrary-list lookup.

{{DEEP_DIVE}}

#### Check it against the baseline

```python
import random
rng = random.Random(35)
for _ in range(1500):
    nums = sorted(rng.sample(range(-30, 31), rng.randrange(25)))
    target = rng.randint(-35, 35)
    before = nums.copy()
    position = solve(nums, target)
    assert position == baseline(nums, target)
    assert all(value < target for value in nums[:position])
    assert all(value >= target for value in nums[position:])
    assert nums == before
```

#### Related problems

| Problem | What changes | What follows |
|---|---|---|
| [Find First and Last Position](https://leetcode.com/problems/find-first-and-last-position-of-element-in-sorted-array/) | Duplicate values; find both ends | Search for the first value ≥ target and the first value > target |
| [Search in Rotated Sorted Array](https://leetcode.com/problems/search-in-rotated-sorted-array/) | Sorted order is rotated | The global predicate is no longer monotone; first reason about which half is sorted |
| [Koko Eating Bananas](https://leetcode.com/problems/koko-eating-bananas/) | Search for a speed, not an array position | Derive a monotone feasibility test, then find its first true value |

#### Reconstruct it

Draw the false/true sequence before writing code. Explain why the true branch uses `right = middle`, while the false branch uses `left = middle + 1`.

{{END_DEEP_DIVE}}
