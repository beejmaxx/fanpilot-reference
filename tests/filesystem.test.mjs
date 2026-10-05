// SPDX-License-Identifier: MIT
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {MemoryFileSystem} from '../src/filesystem-model.mjs';

test('root, sorted children, same names in separate parents, and append semantics', () => {
  const fs = new MemoryFileSystem();
  assert.deepEqual(fs.ls('/'), []);
  fs.mkdir('/z/notes');fs.mkdir('/a');fs.mkdir('/z/notes');
  fs.append('/z/notes/cache','hello');fs.append('/z/notes/cache',' world');
  fs.append('/a/cache','different');
  assert.deepEqual(fs.ls('/'), ['a','z']);
  assert.deepEqual(fs.ls('/z/notes/cache'), ['cache']);
  assert.equal(fs.read('/z/notes/cache'), 'hello world');
  assert.equal(fs.read('/a/cache'), 'different');
});

test('reads do not create nodes, files stay leaves, parent directories are required', () => {
  const fs = new MemoryFileSystem();
  assert.throws(() => fs.read('/missing'));
  assert.throws(() => fs.append('/missing/file', 'x'));
  assert.deepEqual(fs.ls('/'), []);
  fs.append('/file','');
  assert.throws(() => fs.mkdir('/file/child'));
  assert.throws(() => fs.append('/', 'bad'));
  assert.throws(() => fs.read('/'));
  for (const path of ['relative','/a/','/a//b','/a/../b','/A']) assert.throws(() => fs.mkdir(path));
  assert.deepEqual(fs.ls('/'), ['file']);
});

test('search traverses nonmatching directories, composes predicates, and counts UTF-8 bytes', () => {
  const fs = new MemoryFileSystem();
  fs.mkdir('/large/deep');fs.append('/large/deep/cache','é');fs.append('/small','x');
  const matches = [...fs.find(entry => entry.name.includes('cache') && entry.bytes >= 2)];
  assert.deepEqual(matches,[{path:'/large/deep/cache',name:'cache',bytes:2}]);
  assert.equal([...fs.find(() => false)].length,0);
  assert.equal([...fs.find(() => true)].length,2);
});

test('byte metadata agrees with returned text across empty and split-Unicode appends', () => {
  const fs = new MemoryFileSystem();
  for (const chunk of ['', '\ud83d', '', '\ude00', '\ud83d', 'x', '\ude00', 'é', '😀']) {
    fs.append('/text', chunk);
    const [entry] = [...fs.find(() => true)];
    assert.equal(entry.bytes, new TextEncoder().encode(fs.read('/text')).length);
  }
});

test('2,000 deterministic updates agree with a flat full-path reference', () => {
  const fs = new MemoryFileSystem();
  const directories = ['/a','/b','/a/deep','/b/deep'];
  directories.forEach(path => fs.mkdir(path));
  const files = new Map();
  let seed = 12345;
  const random = n => { seed = (Math.imul(seed,1664525)+1013904223)>>>0; return seed%n; };
  for (let i=0;i<2000;i++) {
    const directory = directories[random(directories.length)];
    const path = directory+'/'+['x','y','z'][random(3)];
    const value = ['a','bc','é',''][random(4)];
    fs.append(path,value);files.set(path,(files.get(path)||'')+value);
    assert.equal(fs.read(path),files.get(path));
    const expected = new Set([...directories,...files.keys()].filter(p => p.slice(0,p.lastIndexOf('/'))===directory).map(p => p.slice(p.lastIndexOf('/')+1)));
    assert.deepEqual(fs.ls(directory),[...expected].sort());
    assert.deepEqual([...fs.find(() => true)].map(x=>x.path).sort(),[...files.keys()].sort());
  }
});
