// SPDX-License-Identifier: MIT
// Runs a learner's Python against a lesson's tests in Pyodide, off the main thread.
// The page terminates this worker on a time limit, so an infinite loop cannot hang the tab.
import {loadPyodide} from '/pyodide/pyodide.mjs';

const DRIVER = String.raw`
import ast, io, json, sys, traceback

def _limit(text, size=400):
    return text if len(text) <= size else text[:size] + ' …'

def _trace(error, own='<your code>'):
    frames = [f for f in traceback.extract_tb(error.__traceback__) if f.filename == own]
    lines = [f'Line {f.lineno}: {f.line}' for f in frames[-3:] if f.line]
    return '\n'.join(lines + [f'{type(error).__name__}: {error}'])

# Freeing a long chain of objects (a 10,000-node linked list, say) recurses once per node
# and overflows the browser's stack. So every instance of a lesson or learner class stays
# alive until the run ends; then links are cleared first, and nothing is freed recursively.
_keep = []

def _track(ns):
    for value in list(ns.values()):
        if isinstance(value, type) and value.__module__ == '__main__' and '_fp_tracked' not in value.__dict__:
            base = value.__new__
            def tracked(cls, *args, _base=base, **kwargs):
                obj = _base(cls) if _base is object.__new__ else _base(cls, *args, **kwargs)
                _keep.append(obj)
                return obj
            value.__new__ = staticmethod(tracked)
            value._fp_tracked = True

def _release():
    for obj in _keep:
        fields = getattr(obj, '__dict__', None)
        if fields is not None:
            fields.clear()
    _keep.clear()

def _run(payload):
    p = json.loads(payload)
    result = {'error': None, 'tests': [], 'submit': None}
    ns = {'__name__': '__main__'}
    real = sys.stdout
    def capture():
        sys.stdout = io.StringIO()
    def captured():
        return _limit(sys.stdout.getvalue(), 2000)
    try:
        capture()
        try:
            exec(compile(p['prelude'], '<lesson>', 'exec'), ns)
        except BaseException as e:
            result['error'] = {'title': 'The lesson setup failed', 'detail': _trace(e, '<lesson>')}
            return json.dumps(result)
        _track(ns)
        for name in p['main']:
            ns.pop(name, None)
        try:
            exec(compile(p['user'], '<your code>', 'exec'), ns)
        except SyntaxError as e:
            result['error'] = {'title': 'Syntax error', 'line': e.lineno, 'detail': f'Line {e.lineno}: {e.msg}\n{(e.text or "").rstrip()}'}
            return json.dumps(result)
        except BaseException as e:
            result['error'] = {'title': 'Your code raised an error', 'detail': _trace(e)}
            return json.dumps(result)
        _track(ns)
        missing = [n for n in p['main'] if n not in ns]
        if missing:
            result['error'] = {'title': 'Missing definition', 'detail': 'Define ' + ' and '.join(missing) + ', as in the starter code.'}
            return json.dumps(result)
        try:
            exec(compile(p['setup'], '<setup>', 'exec'), ns)
        except BaseException as e:
            result['error'] = {'title': 'Could not call your code', 'detail': f'{type(e).__name__}: {e}'}
            return json.dumps(result)
        for test in p['tests']:
            capture()
            row = {'ok': False}
            try:
                if test['kind'] == 'compare':
                    got = eval(test['call'], ns)
                    row['got'] = _limit(repr(got))
                    op = test['op']
                    if op == 'truthy':
                        row['ok'] = bool(got)
                    elif op == 'falsy':
                        row['ok'] = not got
                    else:
                        ns['__got'], ns['__expected'] = got, eval(test['expected'], ns)
                        row['ok'] = bool(eval(f'__got {op} __expected', ns))
                else:
                    exec(compile(test['source'], '<test>', 'exec'), ns)
                    row['ok'] = True
            except AssertionError as e:
                row['detail'] = f'Assertion failed{": " + _limit(str(e)) if str(e) else ""}'
            except BaseException as e:
                row['detail'] = _trace(e) or f'{type(e).__name__}: {e}'
            row['stdout'] = captured()
            result['tests'].append(row)
        if p.get('submit'):
            capture()
            try:
                exec(compile(p['submit'], '<random check>', 'exec'), ns)
                result['submit'] = {'ok': True}
            except AssertionError as e:
                result['submit'] = {'ok': False, 'detail': 'Wrong answer on a random input' + (f': {_limit(str(e))}' if str(e) else '')}
            except BaseException as e:
                result['submit'] = {'ok': False, 'detail': _trace(e) or f'{type(e).__name__}: {e}'}
        return json.dumps(result)
    finally:
        sys.stdout = real
        ns.clear()
        _release()
`;

const ready = (async () => {
  const pyodide = await loadPyodide({indexURL: '/pyodide/'});
  pyodide.runPython(DRIVER);
  return pyodide;
})();
ready.then(() => postMessage({type: 'ready'}), error => postMessage({type: 'failed', detail: String(error)}));

onmessage = async ({data}) => {
  const pyodide = await ready;
  const started = performance.now();
  try {
    const output = pyodide.globals.get('_run')(JSON.stringify(data.payload));
    postMessage({type: 'result', id: data.id, result: JSON.parse(output), ms: Math.round(performance.now() - started)});
  } catch (error) {
    // Pyodide cannot continue after a fatal error; the page starts a fresh worker.
    postMessage({type: 'result', id: data.id, fatal: true, detail: String(error).split('\n')[0]});
  }
};
