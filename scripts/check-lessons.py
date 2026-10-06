#!/usr/bin/env python3
"""Run the Python examples printed in lessons. SPDX-License-Identifier: MIT

Each lesson's ```python blocks run in order as one isolated program, so later
blocks can use functions defined earlier. Blocks carry their own assertions.
"""
import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
total = 0
for lesson in sorted((ROOT / 'content' / 'lessons').rglob('*.md')):
    blocks = re.findall(r'^```python\n(.*?)^```$', lesson.read_text(), re.S | re.M)
    if not blocks:
        continue
    program = '\n\n'.join(blocks)
    result = subprocess.run([sys.executable, '-I', '-c', program], capture_output=True, text=True)
    name = lesson.relative_to(ROOT)
    if result.returncode:
        sys.exit(f'{name} failed:\n{result.stderr}')
    total += len(blocks)
    print(f'{name}: {len(blocks)} blocks passed')
print(f'Checked {total} Python blocks.')

# Exercise the exact displayed solutions against independent small references.
import random
rng = random.Random(20261006)
for slug, method in [('two-sum', 'twoSum'), ('daily-temperatures', 'dailyTemperatures'),
                     ('sliding-window-maximum', 'maxSlidingWindow')]:
    text = (ROOT / 'content' / 'lessons' / 'worked' / (slug + '.md')).read_text()
    namespace = {}
    exec('\n\n'.join(re.findall(r'^```python\n(.*?)^```$', text, re.S | re.M)), namespace)
    solve = getattr(namespace['Solution'](), method)
    baseline = namespace['baseline']
    for _ in range(1000):
        nums = [rng.randint(-5, 5) for _ in range(rng.randint(1, 15))]
        before = nums.copy()
        if slug == 'two-sum':
            target = rng.randint(-10, 10)
            actual, expected = solve(nums, target), baseline(nums, target)
            assert bool(actual) == bool(expected)
            if actual:
                i, j = actual
                assert 0 <= i < j < len(nums) and nums[i] + nums[j] == target
        elif slug == 'daily-temperatures':
            assert solve(nums) == baseline(nums)
        else:
            k = rng.randint(1, len(nums))
            assert solve(nums, k) == baseline(nums, k)
        assert nums == before
    print(f'{slug}: 1,000 seeded reference comparisons passed')
