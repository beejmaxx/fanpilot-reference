// SPDX-License-Identifier: MIT
// Practice workspace: problem and walkthrough on one side, an editor and tests on the other.
// Each problem's data is fetched on demand from /practice/data/<slug>.json.
import {PyEditor, highlightPython} from '/py-editor.mjs';

const $ = id => document.getElementById(id);
const store = {
  get(key, fallback) { try { const v = localStorage.getItem('fp:' + key); return v === null ? fallback : JSON.parse(v); } catch { return fallback; } },
  set(key, value) { try { localStorage.setItem('fp:' + key, JSON.stringify(value)); } catch {} },
};
const escape = text => String(text).replace(/[&<>"]/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'})[c]);
const cache = new Map();
let problems = [], index = 0, entry = null, codeView = store.get('codeView', 'mine');
let solved = new Set(store.get('solved', [])), attempted = new Set(store.get('attempted', []));
let filter = 'all', running = false;

const editor = new PyEditor($('ws-editor'), {
  onChange: code => {
    if (codeView !== 'mine' || !entry) return;
    store.set('code:' + entry.slug, code);
    $('ws-saved').textContent = 'Saved';
  },
  onRun: () => run(false),
  onSubmit: () => run(true),
});
editor.input.addEventListener('focus', () => python.start(), {once: true});

/* Problem data */
async function load(slug) {
  if (!cache.has(slug)) cache.set(slug, fetch(`/practice/data/${slug}.json`).then(r => { if (!r.ok) throw new Error(r.status); return r.json(); }));
  return cache.get(slug);
}

async function open(next, {focusList = false} = {}) {
  index = (next + problems.length) % problems.length;
  const item = problems[index];
  if (location.hash !== '#' + item.slug) history.replaceState(null, '', '#' + item.slug);
  renderList();
  $('ws-position').textContent = `${index + 1} of ${problems.length}`;
  try { entry = await load(item.slug); }
  catch { $('ws-title').textContent = 'This problem could not be loaded.'; return; }
  if (problems[index].slug !== entry.slug) return;  // A later click won the race.
  load(problems[(index + 1) % problems.length].slug);  // Prefetch the next problem.
  document.title = `${entry.title} · Practice · Fanpilot`;
  $('ws-meta').innerHTML = `<span class="ws-badge ws-${entry.difficulty.toLowerCase()}">${entry.difficulty}</span>`
    + `<button type="button" class="ws-topic" aria-expanded="false" title="The technique is a spoiler; reveal it when you want it">Topic</button>`
    + `<a href="${escape(entry.leetcode)}" rel="noopener">LeetCode ${entry.number} ↗</a>`;
  const topic = $('ws-meta').querySelector('.ws-topic');
  topic.onclick = () => { topic.textContent = entry.pattern; topic.setAttribute('aria-expanded', 'true'); topic.disabled = true; };
  $('ws-title').textContent = `${entry.number}. ${entry.title}`;
  $('ws-problem').innerHTML = entry.problem;
  $('ws-walkthrough').innerHTML = entry.walkthrough;
  $('ws-further').innerHTML = entry.further;
  $('ws-lesson-link').href = entry.lesson;
  renderHints(0);
  $('ws-left-body').scrollTop = 0;
  showCode(codeView);
  renderCases(0);
  showConsole('cases');
  $('ws-result').innerHTML = '<p class="ws-muted">Run your code to see results here.</p>';
  if (focusList) $('ws-problems').querySelector('[aria-current]')?.focus();
}

function renderHints(shown) {
  const hints = entry.hints, labels = ['Where the slow solution wastes work', 'The key observation'];
  $('ws-hints').innerHTML = hints.length ? '<h2>Stuck?</h2>' + hints.map((hint, i) => i < shown
    ? `<div class="ws-hint"><p class="ws-hint-label">Hint ${i + 1} · ${labels[i] || ''}</p>${hint}</div>` : '').join('')
    + (shown < hints.length ? `<button type="button" class="ws-hint-button">Show hint ${shown + 1}: ${labels[shown] || ''}</button>` : '')
    + (shown === hints.length ? '<p class="ws-muted">Still stuck? The <a href="#" data-goto="walkthrough">walkthrough</a> derives the solution step by step.</p>' : '') : '';
  $('ws-hints').querySelector('.ws-hint-button')?.addEventListener('click', () => renderHints(shown + 1));
  $('ws-hints').querySelector('[data-goto]')?.addEventListener('click', event => { event.preventDefault(); showTab('walkthrough'); });
}

/* Tabs */
function selectTab(container, attribute, value) {
  container.querySelectorAll(`[${attribute}]`).forEach(tab => tab.setAttribute('aria-selected', String(tab.getAttribute(attribute) === value)));
}
function showTab(name) {
  selectTab(document.querySelector('.ws-left .ws-tabs'), 'data-tab', name);
  document.querySelectorAll('[data-panel]').forEach(panel => { panel.hidden = panel.dataset.panel !== name; });
  $('ws-left-body').scrollTop = 0;
}
function showCode(view) {
  codeView = view; store.set('codeView', view);
  selectTab(document.querySelector('.ws-code .ws-tabs'), 'data-code', view);
  editor.readOnly = view === 'solution';
  editor.value = view === 'solution' ? entry.solution : store.get('code:' + entry.slug, entry.starter);
  editor.markLine(null);
  $('ws-reset').hidden = view === 'solution';
  $('ws-saved').textContent = view === 'solution' ? 'Read only' : '';
}
function showConsole(name) {
  selectTab(document.querySelector('.ws-console .ws-tabs'), 'data-console', name);
  document.querySelectorAll('[data-console-panel]').forEach(panel => { panel.hidden = panel.dataset.consolePanel !== name; });
}
document.querySelectorAll('[data-tab]').forEach(tab => tab.addEventListener('click', () => showTab(tab.dataset.tab)));
document.querySelectorAll('[data-code]').forEach(tab => tab.addEventListener('click', () => showCode(tab.dataset.code)));
document.querySelectorAll('[data-console]').forEach(tab => tab.addEventListener('click', () => showConsole(tab.dataset.console)));

/* Test cases */
const code = text => `<pre class="ws-value language-python"><code>${highlightPython(text)}</code></pre>`;
function renderCases(selected) {
  $('ws-case-tabs').innerHTML = entry.tests.map((_, i) => `<button type="button" aria-pressed="${i === selected}">Case ${i + 1}</button>`).join('');
  $('ws-case-tabs').querySelectorAll('button').forEach((button, i) => { button.onclick = () => renderCases(i); });
  const test = entry.tests[selected];
  $('ws-case').innerHTML = !test ? '<p class="ws-muted">This lesson has no example tests.</p>' : test.kind === 'compare'
    ? `<p class="ws-label">Call</p>${code(test.call)}<p class="ws-label">Expected</p>${code(test.expected)}${['==', 'truthy', 'falsy'].includes(test.op) ? '' : `<p class="ws-muted">Compared with <code>${escape(test.op)}</code>.</p>`}`
    : `<p class="ws-label">Check</p>${code(test.source)}`;
}

/* Python, in a worker that is replaced if it exceeds the time limit */
const python = {
  worker: null, ready: null, pending: null,
  start() {
    if (this.worker) return this.ready;
    $('ws-python').textContent = 'Loading Python…';
    this.worker = new Worker('/practice-worker.mjs', {type: 'module'});
    this.ready = new Promise((resolve, reject) => {
      this.worker.onmessage = ({data}) => {
        if (data.type === 'ready') { $('ws-python').textContent = 'Python ready'; resolve(); }
        else if (data.type === 'failed') { $('ws-python').textContent = 'Python failed to load'; reject(new Error(data.detail)); }
        else if (data.type === 'result' && this.pending?.id === data.id) { this.pending.resolve(data); this.pending = null; }
      };
      this.worker.onerror = event => { $('ws-python').textContent = 'Python failed to load'; reject(new Error(event.message || 'The Python worker failed to start.')); };
      setTimeout(() => reject(new Error('Python took more than a minute to load. Check your connection and try again.')), 60000);
    });
    this.ready.catch(() => { this.worker?.terminate(); this.worker = null; });  // Let the next Run try again.
    return this.ready;
  },
  async run(payload, limit) {
    await this.start();
    const id = Math.random();
    return new Promise(resolve => {
      const timer = setTimeout(() => { this.reset(); resolve({timeout: true}); }, limit);
      this.pending = {id, resolve: data => { clearTimeout(timer); resolve(data); }};
      this.worker.postMessage({id, payload});
    });
  },
  reset() { this.worker?.terminate(); this.worker = null; this.pending = null; $('ws-python').textContent = 'Python restarted'; },
};

async function run(submit) {
  if (running || !entry) return;
  running = true;
  const buttons = [$('ws-run'), $('ws-submit')];
  buttons.forEach(b => { b.disabled = true; });
  showConsole('result');
  $('ws-result').innerHTML = `<p class="ws-muted">${python.worker ? 'Running…' : 'Loading Python (about 12 MB, once)…'}</p>`;
  editor.markLine(null);
  if (codeView === 'mine') { attempted.add(entry.slug); store.set('attempted', [...attempted]); renderList(); }
  const payload = {prelude: entry.prelude, main: entry.main, user: editor.value, setup: entry.setup, tests: entry.tests, submit: submit ? entry.submit : ''};
  try {
    const answer = await python.run(payload, submit ? 20000 : 8000);
    renderResult(answer, submit);
  } catch (error) {
    $('ws-result').innerHTML = `<div class="ws-verdict ws-bad"><strong>Python could not start</strong></div><pre class="ws-value">${escape(error.message)}</pre>`;
  } finally {
    running = false;
    buttons.forEach(b => { b.disabled = false; });
  }
}

function renderResult(answer, submit) {
  const out = $('ws-result');
  if (answer.timeout) {
    out.innerHTML = `<div class="ws-verdict ws-bad"><strong>Time limit exceeded</strong><span>Stopped after ${submit ? 20 : 8} seconds. Look for a loop that never ends.</span></div>`;
    return;
  }
  if (answer.fatal) {
    python.reset();
    out.innerHTML = `<div class="ws-verdict ws-bad"><strong>Python crashed</strong><span>Usually very deep recursion. Python has been restarted; try an iterative version.</span></div><pre class="ws-value ws-error">${escape(answer.detail)}</pre>`;
    return;
  }
  const {result, ms} = answer;
  if (result.error) {
    out.innerHTML = `<div class="ws-verdict ws-bad"><strong>${escape(result.error.title)}</strong></div><pre class="ws-value ws-error">${escape(result.error.detail)}</pre>`;
    editor.markLine(result.error.line);
    return;
  }
  const passed = result.tests.filter(t => t.ok).length, total = result.tests.length;
  const allExamples = passed === total, randomOk = !submit || result.submit?.ok;
  const accepted = allExamples && randomOk;
  const verdict = accepted ? (submit ? 'Accepted' : 'All examples pass') : allExamples ? 'Wrong answer on random tests' : 'Wrong answer';
  out.innerHTML = `<div class="ws-verdict ${accepted ? 'ws-good' : 'ws-bad'}"><strong>${verdict}</strong><span>${passed} of ${total} examples${submit ? ` · random tests ${result.submit?.ok ? 'passed' : 'failed'}` : ''} · ${ms} ms</span></div>`
    + (submit && result.submit && !result.submit.ok ? `<p class="ws-label">Random tests against the lesson's baseline</p><pre class="ws-value ws-error">${escape(result.submit.detail)}</pre>` : '')
    + (!submit && allExamples ? '<p class="ws-muted">Examples pass. <strong>Submit</strong> also runs random tests against the lesson\'s slow but correct baseline.</p>' : '')
    + result.tests.map((row, i) => {
      const test = entry.tests[i];
      return `<details class="ws-row ${row.ok ? 'ws-pass' : 'ws-fail'}" ${row.ok ? '' : 'open'}><summary><span class="ws-mark" aria-hidden="true">${row.ok ? '✓' : '✗'}</span>Case ${i + 1}<span class="sr-only">${row.ok ? ' passed' : ' failed'}</span></summary>`
        + (test.kind === 'compare' ? `<p class="ws-label">Call</p>${code(test.call)}<p class="ws-label">Your result</p>${code(row.got ?? '—')}<p class="ws-label">Expected</p>${code(test.expected)}` : `<p class="ws-label">Check</p>${code(test.source)}`)
        + (row.detail ? `<pre class="ws-value ws-error">${escape(row.detail)}</pre>` : '')
        + (row.stdout ? `<p class="ws-label">Printed</p><pre class="ws-value">${escape(row.stdout)}</pre>` : '')
        + '</details>';
    }).join('');
  if (accepted && submit && codeView === 'mine') { solved.add(entry.slug); store.set('solved', [...solved]); renderList(); }
}

$('ws-run').onclick = () => run(false);
$('ws-submit').onclick = () => run(true);
$('ws-reset').onclick = () => { editor.input.select(); editor.insert(entry.starter, 0, 0); $('ws-saved').textContent = 'Reset · undo with ⌘/Ctrl+Z'; };
$('ws-copy').onclick = async () => {
  try { await navigator.clipboard.writeText(editor.value); $('ws-saved').textContent = 'Copied'; }
  catch { $('ws-saved').textContent = 'Copy failed'; }
};

/* Problem list */
function renderList() {
  const query = $('ws-search').value.trim().toLowerCase();
  $('ws-problems').innerHTML = problems.map((p, i) => {
    const match = (filter === 'all' || p.difficulty === filter) && (!query || `${p.number} ${p.title} ${p.pattern}`.toLowerCase().includes(query));
    if (!match) return '';
    const state = solved.has(p.slug) ? '<span class="ws-state ws-solved" title="Solved">✓</span>' : attempted.has(p.slug) ? '<span class="ws-state ws-tried" title="Attempted">•</span>' : '<span class="ws-state"></span>';
    return `<li><a href="#${p.slug}" data-index="${i}"${i === index ? ' aria-current="true"' : ''}>${state}<span class="ws-num">${p.number}</span><span class="ws-name">${escape(p.title)}</span><span class="ws-diff ws-${p.difficulty.toLowerCase()}">${p.difficulty}</span></a></li>`;
  }).join('') || '<li class="ws-muted">No problems match.</li>';
  $('ws-progress').textContent = `${solved.size} of ${problems.length} solved`;
}
$('ws-problems').addEventListener('click', event => {
  const link = event.target.closest('a[data-index]');
  if (!link) return;
  event.preventDefault(); drawer(false); open(Number(link.dataset.index));
});
$('ws-search').addEventListener('input', renderList);
document.querySelectorAll('[data-filter]').forEach(button => button.addEventListener('click', () => {
  filter = button.dataset.filter;
  document.querySelectorAll('[data-filter]').forEach(b => b.setAttribute('aria-pressed', String(b === button)));
  renderList();
}));
function drawer(show) {
  $('ws-drawer').hidden = !show; $('ws-scrim').hidden = !show;
  $('ws-list-button').setAttribute('aria-expanded', String(show));
  if (show) { $('ws-search').focus(); $('ws-problems').querySelector('[aria-current]')?.scrollIntoView({block: 'center'}); }
  else $('ws-list-button').focus({preventScroll: true});
}
$('ws-list-button').onclick = () => drawer($('ws-drawer').hidden);
$('ws-scrim').onclick = () => drawer(false);

/* Navigation */
$('ws-prev').onclick = () => open(index - 1);
$('ws-next').onclick = () => open(index + 1);
$('ws-random').onclick = () => open((index + 1 + Math.floor(Math.random() * (problems.length - 1))) % problems.length);
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && !$('ws-drawer').hidden) { drawer(false); return; }
  if (event.altKey || event.ctrlKey || event.metaKey || event.target.closest('input, textarea, select')) return;
  if (event.key === 'ArrowLeft') { event.preventDefault(); open(index - 1); }
  else if (event.key === 'ArrowRight') { event.preventDefault(); open(index + 1); }
});
window.addEventListener('hashchange', () => {
  const found = problems.findIndex(p => '#' + p.slug === location.hash);
  if (found >= 0 && found !== index) open(found);
});

