// SPDX-License-Identifier: MIT
// Run against a built, served site: SITE_URL=http://127.0.0.1:8765 node scripts/check-practice.mjs
// For every lesson, the workspace must accept the lesson's own solution (examples and random tests)
// and reject the starter stub, which proves the extracted tests actually test something.
import assert from 'node:assert/strict';
import {existsSync} from 'node:fs';
import {chromium} from 'playwright';

const base = new URL(process.env.SITE_URL || 'http://127.0.0.1:8765');
const chrome = process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const browser = await chromium.launch({headless: true, ...(existsSync(chrome) ? {executablePath: chrome} : {})});
const page = await browser.newPage({viewport: {width: 1440, height: 900}});
const errors = [];
page.on('pageerror', error => errors.push(error.message));
const index = await (await fetch(new URL('/practice/index.json', base))).json();

async function submit(code) {
  await page.$eval('.ed-input', (input, value) => { input.value = value; input.dispatchEvent(new Event('input')); }, code);
  await page.click('#ws-submit');
  await page.waitForFunction(() => !document.getElementById('ws-submit').disabled && document.querySelector('#ws-result .ws-verdict'), null, {timeout: 60000});
  return page.$eval('#ws-result .ws-verdict strong', element => element.textContent);
}

const failures = [];
for (const {slug} of index) {
  const entry = await (await fetch(new URL(`/practice/data/${slug}.json`, base))).json();
  await page.goto(new URL(`/practice/#${slug}`, base).href);
  await page.waitForFunction(title => document.getElementById('ws-title').textContent.endsWith(title), entry.title);
  await page.click('[data-code="mine"]');
  const solution = await submit(entry.solution);
  const stub = await submit(entry.starter);
  const ok = solution === 'Accepted' && stub !== 'Accepted' && entry.tests.length > 0 && entry.submit;
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${slug}: solution ${solution}; starter ${stub}; ${entry.tests.length} examples`);
  if (!ok) failures.push(slug);
}
await page.evaluate(() => localStorage.clear());
await browser.close();
assert.deepEqual(errors, [], 'page errors');
assert.deepEqual(failures, [], 'lessons whose workspace tests do not work');
console.log(`Checked the practice workspace for ${index.length} lessons.`);
