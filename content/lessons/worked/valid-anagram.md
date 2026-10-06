# Valid Anagram

*Worked lesson · Frequency summaries · LC 242*

**Difficulty: Easy.** Prerequisites: strings and dictionaries. Related chapter: [hashing-and-sufficient-summaries](/patterns/hashing-and-sufficient-summaries/).

## 1. The problem

Return whether two lowercase English strings contain exactly the same letters with exactly the same multiplicities. Order does not matter, but counts do. [LeetCode 242](https://leetcode.com/problems/valid-anagram/). This function also supports empty strings.

| Input | Answer | Why |
|---|---|---|
| `"listen"`, `"silent"` | True | Same counts in a different order |
| `"aab"`, `"abb"` | False | Different counts of a and b |
| `"a"`, `""` | False | One character has no partner |

## 2. A correct baseline

```python
def baseline(s,t):
    return sorted(s)==sorted(t)

assert baseline('listen','silent')
assert not baseline('aab','abb')
assert not baseline('a','')
```

Sorting costs O(n log n + m log m) time and O(n+m) space. **Bottleneck:** ordering individual occurrences when only their counts matter.

## 3. The observation

A count dictionary is a sufficient summary. Equal string lengths are necessary; then count one string and spend those counts while reading the other. A missing or exhausted count proves a mismatch immediately.

## 4. The solution and a trace

```python
class Solution:
    def isAnagram(self, s: str, t: str) -> bool:
        """Compare letter multiplicities; supports empty strings."""
        if len(s)!=len(t):
            return False
        counts={}
        for char in s:
            counts[char]=counts.get(char,0)+1
        for char in t:
            if counts.get(char,0)==0:
                return False
            counts[char]-=1
        return True

solve=Solution().isAnagram
assert solve('listen','silent')
assert not solve('aab','abb')
assert not solve('a','')
assert solve('','')
```

For `s="aab"`, `t="aba"`, build `{a:2,b:1}`:

| Consume | Counts left |
|---|---|
| a | `{a:1,b:1}` |
| b | `{a:1,b:0}` |
| a | `{a:0,b:0}`; return True |

## 5. Why it works

Before each consumption, counts describe the unpaired occurrences in s. Consuming only available letters preserves nonnegative counts. Equal lengths mean that consuming all of t also consumes all of s. Thus success establishes exactly equal multiplicities; any failed consumption establishes a mismatch.

## 6. Cost, edge cases, and failure

Expected O(n+m) time and O(1) space for the fixed 26-letter alphabet. With arbitrary characters, space becomes O(distinct characters); dictionary keys can still handle Unicode code points. Case folding or Unicode normalization would be a separate contract.

A set loses multiplicity:

```python
assert set('aab')==set('abb')
assert not solve('aab','abb')  # Counterexample to set equality as an anagram test.
```

{{DEEP_DIVE}}

#### Check it against the baseline

```python
import random
rng=random.Random(242)
for _ in range(1000):
    s=''.join(rng.choices('abcd',k=rng.randrange(20)))
    t=''.join(rng.sample(list(s),len(s))) if rng.randrange(2) else ''.join(rng.choices('abcd',k=rng.randrange(20)))
    assert solve(s,t)==baseline(s,t)
```

#### Related problems

| Problem | What changes | What follows |
|---|---|---|
| [Group Anagrams](https://leetcode.com/problems/group-anagrams/) | Many words must be partitioned | Use counts or sorted letters as a shared key |
| [Isomorphic Strings](https://leetcode.com/problems/isomorphic-strings/) | Positions must follow a consistent renaming | Letter counts alone do not preserve the needed relationships |

#### Reconstruct it

Explain why matching lengths plus successful consumption is enough. Test both a missing character and an exhausted character.

{{END_DEEP_DIVE}}
