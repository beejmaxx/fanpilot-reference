// SPDX-License-Identifier: MIT
// Verify lazy static data, every registered solution, races, retries and keyboard behavior.
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {existsSync} from 'node:fs';
import {mkdir} from 'node:fs/promises';
const base = new URL(process.env.SITE_URL || 'http://127.0.0.1:8765');
await mkdir(new URL('../.qa/', import.meta.url), {recursive:true});
const chrome = process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const browser = await chromium.launch({headless:true, ...(existsSync(chrome) ? {executablePath:chrome} : {})});
const context = await browser.newContext({viewport:{width:1440,height:1000}});
await context.addInitScript(() => {
  Object.defineProperty(navigator, 'clipboard', {value:{writeText:async text => {window.copiedCode=text;}}});
});
const page = await context.newPage();
const errors = [], requests = [];
page.on('pageerror', error => errors.push(error.message));
page.on('request', request => requests.push(new URL(request.url()).pathname));
const ready = (target, slug) => target.locator(`.sb-panel[id="${slug}"] h1`).waitFor();
try {
  await page.goto(new URL('/solutions/',base).href);
  await page.locator('.sb-panel h1').waitFor();
  const indexURL = await page.locator('body').getAttribute('data-index');
  const lessons = await page.evaluate(async url => (await fetch(url)).json(), indexURL);
  assert.ok(lessons.length>0);
  assert.equal(requests.filter(url => url.includes('/solutions/data/')).length,1,'Only selected solution loads initially');
  assert.equal(await page.locator('.sb-panel').count(),1);
  assert.equal(requests.filter(url=>url.includes('search-index')).length,0);

  for(const lesson of lessons) {
    await page.locator(`.sb-tab[data-slug="${lesson.slug}"]`).click();
    await ready(page,lesson.slug);
    assert.equal(await page.locator('.sb-panel').count(),1);
    assert.equal(await page.locator('h1').innerText(),lesson.title);
    assert.equal(await page.locator('.sb-lesson').getAttribute('href'),lesson.lesson_url);
    assert.ok((await page.locator('.sb-statement').innerText()).length>80,'Problem description survives');
    assert.ok(await page.locator('.sb-source span').count()>0,'Highlighted Python survives');
    const code = await page.locator('.sb-source code').textContent();
    assert.match(code,/def |class /);
    await page.locator('.sb-copy').click();
    await page.waitForFunction(()=>document.querySelector('.sb-copy').textContent==='Copied');
    assert.equal(await page.evaluate(()=>window.copiedCode),code,'Copy contains source, without gutter');
    assert.equal(await page.evaluate(()=>document.documentElement.scrollHeight>innerHeight+1),false,'Desktop panes fit viewport');
    await page.setViewportSize({width:375,height:812});
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,`Mobile overflow: ${lesson.slug}`);
    await page.setViewportSize({width:1440,height:1000});
  }
  const last = lessons.at(-1);
  await page.locator('.sb-code').focus();
  await page.keyboard.press('ArrowLeft');
  assert.equal(new URL(page.url()).hash,'#'+last.slug,'Arrow keys in code pane do not change problems');
  const beforeWrap=requests.filter(url=>url.includes('/solutions/data/')).length;
  await page.locator('#sb-next').click();await ready(page,lessons[0].slug);
  if(lessons.length>5) assert.equal(requests.filter(url=>url.includes('/solutions/data/')).length,beforeWrap+1,'Older solutions are evicted from the five-item cache');
  await page.locator('#sb-prev').click();await ready(page,last.slug);
  await page.locator('#sb-next').focus();await page.keyboard.press('ArrowRight');await ready(page,lessons[0].slug);
  await page.locator('[data-size="1"]').click();
  assert.equal(await page.evaluate(()=>document.documentElement.style.getPropertyValue('--sb-font')),'16px');
  assert.equal(await page.locator('.sb-code').evaluate(e=>getComputedStyle(e).fontSize),'16px');
  const before = requests.filter(url=>url.includes('/solutions/data/')).length;
  await page.locator('#sb-prev').click();await ready(page,last.slug);
  assert.equal(requests.filter(url=>url.includes('/solutions/data/')).length,before,'Recent solution comes from cache');
  await page.reload();await ready(page,last.slug);
  assert.equal(await page.evaluate(()=>document.documentElement.style.getPropertyValue('--sb-font')),'16px');
  await page.screenshot({path:'.qa/solutions-desktop.png'});
  await page.setViewportSize({width:375,height:812});
  await page.screenshot({path:'.qa/solutions-mobile.png',fullPage:true});
  await page.goto(new URL('/solutions/#unknown-problem',base).href);await ready(page,lessons[0].slug);
  assert.equal(new URL(page.url()).hash,'#'+lessons[0].slug);
  assert.deepEqual(errors,[]);

  // Failed payload, retry, then a delayed response superseded by another click.
  const failure = await context.newPage();
  let fail=true;
  await failure.route('**'+lessons[1].url,route=>fail ? route.fulfill({status:503,body:'Unavailable'}) : route.continue());
  await failure.goto(new URL('/solutions/#'+lessons[1].slug,base).href);
  await failure.getByRole('button',{name:'Retry',exact:true}).waitFor();
  assert.equal(await failure.locator('.sb-message a').getAttribute('href'),lessons[1].lesson_url);
  fail=false;await failure.getByRole('button',{name:'Retry',exact:true}).click();await ready(failure,lessons[1].slug);
  let release, started;
  const gate=new Promise(resolve=>{release=resolve;});
  const pending=new Promise(resolve=>{started=resolve;});
  await failure.route('**'+lessons[2].url,async route=>{started();await gate;try{await route.continue();}catch{/* Aborted request. */}});
  await failure.locator(`.sb-tab[data-slug="${lessons[2].slug}"]`).click();await pending;
  await failure.locator(`.sb-tab[data-slug="${lessons[3].slug}"]`).click();await ready(failure,lessons[3].slug);
  release();await failure.unrouteAll({behavior:'wait'});
  assert.equal(await failure.locator('h1').innerText(),lessons[3].title);
  assert.equal(new URL(failure.url()).hash,'#'+lessons[3].slug);
  await failure.close();

  const indexFailure = await context.newPage();
  let indexFails=true;
  await indexFailure.route('**/solution-index.*.json',route=>indexFails ? route.fulfill({status:503,body:'Unavailable'}) : route.continue());
  await indexFailure.goto(new URL('/solutions/',base).href);
  await indexFailure.getByRole('button',{name:'Retry',exact:true}).waitFor();
  assert.equal(await indexFailure.locator('#sb-next').isDisabled(),true);
  indexFails=false;await indexFailure.getByRole('button',{name:'Retry',exact:true}).click();await ready(indexFailure,lessons[0].slug);
  await indexFailure.close();

  // Search is lazy, retries network failures, and ignores obsolete queries.
  const search = await context.newPage();
  const searchRequests=[];search.on('request',r=>{if(r.url().includes('search-index'))searchRequests.push(r.url());});
  let searchFails=true, unlock;
  const delayed=new Promise(resolve=>{unlock=resolve;});
  await search.route('**/search-index.*.json',async route=>{
    if(searchFails)return route.fulfill({status:503,body:'Unavailable'});
    await delayed;await route.continue();
  });
  await search.goto(base.href);
  assert.equal(searchRequests.length,0);
  assert.ok(await search.locator('#outline-content').innerText(),'Outline does not need global search data');
  await search.locator('#book-search').fill('monotonic');
  await search.getByRole('button',{name:'Retry search',exact:true}).waitFor();
  searchFails=false;await search.getByRole('button',{name:'Retry search',exact:true}).click();
  await search.locator('#book-search').fill('zzyzxnonexistent');unlock();
  await search.waitForFunction(()=>document.getElementById('search-status').textContent.startsWith('0 matching'));
  assert.equal(await search.locator('#search-results a').count(),0);
  await search.locator('#book-search').fill('monotonic');await search.locator('#search-results a').first().waitFor();
  assert.equal(searchRequests.length,2,'One failed fetch plus one shared successful fetch');
  await search.locator('#book-search').fill('the');
  await search.waitForFunction(()=>!document.getElementById('search-status').textContent.startsWith('Loading'));
  assert.ok(await search.locator('#search-results a').count()<=50);
  await search.close();

  const noJS=await browser.newContext({javaScriptEnabled:false});
  const reader=await noJS.newPage();await reader.goto(new URL('/solutions/',base).href);
  assert.equal(await reader.locator('noscript a').getAttribute('href'),'/worked/');
  await reader.locator('noscript a').click();assert.equal(new URL(reader.url()).pathname,'/worked/');
  assert.ok((await reader.locator('h1').innerText()).length>0);
  await noJS.close();
  console.log(`Verified all ${lessons.length} solutions, single-payload loading, copying, desktop/mobile, deep links, wraparound, cache, font settings, request races, failure retries, lazy search and no-JS fallback.`);
} finally {await browser.close();}
