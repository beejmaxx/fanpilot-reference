# Reverse Linked List

*Worked lesson · Pointer reversal · LC 206*

**Difficulty: Easy.** Prerequisites: node references and assignment. Related chapter: [linked-lists-and-recursive-trees](/patterns/linked-lists-and-recursive-trees/).

## 1. The problem

Reverse a singly linked list by changing its next links and return the new head. Reuse the original nodes; do not merely return reversed values. Empty input returns None. Array notation below represents a chain of node values. [LeetCode 206](https://leetcode.com/problems/reverse-linked-list/).

| Input | Answer | Why |
|---|---|---|
| `1 → 2 → 3` | `3 → 2 → 1` | Every next link is reversed |
| `7` | `7` | Only one node |
| Empty | None | No head exists |

## 2. A correct baseline

```python
class ListNode:
    def __init__(self,val=0,next=None):
        self.val,self.next=val,next

def build(values):
    head=None
    for value in reversed(values):
        head=ListNode(value,head)
    return head

def nodes(head):
    result=[]
    while head:
        result.append(head)
        head=head.next
    return result

def values(head):
    return [node.val for node in nodes(head)]

def baseline(head):
    original=nodes(head)
    for i,node in enumerate(original):
        node.next=original[i-1] if i else None
    return original[-1] if original else None

assert values(baseline(build([1,2,3])))==[3,2,1]
assert values(baseline(build([7])))==[7]
assert baseline(None) is None
```

O(n) time and O(n) extra space to remember the node sequence. **Bottleneck:** retaining every reference when only the next unread node and reversed prefix are needed.

## 3. The observation

Split the chain into a reversed prefix and an untouched suffix. Save the current node's next reference before replacing it; otherwise the remaining suffix becomes unreachable from our traversal.

## 4. The solution and a trace

```python
class ListNode:
    def __init__(self,val=0,next=None):
        self.val,self.next=val,next

class Solution:
    def reverseList(self, head):
        """Reverse an acyclic singly linked list, reusing every node."""
        previous=None
        current=head
        while current:
            following=current.next  # Save the unread suffix before rewiring.
            current.next=previous
            previous=current
            current=following
        return previous

solve=Solution().reverseList
assert values(solve(build([1,2,3])))==[3,2,1]
assert values(solve(build([7])))==[7]
assert solve(None) is None
```

| Move | Reversed prefix | Unread suffix |
|---|---|---|
| Start | Empty | `1 → 2 → 3` |
| Rewire 1 | `1 → None` | `2 → 3` |
| Rewire 2 | `2 → 1 → None` | `3` |
| Rewire 3 | `3 → 2 → 1 → None` | Empty |

## 5. Why it works

previous heads the reversed processed prefix; current heads the untouched suffix. Saving following preserves the suffix while rewiring transfers exactly one node into the prefix. Every original node is transferred once. When current is None, the entire original chain has been reversed.

## 6. Cost, edge cases, and failure

O(n) time and O(1) extra space. Node identities and values are preserved; next references change. Empty and singleton chains require no special branches. A cyclic input violates the precondition and cannot be treated as a finite list.

Changing a value is not reversing a link:

```python
head=build([1,2]); first=head; second=head.next
result=solve(head)
assert result is second and result.next is first and first.next is None
```

{{DEEP_DIVE}}

#### Check it against the baseline

```python
import random
rng=random.Random(206)
for _ in range(500):
    data=[rng.randint(-10,10) for _ in range(rng.randrange(50))]
    head=build(data); original=nodes(head)
    result=solve(head); actual=nodes(result)
    assert actual==original[::-1]
    assert [n.val for n in actual]==values(baseline(build(data)))
# The iterative solution also handles chains beyond Python's recursion depth.
assert len(nodes(solve(build(list(range(5000))))))==5000
```

#### Related problems

| Problem | What changes | What follows |
|---|---|---|
| [Reverse Linked List II](https://leetcode.com/problems/reverse-linked-list-ii/) | Reverse a bounded segment | Preserve references to both outer boundaries |
| [Reverse Nodes in k-Group](https://leetcode.com/problems/reverse-nodes-in-k-group/) | Only complete groups reverse | First establish whether k nodes remain; whole-chain reversal loses that condition |

#### Reconstruct it

Draw the two chains before each loop. Explain precisely which reference would be lost if you changed current.next before saving it.

{{END_DEEP_DIVE}}
