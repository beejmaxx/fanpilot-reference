#!/usr/bin/env python3
"""Inventory the catalog and published lessons; never infer human review from tests."""
import argparse
import ast
import datetime
import subprocess
import sys
import hashlib
import json
import re
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
arguments = argparse.ArgumentParser()
arguments.add_argument('--verify', action='store_true', help='Run build, Python, lab and browser checks and save source-hash receipts.')
args = arguments.parse_args()
catalog = json.loads((ROOT / 'data/problems.json').read_text())
problems = catalog['problems']
assert len({p['id'] for p in problems}) == len(problems)
assert len({p['slug'] for p in problems}) == len(problems)
# Keep browser/build registration authoritative without executing the builder.
tree = ast.parse((ROOT / 'scripts/build.py').read_text())
routes = next(ast.literal_eval(n.value) for n in tree.body
              if isinstance(n, ast.Assign) and any(isinstance(t, ast.Name) and t.id == 'EXTRA' for t in n.targets))
registered = {key: url for key, url, _, group in routes if group == 'Worked lessons'}
reviews_path = ROOT / 'data/lesson-reviews.json'
reviews = json.loads(reviews_path.read_text()) if reviews_path.exists() else {}
written = {}
for key, url in registered.items():
    path = ROOT / 'content/lessons' / (key + '.md')
    text = path.read_text()
    match = re.search(r'^\*Worked lesson · .* · LC (\d+)\*$', text, re.M)
    assert match, path
    number = int(match[1])
    assert number not in written, f'Duplicate lesson for {number}'
    digest = hashlib.sha256(path.read_bytes()).hexdigest()
    review = reviews.get(str(number), {})
    current_review = review.get('source_sha256') == digest
    written[number] = {
        'lesson_url': url, 'lesson_source': str(path.relative_to(ROOT)),
        'source_sha256': digest,
        'difficulty': re.search(r'\*\*Difficulty: (Easy|Medium|Hard)', text)[1],
        'review_status': review.get('status', 'pending') if current_review else 'pending',
        'verification_status': 'not_recorded',
    }
if args.verify:
    commands = [[sys.executable, 'scripts/build.py'], [sys.executable, 'scripts/check-lessons.py'],
                ['npm', 'test'], ['npm', 'run', 'test:site'], ['npm', 'run', 'test:solutions']]
    for command in commands:
        subprocess.run(command, cwd=ROOT, check=True)
    for entry in written.values():
        assert hashlib.sha256((ROOT / entry['lesson_source']).read_bytes()).hexdigest() == entry['source_sha256'], 'Lesson changed during verification'
    receipt = {'checked_at_utc': datetime.datetime.now(datetime.timezone.utc).isoformat(),
               'commands': [' '.join(command) for command in commands],
               'source_hashes': {str(number): entry['source_sha256'] for number, entry in written.items()}}
    (ROOT / 'data/lesson-verification.json').write_text(json.dumps(receipt, indent=2) + '\n')
receipt_path = ROOT / 'data/lesson-verification.json'
receipt = json.loads(receipt_path.read_text()) if receipt_path.exists() else {}
for number, entry in written.items():
    if receipt.get('source_hashes', {}).get(str(number)) == entry['source_sha256']:
        entry['verification_status'] = 'checks_passed'
        entry['checked_at_utc'] = receipt['checked_at_utc']
assert set(written).issubset({p['id'] for p in problems})
entries = []
for p in problems:
    entry = {'id': p['id'], 'slug': p['slug'], 'title': p['title'], 'category': p['category'],
             'status': 'written' if p['id'] in written else 'not_written'}
    if p['category'] in ('Database', 'JavaScript / TypeScript'):
        entry['language_policy'] = 'sql' if p['category'] == 'Database' else 'javascript_typescript'
    elif p['category'] == 'Pandas':
        entry['language_policy'] = 'python_pandas'
    else:
        entry['language_policy'] = 'python'
    if p['id'] in written:
        entry.update(written[p['id']])
    entries.append(entry)
result = {'catalog_source': 'data/problems.json',
          'catalog_sha256': hashlib.sha256((ROOT/'data/problems.json').read_bytes()).hexdigest(),
          'counts': {'catalog': len(problems), 'written': len(written),
                     'not_written': len(problems)-len(written),
                     'reviewed': sum(e.get('review_status') == 'approved' for e in entries)},
          'categories': dict(Counter(p['category'] for p in problems)), 'problems': entries}
(ROOT/'data/lesson-progress.json').write_text(json.dumps(result, indent=2)+'\n')
print(json.dumps(result['counts']))
