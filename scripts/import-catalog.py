#!/usr/bin/env python3
"""Snapshot problem metadata from the separate solution corpus. SPDX-License-Identifier: MIT

Copies only facts needed by the problem library: number, title, slug, category,
and public topic tags. Solution code, problem statements, and company lists are
deliberately not imported. Run manually when the corpus catalog changes:

    python3 scripts/import-catalog.py /path/to/all_leetcode
"""
import argparse
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
parser.add_argument('corpus', type=Path)
args = parser.parse_args()
coverage = json.loads((args.corpus / 'catalog' / 'doocs-coverage.json').read_text())
problems = []
for item in sorted(coverage['problems'], key=lambda p: p['id']):
    slug = item['url'].rstrip('/').rsplit('/', 1)[-1]
    assert item['url'] == f'https://leetcode.com/problems/{slug}/', item['url']
    problems.append({'id': item['id'], 'title': item['title'], 'slug': slug,
                     'category': item['category'], 'tags': item['tags']})
assert len({p['id'] for p in problems}) == len(problems)
output = {'source': {'repository': coverage['repository'], 'commit': coverage['commit'],
                     'checked_at': coverage['checked_at']},
          'problems': problems}
destination = ROOT / 'data' / 'problems.json'
destination.parent.mkdir(exist_ok=True)
destination.write_text(json.dumps(output, ensure_ascii=False, separators=(',', ':')) + '\n')
print(f'Wrote {len(problems)} problems to {destination.relative_to(ROOT)}')
