"""Build a compact browser from the same Python blocks the lessons test."""
import ast
import html
import re
from markdown_it import MarkdownIt
from pygments import highlight
from pygments.lexers import PythonLexer
from pygments.formatters import HtmlFormatter


def solution_code(text):
    """The tested solution, without the example invocations below the definitions."""
    block = re.search(r'^## (?:\d+\. )?The solution and a trace\n.*?^```python\n(.*?)^```', text, re.S | re.M)[1]
    lines = block.splitlines()
    return '\n\n'.join('\n'.join(lines[n.lineno-1:n.end_lineno]) for n in ast.parse(block).body
                       if isinstance(n, (ast.FunctionDef, ast.ClassDef, ast.Import, ast.ImportFrom))) + '\n'


def build_browser(root, destination, routes):
    parser = MarkdownIt('commonmark', {'html': False}).enable('table')
    tabs, panels = [], []
    lessons = [(key, url) for key, url, label, group in routes if group == 'Worked lessons']
    for position, (key, url) in enumerate(lessons, 1):
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
        tabs.append(f'<a class="sb-tab" href="#{slug}" data-slug="{slug}"><span class="sb-num">{position}</span>'
                    f'<span class="sb-tab-title">{title}</span><span class="sb-dot sb-{difficulty.lower()}" title="{difficulty}"></span></a>')
        panels.append(
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
    template = (root / 'src' / 'solution-browser.html').read_text()
    page = template.replace('{{TABS}}', ''.join(tabs)).replace('{{PANELS}}', ''.join(panels)).replace('{{COUNT}}', str(len(lessons)))
    output = destination / 'solutions' / 'index.html'
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(page)
    for name in ['solution-browser.js', 'solution-browser.css']:
        (destination/name).write_text((root/'src'/name).read_text())
