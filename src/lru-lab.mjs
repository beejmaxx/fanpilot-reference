// SPDX-License-Identifier: MIT
import {LruCache} from './lru-model.mjs';
const root = document.getElementById('lru-lab');
if (root) {
  const $ = id => document.getElementById(id);
  const example = [['put','A','10'],['put','B','20'],['get','A'],['put','C','30'],['get','B'],['put','A','99'],['get','C']];
  let cache, step;
  const describe = operation => `${operation[0]}(${operation.slice(1).join(', ')})`;
  function render() {
    const nodes = $('lru-nodes');
    nodes.replaceChildren();
    for (const item of cache.snapshot()) {
      const node = document.createElement('div');node.className = 'cache-node';
      const key = document.createElement('strong');key.textContent = item.key;
      const value = document.createElement('span');value.textContent = item.value;
      node.append(key,value);nodes.append(node);
    }
    if (!cache.size) {const empty = document.createElement('p');empty.textContent = 'The cache is empty.';nodes.append(empty);}
    cache.assertInvariants();
    $('lru-size').textContent = `${cache.size} / ${cache.capacity} entries`;
    $('lru-step-count').textContent = `${step} / ${example.length} steps`;
    $('lru-step').textContent = step < example.length ? `Run next: ${describe(example[step])}` : 'Example complete';
    $('lru-step').disabled = step === example.length;
  }
  function reset() {
    cache = new LruCache(Number($('lru-capacity').value));step = 0;
    $('lru-history').replaceChildren();
    $('lru-explanation').textContent = 'Start with an empty cache. Which operation first forces an eviction?';
    render();
  }
  function run(operation) {
    const [method,key,value] = operation;
    const result = method === 'get' ? cache.get(key) : cache.put(key,value);
    let explanation;
    if (method === 'get') explanation = result.hit ? `Hit: ${key} returns ${result.value} and becomes most recent.` : `Miss: ${key} is absent. Recency is unchanged.`;
    else if (result.updated) explanation = `Updated ${key} to ${value}. It becomes most recent; size is unchanged and no entry is evicted.`;
    else explanation = result.evicted ? `Inserted ${key}. Evicted ${result.evicted.key}, the least recently used entry.` : `Inserted ${key}. There was room; no eviction was needed.`;
    $('lru-explanation').textContent = explanation;
    const item = document.createElement('li');item.textContent = describe(operation) + ' — ' + explanation;
    $('lru-history').append(item);render();
  }
  $('lru-step').addEventListener('click', () => { if (step < example.length) run(example[step++]); });
  $('lru-reset').addEventListener('click',reset);$('lru-capacity').addEventListener('change',reset);
  $('lru-form').addEventListener('submit', event => {
    event.preventDefault();
    const key = $('lru-key').value.trim();
    if (!key) { $('lru-key').focus(); return; }
    run([$('lru-operation').value,key,$('lru-value').value]);
  });
  reset();
}
