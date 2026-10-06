// SPDX-License-Identifier: MIT
const root = document.getElementById('problem-library');
if (root) {
  const $ = id => document.getElementById(id);
  const PAGE = 100;
  let data, matches = [], shown = 0;
  const words = text => text.toLowerCase().split(/\s+/).filter(Boolean);

  function row([id, title, slug, , tags, guides]) {
    const tr = document.createElement('tr');
    const number = document.createElement('td');number.textContent = id;
    const name = document.createElement('td');
    const link = document.createElement('a');link.href = `https://leetcode.com/problems/${slug}/`;link.textContent = title;
    link.rel = 'noopener';name.append(link);
    const topics = document.createElement('td');topics.className = 'problem-topics';
    topics.textContent = tags.map(t => data.tags[t]).join(' · ');
    const guide = document.createElement('td');
    for (const [url, label] of guides) {
      const a = document.createElement('a');a.href = url;a.textContent = label;a.className = 'guide-chip';guide.append(a);
    }
    tr.append(number, name, topics, guide);
    return tr;
  }

  function showMore() {
    const rows = $('problem-rows');
    for (const item of matches.slice(shown, shown + PAGE)) rows.append(row(item));
    shown = Math.min(matches.length, shown + PAGE);
    $('problem-more').hidden = shown >= matches.length;
    $('problem-status').textContent = `Showing ${shown.toLocaleString()} of ${matches.length.toLocaleString()} matching problems` +
      (matches.length === data.rows.length ? '' : ` (${data.rows.length.toLocaleString()} total)`);
  }

  function filter() {
    const query = $('problem-query').value.trim();
    const terms = words(query);
    const tag = $('problem-tag').value, category = $('problem-category').value, taught = $('problem-taught').checked;
    matches = data.rows.filter(([id, title, , cat, tags, guides]) =>
      (!terms.length || String(id) === query || terms.every(t => title.toLowerCase().includes(t))) &&
      (tag === '' || tags.includes(Number(tag))) &&
      (category === '' || cat === Number(category)) &&
      (!taught || guides.length));
    $('problem-rows').replaceChildren();shown = 0;
    if (!matches.length) {
      $('problem-status').textContent = 'No problems match these filters.';$('problem-more').hidden = true;return;
    }
    showMore();
  }

  $('problem-status').textContent = 'Loading problems…';
  fetch('/problems-data.json').then(response => {
    if (!response.ok) throw new Error(response.status);
    return response.json();
  }).then(result => {
    data = result;
    $('problem-filters').addEventListener('input', filter);
    $('problem-filters').addEventListener('submit', event => event.preventDefault());
    $('problem-more').addEventListener('click', showMore);
    filter();
  }).catch(() => { $('problem-status').textContent = 'The problem list could not be loaded. Refresh to try again.'; });
}
