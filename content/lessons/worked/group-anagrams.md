# Group Anagrams

*Worked lesson · Canonical keys and hashing · LC 49*

**Difficulty: Medium.** Prerequisites: dictionaries, strings, and sorting. This extends [hashing and sufficient summaries](/patterns/hashing-and-sufficient-summaries/): give equivalent objects the same key.

## 1. The problem

Group lowercase English words that contain exactly the same letters with exactly the same counts. Return all groups; the order of groups and words does not matter. Keep duplicate words. This is [Group Anagrams](https://leetcode.com/problems/group-anagrams/) (LC 49).

| Words | One valid result | Why |
|---|---|---|
| `["eat", "tea", "bat"]` | `[["eat", "tea"], ["bat"]]` | Rearranging letters connects the first two words |
| `["aab", "abb"]` | `[["aab"], ["abb"]]` | Same distinct letters, different counts |
| `["", ""]` | `[["", ""]]` | Empty words match; preserve both occurrences |

The function also returns `[]` for an empty input list, an extension beyond the platform's nonempty-list contract.

## 2. A correct baseline

Compare each word's letter counts with a representative of every existing group.

```python
from collections import Counter

def baseline(words):
    groups = []
    for word in words:
        counts = Counter(word)
        for group in groups:
            if counts == Counter(group[0]):
                group.append(word)
                break
        else:  # Python's for/else runs when the loop did not break.
            groups.append([word])
    return groups

assert baseline(["eat", "tea", "bat"]) == [["eat", "tea"], ["bat"]]
assert baseline(["aab", "abb"]) == [["aab"], ["abb"]]
assert baseline(["", ""]) == [["", ""]]
assert baseline([]) == []
```

For n words of maximum length k, this costs O(n²(k + 1)) time in the worst case. **The bottleneck:** searching through groups and rebuilding their representatives' counts.

## 3. The observation

Sorting a word's letters gives a shared representation: `eat`, `tea`, and `ate` all become `aet`. Two words have the same sorted representation exactly when their letter counts match. A dictionary can therefore find the right group directly.

A set of letters would lose counts: `aab` and `abb` would incorrectly share a key.

## 4. The solution and a trace

```python
class Solution:
    def groupAnagrams(self, strs: list[str]) -> list[list[str]]:
        """Group lowercase words by letter counts; preserve duplicates."""
        groups = {}  # Sorted letters -> all matching words seen so far.
        for word in strs:
            key = "".join(sorted(word))
            if key not in groups:
                groups[key] = []
            groups[key].append(word)
        return list(groups.values())

solve = Solution().groupAnagrams
assert solve(["eat", "tea", "bat"]) == [["eat", "tea"], ["bat"]]
assert solve(["aab", "abb"]) == [["aab"], ["abb"]]
assert solve(["", ""]) == [["", ""]]
assert solve([]) == []
```

`sorted(word)` produces a list of letters; `"".join(...)` makes an immutable string suitable for a dictionary key.

| Word | Key | Group after insertion |
|---|---|---|
| `eat` | `aet` | `["eat"]` |
| `tea` | `aet` | `["eat", "tea"]` |
| `bat` | `abt` | `["bat"]` |

## 5. Why it works

After each iteration, every processed word appears once in the group identified by its sorted letters. Equal keys mean equal counts, so no non-anagrams share a group. Anagrams always have equal keys, so none are split apart. Appending once per input occurrence also preserves duplicates.

## 6. Cost, edge cases, and failure

Expected time is O(n + Σ m log(m + 1)), summing over word lengths m. The dictionary avoids pairwise comparisons; sorting each word remains. Space is O(n + total input characters) in the worst case for keys and word references. The input strings are not copied into new strings for the output.

Empty strings produce the empty key. Do not replace the key with a set, which ignores multiplicity:

```python
assert set("aab") == set("abb")  # A set-based key would incorrectly merge them.
assert "".join(sorted("aab")) != "".join(sorted("abb"))
```

{{DEEP_DIVE}}

#### Check it against the baseline

```python
import random
rng = random.Random(49)
normalize = lambda groups: sorted(sorted(group) for group in groups)
for _ in range(1000):
    words = ["".join(rng.choices("abc", k=rng.randrange(7)))
             for _ in range(rng.randrange(15))]
    before = words.copy()
    assert normalize(solve(words)) == normalize(baseline(words))
    assert words == before
```

#### Related problems

| Problem | What changes | What follows |
|---|---|---|
| [Valid Anagram](https://leetcode.com/problems/valid-anagram/) | Compare only two words | Compare counts directly; no grouping dictionary needed |
| [Find All Anagrams in a String](https://leetcode.com/problems/find-all-anagrams-in-a-string/) | Search consecutive windows inside one string | Sorting the entire string loses positions; update counts as a window moves |

For the fixed 26-letter alphabet, a tuple of 26 counts is another valid key. It avoids per-word sorting, but introduces more bookkeeping; the grouping argument stays the same.

#### Reconstruct it

Explain what information a grouping key must preserve. Write the dictionary update from memory, then use `aab` and `abb` to test whether your key preserves counts.

{{END_DEEP_DIVE}}
