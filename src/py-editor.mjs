// SPDX-License-Identifier: MIT
// A small Python editor: a transparent textarea over highlighted code, so typing,
// selection, undo, and accessibility stay native. Token classes match Pygments,
// so the site's Python palette applies to both the editor and the lessons.

const KEYWORDS = new Set('and as assert async await break class continue def del elif else except finally for from global if import in is lambda nonlocal not or pass raise return try while with yield match case'.split(' '));
const CONSTANTS = new Set(['True', 'False', 'None']);
const BUILTINS = new Set('abs all any bin bool bytes callable chr dict dir divmod enumerate filter float format frozenset getattr hasattr hash hex id input int isinstance issubclass iter len list map max min next object oct open ord pow print range repr reversed round set setattr slice sorted str sum super tuple type zip ValueError KeyError IndexError TypeError Exception StopIteration'.split(' '));
const TOKEN = /(#[^\n]*)|((?:[rRbBuUfF]{1,2})?(?:"""[\s\S]*?(?:"""|$)|'''[\s\S]*?(?:'''|$)|"(?:\\.|[^"\\\n])*"?|'(?:\\.|[^'\\\n])*'?))|(\b(?:0[xob][\da-f_]+|\d[\d_]*\.?\d*(?:e[+-]?\d+)?j?)\b|\.\d+\b)|(@[A-Za-z_][\w.]*)|([A-Za-z_]\w*)/gi;
const escape = text => text.replace(/[&<>]/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;'})[c]);

export function highlightPython(code) {
  let out = '', last = 0, previous = '';
  for (const match of code.matchAll(TOKEN)) {
    out += escape(code.slice(last, match.index));
    const [text, comment, string, number, decorator, name] = match;
    let cls = '';
    if (comment) cls = 'c1';
    else if (string) cls = /^[rRbBuUfF]*("""|''')/.test(string) ? 'sd' : 's';
    else if (number) cls = 'mi';
    else if (decorator) cls = 'nd';
    else if (name) {
      if (KEYWORDS.has(name)) cls = 'k';
      else if (CONSTANTS.has(name)) cls = 'kc';
      else if (previous === 'def') cls = 'nf';
      else if (previous === 'class') cls = 'nc';
      else if (name === 'self' || name === 'cls') cls = 'bp';
      else if (BUILTINS.has(name)) cls = 'nb';
      previous = name;
    }
    out += cls ? `<span class="${cls}">${escape(text)}</span>` : escape(text);
    last = match.index + text.length;
  }
  return out + escape(code.slice(last));
}

export class PyEditor {
  constructor(root, {onChange, onRun, onSubmit} = {}) {
    root.classList.add('ed', 'language-python');
    root.innerHTML = '<pre class="ed-gutter" aria-hidden="true"></pre><div class="ed-scroll"><div class="ed-layers"><pre class="ed-highlight" aria-hidden="true"></pre><textarea class="ed-input" spellcheck="false" autocapitalize="off" autocomplete="off" aria-label="Python code editor. Press Escape, then Tab, to leave the editor."></textarea></div></div>';
    this.root = root;
    this.input = root.querySelector('textarea');
    this.highlight = root.querySelector('.ed-highlight');
    this.gutter = root.querySelector('.ed-gutter');
    this.scroller = root.querySelector('.ed-scroll');
    this.onChange = onChange;
    this.input.addEventListener('input', () => { this.paint(); this.onChange?.(this.value); });
    this.input.addEventListener('keydown', event => this.key(event, onRun, onSubmit));
    this.scroller.addEventListener('scroll', () => { this.gutter.scrollTop = this.scroller.scrollTop; });
  }

  get value() { return this.input.value; }
  set value(code) { this.input.value = code; this.paint(); this.scroller.scrollTop = 0; }
  set readOnly(flag) { this.input.readOnly = flag; this.root.classList.toggle('ed-readonly', flag); }
  focus() { this.input.focus(); }

  paint() {
    const code = this.input.value;
    this.highlight.innerHTML = highlightPython(code) + '\n';
    const lines = code.split('\n').length;
    if (this.lines !== lines) this.gutter.textContent = Array.from({length: this.lines = lines}, (_, i) => i + 1).join('\n');
  }

  markLine(line) {
    this.root.querySelector('.ed-mark')?.remove();
    if (!line) return;
    const mark = document.createElement('div');
    mark.className = 'ed-mark';
    mark.style.top = `calc(${line - 1} * var(--ed-line) + var(--ed-pad))`;
    this.root.querySelector('.ed-layers').append(mark);
  }

  // Replace the selection with text through the browser's editing path, so undo works.
  insert(text, selectStart, selectEnd) {
    this.input.focus();
    if (!document.execCommand('insertText', false, text)) this.input.setRangeText(text, this.input.selectionStart, this.input.selectionEnd, 'end');
    if (selectStart !== undefined) this.input.setSelectionRange(selectStart, selectEnd);
    this.paint(); this.onChange?.(this.value);
  }

  // Apply a change to every line touched by the selection.
  eachLine(transform) {
    const {value, selectionStart: start, selectionEnd: end} = this.input;
    const from = value.lastIndexOf('\n', start - 1) + 1;
    const stop = end > start && value[end - 1] === '\n' ? end - 1 : end;  // A selection ending at a line start excludes that line.
    const next = value.indexOf('\n', stop), to = next === -1 ? value.length : next;
    const lines = value.slice(from, to).split('\n');
    const changed = transform(lines).join('\n');
    this.input.setSelectionRange(from, to);
    this.insert(changed, from, from + changed.length);
  }

  key(event, onRun, onSubmit) {
    const input = this.input, mod = event.metaKey || event.ctrlKey;
    if (mod && event.key === 'Enter') { event.preventDefault(); (event.shiftKey ? onSubmit : onRun)?.(); return; }
    if (input.readOnly) return;
    const {value, selectionStart: start, selectionEnd: end} = input;
    const lineStart = value.lastIndexOf('\n', start - 1) + 1;
    const line = value.slice(lineStart, start);
    if (event.key === 'Escape') { input.blur(); return; }
    if (event.key === 'Tab') {
      event.preventDefault();
      if (event.shiftKey) this.eachLine(lines => lines.map(l => l.replace(/^ {1,4}/, '')));
      else if (value.slice(start, end).includes('\n')) this.eachLine(lines => lines.map(l => '    ' + l));
      else this.insert(' '.repeat(4 - (line.length % 4)));
    } else if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      const indent = line.match(/^ */)[0] + (/:\s*(#.*)?$/.test(line) ? '    ' : '');
      this.insert('\n' + indent);
    } else if (event.key === 'Backspace' && start === end && line.length && /^ +$/.test(line)) {
      event.preventDefault();
      input.setSelectionRange(start - ((line.length - 1) % 4 + 1), start);
      this.insert('');
    } else if (mod && event.key === '/') {
      event.preventDefault();
      this.eachLine(lines => {
        const commented = lines.filter(l => l.trim()).every(l => /^\s*#/.test(l));
        return lines.map(l => commented ? l.replace(/^(\s*)# ?/, '$1') : l.replace(/^(\s*)/, '$1# '));
      });
    }
  }
}
