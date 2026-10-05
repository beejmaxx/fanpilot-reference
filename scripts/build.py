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

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'src'
CONTENT = ROOT / 'content'
GROUPS = [(1, 'Getting oriented'), (5, 'Core patterns'), (13, 'Trees and graphs'),
          (18, 'State and structure'), (25, 'Practice and reference')]
EXTRA = [('index', '/', 'Start here'), ('patterns', '/patterns/', 'LeetCode patterns'),
         ('data-structures', '/data-structures/', 'Data structures'),
         ('algorithms', '/algorithms/', 'Algorithms'),
         ('system-design', '/system-design/', 'System design'),
         ('lru-cache', '/system-design/lru-cache/', 'LRU cache'),
         ('file-system', '/system-design/file-system/', 'File system'),
         ('research', '/research/', 'Research & sources'), ('about', '/about/', 'About the guide')]


def slug(text):
    return re.sub(r'[^a-z0-9]+', '-', text.lower()).strip('-')


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
                      'url':f'/patterns/{slug(title)}/','group':group,'markdown':body+'\n\n'+definitions})
    chapter_links = '\n'.join(f'- [{p["number"]:02}. {p["title"]}]({p["url"]})' for p in pages)
    for key,url,label in EXTRA:
        text = (CONTENT / 'lessons' / f'{key}.md').read_text()
        heading = re.search(r'^# (.+)$', text, re.M)
        assert heading, key
        text = text[heading.end():].replace('{{CHAPTER_LINKS}}', chapter_links)
        for name in ['LRU','FILESYSTEM']:
            model = 'lru' if name=='LRU' else 'filesystem'
            text = text.replace('{{'+name+'_CODE}}','```javascript\n'+(SOURCE/f'{model}-model.mjs').read_text()+'\n```')
        pages.append({'id':key,'number':None,'title':heading[1],'url':url,
                      'group':'System design' if key in ['lru-cache','file-system','system-design'] else 'The reference',
                      'label':label,'markdown':text})
    paths = {}
    for page in pages:
        content = parser.render(page.pop('markdown'))
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
            cards = '<div class="learning-paths">'+''.join(
                f'<a href="{url}"><span>0{i}</span><strong>{label}</strong><p>{description}</p></a>'
                for i,(url,label,description) in enumerate([
                    ('/patterns/','LeetCode patterns','Derive an approach. Prove it. Transfer it.'),
                    ('/data-structures/','Data structures','Choose the representation your operations need.'),
                    ('/algorithms/','Algorithms','Turn a correct baseline into a better one.'),
                    ('/system-design/','System design','Build from requirements, invariants, and tradeoffs.')],1))+'</div>'
            content=content.replace('<p>{{LEARNING_PATHS}}</p>',cards)
        plain=html.unescape(re.sub('<[^>]+>',' ',content));plain=re.sub(r'\s+',' ',plain).strip()
        page.update(content=content,sections=sections,text=plain,minutes=max(1,round(len(plain.split())/220)))
        assert not re.search(r'\{\{[A-Z_]+\}\}',content),page['id']
        assert page['url'] not in paths
        paths[page['url']]=page
    data=json.dumps([{k:v for k,v in p.items() if k!='content'} for p in pages],ensure_ascii=False).replace('<','\\u003c').replace('&','\\u0026')
    template=(SOURCE/'template.html').read_text()
    destination.mkdir(parents=True,exist_ok=True)
    for asset in SOURCE.iterdir():
        if asset.suffix in {'.css','.js','.mjs','.svg'}:shutil.copyfile(asset,destination/asset.name)
    for asset in (ROOT/'public').iterdir():
        if asset.is_file():shutil.copyfile(asset,destination/asset.name)
    for source,name in [(ROOT/'LICENSE','LICENSE-CODE.txt'),(ROOT/'LICENSE-CONTENT','LICENSE-CONTENT.txt'),(CONTENT/'patterns.md','patterns.md')]:
        shutil.copyfile(source,destination/name)
    for page in pages:
        nav=['<h2 class="nav-group">Explore</h2><ol class="chapter-list library-nav">']
        for key,url,label in EXTRA[:7]:
            active=' aria-current="page"' if page['id']==key else ''
            nav.append(f'<li><a href="{url}"{active}><span class="chapter-number">·</span><span>{label}</span></a></li>')
        nav.append('</ol>')
        group=None
        for chapter in pages[:len(headings)]:
            if chapter['group']!=group:
                if group is not None:nav.append('</ol>')
                group=chapter['group'];nav.append(f'<h2 class="nav-group">{group}</h2><ol class="chapter-list">')
            active=' aria-current="page"' if page['id']==chapter['id'] else ''
            nav.append(f'<li><a href="{chapter["url"]}"{active}><span class="chapter-number">{chapter["number"]:02}</span><span>{html.escape(chapter["title"])}</span></a></li>')
        nav.append('</ol>')
        title=html.escape(page['title'])
        chapter_label=f'<span class="chapter-label">Chapter {page["number"]:02}</span>' if page['number'] else ''
        article=f'<article class="chapter" id="{page["id"]}"><div class="chapter-meta"><span>{page["group"]}</span><span>{page["minutes"]} min read</span></div><div class="chapter-heading">{chapter_label}<h1 tabindex="-1">{title}</h1></div><div class="prose">{page["content"]}</div></article>'
        pager=[]
        if page['number']:
            for offset,label in [(-1,'Previous'),(1,'Next')]:
                index=page['number']-1+offset
                if 0<=index<len(headings):
                    other=pages[index]
                    pager.append(f'<a class="{label.lower()}" href="{other["url"]}"><span>{label} chapter</span><strong>{html.escape(other["title"])}</strong></a>')
        if pager:article+='<nav class="chapter-pagination" aria-label="Chapter pagination">'+''.join(pager)+'</nav>'
        result=template
        replacements={'{{NAVIGATION}}':''.join(nav),'{{ARTICLE}}':article,'{{CHAPTER_DATA}}':data,'{{PAGE_ID}}':page['id'],
                      '{{PAGE_TITLE}}':title,'{{DESCRIPTION}}':html.escape(page['text'][:170],quote=True),
                      '{{CANONICAL}}':'https://fanpilot.app'+page['url']}
        for key,value in replacements.items():result=result.replace(key,value)
        assert not re.search(r'\{\{[A-Z_]+\}\}',result)
        output=destination/page['url'].lstrip('/')/'index.html';output.parent.mkdir(parents=True,exist_ok=True)
        pending=output.with_suffix('.html.tmp');pending.write_text(result);pending.replace(output)
    (destination/'sitemap.xml').write_text('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'+''.join('<url><loc>https://fanpilot.app'+p['url']+'</loc></url>' for p in pages)+'</urlset>\n')
    (destination/'robots.txt').write_text('User-agent: *\nAllow: /\nSitemap: https://fanpilot.app/sitemap.xml\n')
    (destination/'404.html').write_text('<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Page not found · Fanpilot</title><link rel="stylesheet" href="/styles.css"><main class="not-found"><p>FANPILOT REFERENCE</p><h1>That page is not here.</h1><p><a href="/">Browse the guide</a> or use its chapter search to find a topic.</p></main></html>')
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
