# Merge k Sorted Lists

*Worked lesson · Heap frontier · LC 23*

**Difficulty: Hard.** Prerequisites: linked nodes and min-heaps. Related chapter: [heaps-and-the-candidate-frontier](/patterns/heaps-and-the-candidate-frontier/).

## 1. The problem

Merge sorted singly linked lists into one sorted linked list, preserving every value occurrence. Inputs may include empty lists. This version reuses input nodes and changes their next links. [LeetCode 23](https://leetcode.com/problems/merge-k-sorted-lists/). Array notation below describes node values.

| Input | Answer | Why |
|---|---|---|
| `[[1,4],[1,3],[2]]` | `[1,1,2,3,4]` | All occurrences remain |
| `[[],[5]]` | `[5]` | Empty list contributes nothing |
| `[]` | `[]` | No nodes |

## 2. A correct baseline

```python
class ListNode:
    def __init__(self,val=0,next=None):
        self.val,self.next=val,next

def build(values):
    head=None
    for v in reversed(values): head=ListNode(v,head)
    return head

def values(head):
    result=[]
    while head:
        result.append(head.val); head=head.next
    return result

def baseline(lists):
    return build(sorted(v for head in lists for v in values(head)))

assert values(baseline([build([1,4]),build([1,3]),build([2])]))==[1,1,2,3,4]
assert values(baseline([None,build([5])]))==[5]
assert baseline([]) is None
```

Flattening and sorting costs O(N log N) time and O(N) extra storage for N nodes. **Bottleneck:** ordering every value despite already-ordered inputs.

## 3. The observation

Only each list's first unused node can be its next contribution. Put those frontier nodes in a heap. After removing one, offer its successor. A unique list index breaks ties without comparing node objects.

## 4. The solution and a trace

```python
import heapq

class ListNode:
    def __init__(self,val=0,next=None):
        self.val,self.next=val,next

class Solution:
    def mergeKLists(self, lists: list) -> object:
        """Sorted acyclic lists; reuse their nodes in the merged chain."""
        heap=[(node.val,i,node) for i,node in enumerate(lists) if node]
        heapq.heapify(heap)
        dummy=ListNode(); tail=dummy
        while heap:
            _,i,node=heapq.heappop(heap)
            following=node.next
            tail.next=node; tail=node
            if following:
                heapq.heappush(heap,(following.val,i,following))
        tail.next=None
        return dummy.next

solve=Solution().mergeKLists
assert values(solve([build([1,4]),build([1,3]),build([2])]))==[1,1,2,3,4]
assert values(solve([None,build([5])]))==[5]
assert solve([]) is None
```

| Front values for `[[1,4],[2,3]]` | Taken | New frontier |
|---|---|---|
| 1,2 | 1 | 4,2 |
| 4,2 | 2 | 4,3 |
| 4,3 | 3 | 4 |
| 4 | 4 | empty |

## 5. Why it works

The heap holds the first unused node of every unfinished list. Since each list is sorted, the smallest frontier value is the smallest remaining value anywhere. Removing it preserves sorted output; replacing it with its successor restores the frontier. Every node is emitted once.

## 6. Cost, edge cases, and failure

O(k + N log(k+1)) time, O(k) heap space. No output nodes except a sentinel are allocated. LeetCode supplies ListNode; the definition here makes the sample runnable. Lists must not share nodes or contain cycles.

```python
assert sorted([4,1])==[1,4]
assert values(solve([build([4,1])]))==[4,1]  # Deliberately unsorted input breaks the frontier argument.
```

{{DEEP_DIVE}}

#### Check it against the baseline

```python
import random
rng=random.Random(23)
for _ in range(250):
    arrays=[sorted(rng.randint(-5,5) for _ in range(rng.randrange(8))) for _ in range(rng.randrange(8))]
    expected=values(baseline([build(a) for a in arrays]))
    assert values(solve([build(a) for a in arrays]))==expected
```

#### Related problems

| Problem | What changes | What follows |
|---|---|---|
| [Merge Two Sorted Lists](https://leetcode.com/problems/merge-two-sorted-lists/) | Two frontiers only | Compare directly; no heap needed |
| [Sort List](https://leetcode.com/problems/sort-list/) | One unsorted list | A frontier heap is insufficient; divide and merge sorted halves |

#### Reconstruct it

Explain why one candidate per list is enough. Show why a tie-breaking index is necessary in Python heap tuples.

{{END_DEEP_DIVE}}
