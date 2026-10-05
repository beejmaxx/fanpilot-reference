// SPDX-License-Identifier: MIT
export class MemoryFileSystem {
  constructor() { this.root = {kind: 'directory', children: new Map()}; }
  parts(path) {
    if (typeof path !== 'string' || !/^\/(?:[a-z]+(?:\/[a-z]+)*)?$/.test(path)) {
      throw new Error('Use an absolute path with lowercase names, such as /notes/cache.');
    }
    return path === '/' ? [] : path.slice(1).split('/');
  }
  walk(parts) {
    let node = this.root;
    for (const name of parts) {
      if (node.kind !== 'directory') throw new Error('A file cannot contain another entry.');
      node = node.children.get(name);
      if (!node) throw new Error('The path does not exist.');
    }
    return node;
  }
  mkdir(path) {
    let node = this.root;
    for (const name of this.parts(path)) {
      if (node.kind !== 'directory') throw new Error('A file cannot contain another entry.');
      let child = node.children.get(name);
      if (!child) { child = {kind: 'directory', children: new Map()}; node.children.set(name, child); }
      if (child.kind !== 'directory') throw new Error('That name already belongs to a file.');
      node = child;
    }
  }
  append(path, content) {
    if (typeof content !== 'string') throw new Error('Content must be a string.');
    const parts = this.parts(path);
    if (!parts.length) throw new Error('The root is a directory.');
    const name = parts.pop();
    const parent = this.walk(parts);
    if (parent.kind !== 'directory') throw new Error('The parent must be a directory.');
    let file = parent.children.get(name);
    if (!file) { file = {kind: 'file', chunks: [], bytes: 0}; parent.children.set(name, file); }
    if (file.kind !== 'file') throw new Error('That name already belongs to a directory.');
    if (!content.length) return;
    const previous = file.chunks.at(-1);
    const last = previous?.charCodeAt(previous.length - 1);
    const first = content.charCodeAt(0);
    // A surrogate pair split across appends uses four UTF-8 bytes, not 3 + 3.
    const joinedPair = last >= 0xd800 && last <= 0xdbff && first >= 0xdc00 && first <= 0xdfff;
    file.bytes += new TextEncoder().encode(content).length - (joinedPair ? 2 : 0);
    file.chunks.push(content);
  }
  ls(path) {
    const parts = this.parts(path);
    const node = this.walk(parts);
    return node.kind === 'file' ? [parts.at(-1)] : [...node.children.keys()].sort();
  }
  read(path) {
    const node = this.walk(this.parts(path));
    if (node.kind !== 'file') throw new Error('Reading content requires a file path.');
    return node.chunks.join('');
  }
  *find(predicate) {
    const pending = [{node: this.root, path: ''}];
    while (pending.length) {
      const {node, path} = pending.pop();
      if (node.kind === 'directory') {
        for (const [name, child] of node.children) pending.push({node: child, path: path + '/' + name});
      } else {
        const entry = {path, name: path.slice(path.lastIndexOf('/') + 1), bytes: node.bytes};
        if (predicate(entry)) yield entry;
      }
    }
  }
}
