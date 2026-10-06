# Shortest subarray reaching a sum

*Worked lesson · Sliding window · LC 209*

**Difficulty: Medium.** This lesson derives a variable-size sliding window. The technique is short to write and easy to misapply, so most of the work is in the argument: why an index can move forward and never come back. Prerequisite: comfort with loops over a list. Related chapter: [sliding windows and monotone validity](/patterns/sliding-windows-and-monotone-validity/).

## 1. The problem

You are given a list of **positive** integers `nums` and a positive integer `target`. Return the length of the shortest contiguous subarray whose sum is at least `target`. If no subarray qualifies, return `0`. This is [Minimum Size Subarray Sum](https://leetcode.com/problems/minimum-size-subarray-sum/) (LC 209).

| Input | Answer | Why |
| --- | --- | --- |
| `nums = [2, 3, 1, 2, 4, 3]`, `target = 7` | `2` | `[4, 3]` sums to 7. No single element reaches 7. |
| `nums = [1, 4, 4]`, `target = 4` | `1` | `[4]` alone is enough. |
| `nums = [1, 1, 1, 1]`, `target = 11` | `0` | Even the whole list sums to only 4. |

"Contiguous" matters: `[2, 4, 1]` is not a subarray of the first example, because those values are not adjacent. "At least" matters too: the sum can overshoot the target.

## 2. A correct baseline

Try every starting index. From each start, extend to the right while keeping a running sum, and stop as soon as the sum reaches the target: a longer subarray from the same start cannot be shorter.

```python
def shortest_baseline(nums, target):
    best = 0
    for start in range(len(nums)):
        total = 0
        for end in range(start, len(nums)):
            total += nums[end]
            if total >= target:
                length = end - start + 1
                if best == 0 or length < best:
                    best = length
                break
    return best

assert shortest_baseline([2, 3, 1, 2, 4, 3], 7) == 2
assert shortest_baseline([1, 4, 4], 4) == 1
assert shortest_baseline([1, 1, 1, 1], 11) == 0
assert shortest_baseline([], 3) == 0
```

This is correct and takes O(n²) time in the worst case, such as when the target exceeds the total and no start ever breaks early. With 100,000 elements that is about five billion additions.

**The bottleneck.** When the outer loop moves from `start` to `start + 1`, the inner loop throws away its running sum and re-adds almost the same elements. Worse, it re-examines end positions that the previous start already ruled out.

## 3. The observation

Suppose the shortest qualifying subarray starting at `start` ends at `end`. Now consider `start + 1`. Its subarray must end **at or after** `end`.

Why? Every subarray `nums[start + 1 .. e]` with `e < end` is part of `nums[start .. e]`, which is missing only the element `nums[start]`. Since all values are positive, dropping an element makes the sum smaller. We already know `nums[start .. e]` fell short of the target (that is why the inner loop kept going past `e`), so the shorter one falls short too.

So the end position never needs to move backward. Both indices only move forward, and each can move at most `n` times. That turns the nested search into a single pass:

- Move `right` forward one element at a time, adding it to the window's sum.
- While the window's sum reaches the target, record its length, then remove `nums[left]` and advance `left`, trying to find something shorter.

The input property doing the work is **positivity**. Adding an element always increases the sum; removing one always decreases it. Validity ("sum is at least target") is therefore monotone: extending a valid window keeps it valid, and shrinking an invalid window keeps it invalid.

## 4. The solution and a trace

```python
def shortest_subarray(nums, target):
    """Length of the shortest contiguous run with sum >= target, or 0.

    Requires every value in nums to be positive.
    """
    best = 0
    left = 0
    window_sum = 0  # always equals sum(nums[left:right + 1])
    for right, value in enumerate(nums):
        window_sum += value
        while window_sum >= target:
            length = right - left + 1
            if best == 0 or length < best:
                best = length
            window_sum -= nums[left]
            left += 1
    return best

assert shortest_subarray([2, 3, 1, 2, 4, 3], 7) == 2
assert shortest_subarray([1, 4, 4], 4) == 1
assert shortest_subarray([1, 1, 1, 1], 11) == 0
assert shortest_subarray([], 3) == 0
```

Trace the first example with `target = 7`. A row shows the window after `right` adds its value, then every shrink step that follows.

| `right` adds | Window | Sum | Action | Best |
| --- | --- | --- | --- | --- |
| 2 | `[2]` | 2 | Below 7, keep extending | 0 |
| 3 | `[2, 3]` | 5 | Below 7 | 0 |
| 1 | `[2, 3, 1]` | 6 | Below 7 | 0 |
| 2 | `[2, 3, 1, 2]` | 8 | Record 4, drop 2 | 4 |
| | `[3, 1, 2]` | 6 | Below 7, stop shrinking | 4 |
| 4 | `[3, 1, 2, 4]` | 10 | Record 4, drop 3 | 4 |
| | `[1, 2, 4]` | 7 | Record 3, drop 1 | 3 |
| | `[2, 4]` | 6 | Below 7 | 3 |
| 3 | `[2, 4, 3]` | 9 | Record 3, drop 2 | 3 |
| | `[4, 3]` | 7 | Record 2, drop 4 | 2 |
| | `[3]` | 3 | Below 7 | 2 |

Notice that the window never contained `[2, 3, 1, 2, 4]` as a candidate after `[2, 3, 1, 2]` was found. Section 3 explains why skipping it is safe.

## 5. Why it works

Two facts carry the proof.

**Invariant.** At the top of each `while` test, `window_sum == sum(nums[left:right + 1])`. It holds initially for the empty window, adding `nums[right]` extends both sides of the equation, and removing `nums[left]` while advancing `left` shrinks both. This guarantees that every recorded length belongs to a real qualifying subarray, so `best` is never too small.

**No qualifying start is skipped too early.** We must show `best` is not too large: the shortest qualifying subarray, say `nums[i .. j]`, gets recorded. Consider the moment `right` first reaches `j`. At that point `left <= i`, because `left` only advances past an index after the window starting there has been recorded and shrunk, and windows starting at `i` cannot qualify before `right` reaches `j` (if a shorter one did, `nums[i .. j]` would not be the shortest). With `left <= i` and `right = j`, the window contains `nums[i .. j]`, so its sum is at least the target. The `while` loop therefore keeps recording and shrinking until `left` passes `i`, and on the way it records the window `nums[i .. j]` itself.

The second argument uses positivity twice: once to say a window containing `nums[i .. j]` reaches the target, and once (in section 3) to justify never moving `right` backward.

## 6. Cost, edge cases, and failure

**Complexity.** Each index is added once when `right` reaches it and removed at most once when `left` passes it. Total work is O(n) despite the nested loop, with O(1) extra space. Counting operations across the whole run, instead of multiplying loop bounds, is the useful habit here.

**Edge cases.** An empty list returns `0`. A single element at least as large as the target gives `1`. When the answer is `0`, the window simply grows to the whole list and never shrinks. Python integers do not overflow; in Rust, Java, or C++, accumulate in a 64-bit type when the sum of all values can exceed 32 bits.

**Where it fails.** Allow a negative value and the argument collapses. Take `nums = [1, -1, 5]` and `target = 5`. The answer is `1`, from `[5]`. The window reaches sum 5 with `[1, -1, 5]` and records length 3. Removing `1` drops the sum to 4, so the loop stops shrinking and never sees that removing `-1` as well would have raised it again.

```python
assert shortest_baseline([1, -1, 5], 5) == 1
assert shortest_subarray([1, -1, 5], 5) == 3  # wrong: the window's argument needs positive values
```

The code runs without error and returns a plausible number. That is why the precondition belongs in the docstring and why the proof, not a few passing examples, decides whether the technique applies.

{{DEEP_DIVE}}

#### Check it against the baseline

Random positive lists exercise far more cases than a hand-picked handful:

```python
import random

rng = random.Random(209)
for _ in range(2000):
    nums = [rng.randint(1, 9) for _ in range(rng.randint(0, 12))]
    target = rng.randint(1, 40)
    assert shortest_subarray(nums, target) == shortest_baseline(nums, target), (nums, target)
```

#### Related problems

Each problem below changes one thing. Before reading the note, decide whether the window argument still holds.

| Problem | What changes | Does the window survive? |
| --- | --- | --- |
| [Subarray Sum Equals K](https://leetcode.com/problems/subarray-sum-equals-k/) (LC 560) | Count subarrays with sum **exactly** k; values may be negative. | No. Negative values break monotonicity. See the [paired lesson](/worked/subarrays-summing-to-k/). |
| [Shortest Subarray with Sum at Least K](https://leetcode.com/problems/shortest-subarray-with-sum-at-least-k/) (LC 862) | Same question, but values may be negative. | No. Use prefix sums with a monotonic deque of candidate starts; see [stacks and monotonic deques](/patterns/stacks-and-monotonic-deques/). |
| [Subarray Product Less Than K](https://leetcode.com/problems/subarray-product-less-than-k/) (LC 713) | Product instead of sum, strictly less than k, count every qualifying subarray. | Yes, for positive integers: multiplying by a value ≥ 1 never decreases the product. Count `right - left + 1` new subarrays per step. |
| [Longest Substring Without Repeating Characters](https://leetcode.com/problems/longest-substring-without-repeating-characters/) (LC 3) | Longest instead of shortest; validity means "no repeats". | Yes, reversed: shrinking repairs a repeat and extending cannot. Record after shrinking, not before. |
| [Max Consecutive Ones III](https://leetcode.com/problems/max-consecutive-ones-iii/) (LC 1004) | Longest run of ones after flipping at most k zeros. | Yes: the number of zeros in a window behaves like the positive sum here. |

The deceptive one is LC 862. Its statement is nearly identical to this lesson's problem, and a sliding window passes many hand-made tests before failing on a negative value. Compare its official constraints with LC 209's before choosing.

**An alternative worth knowing.** Because values are positive, prefix sums are strictly increasing. For each start you could binary-search the first prefix sum at least `prefix[start] + target`, giving O(n log n). It is slower than the window but relies on the same positivity, and it generalizes to some variants where moving two pointers is awkward.

#### Reconstruct it

Close this page. Write the baseline, name the repeated work, state the observation about positive values in one sentence, and then write the window. Finally, explain to yourself what goes wrong on `[1, -1, 5]`.

{{END_DEEP_DIVE}}
