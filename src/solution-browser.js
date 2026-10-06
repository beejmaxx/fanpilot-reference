// Static index + one solution payload at a time. Keep only five recent payloads.
(() => {
  'use strict';
  const stage = document.querySelector('.sb-stage');
  const strip = document.querySelector('.sb-tabs');
  const status = document.getElementById('sb-status');
  const previous = document.getElementById('sb-prev');
  const next = document.getElementById('sb-next');
  const cache = new Map();
  let lessons = [], tabs = [], index = 0, request = 0, controller;
  document.body.classList.add('sb-paged');

  async function getJSON(url, signal) {
    const response = await fetch(url, {signal});
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
  }

  function message(text, retry, lessonURL) {
    const box = document.createElement('div');box.className = 'sb-message';
    const note = document.createElement('span');note.textContent = text;box.append(note);
    if (retry) {
      const button = document.createElement('button');button.type = 'button';button.textContent = 'Retry';
      button.onclick = retry;box.append(button);
    }
    if (lessonURL) {
      const link = document.createElement('a');link.href = lessonURL;link.textContent = 'Read the full lesson';box.append(link);
    }
    stage.replaceChildren(box);status.textContent = text;
  }

  const root = document.documentElement;
  function setSize(size) {
    size = Math.min(22, Math.max(12, size));
    root.style.setProperty('--sb-font', size + 'px');
    try { localStorage.setItem('sb-font', size); } catch {}
  }
  try { const saved = Number(localStorage.getItem('sb-font')); if (Number.isFinite(saved) && saved) setSize(saved); } catch {}

  function mount(html) {
    // This HTML is generated from our own Markdown and highlighted code at build time.
    stage.innerHTML = html;
    for (const button of stage.querySelectorAll('[data-size]')) {
      button.onclick = () => setSize(parseFloat(getComputedStyle(root).getPropertyValue('--sb-font') || 15) + Number(button.dataset.size));
    }
    const copy = stage.querySelector('.sb-copy');
    copy.onclick = async () => {
      const code = stage.querySelector('.sb-source code');
      try { await navigator.clipboard.writeText(code.textContent);copy.textContent = 'Copied'; }
      catch {
        const range = document.createRange();range.selectNodeContents(code);
        const selection = window.getSelection();selection.removeAllRanges();selection.addRange(range);
        copy.textContent = 'Code selected';
      }
      setTimeout(() => { copy.textContent = 'Copy'; }, 1500);
    };
  }

  async function show(position, focusTab = false) {
    if (!lessons.length) return;
    index = (position + lessons.length) % lessons.length;
    const lesson = lessons[index], token = ++request;
    controller?.abort();controller = new AbortController();
    tabs.forEach((tab, i) => tab.toggleAttribute('aria-current', i === index));
    const tab = tabs[index];
    if (tab.offsetLeft < strip.scrollLeft || tab.offsetLeft + tab.offsetWidth > strip.scrollLeft + strip.clientWidth)
      strip.scrollLeft = tab.offsetLeft - (strip.clientWidth - tab.offsetWidth) / 2;
    if (focusTab) tab.focus({preventScroll: true});
    document.title = `${lesson.title} · Browse solutions · Fanpilot`;
    if (location.hash !== '#' + lesson.slug) history.replaceState(null, '', '#' + lesson.slug);
    stage.setAttribute('aria-busy', 'true');
    message(`Loading ${lesson.title}…`);
    try {
      const payload = cache.get(lesson.slug) || await getJSON(lesson.url, controller.signal);
      if (token !== request) return; // A fast click must never show an older response.
      cache.delete(lesson.slug);cache.set(lesson.slug, payload);
      if (cache.size > 5) cache.delete(cache.keys().next().value);
      mount(payload.html);
      status.textContent = `${lesson.title}, problem ${index + 1} of ${lessons.length}`;
    } catch (error) {
      if (token !== request || error.name === 'AbortError') return;
      message(`Could not load ${lesson.title}.`, () => show(index), lesson.lesson_url);
    } finally {
      if (token === request) stage.setAttribute('aria-busy', 'false');
    }
  }

  function fromHash() {
    show(Math.max(0, lessons.findIndex(lesson => '#' + lesson.slug === location.hash)));
    window.scrollTo(0, 0);
  }
  previous.onclick = () => show(index - 1);
  next.onclick = () => show(index + 1);
  document.addEventListener('keydown', event => {
    if (!lessons.length || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey ||
        event.target.closest('input,select,textarea,.sb-code') || event.target.isContentEditable) return;
    const step = {ArrowLeft: -1, ArrowRight: 1, j: 1, k: -1}[event.key];
    if (!step) return;
    event.preventDefault();show(index + step, event.target.classList.contains('sb-tab'));
  });
  window.addEventListener('hashchange', fromHash);
  window.addEventListener('load', () => window.scrollTo(0, 0));

  async function start() {
    stage.setAttribute('aria-busy', 'true');message('Loading solutions…');
    try {
      lessons = await getJSON(document.body.dataset.index);
      if (!lessons.length) {
        message('No solutions are available yet.', null, '/worked/');stage.setAttribute('aria-busy', 'false');return;
      }
      tabs = lessons.map((lesson, i) => {
        const tab = document.createElement('a');tab.className = 'sb-tab';tab.href = '#' + lesson.slug;tab.dataset.slug = lesson.slug;
        const number = document.createElement('span');number.className = 'sb-num';number.textContent = i + 1;
        const title = document.createElement('span');title.className = 'sb-tab-title';title.textContent = lesson.title;
        const dot = document.createElement('span');dot.className = 'sb-dot sb-' + lesson.difficulty.toLowerCase();dot.title = lesson.difficulty;
        tab.append(number, title, dot);tab.onclick = event => {event.preventDefault();show(i);};return tab;
      });
      strip.replaceChildren(...tabs);previous.disabled = next.disabled = false;fromHash();
    } catch {
      message('Could not load the solution list.', start, '/worked/');stage.setAttribute('aria-busy', 'false');
    }
  }
  start();
})();
