# Valid Parentheses

*Worked lesson · Stack matching · LC 20*

**Difficulty: Easy.** Prerequisites: lists and stack append/pop. Related chapter: [stacks-and-monotonic-deques](/patterns/stacks-and-monotonic-deques/).

## 1. The problem

Decide whether every bracket has a matching partner of the same type, with nested brackets closing in the correct order. Input contains only `()[]{}`. [LeetCode 20](https://leetcode.com/problems/valid-parentheses/). We additionally accept empty text as valid.

| Input | Answer | Why |
|---|---|---|
| `"([]){}"` | True | Nested and side-by-side pairs |
| `"([)]"` | False | Counts match but nesting does not |
| `")"` | False | No earlier opening bracket |

## 2. A correct baseline

```python
def baseline(text):
    while True:
        smaller=text.replace('()','').replace('[]','').replace('{}','')
        if smaller==text:
            return text==''
        text=smaller

assert baseline('([]){}')
assert not baseline('([)]')
assert not baseline(')')
```

O(n²) worst-case time and O(n) temporary space: nested input loses only a few characters per scan. **Bottleneck:** rescanning already-seen openings instead of remembering unmatched ones.

## 3. The observation

The next closing bracket must match the most recent unmatched opening. That is last-in, first-out order. A stack keeps exactly that unfinished work.

## 4. The solution and a trace

```python
class Solution:
    def isValid(self, s: str) -> bool:
        """Input contains brackets only; empty input is valid."""
        pairs={')':'(',']':'[','}':'{'}
        stack=[]
        for char in s:
            if char in '([{':
                stack.append(char)
            elif not stack or stack.pop()!=pairs[char]:
                return False
        return not stack

solve=Solution().isValid
assert solve('([]){}')
assert not solve('([)]')
assert not solve(')')
assert solve('')
```

| Character in `([])` | Stack after handling |
|---|---|
| `(` | `['(']` |
| `[` | `['(', '[']` |
| `]` | `['(']` |
| `)` | `[]` |

## 5. Why it works

After each valid prefix, the stack contains exactly its unmatched openings, in order. A closer matching anything below the top would violate nesting. Rejecting a mismatch is therefore necessary; ending with no unmatched openings is sufficient.

## 6. Cost, edge cases, and failure

O(n) time, O(n) worst-case space. Check emptiness before popping. Python's `or` short-circuits, so the pop runs only on a nonempty stack. Equal opening and closing counts alone do not establish correct order.

```python
assert '([)]'.count('(')=='([)]'.count(')')
assert not solve('([)]')  # Deliberate counterexample to counting-only validation.
```

{{DEEP_DIVE}}

#### Check it against the baseline

```python
import random
rng=random.Random(20)
for _ in range(600):
    text=''.join(rng.choices('()[]{}',k=rng.randrange(25)))
    assert solve(text)==baseline(text)
```

#### Related problems

| Problem | What changes | What follows |
|---|---|---|
| [Daily Temperatures](https://leetcode.com/problems/daily-temperatures/) | Resolve waiting days | Stack holds indexes, with an ordering invariant |
| [Valid Parenthesis String](https://leetcode.com/problems/valid-parenthesis-string/) | `*` can mean several things | A single fixed matching stack does not represent all choices |

#### Reconstruct it

State exactly what remains in the stack. Trace a mismatched closer and an opening left over at the end.

{{END_DEEP_DIVE}}
