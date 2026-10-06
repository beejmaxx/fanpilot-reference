/* SPDX-License-Identifier: MIT */
(() => {
  'use strict';
  document.documentElement.classList.add('js-ready');
  const page=JSON.parse(document.getElementById('chapter-data').textContent);
  let searchData, searchRequest=0;
  function loadSearch() {
    if(!searchData) searchData=fetch(page.search_url).then(response=>{
      if(!response.ok)throw new Error('Search unavailable');
      return response.json();
    }).catch(error=>{searchData=null;throw error;});
    return searchData;
  }
  const $=id=>document.getElementById(id);
  const search=$('book-search'), panel=$('search-panel'), results=$('search-results');
  const narrow=window.matchMedia('(max-width: 800px)');
  function toggleMenu(open) {
    document.body.classList.toggle('menu-open',open);
    $('menu-button').setAttribute('aria-expanded',String(open));
    $('scrim').hidden=!open;
    $('sidebar').inert=narrow.matches&&!open;
    $('content-shell').inert=narrow.matches&&open;
  }
  $('menu-button').addEventListener('click',()=>toggleMenu($('menu-button').getAttribute('aria-expanded')!=='true'));
  $('scrim').addEventListener('click',()=>{toggleMenu(false);$('menu-button').focus();});
  narrow.addEventListener('change',()=>toggleMenu(false));toggleMenu(false);
  const outline=$('outline-content');
  const label=document.createElement('h2');label.textContent='On this page';outline.append(label);
  for(const section of page.sections) {
    const link=document.createElement('a');link.href='#'+section.id;link.textContent=section.title;outline.append(link);
  }
  if(!page.sections.length) {
    const note=document.createElement('p');note.className='outline-note';note.textContent='Attempt. Explain. Reconstruct. Test a variation.';outline.append(note);
  }
  function highlighted(element,text,query) {
    const index=text.toLowerCase().indexOf(query.toLowerCase());
    if(index<0){element.textContent=text;return;}
    element.append(document.createTextNode(text.slice(0,index)));
    const mark=document.createElement('mark');mark.textContent=text.slice(index,index+query.length);
    element.append(mark,document.createTextNode(text.slice(index+query.length)));
  }
  async function runSearch() {
    const token=++searchRequest;
    const query=search.value.trim();const terms=query.toLowerCase().split(/\s+/).filter(Boolean);
    panel.hidden=!query;results.replaceChildren();
    if(!query){$('search-status').textContent='';return;}
    $('search-status').textContent='Loading search…';
    let pages;
    try {pages=await loadSearch();}
    catch {
      if(token!==searchRequest)return;
      $('search-status').textContent='Search could not load.';
      const retry=document.createElement('button');retry.type='button';retry.textContent='Retry search';retry.onclick=runSearch;results.append(retry);return;
    }
    if(token!==searchRequest)return;
    const found=pages.filter(p=>terms.every(t=>(p.title+' '+p.text).toLowerCase().includes(t)));
    found.sort((a,b)=>Number(b.title.toLowerCase().includes(query.toLowerCase()))-Number(a.title.toLowerCase().includes(query.toLowerCase())));
    $('search-status').textContent=found.length+(found.length===1?' matching page':' matching pages')+(found.length>50?' (showing first 50)':'');
    if(!found.length){const p=document.createElement('p');p.className='empty-search';p.textContent='No pages found. Try a technique, an observation, or a problem number.';results.append(p);}
    for(const item of found.slice(0,50)){
      const link=document.createElement('a');link.className='search-result';link.href=item.url;
      const title=document.createElement('strong');highlighted(title,item.title,query);
      const index=Math.max(0,item.text.toLowerCase().indexOf(terms[0]));const start=Math.max(0,index-45);
      const snippet=document.createElement('p');highlighted(snippet,(start?'…':'')+item.text.slice(start,start+170)+'…',query);
      link.append(title,snippet);results.append(link);
    }
  }
  search.addEventListener('input',runSearch);
  search.addEventListener('focus',()=>{if(search.value.trim())panel.hidden=false;});
  document.addEventListener('click',event=>{if(!$('search').contains(event.target))panel.hidden=true;});
  const current=document.querySelector('.rail [aria-current="page"]');
  if(current){
    const rail=$('chapter-navigation'), item=current.getBoundingClientRect(), box=rail.getBoundingClientRect();
    if(item.bottom>box.bottom-40)rail.scrollTop+=item.top-box.top-box.height/3;
  }
  document.addEventListener('keydown',event=>{
    const editing=event.target instanceof HTMLElement&&(event.target.matches('input,textarea,select')||event.target.isContentEditable);
    if(event.key==='/'&&!editing&&!event.ctrlKey&&!event.metaKey&&!event.altKey){event.preventDefault();search.focus();}
    if(event.key==='Escape'){
      if(document.activeElement===search&&search.value){search.value='';runSearch();}
      else if(!panel.hidden){panel.hidden=true;}
      else{toggleMenu(false);if(narrow.matches)$('menu-button').focus();}
    }
  });
  for(const code of document.querySelectorAll('pre > code')) {
    const pre=code.parentElement;const toolbar=document.createElement('div');toolbar.className='code-toolbar';
    const language=document.createElement('span');language.textContent=code.className.replace('language-','')||'Example';
    const copy=document.createElement('button');copy.type='button';copy.textContent='Copy';copy.setAttribute('aria-label','Copy code example');
    copy.addEventListener('click',async()=>{
      try {if(!navigator.clipboard?.writeText)throw new Error();await navigator.clipboard.writeText(code.textContent);$('copy-status').textContent='Code copied';}
      catch {const range=document.createRange();range.selectNodeContents(code);const selection=window.getSelection();selection.removeAllRanges();selection.addRange(range);$('copy-status').textContent='Code selected. Use your browser’s Copy command.';}
      setTimeout(()=>{$('copy-status').textContent='';},3000);
    });
    toolbar.append(language,copy);pre.prepend(toolbar);pre.tabIndex=0;
  }
})();
