#!/usr/bin/env python3
"""Check the actual manuscript examples. SPDX-License-Identifier: MIT"""
import re
import subprocess
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
source = (ROOT / 'content' / 'patterns.md').read_text()
headings = [int(x) for x in re.findall(r'^## (\d+) ', source, re.M)]
assert headings == list(range(1, len(headings) + 1)), headings
used = set(re.findall(r'\[(p\d+|S\d+)\]', source))
defined = set(re.findall(r'^\[(p\d+|S\d+)\]:', source, re.M))
assert used <= defined, f'Missing reference definitions: {used - defined}'
assert '<!-- PROBLEM_INDEX -->' not in source, 'Index is unfinished'
assert not re.search(r'chatgpt-content-reference|turn\d+(?:search|view)|TODO|TBD', source)
snippets = re.findall(r'```rust\n(.*?)\n```', source, re.S)
assert len(snippets) == 8, f'Expected 8 examples, found {len(snippets)}'
with tempfile.TemporaryDirectory(prefix='leetcode-bible-') as folder:
    folder = Path(folder)
    test_source = folder / 'examples.rs'
    test_source.write_text('\n\n'.join(snippets) + '\n' +
                           (ROOT / 'tests' / 'pattern_examples.rs').read_text())
    executable = folder / 'examples'
    subprocess.run(['rustc', '--edition=2021', '--test', '-O',
                    '-C', 'overflow-checks=yes', str(test_source),
                    '-o', str(executable)], check=True)
    subprocess.run([str(executable)], check=True)
print(f'Checked {len(headings)} chapters, {len(used)} references, '
      f'and {len(snippets)} Rust examples.')
