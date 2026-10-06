#!/usr/bin/env python3
"""Build the practice workspace: one JSON file per worked lesson, plus an index.

Everything comes from the lesson Markdown, which follows docs/lesson-template.md:
the problem, the walkthrough (steps 2-6), the collapsed extras, the solution code,
and its assertions, which become the workspace's test cases. SPDX-License-Identifier: MIT
"""
import ast
import html
import json
import re
import shutil
import sys
from pathlib import Path
from markdown_it import MarkdownIt
from pygments import highlight
from pygments.lexers import PythonLexer
from pygments.formatters import HtmlFormatter

ROOT = Path(__file__).resolve().parents[1]
PYODIDE_FILES = ['pyodide.mjs', 'pyodide.asm.mjs', 'pyodide.asm.wasm', 'python_stdlib.zip', 'pyodide-lock.json']
COMPARE_OPS = {ast.Eq: '==', ast.NotEq: '!=', ast.Is: 'is', ast.IsNot: 'is not', ast.In: 'in',
               ast.NotIn: 'not in', ast.Lt: '<', ast.LtE: '<=', ast.Gt: '>', ast.GtE: '>='}
parser = MarkdownIt('commonmark', {'html': False}).enable('table')


def render(markdown):
    """Markdown to HTML, with build-time Python highlighting and scrollable tables, as on lesson pages."""
    out = parser.render(markdown)
    out = re.sub(r'<pre><code class="language-python">(.*?)</code></pre>',
                 lambda m: '<pre><code class="language-python">' + highlight(
                     html.unescape(m[1]), PythonLexer(), HtmlFormatter(nowrap=True)) + '</code></pre>', out, flags=re.S)
    return re.sub(r'<table>(.*?)</table>', r'<div class="table-scroll"><table>\1</table></div>', out, flags=re.S)


def sections(text):
    """Split at second-level headings: {'The problem': body, ...} plus the intro under ''."""
    parts = re.split(r'^## ((?:\d+\. )?)(.+)$', text, flags=re.M)
    found = {'': parts[0]}
    for number, title, body in zip(parts[1::3], parts[2::3], parts[3::3]):
        found[title.strip()] = body
        NUMBERS[title.strip()] = number
    return found


NUMBERS = {}  # Heading title -> its step number, such as '2. ', for display.


def blocks(markdown):
    return re.findall(r'^```python\n(.*?)^```$', markdown, re.S | re.M)


def contains_assert(node):
    return any(isinstance(n, ast.Assert) for n in ast.walk(node))


def segment(source, node):
    return ast.get_source_segment(source, node)


def starter_for(source, node):
    """Keep signatures and docstrings, replace each body with `pass`."""
    lines = source.splitlines()

    def stub(function):
        first = min([function.lineno] + [d.lineno for d in function.decorator_list])
        body = function.body
        keep_until = body[0].end_lineno if (isinstance(body[0], ast.Expr) and isinstance(body[0].value, ast.Constant)
                                            and isinstance(body[0].value.value, str)) else body[0].lineno - 1
        return lines[first - 1:keep_until] + [' ' * body[0].col_offset + 'pass']

    if isinstance(node, ast.FunctionDef):
        return stub(node)
    out = lines[node.lineno - 1:node.body[0].lineno - 1]
    for item in node.body:
        if isinstance(item, ast.FunctionDef):
            out += stub(item) + ['']
    return out[:-1] if out and out[-1] == '' else out


