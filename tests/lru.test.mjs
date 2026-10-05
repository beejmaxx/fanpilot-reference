// SPDX-License-Identifier: MIT
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {LruCache} from '../src/lru-model.mjs';

class Reference {
  constructor(capacity) { this.capacity = capacity; this.items = []; }
  get(key) {
    const i = this.items.findIndex(item => item.key === key);
    if (i < 0) return {hit: false};
    const [item] = this.items.splice(i, 1);
    this.items.unshift(item);
    return {hit: true, value: item.value};
  }
  put(key, value) {
    const i = this.items.findIndex(item => item.key === key);
    const updated = i >= 0;
    if (updated) this.items.splice(i, 1);
    this.items.unshift({key, value});
    const evicted = this.items.length > this.capacity ? this.items.pop() : null;
    return {updated, evicted};
  }
}

test('all operation sequences of length five, capacities one through three', () => {
  const operations = [['put','A',1],['put','A',9],['put','B',2],['put','C',3],
                      ['get','A'],['get','B'],['get','C'],['get','missing']];
  for (let capacity = 1; capacity <= 3; capacity++) {
    for (let encoded = 0; encoded < operations.length ** 5; encoded++) {
      const cache = new LruCache(capacity);
      const reference = new Reference(capacity);
      let remaining = encoded;
      for (let step = 0; step < 5; step++) {
        const [method, ...args] = operations[remaining % operations.length];
        remaining = Math.floor(remaining / operations.length);
        assert.deepEqual(cache[method](...args), reference[method](...args));
        assert.equal(cache.assertInvariants(), true);
        assert.deepEqual(cache.snapshot(), reference.items);
      }
    }
  }
});

test('invalid capacities are rejected and missing is distinct from an undefined value', () => {
  for (const capacity of [0,-1,1.5,NaN,Infinity]) assert.throws(() => new LruCache(capacity), RangeError);
  const cache = new LruCache(1);
  cache.put('present', undefined);
  assert.deepEqual(cache.get('present'), {hit:true,value:undefined});
  assert.deepEqual(cache.get('missing'), {hit:false});
});
