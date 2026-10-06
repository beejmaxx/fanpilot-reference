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
