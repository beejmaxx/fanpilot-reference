#!/usr/bin/env python3
"""Build Fanpilot's static reference from Markdown. SPDX-License-Identifier: MIT"""
from __future__ import annotations
import argparse
import html
import json
from pathlib import Path
import re
import shutil
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from threading import Thread
import time
from markdown_it import MarkdownIt
from pygments import highlight
from pygments.lexers import PythonLexer
from pygments.formatters import HtmlFormatter
from solution_browser import build_browser, json_asset

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'src'
CONTENT = ROOT / 'content'
GROUPS = [(1, 'Getting oriented'), (5, 'Core patterns'), (13, 'Trees and graphs'),
          (18, 'State and structure'), (25, 'Practice and reference')]
# Lesson routes: (source key under content/lessons/, URL, navigation label, group).
# 'hub' pages form the Explore list; other groups get their own navigation list.
EXTRA = [('index', '/', 'Start here', 'hub'), ('patterns', '/patterns/', 'LeetCode patterns', 'hub'),
         ('worked', '/worked/', 'Worked lessons', 'hub'),
         ('data-structures', '/data-structures/', 'Data structures', 'hub'),
         ('algorithms', '/algorithms/', 'Algorithms', 'hub'),
         ('system-design', '/system-design/', 'System design', 'hub'),
         ('problems', '/problems/', 'Problem library', 'hub'),
         ('worked/two-sum', '/worked/two-sum/', 'Two Sum · Easy', 'Worked lessons'),
         ('worked/group-anagrams', '/worked/group-anagrams/', 'Group Anagrams · Medium', 'Worked lessons'),
         ('worked/two-sum-ii', '/worked/two-sum-ii/', 'Two Sum II · Medium', 'Worked lessons'),
         ('worked/search-insert-position', '/worked/search-insert-position/', 'Search Insert Position · Easy', 'Worked lessons'),
         ('worked/shortest-subarray-reaching-a-sum', '/worked/shortest-subarray-reaching-a-sum/',
          'Shortest subarray reaching a sum', 'Worked lessons'),
         ('worked/subarrays-summing-to-k', '/worked/subarrays-summing-to-k/',
          'Subarrays summing to k', 'Worked lessons'),
         ('worked/daily-temperatures', '/worked/daily-temperatures/', 'Daily Temperatures · Medium', 'Worked lessons'),
         ('worked/sliding-window-maximum', '/worked/sliding-window-maximum/', 'Sliding Window Maximum · Hard', 'Worked lessons'),
         ('worked/koko-eating-bananas', '/worked/koko-eating-bananas/', 'Koko Eating Bananas · Medium', 'Worked lessons'),
         ('worked/valid-parentheses', '/worked/valid-parentheses/', 'Valid Parentheses · Easy', 'Worked lessons'),
         ('worked/kth-largest-element', '/worked/kth-largest-element/', 'Kth Largest Element · Medium', 'Worked lessons'),
         ('worked/merge-k-sorted-lists', '/worked/merge-k-sorted-lists/', 'Merge k Sorted Lists · Hard', 'Worked lessons'),
         ('worked/valid-anagram', '/worked/valid-anagram/', 'Valid Anagram · Easy', 'Worked lessons'),
         ('worked/longest-substring-without-repeating-characters', '/worked/longest-substring-without-repeating-characters/', 'Longest Substring Without Repeating Characters · Medium', 'Worked lessons'),
         ('worked/move-zeroes', '/worked/move-zeroes/', 'Move Zeroes · Easy', 'Worked lessons'),
         ('worked/maximum-subarray', '/worked/maximum-subarray/', 'Maximum Subarray · Medium', 'Worked lessons'),
         ('worked/merge-intervals', '/worked/merge-intervals/', 'Merge Intervals · Medium', 'Worked lessons'),
         ('worked/reverse-linked-list', '/worked/reverse-linked-list/', 'Reverse Linked List · Easy', 'Worked lessons'),
         ('worked/maximum-depth-of-binary-tree', '/worked/maximum-depth-of-binary-tree/', 'Maximum Depth of Binary Tree · Easy', 'Worked lessons'),
         ('worked/number-of-islands', '/worked/number-of-islands/', 'Number of Islands · Medium', 'Worked lessons'),
         ('worked/house-robber', '/worked/house-robber/', 'House Robber · Medium', 'Worked lessons'),
         ('worked/trapping-rain-water', '/worked/trapping-rain-water/', 'Trapping Rain Water · Hard', 'Worked lessons'),
         ('worked/linked-list-cycle', '/worked/linked-list-cycle/', 'Linked List Cycle · Easy', 'Worked lessons'),
         ('worked/balanced-binary-tree', '/worked/balanced-binary-tree/', 'Balanced Binary Tree · Easy', 'Worked lessons'),
         ('worked/diameter-of-binary-tree', '/worked/diameter-of-binary-tree/', 'Diameter of Binary Tree · Easy', 'Worked lessons'),
         ('worked/validate-binary-search-tree', '/worked/validate-binary-search-tree/', 'Validate Binary Search Tree · Medium', 'Worked lessons'),
         ('lru-cache', '/system-design/lru-cache/', 'LRU cache', 'System design'),
         ('file-system', '/system-design/file-system/', 'File system', 'System design'),
         ('research', '/research/', 'Research & sources', 'The reference'),
         ('about', '/about/', 'About the guide', 'The reference')]
