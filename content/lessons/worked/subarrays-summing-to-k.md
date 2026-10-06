# Subarrays summing to k

*Worked lesson · Prefix sums and hashing · LC 560*

**Difficulty: Medium.** This lesson is the deceptive partner of [the shortest subarray reaching a sum](/worked/shortest-subarray-reaching-a-sum/). The statements look alike: contiguous subarrays, a target sum. One sentence differs, values may be negative, and that sentence removes the sliding window's foundation. Related chapters: [prefix sums](/patterns/prefix-sums-and-algebraic-transformations/) and [hashing and sufficient summaries](/patterns/hashing-and-sufficient-summaries/).

## 1. The problem

Given a list of integers `nums`, which may include negative numbers and zeros, and an integer `k`, return the **number** of contiguous subarrays whose sum is exactly `k`. Subarrays are counted by position: two equal-looking runs at different indices count separately. This is [Subarray Sum Equals K](https://leetcode.com/problems/subarray-sum-equals-k/) (LC 560).

| Input | Answer | Why |
| --- | --- | --- |
| `nums = [1, 1, 1]`, `k = 2` | `2` | Indices 0–1 and 1–2. |
| `nums = [1, 2, 3]`, `k = 3` | `2` | `[1, 2]` and `[3]`. |
| `nums = [1, -1, 0]`, `k = 0` | `3` | `[1, -1]`, `[0]`, and `[1, -1, 0]`. |

The third example has three answers that overlap and share endpoints. Any method that keeps a single window per position will struggle with it.

## 2. A correct baseline

Fix each start and extend a running sum to every end. Unlike the shortest-window problem, we cannot stop early when the sum hits `k`: a later negative value and a later positive value could bring it back to `k` again.

```python
def count_baseline(nums, k):
    count = 0
    for start in range(len(nums)):
        total = 0
        for end in range(start, len(nums)):
            total += nums[end]
            if total == k:
                count += 1
    return count

assert count_baseline([1, 1, 1], 2) == 2
assert count_baseline([1, 2, 3], 3) == 2
assert count_baseline([1, -1, 0], 0) == 3
assert count_baseline([], 0) == 0
```

This always does n(n + 1) / 2 additions: O(n²) time, O(1) space.

**The bottleneck.** For each end position, the inner work amounts to asking "how many starts give a sum of exactly k?" The baseline answers by trying every start again. That question is asked n times, and each answer costs O(n).

## 3. Why the window from the partner lesson fails

It is worth seeing the tempting approach fail before replacing it. A window adapted to exact sums would extend `right`, shrink while the sum exceeds `k`, and count when the sum equals `k`:

```python
def count_with_window(nums, k):
    """A tempting adaptation. Correct only for positive values."""
    count = left = window_sum = 0
    for right, value in enumerate(nums):
        window_sum += value
        while window_sum > k and left <= right:
            window_sum -= nums[left]
            left += 1
        if window_sum == k and left <= right:
            count += 1
    return count

assert count_with_window([1, 1, 1], 2) == 2           # agrees here
assert count_with_window([1, -1, 1], 1) == 2          # the true answer is 3
assert count_baseline([1, -1, 1], 1) == 3
```

At `right = 2` in `[1, -1, 1]`, two starts work: index 0 (`1 - 1 + 1`) and index 2 (`1`). A window holds one start per end, so it can count at most one of them. With positive values that limitation is harmless, because prefix sums strictly increase and at most one start can hit an exact target. With zeros or negatives, several can.

So the real question per end is **how many** earlier positions produce the right sum, and we need to answer it without scanning them.

## 4. The observation

Define the prefix sum `P[i]` as the sum of the first `i` elements, with `P[0] = 0`. The sum of `nums[start .. end]` is then a difference of two prefix sums:

> sum(nums[start .. end]) = P[end + 1] − P[start]

Setting that equal to `k` and rearranging:

> P[start] = P[end + 1] − k

The question "how many starts give sum k for this end?" becomes "how many earlier prefix sums equal `P[end + 1] − k`?" That is a lookup in a table of counts, not a scan. Walk left to right, maintain the running prefix sum, and keep a hash map from each prefix-sum value to how many times it has appeared so far.

The transformation is the key move, not the hash map: a condition on a **pair** of indices is rewritten so that one side depends only on the earlier index. Then the earlier side can be summarized as you go.

## 5. The solution and a trace

```python
def count_subarrays(nums, k):
    """Number of contiguous subarrays of nums whose sum is exactly k."""
    seen = {0: 1}  # prefix sum -> times seen; the empty prefix has sum 0
    prefix = 0
    count = 0
    for value in nums:
        prefix += value
        count += seen.get(prefix - k, 0)  # earlier starts that complete a sum of k here
        seen[prefix] = seen.get(prefix, 0) + 1
    return count

assert count_subarrays([1, 1, 1], 2) == 2
assert count_subarrays([1, 2, 3], 3) == 2
assert count_subarrays([1, -1, 0], 0) == 3
assert count_subarrays([1, -1, 1], 1) == 3
assert count_subarrays([], 0) == 0
```

Trace `nums = [1, -1, 0]` with `k = 0`. The map is shown after each update.

| Value | Prefix | Look up `prefix − k` | Found | Count | Map after |
| --- | --- | --- | --- | --- | --- |
| (start) | 0 | | | 0 | `{0: 1}` |
| 1 | 1 | 1 | 0 | 0 | `{0: 1, 1: 1}` |
| −1 | 0 | 0 | 1 | 1 | `{0: 2, 1: 1}` |
| 0 | 0 | 0 | 2 | 3 | `{0: 3, 1: 1}` |

At the last step the lookup finds prefix sum 0 twice, before index 0 and before index 2. Those correspond to the subarrays `[1, -1, 0]` and `[0]`. One lookup counted both.

## 6. Why it works

**Invariant.** Immediately before the lookup for position `end`, `seen` maps each value `v` to the number of indices `i` with `0 <= i <= end` and `P[i] == v`. It holds at the start, when only `P[0] = 0` exists, and each loop iteration adds exactly one new prefix sum after its lookup.

**Each subarray is counted exactly once.** A subarray `nums[start .. end]` sums to `k` exactly when `P[start] == P[end + 1] − k`. Its start satisfies `start <= end`, so by the invariant it is included in `seen[P[end + 1] − k]` at iteration `end`. Different starts with the same end are different indices in that count, and each subarray contributes only at its own end. Summing over all ends counts every qualifying subarray once.

**Two details the proof depends on.** Seeding `{0: 1}` represents `P[0]`, the empty prefix; without it, subarrays that begin at index 0 are missed. And the lookup happens **before** the current prefix is inserted. If you inserted first, then with `k = 0` the lookup would find the current prefix itself and count the empty subarray `nums[end + 1 .. end]`.

```python
def count_insert_first(nums, k):  # deliberately wrong order, for comparison
    seen, prefix, count = {0: 1}, 0, 0
    for value in nums:
        prefix += value
        seen[prefix] = seen.get(prefix, 0) + 1
        count += seen.get(prefix - k, 0)
    return count

assert count_insert_first([5], 0) == 1  # counts an empty subarray; the answer is 0
assert count_subarrays([5], 0) == 0
```

## 7. Cost, edge cases, and failure

**Complexity.** One pass with one expected-O(1) dictionary lookup and update per element: O(n) expected time, O(n) space for up to n + 1 distinct prefix sums. The answer itself can be as large as n(n + 1) / 2, for example when every value is zero and `k = 0`. Counting a quadratic number of subarrays in linear time is possible because no subarray is ever listed individually.

**Edge cases.** Empty input gives `0`. `k = 0` and runs of zeros are exactly where insertion order matters. Python integers are unbounded; in fixed-width languages, prefix sums of up to 20,000 values of magnitude 1,000 fit in 32 bits, but check the actual constraints before relying on that.

**Where it stops being enough.** The hash map answers equality questions. If the question becomes "sum **at least** k" or "sum between lower and upper", you need earlier prefix sums in a range, which a hash map cannot count. Use an order-aware structure instead: a Fenwick tree over compressed prefix values, or merge sort counting, as in [Count of Range Sum](https://leetcode.com/problems/count-of-range-sum/) (LC 327). And if you must output every qualifying subarray, the output itself can be quadratic; no counting trick helps.

{{DEEP_DIVE}}

#### Check it against the baseline

Compare against the baseline on random inputs, including negative values and zeros that the window cannot handle:

```python
import random

rng = random.Random(560)
for _ in range(2000):
    nums = [rng.randint(-3, 3) for _ in range(rng.randint(0, 12))]
    k = rng.randint(-4, 4)
    assert count_subarrays(nums, k) == count_baseline(nums, k), (nums, k)
```

#### Related problems

| Problem | What changes | What follows |
| --- | --- | --- |
| [Minimum Size Subarray Sum](https://leetcode.com/problems/minimum-size-subarray-sum/) (LC 209) | Positive values; shortest length with sum at least target. | A sliding window works. See the [partner lesson](/worked/shortest-subarray-reaching-a-sum/). |
| [Binary Subarrays With Sum](https://leetcode.com/problems/binary-subarrays-with-sum/) (LC 930) | Values are only 0 or 1. | Both methods work. Zeros break the single-window count, but "at most k minus at most k − 1" windows recover it. |
| [Subarray Sums Divisible by K](https://leetcode.com/problems/subarray-sums-divisible-by-k/) (LC 974) | Divisible by k instead of equal to k. | Key the map by `prefix % k`. Python's `%` is non-negative for positive k; other languages need a correction. |
| [Continuous Subarray Sum](https://leetcode.com/problems/continuous-subarray-sum/) (LC 523) | Divisible by k and length at least 2; existence only. | Store the earliest index of each remainder rather than a count, and compare distances. |
| [Contiguous Array](https://leetcode.com/problems/contiguous-array/) (LC 525) | Longest run with equal numbers of 0s and 1s. | Map 0 to −1; equal counts become sum zero. Store first occurrence to maximize length. |
| [Count Number of Nice Subarrays](https://leetcode.com/problems/count-number-of-nice-subarrays/) (LC 1248) | Count subarrays with exactly k odd numbers. | Map each value to 1 if odd, 0 if even. The problem becomes this one. |

**The deceptive pair, side by side.**

| | Shortest subarray reaching a sum (LC 209) | Subarrays summing to k (LC 560) |
| --- | --- | --- |
| Values | Positive only | Any integers |
| Question | Minimum length, sum ≥ target | Count, sum = k |
| Property used | Validity is monotone as the window grows | Range sum is a difference of prefix sums |
| Technique | Two forward-only indices | Running prefix sum plus a counts map |
| Extra space | O(1) | O(n) |
| Breaks when | A value is zero or negative | The condition is an inequality |

#### Reconstruct it

Write the prefix-sum identity from memory, rearrange it so one side depends only on the start, and explain why the map is seeded with `{0: 1}` and updated after the lookup. Then solve LC 1248 without rereading this page.

{{END_DEEP_DIVE}}