def practice_entry(key, url, text):
    slug = key.split('/')[-1]
    title = re.search(r'^# (.+)$', text, re.M)[1]
    meta = re.search(r'^\*Worked lesson · (.+) · LC (\d+)\*$', text, re.M)
    difficulty = re.search(r'\*\*(?:Difficulty: )?(Easy|Medium|Hard)', text)[1]
    main_text, _, rest = text.partition('{{DEEP_DIVE}}')
    further = rest.partition('{{END_DEEP_DIVE}}')[0]
    parts = sections(main_text)
    solution_title = next(t for t in parts if t.startswith('The solution'))
    titles = list(parts)

    # Problem statement and two progressive hints: the bottleneck, then the observation.
    problem = re.sub(r'^\*\*(Easy|Medium|Hard)\.\*\*\s*', '', parts['The problem'].strip())
    hints = []
    baseline = next((parts[t] for t in titles if t.startswith('A correct baseline')), '')
    bottleneck = next((p for p in re.split(r'\n\s*\n', baseline) if 'ottleneck' in p and not p.startswith('```')), None)
    if bottleneck:
        hints.append(render(re.sub(r'^.*?\*\*(?:The )?[Bb]ottleneck[.:]?\*\*:?\s*', '', bottleneck.strip(), flags=re.S)))
    observation = next((parts[t] for t in titles if t.startswith('The observation')), '')
    first = next((p for p in re.split(r'\n\s*\n', observation.strip()) if p and not p.startswith(('```', '|', '>'))), None)
    if first:
        hints.append(render(first))

    # Walkthrough: the intro, then every numbered step after the problem.
    walkthrough = re.sub(r'^# .+\n+\*Worked lesson.*\*\n', '', parts[''])
    for t in titles[2:]:
        walkthrough += f'\n## {NUMBERS.get(t, "")}{t}\n{parts[t]}'

    # Code: everything before the solution block is the lesson's prelude (helpers such as build()).
    before = [b for t in titles[1:titles.index(solution_title)] for b in blocks(parts[t])]
    solution = blocks(parts[solution_title])[0]
    tree = ast.parse(solution)
    main = next((n for n in tree.body if isinstance(n, ast.ClassDef) and n.name == 'Solution'), None)
    called = {n.id for s in tree.body if not isinstance(s, (ast.FunctionDef, ast.ClassDef)) for n in ast.walk(s) if isinstance(n, ast.Name)}
    mains = [main] if main else [n for n in tree.body if isinstance(n, ast.FunctionDef) and n.name in called]
    if not mains:
        mains = [n for n in tree.body if isinstance(n, ast.FunctionDef)][-1:]
    main_names = [n.name for n in mains]
    prelude, setup, tests, starter, shown = list(before), [], [], [], []
    for node in tree.body:
        source = segment(solution, node)
        if node in mains:
            starter += starter_for(solution, node) + ['']
            shown.append(source)
        elif isinstance(node, (ast.Import, ast.ImportFrom)):
            prelude.append(source); starter += [source, '']; shown.append(source)
        elif isinstance(node, (ast.FunctionDef, ast.ClassDef)):
            prelude.append(source); shown.append(source)
            starter += ['# Provided for you:'] + ['# ' + l if l else '#' for l in source.splitlines()] + ['']
        elif not contains_assert(node):
            setup.append(source)
        elif isinstance(node, ast.Assert) and isinstance(node.test, ast.Compare) and len(node.test.ops) == 1:
            test = node.test
            tests.append({'kind': 'compare', 'call': segment(solution, test.left), 'op': COMPARE_OPS[type(test.ops[0])],
                          'expected': segment(solution, test.comparators[0]), 'source': source})
        elif isinstance(node, ast.Assert) and not isinstance(node.test, (ast.BoolOp, ast.Compare)):
            negated = isinstance(node.test, ast.UnaryOp) and isinstance(node.test.op, ast.Not)
            tests.append({'kind': 'compare', 'call': segment(solution, node.test.operand if negated else node.test),
                          'op': 'falsy' if negated else 'truthy', 'expected': 'False' if negated else 'True', 'source': source})
        else:
            tests.append({'kind': 'block', 'source': source})
    starter_code = re.sub(r'\n{3,}', '\n\n', '\n'.join(starter)).strip() + '\n'
    shown_code = '\n\n'.join(shown) + '\n'

    # Submit: the collapsed random comparison against the baseline, after any helpers defined between.
    after = [b for t in titles[titles.index(solution_title) + 1:] for b in blocks(parts[t])]
    helpers = []
    for b in after:
        for node in ast.parse(b).body:
            if isinstance(node, (ast.FunctionDef, ast.ClassDef, ast.Import, ast.ImportFrom)) and getattr(node, 'name', None) not in main_names:
                helpers.append(segment(b, node))
    check = re.search(r'^#### Check it against the baseline\n(.*?)(?=^#### |\Z)', further, re.S | re.M)
    submit = '\n\n'.join(helpers + blocks(check[1])) if check else ''

    return {
        'slug': slug, 'title': title, 'number': int(meta[2]), 'pattern': meta[1], 'difficulty': difficulty,
        'leetcode': re.search(r'\]\((https://leetcode\.com/problems/[^)]+)\)', text)[1], 'lesson': url,
        'problem': render(problem), 'hints': hints, 'walkthrough': render(walkthrough), 'further': render(further),
        'starter': starter_code, 'solution': shown_code,
        'solutionHtml': highlight(shown_code, PythonLexer(), HtmlFormatter(nowrap=True)),
        'prelude': '\n\n'.join(prelude), 'main': main_names, 'setup': '\n'.join(setup), 'tests': tests, 'submit': submit,
    }


def build_practice(root, destination, routes):
    out = destination / 'practice'
    (out / 'data').mkdir(parents=True, exist_ok=True)
    index = []
    for key, url, label, group in routes:
        if group != 'Worked lessons':
            continue
        entry = practice_entry(key, url, (root / 'content' / 'lessons' / (key + '.md')).read_text())
        (out / 'data' / f'{entry["slug"]}.json').write_text(json.dumps(entry, ensure_ascii=False))
        index.append({k: entry[k] for k in ('slug', 'title', 'number', 'pattern', 'difficulty')} | {'tests': len(entry['tests'])})
    (out / 'index.json').write_text(json.dumps(index, ensure_ascii=False))
    (out / 'index.html').write_text((root / 'src' / 'practice.html').read_text())
    # Python runs in the browser through Pyodide, served from this site (the CSP allows only 'self').
    source = root / 'node_modules' / 'pyodide'
    if source.exists():
        (destination / 'pyodide').mkdir(exist_ok=True)
        for name in PYODIDE_FILES:
            target = destination / 'pyodide' / name
            if not target.exists() or target.stat().st_size != (source / name).stat().st_size:
                shutil.copyfile(source / name, target)
    else:
        print('practice: node_modules/pyodide is missing; run npm install to enable Run and Submit', file=sys.stderr)
    return len(index)


if __name__ == '__main__':
    sys.path.insert(0, str(Path(__file__).parent))
    from build import EXTRA
    count = build_practice(ROOT, ROOT / 'dist', EXTRA)
    print(f'Built the practice workspace for {count} lessons')
