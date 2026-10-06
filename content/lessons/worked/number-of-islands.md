# Number of Islands

*Worked lesson · Connected-component traversal · LC 200*

**Difficulty: Medium.** Prerequisites: grid coordinates, sets, and a queue. Related chapter: [graph-modeling-and-traversal](/patterns/graph-modeling-and-traversal/).

## 1. The problem

Count separate land regions in a rectangular grid of string characters `"1"` and `"0"`. Land connects only horizontally or vertically, never diagonally. The boundary is surrounded by water. Keep the grid unchanged. [LeetCode 200](https://leetcode.com/problems/number-of-islands/). We additionally support an empty grid.

| Input | Answer | Why |
|---|---|---|
| Grid rows | Answer | Why |
|---|---:|---|
| `["110","010","001"]` | 2 | Bottom-right land is separate |
| `["10","01"]` | 2 | Diagonal contact is not a connection |
| `["00","00"]` | 0 | No land |

## 2. A correct baseline

```python
def baseline(grid):
    components=[]
    for r,row in enumerate(grid):
        for c,value in enumerate(row):
            if value!='1': continue
            neighbors={(r-1,c),(r+1,c),(r,c-1),(r,c+1)}
            combined={(r,c)}
            separate=[]
            for group in components:
                if group & neighbors:
                    combined |= group
                else:
                    separate.append(group)
            components=separate+[combined]
    return len(components)

assert baseline([list(r) for r in ['110','010','001']])==2
assert baseline([list(r) for r in ['10','01']])==2
assert baseline([list(r) for r in ['00','00']])==0
```

This maintains sets of processed components and merges any adjacent sets. For V cells, worst-case time is O(V²), with O(V) space. **Bottleneck:** searching existing groups for each new cell rather than visiting a region directly.

## 3. The observation

The grid is an implicit graph: each land cell is a vertex, with up to four edges. On finding unvisited land, count one island and traverse every land cell reachable from it. Mark cells when enqueuing so multiple neighbors cannot enqueue the same cell repeatedly.

## 4. The solution and a trace

```python
from collections import deque

class Solution:
    def numIslands(self, grid: list[list[str]]) -> int:
        """Rectangular string grid; four-neighbor land; preserve input."""
        if not grid or not grid[0]: return 0
        rows,cols=len(grid),len(grid[0])
        seen=set()
        islands=0
        for r in range(rows):
            for c in range(cols):
                if grid[r][c]!='1' or (r,c) in seen: continue
                islands+=1
                seen.add((r,c)); queue=deque([(r,c)])
                while queue:
                    x,y=queue.popleft()
                    for dx,dy in [(1,0),(-1,0),(0,1),(0,-1)]:
                        nx,ny=x+dx,y+dy
                        if (0<=nx<rows and 0<=ny<cols and
                            grid[nx][ny]=='1' and (nx,ny) not in seen):
                            seen.add((nx,ny))
                            queue.append((nx,ny))
        return islands

solve=Solution().numIslands
assert solve([list(r) for r in ['110','010','001']])==2
assert solve([list(r) for r in ['10','01']])==2
assert solve([list(r) for r in ['00','00']])==0
assert solve([])==0
```

For rows `110 / 010 / 001`:

| Event | Newly reached land | Island count |
|---|---|---:|
| Start at (0,0) | (0,0), then (0,1), then (1,1) | 1 |
| Scan those cells again | Already seen; skip | 1 |
| Start at (2,2) | (2,2) only | 2 |

## 5. Why it works

Each traversal reaches exactly the component of its start: it follows only legal land edges, and every reachable neighbor is eventually enqueued. Afterward that entire island is marked. The outer scan therefore starts once per island, never twice, and cannot miss a component.

## 6. Cost, edge cases, and failure

O(rows×cols) time and space. Each cell is scanned once and each land cell is enqueued once; it checks only four neighbors. A stack-based iterative DFS also works. Recursive DFS risks call-stack failure on a large connected region. The separate seen set preserves the input.

Changing adjacency changes the answer:

```python
assert solve([list('10'),list('01')])==2
assert baseline([list('11')])==1  # Horizontal contact does connect.
```

{{DEEP_DIVE}}

#### Check it against the baseline

```python
import random,copy
rng=random.Random(200)
for _ in range(500):
    rows,cols=rng.randint(1,6),rng.randint(1,6)
    grid=[[rng.choice('01') for _ in range(cols)] for _ in range(rows)]
    before=copy.deepcopy(grid)
    assert solve(grid)==baseline(grid)
    assert grid==before
assert solve([['1']*300 for _ in range(300)])==1
```

#### Related problems

| Problem | What changes | What follows |
|---|---|---|
| [Max Area of Island](https://leetcode.com/problems/max-area-of-island/) | Need largest component size | Count cells inside each traversal |
| [Number of Islands II](https://leetcode.com/problems/number-of-islands-ii/) | Land is added over time | Repeated full-grid scans waste work; merge components incrementally with union-find |

#### Reconstruct it

Name the graph's vertices and edges before coding. Explain why counting starts of traversals counts islands rather than cells.

{{END_DEEP_DIVE}}
