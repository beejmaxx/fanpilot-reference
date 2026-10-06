# Validate Binary Search Tree

*Worked lesson · Propagating strict bounds · LC 98*

**Difficulty: Medium.** Prerequisites: binary trees and comparisons. Related chapter: [linked lists and recursive trees](/patterns/linked-lists-and-recursive-trees/).

## 1. The problem

Decide whether each node's **entire** left subtree contains smaller values and its entire right subtree contains larger values. Both subtrees must obey the same rule. Equality is forbidden. Leave the tree unchanged. We additionally accept an empty tree as valid. Examples use level-order notation. [LeetCode 98](https://leetcode.com/problems/validate-binary-search-tree/).

| Tree | Answer | Why |
|---|---|---|
| `[4,2,6]` | True | All left values are below 4; all right values above |
| `[5,3,8,null,null,4,9]` | False | 4 is in 5's right subtree |
| `[2,2,3]` | False | Equal keys violate strict order |
| `[]` | True | Empty-input extension |

## 2. A correct baseline

For each node, collect its descendant values and check them directly.

```python
class TreeNode:
    def __init__(self, val=0, left=None, right=None):
        self.val, self.left, self.right = val, left, right

def values(root):
    result, pending = [], [root]
    while pending:
        node = pending.pop()
        if node is not None:
            result.append(node.val)
            pending.extend((node.left, node.right))
    return result

def baseline(root):
    if root is None:
        return True
    return (all(x < root.val for x in values(root.left))
            and all(x > root.val for x in values(root.right))
            and baseline(root.left) and baseline(root.right))

assert baseline(TreeNode(4, TreeNode(2), TreeNode(6)))
assert not baseline(TreeNode(5, TreeNode(3), TreeNode(8, TreeNode(4), TreeNode(9))))
assert not baseline(TreeNode(2, TreeNode(2), TreeNode(3)))
assert baseline(None)
```

O(n²) worst-case time and O(n) peak extra space, including collected values and the recursive stack. On a valid chain, descendant lists are collected repeatedly. **Bottleneck:** checking the same descendant against every ancestor separately.

## 3. The observation

Every ancestor contributes a lower or upper bound. Only the strongest bounds matter: the maximum lower bound and minimum upper bound. Moving left replaces the upper bound with the current value; moving right replaces the lower bound. The bounds are **open**, so checking `lower < value < upper` also rejects duplicates. Use `None` for a missing bound, avoiding a finite sentinel that could exclude a valid extreme integer.

## 4. The solution and a trace

```python
class TreeNode:
    def __init__(self, val=0, left=None, right=None):
        self.val, self.left, self.right = val, left, right

class Solution:
    def isValidBST(self, root) -> bool:
        """Acyclic binary tree with integer keys; strict order, empty is valid."""
        pending = [(root, None, None)]
        while pending:
            node, lower, upper = pending.pop()
            if node is None:
                continue
            # Bounds summarize all ancestor restrictions on this subtree.
            if lower is not None and node.val <= lower:
                return False
            if upper is not None and node.val >= upper:
                return False
            pending.append((node.right, node.val, upper))
            pending.append((node.left, lower, node.val))
        return True

solve = Solution().isValidBST
assert solve(TreeNode(4, TreeNode(2), TreeNode(6)))
assert not solve(TreeNode(5, TreeNode(3), TreeNode(8, TreeNode(4), TreeNode(9))))
assert not solve(TreeNode(2, TreeNode(2), TreeNode(3)))
assert solve(None)
```

For the second example, nonempty-node visits are:

| Node | Lower | Upper | Action |
|---|---|---|---|
| 5 | None | None | Push child ranges |
| 3 | None | 5 | Valid; no real children |
| 8 | 5 | None | Push child ranges |
| 4 | 5 | 8 | Reject: 4 ≤ 5 |

## 5. Why it works

Every pending node carries exactly the interval allowed by its ancestors. A passing node can tighten that interval for its children without losing any ancestor restriction: it lies inside the old interval. Thus every rejected value violates a required ancestor comparison. Conversely, when every node passes, all descendants satisfy every ancestor's left/right restriction, so the tree is a BST. Strict comparisons supply the no-duplicates rule.

## 6. Cost, edge cases, and failure

Each node is pushed and checked once: O(n) time. Depth-first traversal keeps O(h) pending entries, where h is tree height; a chain gives O(n) worst-case space. No recursion or mutation is used. Negative values and the official signed 32-bit endpoints work without special cases. Checking immediate children alone fails:

```python
root = TreeNode(5, TreeNode(3), TreeNode(8, TreeNode(4), TreeNode(9)))
def local_only(node):
    # Deliberately wrong: forgets ancestors above the parent.
    if node is None:
        return True
    return ((node.left is None or node.left.val < node.val)
            and (node.right is None or node.right.val > node.val)
            and local_only(node.left) and local_only(node.right))
assert local_only(root)
assert not solve(root)
assert solve(TreeNode(-(2**31), None, TreeNode(2**31 - 1)))
```

{{DEEP_DIVE}}

#### Check it against the baseline

```python
import random
rng = random.Random(98)
def random_tree(depth):
    if depth == 0 or rng.randrange(4) == 0:
        return None
    return TreeNode(rng.randrange(-5, 6), random_tree(depth - 1), random_tree(depth - 1))
def snapshot(root):
    nodes, pending = [], [root]
    while pending:
        node = pending.pop()
        if node is not None:
            nodes.append((node, node.val, node.left, node.right))
            pending.extend((node.left, node.right))
    return nodes
for _ in range(500):
    root = random_tree(6)
    before = snapshot(root)
    assert solve(root) == baseline(root)
    assert all(node.val == val and node.left is left and node.right is right
               for node, val, left, right in before)
    # Assign increasing inorder values to also test genuinely valid shapes.
    def assign(node, counter):
        if node is not None:
            assign(node.left, counter)
            node.val = next(counter)
            assign(node.right, counter)
    assign(root, iter(range(1000)))
    assert solve(root) and baseline(root)
chain = None
for value in range(9999, -1, -1):
    chain = TreeNode(value, None, chain)
assert solve(chain)
```

#### Related problems

| Problem | What changes | What follows |
|---|---|---|
| [Search in a BST](https://leetcode.com/problems/search-in-a-binary-search-tree/) | Validity is promised | Follow just one branch |
| [Balanced Binary Tree](/worked/balanced-binary-tree/) | Heights replace key ordering | A balanced tree can still fail BST bounds |

#### Reconstruct it

Write the range inherited by each child before writing the loop. Draw a descendant that obeys its parent but violates its grandparent, then explain the strict inequalities.

{{END_DEEP_DIVE}}
