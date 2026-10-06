# House Robber

*Worked lesson · Skip-or-take dynamic programming · LC 198*

**Difficulty: Medium.** Prerequisites: array order and sufficient state. Related chapter: [dynamic-programming-from-sufficient-state](/patterns/dynamic-programming-from-sufficient-state/).

## 1. The problem

Each nonnegative integer is the amount in a house along a line. Choose houses with no two selected positions adjacent; return the largest total. You may skip any house. Keep the input unchanged. [LeetCode 198](https://leetcode.com/problems/house-robber/). Our function also returns 0 for empty input.

| Input | Answer | Why |
|---|---|---|
| `[2,7,9,3,1]` | 12 | Choose 2,9,1 |
| `[2,1,1,2]` | 4 | Choose the two ends, not a fixed parity |
| `[0]` | 0 | No positive money |

## 2. A correct baseline

```python
def baseline(nums):
    def choose(i):
        if i>=len(nums): return 0
        return max(choose(i+1),nums[i]+choose(i+2))
    return choose(0)

assert baseline([2,7,9,3,1])==12
assert baseline([2,1,1,2])==4
assert baseline([0])==0
```

O(2^n) upper-bound time and O(n) call-stack space. **Bottleneck:** different choices repeatedly ask for the best total over the same remaining suffix.

## 3. The observation

For a prefix ending at this house, either skip it and keep the previous prefix's best, or take it and add its value to the best prefix ending two houses ago. Only those two totals are needed; the full selection history cannot change these choices.

## 4. The solution and a trace

```python
class Solution:
    def rob(self, nums: list[int]) -> int:
        """Nonnegative amounts along a line; adjacent houses cannot both be selected."""
        two_back=one_back=0
        for money in nums:
            current=max(one_back,two_back+money)
            two_back,one_back=one_back,current
        return one_back

solve=Solution().rob
assert solve([2,7,9,3,1])==12
assert solve([2,1,1,2])==4
assert solve([0])==0
assert solve([])==0
```

For `[2,7,9,3,1]`, values are before each update:

| Money | Skip: one_back | Take: two_back + money | New best |
|---|---:|---:|---:|
| 2 | 0 | 2 | 2 |
| 7 | 2 | 7 | 7 |
| 9 | 7 | 11 | 11 |
| 3 | 11 | 10 | 11 |
| 1 | 11 | 12 | 12 |

## 5. Why it works

one_back and two_back hold the exact optima for the preceding two prefixes. Every valid selection either excludes the current house or includes it and excludes its neighbor. These cases are exhaustive, and extending an optimal earlier prefix yields a feasible selection. Their maximum is therefore the current optimum.

## 6. Cost, edge cases, and failure

O(n) time and O(1) space. Python's simultaneous assignment reads both right-hand values before changing either variable. Updating two_back too early with sequential assignments could allow adjacent houses. Returning a fixed odd/even sum is not enough.

```python
nums=[2,1,1,2]
assert max(sum(nums[::2]),sum(nums[1::2]))==3
assert solve(nums)==4  # Counterexample to fixed-parity selection.
```

{{DEEP_DIVE}}

#### Check it against the baseline

```python
import random
rng=random.Random(198)
for _ in range(500):
    nums=[rng.randint(0,15) for _ in range(rng.randrange(13))]
    before=nums.copy()
    assert solve(nums)==baseline(nums)
    assert nums==before
```

#### Related problems

| Problem | What changes | What follows |
|---|---|---|
| [House Robber II](https://leetcode.com/problems/house-robber-ii/) | First and last are adjacent | Compare excluding the first with excluding the last |
| [House Robber III](https://leetcode.com/problems/house-robber-iii/) | Adjacency is a tree relationship | Return take/skip totals per subtree; two array-prefix totals cannot represent the branches |

#### Reconstruct it

Derive the two cases from the adjacency rule. Explain the meanings of both previous totals before writing the update.

{{END_DEEP_DIVE}}
