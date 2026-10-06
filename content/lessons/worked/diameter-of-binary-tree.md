# Diameter of Binary Tree

*Worked lesson · Combining subtree summaries · LC 543*

**Difficulty: Easy.** Prerequisites: [tree depth](/worked/maximum-depth-of-binary-tree/) and postorder traversal. Related chapter: [linked lists and recursive trees](/patterns/linked-lists-and-recursive-trees/).

## 1. The problem

Find the greatest number of **edges** on a path between any two nodes of a binary tree. The path need not pass through the root. Values do not affect the answer. Leave node values and links unchanged. We additionally define the empty tree's diameter as zero. [LeetCode 543](https://leetcode.com/problems/diameter-of-binary-tree/).

| Tree, in level order | Answer | Why |
|---|---:|---|
| `[1,2,3,4,5]` | 3 | Path 4 → 2 → 1 → 3 |
| `[8]` | 0 | One node, no edges |
| `[]` | 0 | Empty-input extension |

## 2. A correct baseline

Turn the tree into an undirected adjacency list, then traverse from every possible starting node.

```python
class TreeNode:
    def __init__(self, val=0, left=None, right=None):
        self.val, self.left, self.right = val, left, right

def example():
    return TreeNode(1, TreeNode(2, TreeNode(4), TreeNode(5)), TreeNode(3))

def baseline(root):
    if root is None:
        return 0
    graph = {}
    pending = [root]
    while pending:
        node = pending.pop()
        graph.setdefault(id(node), [])
        for child in (node.left, node.right):
            if child is not None:
                graph.setdefault(id(child), []).append(id(node))
                graph[id(node)].append(id(child))
                pending.append(child)
    best = 0
    for start in graph:
        pending = [(start, None, 0)]
        while pending:
            node, parent, distance = pending.pop()
            best = max(best, distance)
            for neighbor in graph[node]:
                if neighbor != parent:
                    pending.append((neighbor, node, distance + 1))
    return best

assert baseline(example()) == 3
assert baseline(TreeNode(8)) == 0
assert baseline(None) == 0
```

O(n²) time and O(n) extra space. **Bottleneck:** exploring the same downward branches again for different possible endpoints.

## 3. The observation

Every path has a highest node relative to the root. At that node, the longest path passing through it uses the deepest branch from each child. If child heights count nodes, their sum already counts the edges through the parent. Compute these heights once, bottom-up, and take the largest sum anywhere.

## 4. The solution and a trace

```python
class TreeNode:
    def __init__(self, val=0, left=None, right=None):
        self.val, self.left, self.right = val, left, right

class Solution:
    def diameterOfBinaryTree(self, root) -> int:
        """Return the longest path's edge count; empty trees return zero."""
        heights = {id(None): 0}
        pending = [(root, False)]
        best = 0
        while pending:
            node, expanded = pending.pop()
            if node is None:
                continue
            if not expanded:
                pending.append((node, True))
                pending.append((node.right, False))
                pending.append((node.left, False))
            else:
                left = heights[id(node.left)]
                right = heights[id(node.right)]
                best = max(best, left + right)  # Path bending at this node.
                heights[id(node)] = 1 + max(left, right)
        return best

solve = Solution().diameterOfBinaryTree
assert solve(example()) == 3
assert solve(TreeNode(8)) == 0
assert solve(None) == 0
```

Completed-node events for the example:

| Node | Child heights | Saved height | Best diameter |
|---|---|---:|---:|
| 4 | 0, 0 | 1 | 0 |
| 5 | 0, 0 | 1 | 0 |
| 2 | 1, 1 | 2 | 2 |
| 3 | 0, 0 | 1 | 2 |
| 1 | 2, 1 | 3 | 3 |

## 5. Why it works

Completed heights are exact by postorder induction. Joining deepest child branches creates a real path of length left + right, so no candidate overestimates the diameter. Conversely, the longest path has a highest node, and its two branches cannot exceed those child heights. Our candidate at that node is at least as long as the longest path. Therefore the maximum candidate is exactly the diameter.

## 6. Cost, edge cases, and failure

O(n) time and O(n) extra space for cached heights; the explicit traversal stack uses O(h). This avoids Python recursion limits. Looking only at the path through the root can miss the answer:

```python
fork = TreeNode(2, TreeNode(3, TreeNode(4)), TreeNode(5, None, TreeNode(6)))
root = TreeNode(1, fork)
assert solve(root) == 4  # 4 → 3 → 2 → 5 → 6, entirely below the root.
assert solve(TreeNode(1, TreeNode(2))) == 1  # Count edges, not nodes.
```

{{DEEP_DIVE}}

#### Check it against the baseline

```python
import random
rng = random.Random(543)
def random_tree(depth):
    if depth == 0 or rng.randrange(3) == 0:
        return None
    return TreeNode(rng.randrange(3), random_tree(depth - 1), random_tree(depth - 1))
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
chain = None
for _ in range(10000):
    chain = TreeNode(1, chain)
assert solve(chain) == 9999
```

#### Related problems

| Problem | What changes | What follows |
|---|---|---|
| [Balanced Binary Tree](https://leetcode.com/problems/balanced-binary-tree/) | Check height differences | Same child summaries, different combination |
| [Binary Tree Maximum Path Sum](https://leetcode.com/problems/binary-tree-maximum-path-sum/) | Values and negative branches matter | Height no longer summarizes the best branch |

#### Reconstruct it

Explain why the returned height keeps one branch while the candidate diameter combines two. Find a tree whose best path avoids the root.

{{END_DEEP_DIVE}}
