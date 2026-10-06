# Kth Largest Element

*Worked lesson · Top-k min-heap · LC 215*

**Difficulty: Medium.** Prerequisites: dictionary-free selection and heap operations. Related chapter: [heaps-and-the-candidate-frontier](/patterns/heaps-and-the-candidate-frontier/).

## 1. The problem

Return the kth largest value, counting duplicates separately. Integers can be negative; 1 ≤ k ≤ n. Keep the input unchanged. [LeetCode 215](https://leetcode.com/problems/kth-largest-element-in-an-array/).

| Input | Answer | Why |
|---|---|---|
| `[3,2,1,5,6,4]`, k=2 | 5 | Only 6 is larger |
| `[5,5,4]`, k=2 | 5 | Second occurrence counts |
| `[-2]`, k=1 | -2 | Only candidate |

## 2. A correct baseline

```python
def baseline(nums,k):
    return sorted(nums,reverse=True)[k-1]

assert baseline([3,2,1,5,6,4],2)==5
assert baseline([5,5,4],2)==5
assert baseline([-2],1)==-2
```

O(n log n) time, O(n) copy space. **Bottleneck:** fully ordering values that cannot affect the answer. We only need the best k.

## 3. The observation

Keep the largest k values seen. The smallest retained value is the one a new candidate might replace; a min-heap gives direct access to it. A max-heap would expose the wrong end of this retained set.

## 4. The solution and a trace

```python
import heapq

class Solution:
    def findKthLargest(self, nums: list[int], k: int) -> int:
        """Requires 1 <= k <= len(nums); duplicates count separately."""
        best=nums[:k]
        heapq.heapify(best)
        for i in range(k,len(nums)):
            if nums[i]>best[0]:
                heapq.heapreplace(best,nums[i])
        return best[0]

solve=Solution().findKthLargest
assert solve([3,2,1,5,6,4],2)==5
assert solve([5,5,4],2)==5
assert solve([-2],1)==-2
```

For `[3,2,1,5,6,4]`, k=2, sets below describe retained values, not heap layout:

| Incoming | Retained | Decision |
|---|---|---|
| Initial 3,2 | {2,3} | heap minimum=2 |
| 1 | {2,3} | Discard |
| 5 | {3,5} | Replace 2 |
| 6 | {5,6} | Replace 3 |
| 4 | {5,6} | Discard; return 5 |

## 5. Why it works

The heap always contains the largest k processed occurrences. A value no larger than its minimum cannot improve the set. A larger value replaces exactly its weakest member. Consequently the minimum of the final heap is the kth largest.

## 6. Cost, edge cases, and failure

O(n log(k+1)) time, O(k) space; heap construction is O(k). k=1 reduces to finding the maximum. k=n returns the minimum. A heap array is not globally sorted.

```python
import heapq
wrong=[3,6,5]
heapq.heapify(wrong)
assert wrong[0]==3 and baseline(wrong,2)==5  # Whole-array min-heap root is not kth largest.
```

{{DEEP_DIVE}}

#### Check it against the baseline

```python
import random
rng=random.Random(215)
for _ in range(500):
    nums=[rng.randint(-10,10) for _ in range(rng.randint(1,30))]
    before=nums.copy(); k=rng.randint(1,len(nums))
    assert solve(nums,k)==baseline(nums,k)
    assert nums==before
```

#### Related problems

| Problem | What changes | What follows |
|---|---|---|
| [Kth Largest in a Stream](https://leetcode.com/problems/kth-largest-element-in-a-stream/) | Values arrive over time | Keep this heap between calls |
| [Top K Frequent Elements](https://leetcode.com/problems/top-k-frequent-elements/) | Priority is frequency, not value | Count first; selecting numerically largest values is wrong |

#### Reconstruct it

Explain why the retained heap is a min-heap. Rebuild the invariant before memorizing heapreplace.

{{END_DEEP_DIVE}}
