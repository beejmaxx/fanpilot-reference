// SPDX-License-Identifier: MIT
const root = document.getElementById('hero-trace');
if (root) {
  const nums = [2, 3, 1, 2, 4, 3], target = 7;
  const $ = id => document.getElementById(id);
  const cells = [...root.querySelectorAll('.trace-cells li')];
  // Record every state of the real algorithm: after each addition and each shrink.
  const states = [{left: 0, right: -1, sum: 0, best: 0, say: 'Empty window. Move the right end to add values.'}];
  let left = 0, sum = 0, best = 0;
  nums.forEach((value, right) => {
    sum += value;
    states.push({left, right, sum, best, say: sum >= target ? `Added ${value}. Sum ${sum} reaches ${target}.` : `Added ${value}. Sum ${sum} is short of ${target}; keep extending.`});
    while (sum >= target) {
      best = best === 0 ? right - left + 1 : Math.min(best, right - left + 1);
      const dropped = nums[left];
      sum -= dropped; left += 1;
      states.push({left, right, sum, best, say: `Recorded length ${right - left + 2}. Dropped ${dropped} from the left; sum is now ${sum}.`});
    }
  });
  const final = {left: 4, right: 5, sum: 7, best: 2, say: 'Done. The shortest run is [4, 3], length 2.'};
  states.push(final);
  let index = states.length, timer = null;
  function show(state) {
    cells.forEach((cell, i) => {
      cell.classList.toggle('in', i >= state.left && i <= state.right);
      cell.classList.toggle('left', i === state.left && state.left <= state.right);
      cell.classList.toggle('right', i === state.right);
    });
    $('trace-say').textContent = state.say;
    $('trace-sum').textContent = state.sum;
    $('trace-best').textContent = state.best || 'none';
  }
  function stop(label) { clearInterval(timer); timer = null; $('trace-play').textContent = label; }
  function step() {
    if (index >= states.length) index = 0;
    show(states[index]); index += 1;
    if (index >= states.length) stop('Replay');
  }
  function play() {
    if (timer) { stop('Play'); return; }
    if (index >= states.length) index = 0;
    $('trace-play').textContent = 'Pause';
    step(); timer = setInterval(step, 1100);
  }
  $('trace-step').addEventListener('click', () => { if (timer) stop('Play'); step(); });
  $('trace-play').addEventListener('click', play);
  if (!matchMedia('(prefers-reduced-motion: reduce)').matches) { index = 0; play(); }
  else show(final);
}
