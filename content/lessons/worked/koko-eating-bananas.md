# Koko Eating Bananas

*Worked lesson · Binary search on the answer · LC 875*

**Difficulty: Medium.** Prerequisites: boundary binary search and integer division. Related chapter: [binary-search-over-a-boundary](/patterns/binary-search-over-a-boundary/).

## 1. The problem

Choose a positive integer eating speed. Each hour consumes up to that many bananas from one pile; unused time in that hour cannot transfer to another pile. Find the smallest speed finishing within h hours. Piles are positive and h is at least their count. [LeetCode 875](https://leetcode.com/problems/koko-eating-bananas/).

| Input | Answer | Why |
|---|---|---|
| `[3,6,7,11]`, h=8 | 4 | Rounded-up hours are 1+2+2+3 |
| `[4,4]`, h=2 | 4 | Each pile must finish in one hour |
| `[1]`, h=9 | 1 | Speed cannot be below 1 |

## 2. A correct baseline

```python
def baseline(piles, h):
    for speed in range(1, max(piles) + 1):
        if sum((p + speed - 1) // speed for p in piles) <= h:
            return speed

assert baseline([3,6,7,11],8) == 4
assert baseline([4,4],2) == 4
assert baseline([1],9) == 1
```

O(nM) time for maximum pile M; O(1) extra space. **Bottleneck:** testing each speed separately, although success at one speed guarantees success at every faster speed.

## 3. The observation

Hours per pile equal ceiling(pile/speed), written `(pile + speed - 1) // speed`. Increasing speed never increases total hours. Search the first feasible speed between 1 and M; M is feasible because h ≥ n.

## 4. The solution and a trace

```python
class Solution:
    def minEatingSpeed(self, piles: list[int], h: int) -> int:
        """Positive piles, h >= len(piles); return minimum feasible speed."""
        left, right = 1, max(piles)
        while left < right:
            speed = (left + right) // 2
            hours = sum((p + speed - 1) // speed for p in piles)
            if hours <= h:
                right = speed  # This speed works; keep it as a candidate.
            else:
                left = speed + 1
        return left

solve=Solution().minEatingSpeed
assert solve([3,6,7,11],8) == 4
assert solve([4,4],2) == 4
assert solve([1],9) == 1
```

For `[3,6,7,11]`, h=8:

| Bounds | Speed/hours | Update |
|---|---|---|
| 1..11 | 6 / 6 | right=6 |
| 1..6 | 3 / 10 | left=4 |
| 4..6 | 5 / 8 | right=5 |
| 4..5 | 4 / 8 | right=4; return 4 |

## 5. Why it works

The minimum feasible speed always lies within the bounds. A failed speed rules out everything slower; a successful one rules out the need to go faster. Each update shrinks the interval and preserves that candidate.

## 6. Cost, edge cases, and failure

O(n log M) time, O(1) space. Rounding happens separately for each pile. Empty piles and h < n are outside the contract; a faster speed cannot reduce a nonempty pile below one hour.

Combining piles before rounding changes the problem:

```python
assert baseline([1,1],1) is None  # Infeasible, deliberately outside the contract.
assert (sum([1,1])+2-1)//2 == 1  # Wrong model suggests one hour suffices.
```

{{DEEP_DIVE}}

#### Check it against the baseline

```python
import random
rng=random.Random(875)
for _ in range(300):
    piles=[rng.randint(1,20) for _ in range(rng.randint(1,8))]
    h=rng.randint(len(piles),40)
    assert solve(piles,h)==baseline(piles,h)
```

#### Related problems

| Problem | What changes | What follows |
|---|---|---|
| [Search Insert Position](https://leetcode.com/problems/search-insert-position/) | Search array indexes | Same first-true boundary, different predicate |
| [Capacity to Ship Packages](https://leetcode.com/problems/capacity-to-ship-packages-within-d-days/) | Order and daily capacity matter | Greedily simulate days; the banana-hours formula is invalid |

#### Reconstruct it

Derive the hour formula and justify the feasible upper bound before writing the search. Explain why success keeps the midpoint rather than skipping it.

{{END_DEEP_DIVE}}
