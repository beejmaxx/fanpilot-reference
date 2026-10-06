# Follow one problem all the way down.

A pattern chapter names an idea and its boundaries. A worked lesson takes one problem and shows where that idea comes from: what the obvious solution does, why it is slow, which fact about the input permits something better, and how to prove the result correct. Every lesson ends by changing one constraint and asking whether the argument survives.

## The seven steps

Each lesson follows the same order, so you can compare techniques side by side:

1. **The problem**, with concrete examples and their explanations.
2. **A correct baseline** and the work that makes it expensive.
3. **The observation** that removes that work, and the input property it depends on.
4. **The solution** in readable Python, with a step-by-step trace.
5. **Why it works:** the invariant or exchange argument, stated so you could check it.
6. **Cost, edge cases, and failure:** complexity, inputs that need care, and a counterexample where the technique breaks.
7. **Related problems** that change one meaningful constraint, including deceptive pairs that look alike but need different methods.

## The lessons

{{WORKED_LINKS}}

The first two lessons are a deliberate pair. Both ask about contiguous subarrays and target sums. One allows a sliding window because every value is positive; the other allows negative values, which breaks the window's argument and calls for prefix sums with a hash map. Read them in order.

## How to study a lesson

Read the problem and examples, then stop. Write the baseline yourself and name its bottleneck before reading step 2. After step 3, try to finish the solution independently. Return later and reconstruct the invariant from a blank page; recognizing an explanation is weaker evidence than producing one.

Each code block is plain Python 3 with no dependencies. The site's checks run every block, including assertions that compare the fast solution with the baseline on random inputs. Passing checks show the code agrees with its reference on those inputs; they do not replace the proof.

This section is new. It contains two lessons, written as the template for future ones. The [pattern chapters](/patterns/) cover far more techniques in condensed form.
