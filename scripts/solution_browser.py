"""Build a compact browser from the same Python blocks the lessons test."""
import ast
import html
import hashlib
import json
import re
from markdown_it import MarkdownIt
from pygments import highlight
from pygments.lexers import PythonLexer
from pygments.formatters import HtmlFormatter


def json_asset(destination, name, value):
    """Content-addressed static data, so a rebuilt page cannot reuse stale data."""
    data = json.dumps(value, ensure_ascii=False, separators=(',', ':'))
    filename = f'{name}.{hashlib.sha256(data.encode()).hexdigest()[:12]}.json'
    output = destination / filename
    output.parent.mkdir(parents=True, exist_ok=True)
    if not output.exists():
        output.write_text(data)
    # Keep the current and previous version; repeated local builds must not
    # accumulate thousands of obsolete indexes or solution payloads.
    previous = sorted((p for p in output.parent.glob(f'{output.stem.rsplit(".", 1)[0]}.*.json')
                       if p != output), key=lambda p: p.stat().st_mtime_ns, reverse=True)
    for stale in previous[1:]:
        stale.unlink()
    return '/' + filename


def solution_code(text):
    """The tested solution, without the example invocations below the definitions."""
    block = re.search(r'^## (?:\d+\. )?The solution and a trace\n.*?^```python\n(.*?)^```', text, re.S | re.M)[1]
    lines = block.splitlines()
    return '\n\n'.join('\n'.join(lines[n.lineno-1:n.end_lineno]) for n in ast.parse(block).body
                       if isinstance(n, (ast.FunctionDef, ast.ClassDef, ast.Import, ast.ImportFrom))) + '\n'


def build_browser(root, destination, routes):
    parser = MarkdownIt('commonmark', {'html': False}).enable('table')
    index = []
    lessons = [(key, url) for key, url, label, group in routes if group == 'Worked lessons']
    for key, url in lessons:
        text = (root / 'content' / 'lessons' / (key + '.md')).read_text()
        slug = key.split('/')[-1]
        title = html.escape(re.search(r'^# (.+)$', text, re.M)[1])
        difficulty = re.search(r'\*\*(?:Difficulty: )?(Easy|Medium|Hard)', text)[1]
        meta = re.search(r'^\*Worked lesson · (.+) · LC (\d+)\*$', text, re.M)
        pattern, number = html.escape(meta[1]), meta[2]
        leetcode = re.search(r'\]\((https://leetcode\.com/problems/[^)]+)\)', text)[1]
        problem = re.search(r'^## (?:\d+\. )?The problem\s+(.*?)(?=\n## )', text, re.S | re.M)[1]
        # Difficulty and the LeetCode link appear in the panel header instead.
        problem = re.sub(r'^\*\*(Easy|Medium|Hard)\.\*\*\s*', '', problem)
        problem = re.sub(r'\s*(See )?\[LeetCode \d+\]\([^)]*\)\.(?=\s|$)', '', problem)
        problem = re.sub(r'\s*This is \[[^]]+\]\([^)]*\) \(LC \d+\)\.', '', problem)
        code = solution_code(text)
        lines = code.count('\n')
        panel = (
            f'<section class="sb-panel" id="{slug}" aria-label="{title}" data-title="{title}">'
            f'<div class="sb-problem"><p class="sb-meta"><span class="sb-badge sb-{difficulty.lower()}">{difficulty}</span>'
            f'<span>{pattern}</span><a href="{leetcode}" rel="noopener">LeetCode {number} ↗</a></p>'
            f'<h1>{title}</h1><div class="sb-statement">{parser.render(problem)}</div>'
            f'<a class="sb-lesson" href="{url}">Read the full explanation →</a></div>'
            f'<div class="sb-editor"><div class="sb-editor-bar"><span class="sb-file">{slug.replace("-", "_")}.py</span>'
            f'<span class="sb-tools"><button type="button" data-size="-1" aria-label="Smaller text">A−</button>'
            f'<button type="button" data-size="1" aria-label="Larger text">A+</button>'
            f'<button type="button" class="sb-copy">Copy</button></span></div>'
            f'<div class="sb-code" tabindex="0" aria-label="Python solution"><pre class="sb-gutter" aria-hidden="true">'
            + '\n'.join(str(n) for n in range(1, lines + 1)) +
            f'</pre><pre class="sb-source"><code class="language-python">{highlight(code, PythonLexer(), HtmlFormatter(nowrap=True))}</code></pre></div></div>'
            '</section>')
        data_url = json_asset(destination, f'solutions/data/{slug}', {'html': panel})
        index.append({'slug': slug, 'title': html.unescape(title), 'difficulty': difficulty,
                      'url': data_url, 'lesson_url': url})
    index_url = json_asset(destination, 'solutions/solution-index', index)
    template = (root / 'src' / 'solution-browser.html').read_text()
    page = template.replace('{{INDEX_URL}}', index_url)
    output = destination / 'solutions' / 'index.html'
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(page)
    for name in ['solution-browser.js', 'solution-browser.css']:
        (destination/name).write_text((root/'src'/name).read_text())
