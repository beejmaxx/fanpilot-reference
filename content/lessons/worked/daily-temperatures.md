# Daily Temperatures

*Worked lesson · Monotonic stack · LC 739*

**Difficulty: Medium.** This lesson derives a monotonic stack: instead of every day searching the future, each new day answers the earlier days still waiting. The waiting days turn out to have a shape that makes the answer cheap. Prerequisite: list indexes and stack push and pop. Related chapter: [stacks and monotonic deques](/patterns/stacks-and-monotonic-deques/).

## 1. The problem

Given a list of daily temperatures, return for each day the number of days until the first **strictly warmer** temperature. Use `0` if no warmer day follows. Do not change the input; empty input returns `[]`. This is [Daily Temperatures](https://leetcode.com/problems/daily-temperatures/) (LC 739).

| Temperatures | Result | Why |
|---|---|---|
| `[75, 70, 72, 76]` | `[3, 1, 1, 0]` | The final day resolves all remaining waits |
| `[70, 70, 71]` | `[2, 1, 0]` | The equal temperature does not resolve day 0 |
| `[80, 70, 60]` | `[0, 0, 0]` | No day has a warmer successor |

"Strictly" and "first" both matter. An equal temperature does not count, and a later, even warmer day does not replace the first one.

## 2. A correct baseline

For each day, scan forward until a warmer day appears.

```python
def baseline(temperatures):
    answer = [0] * len(temperatures)
    for day in range(len(temperatures)):
        for later in range(day + 1, len(temperatures)):
            if temperatures[later] > temperatures[day]:
                answer[day] = later - day
                break
    return answer

assert baseline([75, 70, 72, 76]) == [3, 1, 1, 0]
assert baseline([70, 70, 71]) == [2, 1, 0]
assert baseline([80, 70, 60]) == [0, 0, 0]
assert baseline([]) == []
```

On a list that never warms up, no scan ever stops early, so the baseline makes n(n − 1) / 2 comparisons: O(n²) time. With LeetCode's 100,000 days that is about five billion.

**The bottleneck.** The forward scans overlap. Day 0 reads days 1, 2, 3, …; day 1 then rereads days 2, 3, …. A scan learns facts about the future, then throws them away.

## 3. The observation

Turn the search around. Walk forward once, and when a new day arrives, ask which **earlier** days it resolves. A day is resolved by the first strictly warmer day after it; until then it is **pending**.

Which days can be pending at the same moment? Suppose day `a` comes before day `b` and both are pending. If `b` were warmer than `a`, it would already have resolved `a`. So:

> Pending days, from oldest to newest, have temperatures that never increase.

That shape is what makes the question cheap. The coolest pending days are the most recent ones. When today arrives, compare it with the newest pending day:

- If today is warmer, today is that day's answer. Remove it and compare with the next newest.
- If not, stop. Every older pending day is at least as warm as this one, so today resolves none of them.

Adding at one end and removing from the same end is a stack. Store **indexes**, not temperatures, because the answer is a distance.

The property doing the work is that "first warmer day" depends only on order comparisons, and that a day, once resolved, never matters again.

## 4. The solution and a trace

```python
class Solution:
    def dailyTemperatures(self, temperatures: list[int]) -> list[int]:
        """Return waits for strictly warmer days, without modifying input."""
        answer = [0] * len(temperatures)
        pending = []  # Unresolved indexes; temperatures never increase bottom to top.
        for today, temperature in enumerate(temperatures):
            while pending and temperature > temperatures[pending[-1]]:
                earlier = pending.pop()
                answer[earlier] = today - earlier
            pending.append(today)
        return answer

solve = Solution().dailyTemperatures
assert solve([75, 70, 72, 76]) == [3, 1, 1, 0]
assert solve([70, 70, 71]) == [2, 1, 0]
assert solve([80, 70, 60]) == [0, 0, 0]
assert solve([]) == []
assert solve([72, 70, 70, 71, 75, 69]) == [4, 2, 1, 1, 0, 0]
```

Trace `[72, 70, 70, 71, 75, 69]`, which has an equal pair, one day resolving several, and days left over:

| Day / temperature | Resolved | Pending afterwards (indexes) |
|---|---|---|
| `0 / 72` | None | `[0]` |
| `1 / 70` | None: 70 is not warmer than 72 | `[0, 1]` |
| `2 / 70` | None: equal is not warmer | `[0, 1, 2]` |
| `3 / 71` | Day 2 waits 1, day 1 waits 2; stop at 72 | `[0, 3]` |
| `4 / 75` | Day 3 waits 1, day 0 waits 4 | `[4]` |
| `5 / 69` | None | `[4, 5]` |

Days 4 and 5 are still pending at the end. No warmer day came, so their answers stay `0`.

## 5. Why it works

**Invariant.** Before day `t` is processed, `pending` holds, in increasing index order, exactly the days before `t` that have no strictly warmer day before `t`; their temperatures never increase from bottom to top. It holds initially (empty), and the argument below shows each step keeps it.

**Each answer is correct.** When day `t` pops day `d`, today is warmer than `d`. And `d` was still pending, so by the invariant no day between `d` and `t` was warmer. Day `t` is therefore the first warmer day, and `answer[d] = t − d` is right.

**No day is resolved too late.** The loop stops at the first pending day that today is not warmer than. Every day below it is at least as warm (the invariant's ordering), so today is not warmer than any of them either. Every day today should resolve has been popped. Pushing today then keeps the order, because the new top below it is at least as warm as today.

**Leftovers are correct.** A day still pending after the last day has no warmer day after it, so its `0` is the right answer.

## 6. Cost, edge cases, and failure

**Complexity.** The `while` loop looks nested, but count across the whole run. Each index is pushed once and popped at most once, and each day makes one failed comparison at most. That is O(n) total time. Extra space is O(n): a list that never warms up leaves every day pending.

**Edge cases.** Empty input gives `[]`. All equal temperatures give all zeros, since equal is not warmer. A steadily warming list gives all ones except the last day, and the stack never holds more than one index.

**Where it fails.** The comparisons are the whole proof. With `>=`, an equal day "resolves" an earlier one:

```python
class ResolveOnEqual:  # deliberately wrong: treats an equal day as warmer
    def dailyTemperatures(self, temperatures):
        answer, pending = [0] * len(temperatures), []
        for today, temperature in enumerate(temperatures):
            while pending and temperature >= temperatures[pending[-1]]:
                earlier = pending.pop()
                answer[earlier] = today - earlier
            pending.append(today)
        return answer

assert ResolveOnEqual().dailyTemperatures([70, 70, 71]) == [1, 1, 0]  # wrong: day 0 waits 2
assert solve([70, 70, 71]) == [2, 1, 0]
```

Replacing `while` with `if` fails differently: day 3 in the trace would resolve day 2 but leave day 1 waiting. And the stack alone cannot handle days that **expire**, such as "the warmest of the last k days". That needs removal from the old end too, which is [sliding window maximum](/worked/sliding-window-maximum/).

{{DEEP_DIVE}}

#### Check it against the baseline

```python
import random

rng = random.Random(739)
for _ in range(2000):
    temperatures = [rng.randint(30, 36) for _ in range(rng.randint(0, 12))]
    assert solve(temperatures) == baseline(temperatures), temperatures
```

The narrow range forces many equal temperatures, which is where `>` versus `>=` matters.

#### Related problems

| Problem | What changes | What follows |
|---|---|---|
| [Next Greater Element II](https://leetcode.com/problems/next-greater-element-ii/) (LC 503) | The list is circular, and the answer is the value, not the distance. | Scan the list twice, pushing indexes only on the first pass. |
| [Online Stock Span](https://leetcode.com/problems/online-stock-span/) (LC 901) | Look backward: how many consecutive previous days were at most today's price. | The same stack, popping days that are at most today's price and adding up their spans. |
| [Largest Rectangle in Histogram](https://leetcode.com/problems/largest-rectangle-in-histogram/) (LC 84) | Each bar needs its nearest shorter bar on both sides. | When a bar is popped, the bar below it and the bar popping it are its two boundaries. |
| [Sliding Window Maximum](https://leetcode.com/problems/sliding-window-maximum/) (LC 239) | Candidates also expire after k positions. | The deceptive pair. Same domination idea, but removal at both ends needs a deque. See [the lesson](/worked/sliding-window-maximum/). |

#### Reconstruct it

From a blank page: write the baseline, then explain why two pending days can never be in increasing order. Use that to justify stopping at the first pending day that is not cooler, and say what `>` versus `>=` decides.

{{END_DEEP_DIVE}}
