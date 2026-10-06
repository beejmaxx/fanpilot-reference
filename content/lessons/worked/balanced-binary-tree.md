# Balanced Binary Tree

*Worked lesson · Postorder height summaries · LC 110*

**Difficulty: Easy.** Prerequisites: [tree depth](/worked/maximum-depth-of-binary-tree/) and stacks. Related chapter: [linked lists and recursive trees](/patterns/linked-lists-and-recursive-trees/).

## 1. The problem

Return whether **every node** has left and right subtree heights differing by at most one. Height counts nodes on the longest downward path; an absent subtree has height zero. Values do not matter. Leave node values and links unchanged. Examples use level-order notation. [LeetCode 110](https://leetcode.com/problems/balanced-binary-tree/).

| Tree | Answer | Why |
|---|---|---|
| `[2,1,3]` | True | Both child heights are 1 |
| `[1,2,null,3]` | False | Root child heights are 2 and 0 |
| `[]` | True | No node violates the rule |

## 2. A correct baseline

```python
class TreeNode:
    def __init__(self, val=0, left=None, right=None):
        self.val, self.left, self.right = val, left, right

def height(node):
    return 0 if node is None else 1 + max(height(node.left), height(node.right))

def baseline(root):
    if root is None:
        return True
    local_ok = abs(height(root.left) - height(root.right)) <= 1
    left_ok = baseline(root.left)
    right_ok = baseline(root.right)
    return local_ok and left_ok and right_ok

assert baseline(TreeNode(2, TreeNode(1), TreeNode(3)))
assert not baseline(TreeNode(1, TreeNode(2, TreeNode(3))))
assert baseline(None)
```

O(n²) worst-case time: on a chain, repeatedly computing subtree heights revisits n + (n−1) + … nodes. The recursive stack uses O(h) space. **Bottleneck:** throwing away each calculated height, then calculating it again for ancestors.

## 3. The observation

Process children before their parent. Once their heights are known, checking this parent and calculating its height both take constant time. An explicit postorder stack avoids Python's recursion limit on long chains. Keep the completed heights in a dictionary keyed by node identity.

## 4. The solution and a trace

```python
class TreeNode:
    def __init__(self, val=0, left=None, right=None):
        self.val, self.left, self.right = val, left, right

class Solution:
    def isBalanced(self, root) -> bool:
        """Check every node of an acyclic binary tree; empty is balanced."""
        heights = {id(None): 0}
        pending = [(root, False)]
        while pending:
            node, expanded = pending.pop()
            if node is None:
                continue
            if not expanded:
                # Revisit this parent after both children have heights.
                pending.append((node, True))
                pending.append((node.right, False))
                pending.append((node.left, False))
            else:
                left = heights[id(node.left)]
                right = heights[id(node.right)]
                if abs(left - right) > 1:
                    return False
                heights[id(node)] = 1 + max(left, right)
        return True

solve = Solution().isBalanced
assert solve(TreeNode(2, TreeNode(1), TreeNode(3)))
assert not solve(TreeNode(1, TreeNode(2, TreeNode(3))))
assert solve(None)
```

For a left-only chain `1 → 2 → 3`, the completed-node events are:

| Completed node | Left height | Right height | Action |
|---|---:|---:|---|
| 3 | 0 | 0 | Save height 1 |
| 2 | 1 | 0 | Save height 2 |
| 1 | 2 | 0 | Return False |

## 5. Why it works

Before an expanded node is processed, both child heights are exact: missing children start at zero, and real children are completed first. If their difference exceeds one, that node is a witness to failure. Otherwise its saved height is exact. Returning True means every node was checked successfully, not just the root.

## 6. Cost, edge cases, and failure

O(n) time, O(n) extra space for heights plus O(h) stack space. This straightforward iterative version trades the recursive version's O(h) space for handling deep Python trees safely. Equal root heights alone are insufficient:

```python
left = TreeNode(2, TreeNode(3, TreeNode(4)))
right = TreeNode(5, None, TreeNode(6, None, TreeNode(7)))
root = TreeNode(1, left, right)
assert height(left) == height(right)
assert not solve(root)  # Both child subtrees are unbalanced.
```

{{DEEP_DIVE}}

#### Check it against the baseline

```python
import random
rng = random.Random(110)
def random_tree(depth):
    if depth == 0 or rng.randrange(4) == 0:
        return None
    return TreeNode(rng.randrange(4), random_tree(depth - 1), random_tree(depth - 1))
def snapshot(root):
    nodes, pending = [], [root]
    while pending:
        node = pending.pop()
        if node is not None:
            nodes.append((node, node.val, node.left, node.right))
            pending.extend((node.left, node.right))
    return nodes
for _ in range(500):
    tree = random_tree(7)
    before = snapshot(tree)
    assert solve(tree) == baseline(tree)
    assert all(node.val == val and node.left is left and node.right is right
               for node, val, left, right in before)
# Stress extension beyond the official 5,000-node limit.
chain = None
for _ in range(10000):
    chain = TreeNode(0, chain)
assert not solve(chain)
```

#### Related problems

| Problem | What changes | What follows |
|---|---|---|
| [Diameter of Binary Tree](https://leetcode.com/problems/diameter-of-binary-tree/) | Need the longest path | Combine the same heights by addition |
| [Maximum Depth](https://leetcode.com/problems/maximum-depth-of-binary-tree/) | Only the longest root path matters | One global maximum cannot certify balance everywhere |

#### Reconstruct it

Draw the stack order that makes children finish before their parent. Explain why equal heights at the root do not settle the whole problem.

{{END_DEEP_DIVE}}
