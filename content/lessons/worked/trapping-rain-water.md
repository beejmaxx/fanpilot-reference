# Trapping Rain Water

*Worked lesson · Two boundary maxima · LC 42*

**Difficulty: Hard.** Prerequisites: running maximums and inward pointers. Related chapter: [two-pointers-and-safe-elimination](/patterns/two-pointers-and-safe-elimination/).

## 1. The problem

Bars have unit width and nonnegative integer heights. Return the total units of water held between them after rain. Water level above a bar is limited by the tallest wall on each side. Keep the heights unchanged. [LeetCode 42](https://leetcode.com/problems/trapping-rain-water/). Empty input also returns 0.

| Input | Answer | Why |
|---|---|---|
| `[3,0,2,0,4]` | 7 | Interior positions hold 3,1,3 units |
| `[0,1,2]` | 0 | No basin |
| `[2,0,2]` | 2 | One gap between equal walls |

## 2. A correct baseline

```python
def baseline(height):
    water=0
    for i in range(len(height)):
        left=max(height[:i+1])
        right=max(height[i:])
        water+=min(left,right)-height[i]
    return water

assert baseline([3,0,2,0,4])==7
assert baseline([0,1,2])==0
assert baseline([2,0,2])==2
```

O(n²) time and O(n) temporary slice space. **Bottleneck:** recomputing each position's left and right maximum from overlapping ranges.

## 3. The observation

Prefix/suffix maximum arrays remove repeated scans in O(n) space. We can go further: keep the tallest wall already encountered at each end. Process the side with the smaller known maximum. The other side already has a wall at least that tall, so unseen interior walls cannot change this position's limiting water level.

## 4. The solution and a trace

```python
class Solution:
    def trap(self, height: list[int]) -> int:
        """Unit-width nonnegative bars; return trapped units without mutation."""
        left,right=0,len(height)-1
        left_max=right_max=0
        water=0
        while left<=right:
            if left_max<=right_max:
                left_max=max(left_max,height[left])
                water+=left_max-height[left]
                left+=1
            else:
                right_max=max(right_max,height[right])
                water+=right_max-height[right]
                right-=1
        return water

solve=Solution().trap
assert solve([3,0,2,0,4])==7
assert solve([0,1,2])==0
assert solve([2,0,2])==2
assert solve([])==0
```

For `[3,0,2,0,4]`:

| Processed position | Known wall after update | Added water | Total |
|---|---:|---:|---:|
| Left index 0, height 3 | left_max=3 | 0 | 0 |
| Right index 4, height 4 | right_max=4 | 0 | 0 |
| Left index 1, height 0 | left_max=3 | 3 | 3 |
| Left index 2, height 2 | left_max=3 | 1 | 4 |
| Left index 3, height 0 | left_max=3 | 3 | 7 |

## 5. Why it works

All processed positions have their final contribution counted once. When left_max ≤ right_max, a right wall at least as high as left_max is already known. If the current left height is below left_max, its limiting level is left_max. If it raises left_max, the bar itself leaves zero space above it using its left boundary. The symmetric reasoning handles the right. Advancing one pointer finalizes one distinct position until none remain.

## 6. Cost, edge cases, and failure

O(n) time and O(1) space. Equal maxima can choose either side consistently. Flat, increasing and decreasing input traps no water. Nonnegative heights matter to initialization at zero. This measures total volume, not the area of a single container.

Keeping only the globally tallest wall ignores the shorter side:

```python
height=[3,0,1]
assert max(height)-height[1]==3  # Deliberately wrong water depth using one global wall.
assert solve(height)==1
```

{{DEEP_DIVE}}

#### Check it against the baseline

```python
import random,itertools
rng=random.Random(42)
for _ in range(1000):
    height=[rng.randint(0,10) for _ in range(rng.randrange(30))]
    before=height.copy()
    assert solve(height)==baseline(height)
    assert height==before
for n in range(7):
    for height in itertools.product(range(3),repeat=n):
        assert solve(list(height))==baseline(list(height))
```

#### Related problems

| Problem | What changes | What follows |
|---|---|---|
| [Container With Most Water](https://leetcode.com/problems/container-with-most-water/) | Choose one pair of boundaries and maximize area | Interior bars do not subtract volume; this sum-of-contributions algorithm answers a different question |
| [Trapping Rain Water II](https://leetcode.com/problems/trapping-rain-water-ii/) | Heights form a 2D grid | Two end walls are insufficient; process a minimum-height boundary frontier with a heap |

#### Reconstruct it

Derive the per-position formula first. Explain why the smaller known boundary makes a contribution final even before seeing all interior bars.

{{END_DEEP_DIVE}}
