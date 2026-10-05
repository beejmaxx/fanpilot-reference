// SPDX-License-Identifier: MIT
// Run against a built, served site: SITE_URL=http://127.0.0.1:8765 npm run test:site
import assert from 'node:assert/strict';
import {readFile, mkdir} from 'node:fs/promises';
import {existsSync} from 'node:fs';
import {chromium} from 'playwright';

const base = new URL(process.env.SITE_URL || 'http://127.0.0.1:8765');
const manifest = JSON.parse(await readFile(new URL('../dist/build-manifest.json', import.meta.url)));
const chrome = process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const browser = await chromium.launch({headless:true, ...(existsSync(chrome) ? {executablePath:chrome} : {})});
const context = await browser.newContext({viewport:{width:1440,height:1000}});
const page = await context.newPage();
const errors = [];
page.on('pageerror', error => errors.push(error.message));
page.on('console', message => { if(message.type()==='error') errors.push(message.text()); });
const links = new Map();
const ids = new Map();
await mkdir(new URL('../.qa/', import.meta.url), {recursive:true});

try {
  for (const entry of manifest.pages) {
    const response = await page.goto(new URL(entry.url, base).href);
    assert.equal(response.status(), 200, entry.url);
    assert.equal(await page.locator('h1').innerText(), entry.title);
    const dom = await page.evaluate(() => ({
      ids:[...document.querySelectorAll('[id]')].map(e=>e.id),
      links:[...document.querySelectorAll('a[href]')].map(e=>e.href),
      overflow:document.documentElement.scrollWidth>innerWidth
    }));
    assert.equal(dom.overflow, false, `Desktop overflow: ${entry.url}`);
    assert.equal(new Set(dom.ids).size, dom.ids.length, `Duplicate IDs: ${entry.url}`);
    ids.set(entry.url, new Set(dom.ids));
    for(const href of dom.links) {
      const url = new URL(href);
      if(url.origin===base.origin) links.set(url.pathname+url.hash, {url,source:entry.url});
    }
    await page.setViewportSize({width:375,height:812});
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth), false, `Mobile overflow: ${entry.url}`);
    await page.setViewportSize({width:1440,height:1000});
  }
  for(const {url,source} of links.values()) {
    if(ids.has(url.pathname)) {
      if(url.hash) assert.ok(ids.get(url.pathname).has(decodeURIComponent(url.hash.slice(1))), `Missing anchor ${url.pathname+url.hash} linked by ${source}`);
    } else {
      const response = await context.request.get(url.href);
      assert.equal(response.status(),200,`Broken link ${url.pathname} linked by ${source}`);
    }
  }

  await page.goto(new URL('/',base).href);
  await page.screenshot({path:'.qa/home-desktop.png',fullPage:true});
  await page.keyboard.press('/');
  assert.equal(await page.locator('#book-search').evaluate(e=>document.activeElement===e),true);
  await page.locator('#book-search').fill('monotonic');
  assert.ok(await page.locator('#search-results a').count()>0);
  await page.locator('#book-search').fill('zzyzxnonexistent');
  assert.match(await page.locator('#search-status').innerText(), /0 matching/);
  await page.keyboard.press('Escape');
  assert.equal(await page.locator('#book-search').inputValue(),'');
  await page.setViewportSize({width:375,height:812});
  await page.screenshot({path:'.qa/home-mobile.png',fullPage:true});
  await page.locator('#menu-button').click();
  assert.equal(await page.locator('#menu-button').getAttribute('aria-expanded'),'true');
  assert.equal(await page.locator('#content-shell').evaluate(e=>e.inert),true);
  await page.locator('#book-search').fill('LRU cache');
  await page.locator('#search-results a').filter({hasText:'Design an LRU cache'}).first().click();
  assert.equal(new URL(page.url()).pathname,'/system-design/lru-cache/');
  assert.equal(await page.locator('#sidebar').evaluate(e=>e.inert),true);

  for(let i=0;i<4;i++) await page.locator('#lru-step').click();
  assert.deepEqual(await page.locator('.cache-node strong').allTextContents(),['C','A']);
  assert.match(await page.locator('#lru-explanation').innerText(),/Evicted B/);
  await page.locator('#lru-step').click();
  assert.match(await page.locator('#lru-explanation').innerText(),/Miss: B/);
  await page.locator('#lru-capacity').selectOption('1');
  assert.equal(await page.locator('.cache-node').count(),0);
  await page.locator('#lru-lab .lab-custom summary').click();
  await page.locator('#lru-key').fill('<b>x</b>');
  await page.locator('#lru-form button').click();
  assert.equal(await page.locator('.cache-node strong').innerText(),'<b>x</b>');
  assert.equal(await page.locator('.cache-node b').count(),0);
  await page.locator('#lru-capacity').selectOption('2');
  for(let i=0;i<4;i++) await page.locator('#lru-step').click();
  await page.locator('#lru-lab').screenshot({path:'.qa/lru-mobile.png'});
  await page.setViewportSize({width:1440,height:1000});
  await page.locator('#lru-lab').screenshot({path:'.qa/lru-desktop.png'});

  await page.goto(new URL('/system-design/file-system/',base).href);
  for(let i=0;i<6;i++) await page.locator('#fs-step').click();
  assert.match(await page.locator('#fs-result').innerText(),/hello world/);
  await page.locator('#filesystem-lab summary').filter({hasText:'Search files'}).click();
  await page.locator('#fs-search button').click();
  assert.equal(await page.locator('#fs-search-result').innerText(),'/notes/cache');
  await page.locator('#fs-minimum').fill('12');
  await page.locator('#fs-search button').click();
  assert.match(await page.locator('#fs-search-result').innerText(),/No files match/);
  await page.locator('#filesystem-lab summary').filter({hasText:'Try your own'}).click();
  await page.locator('#fs-operation').selectOption('append');
  await page.locator('#fs-path').fill('/missing/file');
  await page.locator('#fs-form button').click();
  assert.match(await page.locator('#fs-result').innerText(),/does not exist/);
  assert.equal(await page.locator('#fs-tree').innerText().then(t=>t.includes('missing')),false);
  await page.locator('#fs-path').fill('/notes/cache');
  await page.locator('#fs-content').fill('😀');
  await page.locator('#fs-form button').click();
  assert.match(await page.locator('#fs-tree').innerText(),/15 B/);
  await page.locator('#filesystem-lab').screenshot({path:'.qa/filesystem-desktop.png'});

  const noJs = await browser.newContext({javaScriptEnabled:false,viewport:{width:375,height:812}});
  const reader = await noJs.newPage();
  await reader.goto(new URL('/patterns/heaps-and-the-candidate-frontier/',base).href);
  assert.match(await reader.locator('h1').innerText(),/Heaps/);
  assert.ok(await reader.locator('.prose').innerText().then(t=>t.length)>500);
  assert.equal(await reader.locator('.sidebar').isVisible(),true);
  await noJs.close();
  assert.deepEqual(errors,[],'Browser errors');
  console.log(`Verified ${manifest.pages.length} routes, ${links.size} internal link targets, desktop/mobile layouts, search, both labs, and reading without JavaScript.`);
} finally { await browser.close(); }
