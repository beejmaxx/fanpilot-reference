# Move Zeroes

*Worked lesson · Stable in-place compaction · LC 283*

**Difficulty: Easy.** Prerequisites: list assignment and indexes. Related chapter: [two-pointers-and-safe-elimination](/patterns/two-pointers-and-safe-elimination/).

## 1. The problem

Move every zero to the end of the existing integer list, preserving the order of all nonzero values. Keep its length, create no second list, and return None. [LeetCode 283](https://leetcode.com/problems/move-zeroes/). We additionally support empty input.

| Input | Answer | Why |
|---|---|---|
| `[0,3,0,1,4]` | `[3,1,4,0,0]` | Nonzeros keep their order |
| `[0,0]` | `[0,0]` | All entries are zero |
| `[2,-1,3]` | `[2,-1,3]` | No zero; no reordering |

## 2. A correct baseline

```python
def baseline(nums):
    zeros=0
    i=0
    while i<len(nums)-zeros:
        if nums[i]==0:
            nums.pop(i)
            nums.append(0)
            zeros+=1
        else:
            i+=1

a=[0,3,0,1,4]; baseline(a); assert a==[3,1,4,0,0]
a=[0,0]; baseline(a); assert a==[0,0]
a=[2,-1,3]; baseline(a); assert a==[2,-1,3]
```

O(n²) worst-case time and O(1) extra space. **Bottleneck:** deleting a list element shifts all later elements, potentially many times.

## 3. The observation

Compact the nonzeros into a prefix in their original order. A read index visits each element; a write index names the next output position. Once reading finishes, fill the remaining suffix with zeros.

## 4. The solution and a trace

```python
class Solution:
    def moveZeroes(self, nums: list[int]) -> None:
        """Modify nums in place, preserving nonzero order and list length."""
        write=0
        for read in range(len(nums)):
            if nums[read]!=0:
                nums[write]=nums[read]
                write+=1
        while write<len(nums):
            nums[write]=0
            write+=1

solve=Solution().moveZeroes
for before,after in [([0,3,0,1,4],[3,1,4,0,0]),([0,0],[0,0]),([2,-1,3],[2,-1,3]),([],[])]:
    nums=before.copy(); alias=nums
    assert solve(nums) is None
    assert nums==after and alias is nums
```

| Read in `[0,3,0,1,4]` | Write index afterward | List |
|---|---:|---|
| 0 | 0 | `[0,3,0,1,4]` |
| 3 | 1 | `[3,3,0,1,4]` |
| 0 | 1 | `[3,3,0,1,4]` |
| 1 | 2 | `[3,1,0,1,4]` |
| 4 | 3 | `[3,1,4,1,4]` |
| Fill suffix | 5 | `[3,1,4,0,0]` |

## 5. Why it works

Before each read, the prefix before write contains exactly the processed nonzeros in order. write never exceeds read, so assignment cannot overwrite an unread value. When scanning ends, there are exactly write nonzeros; replacing the other positions by zero establishes the result.

## 6. Cost, edge cases, and failure

O(n) time and O(1) extra space. Empty and all-zero lists work without branches. The temporary duplicated values during compaction are harmless. Assigning a new list to the local variable would not mutate the caller's list.

```python
nums=[0,2,1]
wrong=sorted(nums,reverse=True)  # Deliberately wrong: sorts nonzeros too.
solve(nums)
assert wrong==[2,1,0]
nums=[0,1,2]; wrong=sorted(nums,reverse=True); solve(nums)
assert nums==[1,2,0] and wrong!=nums
```

{{DEEP_DIVE}}

#### Check it against the baseline

```python
import random
rng=random.Random(283)
for _ in range(1000):
    original=[rng.choice([-2,-1,0,0,1,2]) for _ in range(rng.randrange(45))]
    actual=original.copy(); expected=original.copy()
    baseline(expected); alias=actual
    assert solve(actual) is None
    assert actual==expected and alias is actual and len(actual)==len(original)
```

#### Related problems

| Problem | What changes | What follows |
|---|---|---|
| [Remove Duplicates from Sorted Array](https://leetcode.com/problems/remove-duplicates-from-sorted-array/) | Compact distinct sorted values | Same read/write idea, different acceptance rule |
| [Sort Colors](https://leetcode.com/problems/sort-colors/) | Three categories; relative order is unnecessary | Partition with additional boundaries rather than stable zero filling |

#### Reconstruct it

State what the prefix before write means. Explain why write can never destroy an unread value.

{{END_DEEP_DIVE}}
