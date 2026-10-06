# Sliding Window Maximum

*Worked lesson · Monotonic deque · LC 239*

**Difficulty: Hard.** This lesson extends the pending-days idea from [Daily Temperatures](/worked/daily-temperatures/) to candidates that also expire. The result is a monotonic deque, where both ends do work. Prerequisite: Daily Temperatures and fixed-size windows. A deque is a sequence that supports efficient removal from either end. Related chapter: [stacks and monotonic deques](/patterns/stacks-and-monotonic-deques/).

## 1. The problem

Given a list of integers `nums` and a window size `k`, return the maximum of every block of `k` consecutive numbers, moving the block one position at a time. Assume `1 <= k <= len(nums)`; negative values and duplicates are allowed. Do not change the input. This is [Sliding Window Maximum](https://leetcode.com/problems/sliding-window-maximum/) (LC 239).

| Numbers; k | Result | Why |
|---|---|---|
| `[4, 2, 3, 1, 5]`; `3` | `[4, 3, 5]` | Maxima of `[4,2,3]`, `[2,3,1]`, `[3,1,5]` |
| `[2, 2, 1]`; `2` | `[2, 2]` | Equal maxima can occupy different windows |
| `[-3, -1]`; `1` | `[-3, -1]` | Each element is its own window |

There are `len(nums) − k + 1` windows. The hard part is the second example's opposite: what happens when the current maximum **leaves** the window.

## 2. A correct baseline

Take the maximum of each window directly.

```python
def baseline(nums, k):
    return [max(nums[start:start + k]) for start in range(len(nums) - k + 1)]

assert baseline([4, 2, 3, 1, 5], 3) == [4, 3, 5]
assert baseline([2, 2, 1], 2) == [2, 2]
assert baseline([-3, -1], 1) == [-3, -1]
```

Each window costs k steps: O((n − k + 1) · k) time. With n = 100,000 and k = 50,000 that is about 2.5 billion comparisons.

**The bottleneck.** Adjacent windows share k − 1 values, and the baseline re-examines all of them. The obvious repair is to keep a running maximum, but it breaks when the maximum leaves. In `[5, 1, 2]` with `k = 2`, the first maximum is 5. When 5 leaves, the remembered "5" says nothing about whether 1 or 2 is next. We need backups, and the question is which ones.

## 3. The observation

Consider two indexes in the window, an older `i` and a newer `j`, with `nums[i] <= nums[j]`. Every future window that still contains `i` also contains `j`, because `i` expires first. And `nums[j]` is at least as large. So `i` is **never needed again**: discard it permanently.

After discarding every such dominated index, the survivors, oldest to newest, have **strictly decreasing** values. That shape gives both operations:

- **The maximum is the oldest survivor.** Values decrease toward the new end, so the front holds the largest.
- **A new value removes from the back.** It dominates every survivor that is less than or equal to it, and those are exactly the ones at the new end.
- **Expiry removes from the front.** The window moves forward, so indexes leave in order, oldest first.

Daily Temperatures removed only at the new end, so a stack was enough. Here candidates also expire at the old end, so removals happen at both ends: a deque. Store indexes, because a value alone does not say when it expires.

The property doing the work is that windows only move forward: whatever leaves, leaves from the old end.

## 4. The solution and a trace

```python
from collections import deque

class Solution:
    def maxSlidingWindow(self, nums: list[int], k: int) -> list[int]:
        """Return window maxima; requires 1 <= k <= len(nums)."""
        candidates = deque()  # Indexes in the window; their values strictly decrease.
        answer = []
        for right, number in enumerate(nums):
            left = right - k + 1
            while candidates and candidates[0] < left:
                candidates.popleft()
            while candidates and nums[candidates[-1]] <= number:
                candidates.pop()
            candidates.append(right)
            if right >= k - 1:
                answer.append(nums[candidates[0]])
        return answer

solve = Solution().maxSlidingWindow
assert solve([4, 2, 3, 1, 5], 3) == [4, 3, 5]
assert solve([2, 2, 1], 2) == [2, 2]
assert solve([-3, -1], 1) == [-3, -1]
assert solve([5, 1, 2], 2) == [5, 2]
```

Trace `[4, 2, 3, 1, 5]` with `k = 3`:

| Right / value | Removed | Candidate indexes (values) | Output |
|---|---|---|---|
| `0 / 4` | None | `[0]` (4) | Window incomplete |
| `1 / 2` | None | `[0, 1]` (4, 2) | Window incomplete |
| `2 / 3` | Index 1: dominated by 3 | `[0, 2]` (4, 3) | `4` |
| `3 / 1` | Index 0: expired | `[2, 3]` (3, 1) | `3` |
| `4 / 5` | Indexes 3 and 2: dominated by 5 | `[4]` (5) | `5` |

At `right = 3` the maximum 4 leaves, and the backup 3 is already waiting at the front. That backup is what the running maximum could not provide.

## 5. Why it works

**Invariant.** After processing `right`, the deque holds exactly the indexes `i` in the window `[left, right]` such that every later index in the window has a strictly smaller value. They are in increasing index order, so their values strictly decrease.

**The front is the maximum.** Let `m` be the **last** index in the window holding the window's maximum. Every later index has a smaller value, so `m` is in the deque. Values in the deque strictly decrease, and none exceeds the maximum, so `m` is at the front.

**Each step keeps the invariant.** When `right` arrives, an index at the back with value at most `nums[right]` now has a later index that is not smaller, so it no longer qualifies; the loop removes exactly those. The rest have values greater than `nums[right]`, so they still qualify, and `right` itself qualifies trivially. An index that has dropped out of the window is removed from the front, which is where the oldest index sits.

## 6. Cost, edge cases, and failure

**Complexity.** Each index is appended once and removed at most once, from one end or the other. Total time is O(n), despite the nested loops. The deque holds at most k indexes, so O(k) extra space plus the output. Python's `deque.popleft()` is O(1); a list's `pop(0)` shifts every element and would bring back O(nk) behaviour.

**Edge cases.** `k = 1` returns the input's values; `k = len(nums)` returns one maximum. With duplicates, `<=` discards the older equal value, which expires sooner; `<` would also be correct, just with a longer deque.

**Where it fails.** The expiry test is `< left`, because index `left` is still inside the window. An off-by-one there throws away a live maximum:

```python
class ExpireEarly:  # deliberately wrong: drops index left while it is still in the window
    def maxSlidingWindow(self, nums, k):
        candidates, answer = deque(), []
        for right, number in enumerate(nums):
            left = right - k + 1
            while candidates and candidates[0] <= left:
                candidates.popleft()
            while candidates and nums[candidates[-1]] <= number:
                candidates.pop()
            candidates.append(right)
            if right >= k - 1:
                answer.append(nums[candidates[0]])
        return answer

assert ExpireEarly().maxSlidingWindow([4, 2, 3, 1, 5], 3) == [3, 3, 5]  # wrong: the first window's maximum is 4
assert solve([4, 2, 3, 1, 5], 3) == [4, 3, 5]
```

The technique itself fails when smaller values still matter. For the window **median**, a value that is older and smaller still affects the median's position, so domination never discards it. That problem needs two heaps or an order-statistics structure.

{{DEEP_DIVE}}

#### Check it against the baseline

```python
import random

rng = random.Random(239)
for _ in range(2000):
    nums = [rng.randint(-4, 4) for _ in range(rng.randint(1, 12))]
    k = rng.randint(1, len(nums))
    assert solve(nums, k) == baseline(nums, k), (nums, k)
```

#### Related problems

| Problem | What changes | What follows |
|---|---|---|
| [Daily Temperatures](https://leetcode.com/problems/daily-temperatures/) (LC 739) | No expiry: find the first warmer later day. | A stack is enough. See [the lesson](/worked/daily-temperatures/). |
| [Longest Continuous Subarray With Absolute Diff Less Than or Equal to Limit](https://leetcode.com/problems/longest-continuous-subarray-with-absolute-diff-less-than-or-equal-to-limit/) (LC 1438) | The window size varies; validity depends on max − min. | Two deques, one for the maximum and one for the minimum, inside a [sliding window](/worked/shortest-subarray-reaching-a-sum/). |
| [Shortest Subarray with Sum at Least K](https://leetcode.com/problems/shortest-subarray-with-sum-at-least-k/) (LC 862) | Negative values break the plain window. | A monotonic deque of prefix sums, with candidate starts leaving from both ends. |
| [Jump Game VI](https://leetcode.com/problems/jump-game-vi/) (LC 1696) | Dynamic programming where each step takes the best of the previous k results. | This lesson's deque, run over the DP values as they are computed. |
| [Sliding Window Median](https://leetcode.com/problems/sliding-window-median/) (LC 480) | The median instead of the maximum. | The deceptive pair. Domination fails, so use two heaps with lazy deletion. |

#### Reconstruct it

From a blank page: say why a single running maximum fails, then state the domination rule in one sentence. Derive the two removal rules from it, "too old" at the front and "cannot win" at the back, and explain why the expiry test is `< left`.

{{END_DEEP_DIVE}}