HUB_DESCRIPTIONS = {'patterns': 'Derive an approach. Prove it. Transfer it.',
                    'worked': 'Follow one problem from baseline to proof, in Python.',
                    'data-structures': 'Choose the representation your operations need.',
                    'algorithms': 'Turn a correct baseline into a better one.',
                    'system-design': 'Build from requirements, invariants, and tradeoffs.',
                    'problems': 'Browse every numbered problem by topic and guide coverage.'}


def slug(text):
    return re.sub(r'[^a-z0-9]+', '-', text.lower()).strip('-')


def problem_library(chapters, worked):
    """Compact problem metadata plus links to every page that teaches a problem."""
    catalog = json.loads((ROOT/'data'/'problems.json').read_text())
    guides = {}
    for page in chapters:
        if page['number'] in (30, 32):continue  # Directory and index pages, not lessons.
        for number in dict.fromkeys(re.findall(r'\[p(\d+)\]', page['body'])):
            guides.setdefault(int(number), []).append([page['url'], f'Ch. {page["number"]:02}'])
    for page in worked:
        # A lesson's subtitle names the problem it solves in full: *Worked lesson · ... · LC 209*
        number = re.search(r'^\*Worked lesson · .* · LC (\d+)\*$', page['markdown'], re.M)
        assert number, page['url']
        guides.setdefault(int(number[1]), []).append([page['url'], 'Worked lesson'])
    tags = sorted({t for p in catalog['problems'] for t in p['tags']})
    index = {t: i for i, t in enumerate(tags)}
    categories = sorted({p['category'] for p in catalog['problems']})
    rows = [[p['id'], p['title'], p['slug'], categories.index(p['category']), [index[t] for t in p['tags']],
             guides.get(p['id'], [])] for p in catalog['problems']]
    data = json.dumps({'source': catalog['source'], 'tags': tags, 'categories': categories, 'rows': rows},
                      ensure_ascii=False, separators=(',', ':'))
    counts = {t: sum(1 for p in catalog['problems'] if t in p['tags']) for t in tags}
    options = ''.join(f'<option value="{index[t]}">{html.escape(t)} ({counts[t]})</option>'
                      for t in sorted(tags, key=lambda t: (-counts[t], t)))
    category_options = ''.join(f'<option value="{i}">{html.escape(c)}</option>' for i, c in enumerate(categories))
    taught = sum(1 for p in catalog['problems'] if p['id'] in guides)
    markup = (f'<div class="problem-library" id="problem-library" data-total="{len(rows)}">'
              '<form class="problem-filters" id="problem-filters" role="search">'
              '<label>Search<input id="problem-query" type="search" placeholder="Number or title words" autocomplete="off"></label>'
              f'<label>Topic<select id="problem-tag"><option value="">All topics</option>{options}</select></label>'
              f'<label>Category<select id="problem-category"><option value="">All categories</option>{category_options}</select></label>'
              '<label class="problem-check"><input id="problem-taught" type="checkbox"> Only problems discussed in this guide</label>'
              '</form><p class="problem-status" id="problem-status" role="status" aria-live="polite"></p>'
              '<div class="table-scroll" tabindex="0" role="region" aria-label="Problem list"><table class="problem-table">'
              '<thead><tr><th scope="col">#</th><th scope="col">Problem</th><th scope="col">Topics</th><th scope="col">In this guide</th></tr></thead>'
              '<tbody id="problem-rows"></tbody></table></div>'
              '<button type="button" id="problem-more" hidden>Show more</button>'
              f'<noscript><p class="notice">The filterable list of {len(rows):,} problems requires JavaScript. '
              'Without it, use the <a href="/patterns/selected-problem-index/">selected problem index</a>.</p></noscript></div>')
    return {'data': data, 'html': markup, 'total': len(rows), 'taught': taught}