/* Layout: side by side or stacked, with draggable dividers */
const root = document.documentElement, main = $('ws-main');
function setLayout(stacked) {
  document.body.classList.toggle('ws-stacked', stacked);
  store.set('stacked', stacked);
  $('ws-layout').setAttribute('aria-label', stacked ? 'Place panels side by side' : 'Stack panels');
}
$('ws-layout').onclick = () => setLayout(!document.body.classList.contains('ws-stacked'));
setLayout(store.get('stacked', false));
function splitter(handle, variable, measure, fallback) {
  const apply = value => { value = Math.min(80, Math.max(20, value)); root.style.setProperty(variable, value + '%'); store.set(variable, value); return value; };
  let current = apply(store.get(variable, fallback));
  handle.addEventListener('pointerdown', event => {
    handle.setPointerCapture(event.pointerId);
    document.body.classList.add('ws-dragging');
    const move = e => { current = apply(measure(e)); };
    const up = () => { handle.removeEventListener('pointermove', move); document.body.classList.remove('ws-dragging'); };
    handle.addEventListener('pointermove', move);
    handle.addEventListener('pointerup', up, {once: true});
  });
  handle.addEventListener('keydown', event => {
    const step = {ArrowLeft: -2, ArrowUp: -2, ArrowRight: 2, ArrowDown: 2}[event.key];
    if (step) { event.preventDefault(); current = apply(current + step); }
  });
}
splitter($('ws-handle-main'), '--ws-split', e => {
  const box = main.getBoundingClientRect();
  return document.body.classList.contains('ws-stacked') ? (e.clientY - box.top) / box.height * 100 : (e.clientX - box.left) / box.width * 100;
}, 42);
splitter($('ws-handle-code'), '--ws-code', e => {
  const box = document.querySelector('.ws-right').getBoundingClientRect();
  return (e.clientY - box.top) / box.height * 100;
}, 62);

/* Start */
problems = await fetch('/practice/index.json').then(r => r.json());
const start = problems.findIndex(p => '#' + p.slug === location.hash);
open(Math.max(0, start));
