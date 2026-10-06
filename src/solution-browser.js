// Show one problem at a time; without JavaScript every problem is listed in order.
(() => {
  const panels = [...document.querySelectorAll('.sb-panel')];
  const tabs = [...document.querySelectorAll('.sb-tab')];
  const status = document.getElementById('sb-status');
  let index = 0;
  document.body.classList.add('sb-paged');

  function show(next, focusTab) {
    index = (next + panels.length) % panels.length;  // Wrap around at either end.
    panels.forEach((panel, i) => { panel.hidden = i !== index; });
    tabs.forEach((tab, i) => tab.toggleAttribute('aria-current', i === index));
    // Keep the active tab visible without scrolling the page itself.
    const strip = tabs[index].parentElement, tab = tabs[index];
    if (tab.offsetLeft < strip.scrollLeft || tab.offsetLeft + tab.offsetWidth > strip.scrollLeft + strip.clientWidth)
      strip.scrollLeft = tab.offsetLeft - (strip.clientWidth - tab.offsetWidth) / 2;
    if (focusTab) tabs[index].focus({preventScroll: true});
    const panel = panels[index];
    panel.querySelector('.sb-code').scrollTop = 0;
    panel.querySelector('.sb-problem').scrollTop = 0;
    document.title = `${panel.dataset.title} · Browse solutions · Fanpilot`;
    status.textContent = `${panel.dataset.title}, problem ${index + 1} of ${panels.length}`;
    if (location.hash !== '#' + panel.id) history.replaceState(null, '', '#' + panel.id);
  }
  const fromHash = () => {
    show(Math.max(0, panels.findIndex(p => '#' + p.id === location.hash)));
    window.scrollTo(0, 0);  // Undo the browser's jump to the anchor; the tabs stay on top.
  };

  tabs.forEach((tab, i) => tab.addEventListener('click', event => { event.preventDefault(); show(i); }));
  document.getElementById('sb-prev').onclick = () => show(index - 1);
  document.getElementById('sb-next').onclick = () => show(index + 1);
  document.addEventListener('keydown', event => {
    if (event.altKey || event.ctrlKey || event.metaKey || event.target.closest('input,select,textarea')) return;
    const step = {ArrowLeft: -1, ArrowRight: 1, j: 1, k: -1}[event.key];
    if (!step) return;
    event.preventDefault();
    show(index + step, event.target.classList.contains('sb-tab'));
  });
  window.addEventListener('hashchange', fromHash);
  window.addEventListener('load', () => window.scrollTo(0, 0));  // Chrome repeats the anchor jump after load.

  const root = document.documentElement;
  function setSize(size) {
    size = Math.min(22, Math.max(12, size));
    root.style.setProperty('--sb-font', size + 'px');
    try { localStorage.setItem('sb-font', size); } catch {}
  }
  try { const saved = Number(localStorage.getItem('sb-font')); if (saved) setSize(saved); } catch {}
  for (const button of document.querySelectorAll('[data-size]')) {
    button.onclick = () => setSize(parseFloat(getComputedStyle(root).getPropertyValue('--sb-font') || 15) + Number(button.dataset.size));
  }
  for (const button of document.querySelectorAll('.sb-copy')) {
    button.onclick = async () => {
      const code = button.closest('.sb-editor').querySelector('.sb-source').textContent;
      try { await navigator.clipboard.writeText(code); button.textContent = 'Copied'; }
      catch { button.textContent = 'Copy failed'; }
      setTimeout(() => { button.textContent = 'Copy'; }, 1500);
    };
  }
  fromHash();
})();