def build(destination):
    parser = MarkdownIt('commonmark', {'html': False}).enable('table')
    manuscript = (CONTENT / 'patterns.md').read_text()
    definitions = '\n'.join(re.findall(r'^\[(?:p\d+|S\d+)\]:.*$', manuscript, re.M))
    headings = list(re.finditer(r'^## (\d+) (.+)$', manuscript, re.M))
    assert [int(h[1]) for h in headings] == list(range(1, len(headings)+1))
    pages = []
    for index, match in enumerate(headings):
        number = int(match[1]); title = match[2]
        body = manuscript[match.end():headings[index+1].start() if index+1<len(headings) else None]
        group = next(name for start,name in reversed(GROUPS) if number>=start)
        pages.append({'id': f'chapter-{number}', 'number':number,'title':title,
                      'url':f'/patterns/{slug(title)}/','group':group,'body':body,'markdown':body+'\n\n'+definitions})
    chapter_links = '\n'.join(f'- [{p["number"]:02}. {p["title"]}]({p["url"]})' for p in pages)
    worked_links = '\n'.join(f'- [{label}]({url})' for key,url,label,group in EXTRA if group=='Worked lessons')
    for key,url,label,group in EXTRA:
        text = (CONTENT / 'lessons' / f'{key}.md').read_text()
        heading = re.search(r'^# (.+)$', text, re.M)
        assert heading, key
        text = text[heading.end():].replace('{{CHAPTER_LINKS}}', chapter_links).replace('{{WORKED_LINKS}}', worked_links)
        for name in ['LRU','FILESYSTEM']:
            model = 'lru' if name=='LRU' else 'filesystem'
            text = text.replace('{{'+name+'_CODE}}','```javascript\n'+(SOURCE/f'{model}-model.mjs').read_text()+'\n```')
        pages.append({'id':key.replace('/','-'),'key':key,'number':None,'title':heading[1],'url':url,
                      'group':'The reference' if group=='hub' else group,'label':label,'markdown':text})
    library = problem_library(pages[:len(headings)], [p for p in pages if p.get('key','').startswith('worked/')])
    paths = {}
    for page in pages:
        content = parser.render(page.pop('markdown'))
        content = re.sub(
            r'<pre><code class="language-python">(.*?)</code></pre>',
            lambda match: '<pre><code class="language-python">' + highlight(
                html.unescape(match[1]), PythonLexer(), HtmlFormatter(nowrap=True)
            ) + '</code></pre>', content, flags=re.S)
        content = content.replace('<p>{{DEEP_DIVE}}</p>', '<details class="lesson-deep"><summary>Going further: random checks, related problems, and a reconstruction exercise</summary>')
        content = content.replace('<p>{{END_DEEP_DIVE}}</p>', '</details>')
        sections = []
        def heading(match):
            text = html.unescape(re.sub('<[^>]+>','',match[2]))
            anchor = slug(text)+'-'+str(len(sections)+1)
            sections.append({'id':anchor,'title':text})
            return f'<h2 id="{anchor}" tabindex="-1">{match[2]}</h2>'
        content = re.sub(r'<h([23])>(.*?)</h\1>',heading,content,flags=re.S)
        content = re.sub(r'<table>(.*?)</table>',r'<div class="table-scroll" tabindex="0" role="region" aria-label="Scrollable table"><table>\1</table></div>',content,flags=re.S)
        for name in ['LRU','FILESYSTEM']:
            model = 'lru' if name=='LRU' else 'filesystem'
            content = content.replace('<p>{{'+name+'_LAB}}</p>',(SOURCE/f'{model}-lab.html').read_text())
        if page['id']=='index':
            cards = '<ul class="section-index">'+''.join(
                f'<li><a href="{url}">{label}</a><p>{HUB_DESCRIPTIONS[key]}</p></li>'
                for key,url,label,group in EXTRA if group=='hub' and key!='index').replace(
                '</li><li><a href="/data-structures/">',
                '</li><li><a href="/solutions/">Browse solutions</a><p>Flip through every Python solution, one problem per screen.</p></li><li><a href="/data-structures/">',1)+'</ul>'
            content=content.replace('<p>{{LEARNING_PATHS}}</p>',cards).replace('<p>{{HERO_TRACE}}</p>',(SOURCE/'hero-trace.html').read_text())
        plain=html.unescape(re.sub('<[^>]+>',' ',content.replace('{{PROBLEM_LIBRARY}}','')));plain=re.sub(r'\s+',' ',plain).strip()
        if page['id']=='problems':content=content.replace('<p>{{PROBLEM_LIBRARY}}</p>',library['html'])
        page.update(content=content,sections=sections,text=plain,minutes=max(1,round(len(plain.split())/220)))
        assert not re.search(r'\{\{[A-Z_]+\}\}',content),page['id']
        assert page['url'] not in paths
        paths[page['url']]=page
    search_url=json_asset(destination, 'search-index',
                          [{k:p[k] for k in ('title','url','text')} for p in pages])
    template=(SOURCE/'template.html').read_text()
    worked_count=sum(1 for e in EXTRA if e[3]=='Worked lessons')
    summary=f'{len(headings)} pattern chapters, {worked_count} worked lessons, and 2 design labs. A growing reference, not a finished one.'
    destination.mkdir(parents=True,exist_ok=True)
    for asset in SOURCE.iterdir():
        if asset.suffix in {'.css','.js','.mjs','.svg'}:shutil.copyfile(asset,destination/asset.name)
    shutil.copytree(SOURCE/'fonts',destination/'fonts',dirs_exist_ok=True)
    for asset in (ROOT/'public').iterdir():
        if asset.is_file():shutil.copyfile(asset,destination/asset.name)
    (destination/'problems-data.json').write_text(library['data'])
    for source,name in [(ROOT/'LICENSE','LICENSE-CODE.txt'),(ROOT/'LICENSE-CONTENT','LICENSE-CONTENT.txt'),(CONTENT/'patterns.md','patterns.md')]:
        shutil.copyfile(source,destination/name)
    hubs=[e for e in EXTRA if e[3]=='hub' and e[0]!='index']
    section_of={key:(key if group=='hub' else {'Worked lessons':'worked','System design':'system-design'}.get(group))
                for key,url,label,group in EXTRA}
    def link(url,label,current,number=''):
        active=' aria-current="page"' if current else ''
        marker=f'<span class="chapter-number">{number}</span>' if number else ''
        return f'<li><a href="{url}"{active}>{marker}<span>{html.escape(label)}</span></a></li>'
    for page in pages:
        section='patterns' if page['number'] else section_of.get(page.get('key'))
        sections=''.join(f'<a href="{url}"'+(' aria-current="true"' if key==section else '')+f'>{label}</a>' for key,url,label,group in hubs)
        nav=['<div class="rail-sections"><h2 class="nav-group">Sections</h2><ol class="chapter-list">'+
             ''.join(link(url,label,page.get('key')==key) for key,url,label,group in EXTRA if group=='hub')+'</ol></div>']
        if section=='patterns':
            nav.append('<h2 class="nav-group"><a href="/patterns/">LeetCode patterns</a></h2>')
            group=None
            for chapter in pages[:len(headings)]:
                if chapter['group']!=group:
                    if group is not None:nav.append('</ol>')
                    group=chapter['group'];nav.append(f'<h3 class="nav-subgroup">{group}</h3><ol class="chapter-list">')
                nav.append(link(chapter['url'],chapter['title'],page['id']==chapter['id'],chapter['number']))
            nav.append('</ol>')
        elif section in ('worked','system-design'):
            hub=next(e for e in EXTRA if e[0]==section)
            nav.append(f'<h2 class="nav-group"><a href="{hub[1]}">{hub[2]}</a></h2><ol class="chapter-list">')
            nav.append(link(hub[1],'Overview',page.get('key')==section))
            if section=='worked':nav.append(link('/solutions/','Browse all solutions →',False))
            for key,url,label,group in EXTRA:
                if section_of.get(key)==section and group!='hub':nav.append(link(url,label,page.get('key')==key))
            nav.append('</ol>')
        else:
            nav.append('<h2 class="nav-group">The reference</h2><ol class="chapter-list contents-list">')
            for key,url,label,group in hubs:
                children=[e for e in EXTRA if section_of.get(e[0])==key and e[3]!='hub']
                inner=''.join(link(u,l,page.get('key')==k) for k,u,l,g in children)
                if key=='worked':inner=link('/solutions/','Browse all solutions →',False)+inner
                nav.append(link(url,label,page.get('key')==key).replace('</li>',(f'<ol class="chapter-list nested">{inner}</ol>' if inner else '')+'</li>'))
            nav.append('</ol>')
        title=html.escape(page['title'])
        if page['number']:meta=f'<span>{page["group"]}, chapter {page["number"]} of {len(headings)}</span>'
        elif page['group'] in ('Worked lessons','System design'):meta=f'<span>{page["group"]}</span>'
        else:meta='<span></span>'
        article=f'<article class="chapter" id="{page["id"]}"><header class="chapter-heading"><p class="chapter-meta">{meta}<span>{page["minutes"]} min read</span></p><h1 tabindex="-1">{title}</h1></header><div class="prose">{page["content"]}</div></article>'
        if page.get('key', '').startswith('worked/'):
            controls = '<p class="lesson-controls"><a href="/solutions/#' + page['key'].split('/')[-1] + '">Just the code? Flip through every solution →</a></p>'
            article = article.replace('<div class="prose">', controls + '<div class="prose">', 1)
        pager=[]
        if page.get('key', '').startswith('worked/'):
            lessons = [p for p in pages if p.get('key', '').startswith('worked/')]
            position = lessons.index(page)
            for offset, label in [(-1, 'Previous'), (1, 'Next')]:
                index = position + offset
                if 0 <= index < len(lessons):
                    other = lessons[index]
                    pager.append(f'<a href="{other["url"]}"><span>{label} problem</span><strong>{html.escape(other["title"])}</strong></a>')
        if page['number']:
            for offset,label in [(-1,'Previous'),(1,'Next')]:
                index=page['number']-1+offset
                if 0<=index<len(headings):
                    other=pages[index]
                    pager.append(f'<a class="{label.lower()}" href="{other["url"]}"><span>{label} chapter</span><strong>{html.escape(other["title"])}</strong></a>')
        if pager:article+='<nav class="chapter-pagination" aria-label="Chapter pagination">'+''.join(pager)+'</nav>'
        result=template
        data=json.dumps({'sections':page['sections'], 'search_url':search_url},ensure_ascii=False).replace('<','\\u003c').replace('&','\\u0026')
        replacements={'{{NAVIGATION}}':''.join(nav),'{{SECTIONS}}':sections,'{{ARTICLE}}':article,'{{CHAPTER_DATA}}':data,'{{PAGE_ID}}':page['id'],
                      '{{PAGE_TITLE}}':title,'{{DESCRIPTION}}':html.escape(page['text'][:170],quote=True),
                      '{{CANONICAL}}':'https://fanpilot.app'+page['url'],'{{SIDEBAR_SUMMARY}}':summary}
        for key,value in replacements.items():result=result.replace(key,value)
        assert not re.search(r'\{\{[A-Z_]+\}\}',result)
        output=destination/page['url'].lstrip('/')/'index.html';output.parent.mkdir(parents=True,exist_ok=True)
        pending=output.with_suffix('.html.tmp');pending.write_text(result);pending.replace(output)
    build_browser(ROOT, destination, EXTRA)
    (destination/'sitemap.xml').write_text('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'+''.join('<url><loc>https://fanpilot.app'+p['url']+'</loc></url>' for p in pages)+'</urlset>\n')
    (destination/'robots.txt').write_text('User-agent: *\nAllow: /\nSitemap: https://fanpilot.app/sitemap.xml\n')
    (destination/'404.html').write_text('<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Page not found · Fanpilot</title><link rel="stylesheet" href="/styles.css"><main class="not-found"><p><a class="brand" href="/">Fanpilot</a></p><h1>That page is not here.</h1><p>The address may be mistyped, or the page may have moved. <a href="/">Go to the start page</a> or <a href="/problems/">search the problem library</a>.</p></main></html>')
    (destination/'build-manifest.json').write_text(json.dumps({'pages':[{'id':p['id'],'url':p['url'],'title':p['title']} for p in pages]},indent=2)+'\n')
    print(f'Built {len(pages)} pages in {destination}',flush=True)


