# Two Sum

*Worked lesson · Hash lookup · LC 1*

**Difficulty: Easy.** This lesson turns a repeated search into a lookup in something you remembered. The same move, rewriting a condition on a pair so that one side depends only on the earlier element, drives [subarrays summing to k](/worked/subarrays-summing-to-k/). Prerequisite: loops, indexes, and dictionaries. Related chapter: [hashing and sufficient summaries](/patterns/hashing-and-sufficient-summaries/).

## 1. The problem

Given a list of integers `nums` and an integer `target`, find two **different positions** whose values add up to `target`, and return their indexes in either order. Do not change the input. [LeetCode 1](https://leetcode.com/problems/two-sum/) guarantees exactly one answer; our function also returns `[]` when there is none, so that boundary is explicit.

| Input; target | Result | Why |
|---|---|---|
| `[4, 1, 8, 6]`; `10` | `[0, 3]` | `4 + 6 = 10` |
| `[3, 3]`; `6` | `[0, 1]` | Equal values, different positions |
| `[5]`; `10` | `[]` | Using position 0 twice is not allowed |

"Different positions" is the phrase that matters. Equal values are fine, as in `[3, 3]`; reusing one index is not, as in `[5]`.

## 2. A correct baseline

Try every pair of positions `i < j`.

```python
def baseline(nums, target):
    for i in range(len(nums)):
        for j in range(i + 1, len(nums)):
            if nums[i] + nums[j] == target:
                return [i, j]
    return []

assert baseline([4, 1, 8, 6], 10) == [0, 3]
assert baseline([3, 3], 6) == [0, 1]
assert baseline([5], 10) == []
assert baseline([], 0) == []
```

When no pair exists, this checks all n(n − 1) / 2 pairs: O(n²) time, O(1) extra space. With 10,000 numbers that is about fifty million additions.

**The bottleneck.** Look at what the inner loop is really doing. For a fixed `nums[i]`, only one value can complete the pair: `target - nums[i]`. The inner loop is a linear search for that one value, and every outer iteration searches again through elements it has already seen.

## 3. The observation

Rewrite the condition so each side depends on one position:

> nums[i] + nums[j] == target  ⟺  nums[i] == target − nums[j]

Now walk left to right and treat each position `j` as the **later** element of a pair. The question becomes: "has the value `target − nums[j]` appeared at some earlier position?" That is a membership question about values already passed, and a dictionary answers it in expected O(1) time. Map each value seen so far to an index where it occurred.

Two details follow from the rewrite. The dictionary must contain only **earlier** positions, so look up the partner before storing the current value. And it needs to remember only one index per value, because any matching partner is acceptable.

The property doing the work is that the condition is an **exact equality**. A hash table answers "is this exact value present?", not "is some value within a range present?".

## 4. The solution and a trace

```python
class Solution:
    def twoSum(self, nums: list[int], target: int) -> list[int]:
        """Return distinct matching indexes; return [] if no pair exists."""
        seen = {}  # Each value maps to an index strictly before i.
        for i, number in enumerate(nums):
            needed = target - number
            if needed in seen:
                return [seen[needed], i]
            seen[number] = i
        return []

solve = Solution().twoSum
assert solve([4, 1, 8, 6], 10) == [0, 3]
assert solve([3, 3], 6) == [0, 1]
assert solve([5], 10) == []
assert solve([], 0) == []
```

Trace `[4, 1, 8, 6]` with target `10`:

| Index / value | Needed | In `seen`? | `seen` afterwards |
|---|---|---|---|
| `0 / 4` | `6` | No | `{4: 0}` |
| `1 / 1` | `9` | No | `{4: 0, 1: 1}` |
| `2 / 8` | `2` | No | `{4: 0, 1: 1, 8: 2}` |
| `3 / 6` | `4` | Yes, at index 0 | Return `[0, 3]` |

The pair was found when its **second** element arrived. The first element was simply remembered.

## 5. Why it works

**Invariant.** At the top of iteration `i`, `seen` contains every value from `nums[0 .. i − 1]`, each mapped to an index before `i` where that value occurs. It holds initially (nothing seen, empty dictionary), and each iteration adds `nums[i]` only after its lookup.

**Every returned pair is valid.** At iteration `i`, `seen[needed]` is an index before `i`, so the two positions differ, and its value is `needed = target − nums[i]`, so the sum is `target`.

**No pair is missed.** Suppose some valid pair exists, and let `(p, q)` with `p < q` be one with the smallest later index `q`. If the function has not returned before iteration `q`, then at iteration `q` the value `nums[p] = target − nums[q]` is in `seen` by the invariant, so it returns there. Either way it returns a valid pair, and it returns `[]` only when no pair exists.

Overwriting `seen[number]` when a value repeats is safe: the invariant asks only for *an* earlier index holding that value, and any one of them completes the pair.

## 6. Cost, edge cases, and failure

**Complexity.** One pass, with one lookup and at most one insertion per element: O(n) expected time and O(n) extra space for the dictionary. "Expected" is the usual hash-table caveat; for Python integers it is not a practical concern.

**Edge cases.** Empty and one-element lists return `[]`. Negative values and zero need no special handling, because the rewrite is plain arithmetic. Equal values work because the earlier copy is already in `seen` when the later one arrives.

**Where it fails.** Store before you look up, and a value can pair with itself:

```python
class StoreFirst:  # deliberately wrong order, for comparison
    def twoSum(self, nums, target):
        seen = {}
        for i, number in enumerate(nums):
            seen[number] = i
            if target - number in seen:
                return [seen[target - number], i]
        return []

assert StoreFirst().twoSum([5], 10) == [0, 0]  # wrong: position 0 used twice
assert solve([5], 10) == []
```

The same order of lookup and insertion matters in [subarrays summing to k](/worked/subarrays-summing-to-k/), for the same reason.

{{DEEP_DIVE}}

#### Check it against the baseline

There can be several valid answers, so compare validity rather than exact output: whenever the baseline finds a pair, the solution must return *a* valid pair; otherwise it must return `[]`.

```python
import random

rng = random.Random(1)
for _ in range(2000):
    nums = [rng.randint(-5, 5) for _ in range(rng.randint(0, 10))]
    target = rng.randint(-10, 10)
    found = solve(nums, target)
    if baseline(nums, target):
        i, j = found
        assert i != j and nums[i] + nums[j] == target, (nums, target)
    else:
        assert found == [], (nums, target)
```

#### Related problems

| Problem | What changes | What follows |
|---|---|---|
| [Two Sum II](https://leetcode.com/problems/two-sum-ii-input-array-is-sorted/) (LC 167) | The input is sorted; indexes are one-based; O(1) extra space is required. | Two pointers from both ends: if the sum is too small, only moving the left one can help. |
| [3Sum](https://leetcode.com/problems/3sum/) (LC 15) | Triples summing to zero, without duplicate triples. | Sort, fix the first value, then run Two Sum II on the rest, skipping repeated values. |
| [Contains Duplicate II](https://leetcode.com/problems/contains-duplicate-ii/) (LC 219) | Equal values within distance k. | The same "latest index per value" dictionary, with a distance check instead of a sum. |
| [Subarray Sum Equals K](https://leetcode.com/problems/subarray-sum-equals-k/) (LC 560) | Contiguous runs of any length instead of two elements. | The deceptive pair. Individual values no longer work, but the same rewrite does, on prefix sums. See [the lesson](/worked/subarrays-summing-to-k/). |

#### Reconstruct it

From a blank page: write the baseline, then name the one value the inner loop searches for. Write the rewritten condition, and explain why the lookup must happen before the insertion.

{{END_DEEP_DIVE}}
