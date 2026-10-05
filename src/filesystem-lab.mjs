// SPDX-License-Identifier: MIT
import {MemoryFileSystem} from './filesystem-model.mjs';
if (document.getElementById('filesystem-lab')) {
  const $ = id => document.getElementById(id);
  const operations = [['mkdir','/notes'],['append','/notes/cache','hello'],['append','/notes/cache',' world'],['mkdir','/notes/algorithms'],['ls','/notes'],['read','/notes/cache']];
  let fs, step;
  const label = operation => `${operation[0]} ${operation[1]}`;
  function render() {
    $('fs-tree').replaceChildren();
    function visit(node, name, container) {
      const item = document.createElement('li');
      const text = document.createElement('span');
      text.className = node.kind === 'directory' ? 'directory-name' : 'file-name';
      text.textContent = name + (node.kind === 'directory' && name !== '/' ? '/' : '') + (node.kind === 'file' ? ` · ${node.bytes} B` : '');
      item.append(text);container.append(item);
      if (node.kind === 'directory' && node.children.size) {
        const children = document.createElement('ul');item.append(children);
        for (const [childName,child] of [...node.children].sort(([a],[b])=>a<b?-1:a>b?1:0)) visit(child,childName,children);
      }
    }
    const tree = document.createElement('ul');$('fs-tree').append(tree);visit(fs.root,'/',tree);
    $('fs-step-count').textContent = `${step} / ${operations.length} steps`;
    $('fs-step').textContent = step < operations.length ? `Run next: ${label(operations[step])}` : 'Example complete';
    $('fs-step').disabled = step === operations.length;
  }
  function run([method,path,content]) {
    try {
      const result = fs[method](path,content);
      $('fs-result').textContent = result === undefined ? `${label([method,path])} succeeded.` : `${label([method,path])}: ${JSON.stringify(result)}`;
      $('fs-result').classList.remove('operation-error');
      $('fs-search-result').textContent = 'Run a search to inspect the current files.';
    } catch (error) {
      $('fs-result').textContent = error.message;$('fs-result').classList.add('operation-error');
    }
    render();
  }
  function reset() {
    fs = new MemoryFileSystem();step=0;$('fs-result').textContent='The root directory is empty.';
    $('fs-result').classList.remove('operation-error');$('fs-search-result').textContent='Run a search after creating some files.';render();
  }
  $('fs-step').addEventListener('click',()=>{if(step<operations.length)run(operations[step++]);});
  $('fs-reset').addEventListener('click',reset);
  $('fs-form').addEventListener('submit',event=>{event.preventDefault();run([$('fs-operation').value,$('fs-path').value,$('fs-content').value]);});
  $('fs-search').addEventListener('submit',event=>{
    event.preventDefault();
    const name=$('fs-name').value;const minimum=Number($('fs-minimum').value);
    const results=[...fs.find(entry=>entry.name.includes(name)&&entry.bytes>=minimum)].map(entry=>entry.path).sort();
    $('fs-search-result').textContent=results.length?results.join(', '):'No files match both conditions.';
  });
  reset();
}
