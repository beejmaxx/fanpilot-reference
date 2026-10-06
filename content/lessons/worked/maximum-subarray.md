# Maximum Subarray

*Worked lesson · Best ending state · LC 53*

**Difficulty: Medium.** Prerequisites: running sums and maximums. Related chapter: [dynamic-programming-from-sufficient-state](/patterns/dynamic-programming-from-sufficient-state/).

## 1. The problem

Return the greatest sum of a nonempty consecutive section of a nonempty integer list. Negative numbers are allowed; you cannot skip values inside a section. Keep the input unchanged. [LeetCode 53](https://leetcode.com/problems/maximum-subarray/).

| Input | Answer | Why |
|---|---|---|
| `[4,-6,3,2,-1,4]` | 8 | Choose `[3,2,-1,4]` |
| `[-5,-2,-7]` | -2 | Choose the least negative singleton |
| `[0]` | 0 | The one-element section is allowed |

## 2. A correct baseline

```python
def baseline(nums):
    best=nums[0]
    for start in range(len(nums)):
        total=0
        for end in range(start,len(nums)):
            total+=nums[end]
            best=max(best,total)
    return best

assert baseline([4,-6,3,2,-1,4])==8
assert baseline([-5,-2,-7])==-2
assert baseline([0])==0
```

O(n²) time and O(1) extra space. **Bottleneck:** tracking every earlier start separately, although only its best sum ending at the previous position can help the next position.

## 3. The observation

A section ending today either consists of today's value alone or extends a section ending yesterday. Among those previous sections, only the largest sum matters. Compare restarting with extending; separately retain the best result anywhere.

## 4. The solution and a trace

```python
class Solution:
    def maxSubArray(self, nums: list[int]) -> int:
        """Requires a nonempty integer list; select at least one element."""
        ending=best=nums[0]
        for i in range(1,len(nums)):
            value=nums[i]
            ending=max(value,ending+value)  # Best sum ending exactly at i.
            best=max(best,ending)
        return best

solve=Solution().maxSubArray
assert solve([4,-6,3,2,-1,4])==8
assert solve([-5,-2,-7])==-2
assert solve([0])==0
```

| Value in `[4,-6,3,2,-1,4]` | Best ending here | Best anywhere |
|---|---:|---:|
| 4 | 4 | 4 |
| -6 | -2 | 4 |
| 3 | 3, restart | 4 |
| 2 | 5 | 5 |
| -1 | 4 | 5 |
| 4 | 8 | 8 |

## 5. Why it works

Inductively, ending represents the best nonempty section at the current index: the recurrence covers both possible forms of that section and chooses the better. Every section has an end, so best over all these ending states covers every candidate. Negative previous sums are discarded because they reduce any extension.

## 6. Cost, edge cases, and failure

O(n) time and O(1) space. Initialize from a real element, not zero, because an empty section is forbidden. Keeping a negative value inside a profitable section may still be optimal; do not filter negatives.

```python
assert solve([-5,-2,-7])==-2  # A zero-initialized global best would incorrectly return 0.
assert solve([4,-1,4])==7
assert sum(v for v in [4,-1,4] if v>0)==8  # Filtering negatives breaks consecutiveness.
```

{{DEEP_DIVE}}

#### Check it against the baseline

```python
import random
rng=random.Random(53)
for _ in range(1000):
    nums=[rng.randint(-10,10) for _ in range(rng.randint(1,25))]
    before=nums.copy()
    assert solve(nums)==baseline(nums)
    assert nums==before
```

#### Related problems

| Problem | What changes | What follows |
|---|---|---|
| [Maximum Product Subarray](https://leetcode.com/problems/maximum-product-subarray/) | Multiply instead of add | Negative products can become useful; retain minimum and maximum ending products |
| [Maximum Sum Circular Subarray](https://leetcode.com/problems/maximum-sum-circular-subarray/) | Wraparound is allowed | A linear section no longer covers every candidate; handle the complement too |

#### Reconstruct it

Distinguish the best section ending here from the best anywhere. Derive the restart/extend recurrence and test an all-negative list.

{{END_DEEP_DIVE}}
