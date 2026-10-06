# Two Sum II

*Worked lesson · Two pointers and safe elimination · LC 167*

**Difficulty: Medium.** Prerequisites: indexes and sorted lists. Read [Two Sum](/worked/two-sum/) first, then connect this change to [two pointers and safe elimination](/patterns/two-pointers-and-safe-elimination/).

## 1. The problem

Given integers sorted from smallest to largest and a target, find two different positions whose values sum to the target. Return **one-based indexes**, with the smaller index first, using constant extra space. This is [Two Sum II](https://leetcode.com/problems/two-sum-ii-input-array-is-sorted/) (LC 167).

| Numbers; target | Answer | Why |
|---|---|---|
| `[1, 2, 4, 6, 9]`; `8` | `[2, 4]` | Values 2 and 6 occupy positions 2 and 4 |
| `[3, 3]`; `6` | `[1, 2]` | Equal values are allowed; reuse of one position is not |
| `[-3, 0, 4]`; `1` | `[1, 3]` | Negative values work too |

The platform guarantees one answer. Our function additionally returns `[]` for no answer, including an empty list. It does not modify the input.

## 2. A correct baseline

Try each distinct pair, translating Python's zero-based indexes when returning.

```python
def baseline(numbers, target):
    for i in range(len(numbers)):
        for j in range(i + 1, len(numbers)):
            if numbers[i] + numbers[j] == target:
                return [i + 1, j + 1]
    return []

assert baseline([1, 2, 4, 6, 9], 8) == [2, 4]
assert baseline([3, 3], 6) == [1, 2]
assert baseline([-3, 0, 4], 1) == [1, 3]
assert baseline([], 8) == []
```

Worst-case time is O(n²), with O(1) extra space. **The bottleneck:** testing partners even when sorted order can rule out an entire group of them. A hash map would give expected O(n) time, but requires O(n) extra space and misses the constant-space requirement.

## 3. The observation

Compare the smallest and largest remaining values. If their sum is too small, the smallest value cannot work with *any* remaining partner: even the largest was insufficient. Discard that left value. If the sum is too large, the largest value cannot work with any remaining partner: even the smallest was too large. Discard that right value.

Sorted order makes both eliminations safe. It is the reason for moving a pointer, not merely a hint that “two pointers” might fit.

## 4. The solution and a trace

```python
class Solution:
    def twoSum(self, numbers: list[int], target: int) -> list[int]:
        """For sorted input, return one-based matching indexes or []."""
        left = 0
        right = len(numbers) - 1
        # Any pair not ruled out lies between these two indexes.
        while left < right:
            total = numbers[left] + numbers[right]
            if total == target:
                return [left + 1, right + 1]
            if total < target:
                left += 1
            else:
                right -= 1
        return []

solve = Solution().twoSum
assert solve([1, 2, 4, 6, 9], 8) == [2, 4]
assert solve([3, 3], 6) == [1, 2]
assert solve([-3, 0, 4], 1) == [1, 3]
assert solve([], 8) == []
```

Trace `[1, 2, 4, 6, 9]`, target `8`:

| Left/right values | Sum | Action |
|---|---:|---|
| 1 and 9 | 10 | Discard 9; move right inward |
| 1 and 6 | 7 | Discard 1; move left inward |
| 2 and 6 | 8 | Return one-based indexes `[2, 4]` |

## 5. Why it works

Initially, all pairs lie between the pointers. Every move discards a value that cannot participate in a remaining answer, so this invariant is preserved. A returned pair has the required sum, and `left < right` guarantees distinct positions. If the pointers meet without a match, no pair remains; otherwise an existing answer cannot have been discarded.

## 6. Cost, edge cases, and failure

Each iteration moves a pointer inward, so there are at most n−1 comparisons: O(n) time and O(1) extra space. Duplicates and negative numbers preserve sorted order and need no special branches. Do not return the zero-based pointers directly.

Unsorted input invalidates the elimination. This counterexample has a valid pair but our algorithm misses it:

```python
assert baseline([3, 2, 4], 6) == [2, 3]
assert solve([3, 2, 4], 6) == []  # Deliberately violates the sorted-input precondition.
```

Sorting arbitrary input would also change its original indexes unless you keep extra bookkeeping. For the unsorted problem, use the dictionary approach instead.

{{DEEP_DIVE}}

#### Check it against the baseline

```python
import random
rng = random.Random(167)
for _ in range(1500):
    numbers = sorted(rng.randint(-10, 10) for _ in range(rng.randrange(16)))
    target = rng.randint(-20, 20)
    before = numbers.copy()
    actual, expected = solve(numbers, target), baseline(numbers, target)
    assert bool(actual) == bool(expected)
    if actual:  # Several answers are allowed in generated tests.
        i, j = actual
        assert 1 <= i < j <= len(numbers)
        assert numbers[i - 1] + numbers[j - 1] == target
    assert numbers == before
```

#### Related problems

| Problem | What changes | What follows |
|---|---|---|
| [Two Sum](https://leetcode.com/problems/two-sum/) | Input is unsorted; original indexes matter | The elimination fails; remember earlier values in a dictionary |
| [3Sum](https://leetcode.com/problems/3sum/) | Find unique triples of values | Sort, fix one value, then search for the remaining pair while handling duplicates |

#### Reconstruct it

Explain why a too-small sum eliminates the left value with every remaining partner, not just the current right value. Then implement both symmetric moves and account for one-based output.

{{END_DEEP_DIVE}}