def serve(destination,port):
    class Handler(SimpleHTTPRequestHandler):
        def __init__(self,*args,**kwargs):super().__init__(*args,directory=str(destination),**kwargs)
        def end_headers(self):self.send_header('Cache-Control','no-cache');super().end_headers()
    server=ThreadingHTTPServer(('127.0.0.1',port),Handler)
    def stamps():return [(str(p),p.stat().st_mtime_ns) for base in (CONTENT,SOURCE) for p in sorted(base.rglob('*')) if p.is_file()]
    def watch():
        previous=stamps()
        while True:
            time.sleep(1);current=stamps()
            if current!=previous:
                try:build(destination)
                except Exception as error:print(f'Build error: {error}',flush=True)
                previous=current
    Thread(target=watch,daemon=True).start()
    print(f'Local URL: http://127.0.0.1:{server.server_port}/',flush=True)
    print('Watching content and assets. Refresh after edits.',flush=True)
    try:server.serve_forever()
    except KeyboardInterrupt:pass
    finally:server.server_close()


if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output',type=Path,default=ROOT/'dist')
    parser.add_argument('--serve',action='store_true')
    parser.add_argument('--port',type=int,default=8765)
    args=parser.parse_args();build(args.output.resolve())
    if args.serve:serve(args.output.resolve(),args.port)
