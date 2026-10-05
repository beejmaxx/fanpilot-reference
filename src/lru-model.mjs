// SPDX-License-Identifier: MIT
// The live lesson uses this exact map + doubly linked list implementation.
export class LruCache {
  #entries;
  #head;
  #tail;
  constructor(capacity) {
    if (!Number.isInteger(capacity) || capacity < 1) throw new RangeError("Capacity must be a positive integer");
    this.capacity = capacity;
    this.#entries = new Map();
    this.#head = {next: null, prev: null};
    this.#tail = {next: null, prev: this.#head};
    this.#head.next = this.#tail;
  }

  #unlink(node) {
    node.prev.next = node.next;
    node.next.prev = node.prev;
    node.prev = node.next = null;
  }

  #prepend(node) {
    node.prev = this.#head;
    node.next = this.#head.next;
    this.#head.next.prev = node;
    this.#head.next = node;
  }

  get(key) {
    const node = this.#entries.get(key);
    if (!node) return {hit: false};
    this.#unlink(node);
    this.#prepend(node);
    return {hit: true, value: node.value};
  }

  put(key, value) {
    const existing = this.#entries.get(key);
    if (existing) {
      existing.value = value;
      this.#unlink(existing);
      this.#prepend(existing);
      return {updated: true, evicted: null};
    }
    let evicted = null;
    if (this.#entries.size === this.capacity) {
      const victim = this.#tail.prev;
      evicted = {key: victim.key, value: victim.value};
      this.#unlink(victim);
      this.#entries.delete(victim.key);
    }
    const node = {key, value, prev: null, next: null};
    this.#prepend(node);
    this.#entries.set(key, node);
    return {updated: false, evicted};
  }

  get size() { return this.#entries.size; }

  snapshot() {
    const result = [];
    for (let node = this.#head.next; node !== this.#tail; node = node.next) {
      result.push({key: node.key, value: node.value});
    }
    return result;
  }

  assertInvariants() {
    if (this.#head.prev !== null || this.#tail.next !== null) throw new Error("Broken sentinel boundary");
    const seen = new Set();
    let previous = this.#head;
    for (let node = this.#head.next; node !== this.#tail; node = node.next) {
      if (!node || seen.has(node)) throw new Error("Cycle or missing tail");
      if (node.prev !== previous || this.#entries.get(node.key) !== node) throw new Error("Map/list mismatch");
      seen.add(node);
      previous = node;
    }
    if (this.#tail.prev !== previous || previous.next !== this.#tail) throw new Error("Broken tail link");
    if (seen.size !== this.#entries.size || seen.size > this.capacity) throw new Error("Invalid size");
    return true;
  }
}
