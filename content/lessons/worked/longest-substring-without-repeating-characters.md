# Longest Substring Without Repeating Characters

*Worked lesson · Sliding window with membership · LC 3*

**Difficulty: Medium.** Prerequisites: strings, sets, and window indexes. Related chapter: [sliding-windows-and-monotone-validity](/patterns/sliding-windows-and-monotone-validity/).

## 1. The problem

Return the length of the longest consecutive substring with no repeated character. Characters may include letters, digits, symbols and spaces; comparison is case-sensitive. Empty input returns 0. [LeetCode 3](https://leetcode.com/problems/longest-substring-without-repeating-characters/).

| Input | Answer | Why |
|---|---|---|
| `"abcabcbb"` | 3 | `abc` is a longest valid substring |
| `"abba"` | 2 | `ab` or `ba`, but never all four |
| `""` | 0 | No characters |

## 2. A correct baseline

```python
def baseline(s):
    best=0
    for start in range(len(s)):
        seen=set()
        for end in range(start,len(s)):
            if s[end] in seen:
                break
            seen.add(s[end])
            best=max(best,end-start+1)
    return best

assert baseline('abcabcbb')==3
assert baseline('abba')==2
assert baseline('')==0
```

Expected O(n²) time and O(n) space in the worst case. **Bottleneck:** rebuilding nearly the same membership set for overlapping starts.

## 3. The observation

Keep one duplicate-free window. When a new character is already present, remove characters from the left until its older occurrence is gone. Adding the new occurrence then restores validity. Removing left characters never creates a duplicate.

## 4. The solution and a trace

```python
class Solution:
    def lengthOfLongestSubstring(self, s: str) -> int:
        """Return a consecutive duplicate-free length; empty input gives 0."""
        seen=set()
        left=0
        best=0
        for right,char in enumerate(s):
            while char in seen:
                seen.remove(s[left])
                left+=1
            seen.add(char)  # Exactly the characters in the current valid window.
            best=max(best,right-left+1)
        return best

solve=Solution().lengthOfLongestSubstring
assert solve('abcabcbb')==3
assert solve('abba')==2
assert solve('')==0
```

| Step in `abba` | Removals | Window | Best |
|---|---|---|---:|
| First a | None | a | 1 |
| First b | None | ab | 2 |
| Second b | Remove a, then old b | b | 2 |
| Last a | None | ba | 2 |

## 5. Why it works

The set contains exactly the current window's characters, each once. Left advances only when an earlier start contains a duplicate; extending such a start cannot repair it. After shrinking just enough, this is the longest valid window ending at right. Taking the maximum across ends therefore finds the global longest.

## 6. Cost, edge cases, and failure

Expected O(n) time and O(n) worst-case space. Each occurrence enters once and leaves at most once; the inner while is not a quadratic rescan. Spaces count as characters. A substring must be consecutive; a subsequence may skip positions and is a different problem.

One removal is not always enough:

```python
assert len(set('ab'))==2
assert len(set('bb'))==1
assert solve('abba')==2  # At the second b, dropping only a leaves an invalid window.
```

{{DEEP_DIVE}}

#### Check it against the baseline

```python
import random
rng=random.Random(3)
for _ in range(1000):
    s=''.join(rng.choices('abAB 12!',k=rng.randrange(35)))
    assert solve(s)==baseline(s)
```

#### Related problems

| Problem | What changes | What follows |
|---|---|---|
| [Longest Substring with At Most Two Distinct Characters](https://leetcode.com/problems/longest-substring-with-at-most-two-distinct-characters/) | Repeated characters become legal | Store counts; a set alone cannot support removal correctly |
| [Longest Palindromic Substring](https://leetcode.com/problems/longest-palindromic-substring/) | Validity means symmetry | This shrink-on-duplicate rule is unrelated to palindrome validity |

#### Reconstruct it

Describe the set after every iteration. Trace the two removals in abba and explain why shrinking must repeat.

{{END_DEEP_DIVE}}
