# Linked List Cycle

*Worked lesson · Fast and slow pointers · LC 141*

**Difficulty: Easy.** Prerequisites: linked nodes and object identity. Related chapter: [linked lists and recursive trees](/patterns/linked-lists-and-recursive-trees/).

## 1. The problem

Determine whether repeatedly following `next` from the head eventually revisits a node. Repeated **values** do not establish a cycle; revisiting the same **node object** does. The function receives only the head, not a cycle position. [LeetCode 141](https://leetcode.com/problems/linked-list-cycle/).

| Structure | Answer | Why |
|---|---|---|
| `A → B → C → B` | True | B is revisited |
| Two different nodes both holding 7, then None | False | Equal values, different nodes |
| Empty list | False | There is nothing to revisit |

## 2. A correct baseline

```python
class ListNode:
    def __init__(self, val=0, next=None):
        self.val, self.next = val, next

def baseline(head):
    seen = set()
    while head is not None:
        if id(head) in seen:
            return True
        seen.add(id(head))
        head = head.next
    return False

def example():
    a, b, c = ListNode(1), ListNode(2), ListNode(3)
    a.next, b.next, c.next = b, c, b
    return a

assert baseline(example())
assert not baseline(ListNode(7, ListNode(7)))
assert not baseline(None)
```

The list is not modified. For n reachable nodes, this takes O(n) time and O(n) memory. **Bottleneck:** recording every visited node merely to detect a return. The head keeps the reachable objects alive, so their identities remain stable during this traversal.

## 3. The observation

In a list without a cycle, a pointer eventually reaches None. Inside a cycle, a pointer moving twice as fast gains one position per round on a slower pointer. That relative movement eventually closes any gap. We need two references instead of a history set.

## 4. The solution and a trace

```python
class ListNode:
    def __init__(self, val=0, next=None):
        self.val, self.next = val, next

class Solution:
    def hasCycle(self, head) -> bool:
        """Detect a cycle without changing a singly linked list."""
        slow = fast = head  # Reachable finite nodes; each has one next link.
        while fast is not None and fast.next is not None:
            slow = slow.next
            fast = fast.next.next
            # Compare node identity after moving, not their stored values.
            if slow is fast:
                return True
        return False

solve = Solution().hasCycle
assert solve(example())
assert not solve(ListNode(7, ListNode(7)))
assert not solve(None)
```

For `A → B → C → B`:

| Round | Slow | Fast | Result |
|---|---|---|---|
| Start | A | A | Do not compare before moving |
| 1 | B | C | Different objects |
| 2 | C | C | Cycle found |

## 5. Why it works

After t rounds, slow has advanced t links and fast has advanced 2t. In an acyclic list their positions cannot coincide after a positive number of moves; fast eventually stops. In a cycle of length L, once both pointers are inside, their distance changes by one modulo L each round. They therefore coincide within L more rounds. These exhaust the possibilities for a finite singly linked structure.

## 6. Cost, edge cases, and failure

O(n) time and O(1) extra space, including a noncyclic prefix followed by a cycle. A self-loop is a cycle. Testing before moving would label every nonempty list cyclic, since both references initially point at the head. Comparing values would also fail:

```python
head = ListNode(7, ListNode(7, ListNode(7)))
assert head.next.val == head.next.next.val
assert head.next is not head.next.next
assert not solve(head)
one = ListNode(9)
one.next = one
assert solve(one)
```

{{DEEP_DIVE}}

#### Check it against the baseline

```python
import random
rng = random.Random(141)
for _ in range(1000):
    nodes = [ListNode(rng.randrange(3)) for _ in range(rng.randrange(40))]
    for a, b in zip(nodes, nodes[1:]):
        a.next = b
    if nodes and rng.randrange(2):
        nodes[-1].next = rng.choice(nodes)
    head = nodes[0] if nodes else None
    links = [node.next for node in nodes]
    assert solve(head) == baseline(head)
    assert all(node.next is link for node, link in zip(nodes, links))
```

#### Related problems

| Problem | What changes | What follows |
|---|---|---|
| [Linked List Cycle II](https://leetcode.com/problems/linked-list-cycle-ii/) | Return the cycle entrance | The meeting point needs a second phase |
| [Course Schedule](https://leetcode.com/problems/course-schedule/) | Nodes can have many outgoing edges | Two pointers following one path cannot detect all graph cycles |

#### Reconstruct it

Explain the safety check before moving fast twice. Derive why a one-position relative gain catches slow, and why identity matters.

{{END_DEEP_DIVE}}
