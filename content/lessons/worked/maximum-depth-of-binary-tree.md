# Maximum Depth of Binary Tree

*Worked lesson · Explicit traversal state · LC 104*

**Difficulty: Easy.** Prerequisites: tree nodes and a stack. Related chapter: [linked-lists-and-recursive-trees](/patterns/linked-lists-and-recursive-trees/).

## 1. The problem

Return the largest number of nodes on a root-to-leaf path in a binary tree. Count nodes, not edges; an empty tree has depth 0. Values do not affect depth. Level-order notation uses null for absent children. [LeetCode 104](https://leetcode.com/problems/maximum-depth-of-binary-tree/).

| Input | Answer | Why |
|---|---|---|
| `[3,9,20,null,null,15,7]` | 3 | Root, 20, then a leaf |
| `[8]` | 1 | The root is itself a leaf |
| `[]` | 0 | No nodes |

## 2. A correct baseline

```python
class TreeNode:
    def __init__(self,val=0,left=None,right=None):
        self.val,self.left,self.right=val,left,right

def example():
    return TreeNode(3,TreeNode(9),TreeNode(20,TreeNode(15),TreeNode(7)))

def baseline(root):
    if root is None:
        return 0
    paths=[]
    pending=[(root,[])]
    while pending:
        node,path=pending.pop()
        path=path+[node.val]
        if node.left is None and node.right is None:
            paths.append(path)
        if node.left: pending.append((node.left,path))
        if node.right: pending.append((node.right,path))
    return max(map(len,paths))

assert baseline(example())==3
assert baseline(TreeNode(8))==1
assert baseline(None)==0
```

This enumerates paths in O(nh) worst-case time and space for n nodes and height h, because path contents are copied and retained. **Bottleneck:** storing values along a path when only its length matters.

## 3. The observation

A traversal item only needs a node and its depth. Increment that integer when adding a child; retain the greatest depth seen. An explicit stack also avoids Python's call-stack limit on a deep chain.

## 4. The solution and a trace

```python
class TreeNode:
    def __init__(self,val=0,left=None,right=None):
        self.val,self.left,self.right=val,left,right

class Solution:
    def maxDepth(self, root) -> int:
        """Count nodes on the longest path in an acyclic binary tree."""
        if root is None:
            return 0
        pending=[(root,1)]  # Each depth is measured from the original root.
        best=0
        while pending:
            node,depth=pending.pop()
            best=max(best,depth)
            if node.left: pending.append((node.left,depth+1))
            if node.right: pending.append((node.right,depth+1))
        return best

solve=Solution().maxDepth
assert solve(example())==3
assert solve(TreeNode(8))==1
assert solve(None)==0
```

| Node visited in the example | Depth | Best |
|---|---:|---:|
| 3 | 1 | 1 |
| 20 | 2 | 2 |
| 7 | 3 | 3 |
| 15 | 3 | 3 |
| 9 | 2 | 3 |

## 5. Why it works

Every pending depth is its node's true root-path length: the root starts at 1 and a child adds one. Every node enters exactly once in a tree. A deepest node must be a leaf, since any child would be deeper. Thus maximizing all visited depths gives the required leaf-path depth.

## 6. Cost, edge cases, and failure

O(n) time and O(h) auxiliary stack space for this depth-first traversal. Each ancestor contributes at most one waiting sibling. A recursive solution has the same mathematical bounds but can raise RecursionError on a skewed tree within platform size limits.

```python
assert solve(TreeNode(1))==1  # Counting edges would incorrectly give 0.
assert solve(TreeNode(1,None,TreeNode(2)))==2
```

{{DEEP_DIVE}}

#### Check it against the baseline

```python
import random
rng=random.Random(104)
def random_tree(depth):
    if depth==0 or rng.randrange(4)==0: return None
    return TreeNode(rng.randrange(10),random_tree(depth-1),random_tree(depth-1))
for _ in range(500):
    root=random_tree(7)
    assert solve(root)==baseline(root)
chain=None
for _ in range(10000): chain=TreeNode(1,chain)
assert solve(chain)==10000
```

#### Related problems

| Problem | What changes | What follows |
|---|---|---|
| [Balanced Binary Tree](https://leetcode.com/problems/balanced-binary-tree/) | Need two subtree heights at each node | Return local height summaries; one global max is insufficient |
| [Diameter of Binary Tree](https://leetcode.com/problems/diameter-of-binary-tree/) | Longest path need not start at the root | Combine left/right heights at every node; maximum root depth is not the diameter |

#### Reconstruct it

Explain why the stack item needs a depth rather than a whole path. Trace a right-only chain and an empty tree.

{{END_DEEP_DIVE}}
