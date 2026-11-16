/* Tonic — SVG piano keyboard and staff. Clefs are drawn as paths so nothing
   depends on a music font being installed. */
(function (root) {
  'use strict';
  const T = root.Theory;
  const NS = 'http://www.w3.org/2000/svg';
  function el(tag, attrs, parent) {
    const e = document.createElementNS(NS, tag);
    for (const k in attrs) if (attrs[k] !== null && attrs[k] !== undefined) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  }

  // ---------- piano ----------
  // opts: lo (a C), hi (a B), state: {midi: 'mark'|'given'|'sel'|'good'|'bad'|'miss'},
  //       labels: {midi: text}, onKey(midi)
  const WW = 26, WH = 112, BW = 16, BH = 70;
  function piano(opts) {
    const lo = opts.lo, hi = opts.hi;
    const whites = [];
    for (let m = lo; m <= hi; m++) if (!T.IS_BLACK[m % 12]) whites.push(m);
    const W = whites.length * WW;
    const svg = el('svg', { viewBox: `0 0 ${W + 2} ${WH + 4}`, class: 'piano' + (opts.onKey ? ' piano-live' : ''), role: opts.onKey ? 'group' : 'img', 'aria-label': 'Piano keyboard' });
    const keys = {};
    const xOf = {};
    whites.forEach((m, i) => { xOf[m] = 1 + i * WW; });
    const gW = el('g', {}, svg), gB = el('g', {}, svg), gL = el('g', { class: 'piano-labels' }, svg);
    whites.forEach((m) => {
      keys[m] = el('rect', { x: xOf[m], y: 1, width: WW, height: WH, rx: 4, class: 'key white', 'data-midi': m }, gW);
    });
    for (let m = lo; m <= hi; m++) {
      if (!T.IS_BLACK[m % 12]) continue;
      const x = xOf[m - 1] + WW - BW / 2;
      xOf[m] = x;
      keys[m] = el('rect', { x, y: 1, width: BW, height: BH, rx: 3, class: 'key black', 'data-midi': m }, gB);
    }
    const api = { el: svg, keys };
    api.set = function (state, labels) {
      gL.textContent = '';
      for (const m in keys) {
        const black = T.IS_BLACK[m % 12];
        const st = state && state[m];
        keys[m].setAttribute('class', 'key ' + (black ? 'black' : 'white') + (st ? ' k-' + st : ''));
        const lab = labels && labels[m];
        if (lab) {
          const cx = xOf[m] + (black ? BW : WW) / 2;
          const t = el('text', { x: cx, y: black ? BH - 9 : WH - 10, class: 'klabel' + (black ? ' on-black' : '') + (st ? ' l-' + st : ''), 'text-anchor': 'middle' }, gL);
          t.textContent = lab;
        } else if (st && st !== 'sel') {
          const cx = xOf[m] + (black ? BW : WW) / 2;
          el('circle', { cx, cy: black ? BH - 13 : WH - 15, r: black ? 3.5 : 4.5, class: 'kdot d-' + st }, gL);
        } else if (opts.hintC && m % 12 === 0 && !st) {
          // a quiet landmark so you can find your way around
          const t = el('text', { x: xOf[m] + WW / 2, y: WH - 8, class: 'khint', 'text-anchor': 'middle' }, gL);
          t.textContent = 'C';
        }
      }
    };
    const state = {};
    (opts.marks || []).forEach((m) => { state[m] = 'mark'; });
    Object.assign(state, opts.state || {});
    api.set(state, opts.labels);
    if (opts.onKey) {
      svg.addEventListener('pointerdown', (e) => {
        const m = e.target && e.target.getAttribute && e.target.getAttribute('data-midi');
        if (m) { e.preventDefault(); opts.onKey(+m); }
      });
    }
    return api;
  }

  // ---------- staff ----------
  // Coordinates: staff space = 10. Lines at y = TOP + 0..40.
  const SP = 10, TOP = 52, H = 148;
  // Clef outlines, in staff-space units around their reference line.
  const TREBLE = 'M-0.05 0.32 C-0.45 0.1 -0.35 -0.58 0.15 -0.58 C0.68 -0.58 0.95 -0.12 0.95 0.28 C0.95 0.78 0.5 1.02 0.02 1.02 C-0.6 1.02 -1.05 0.55 -1.05 -0.1 C-1.05 -1.2 0.62 -1.95 0.62 -3.3 C0.62 -3.95 0.42 -4.35 0.2 -4.35 C-0.08 -4.35 -0.22 -3.75 -0.22 -3.2 C-0.22 -2.4 0.12 -0.4 0.42 1.65 C0.5 2.3 0.12 2.7 -0.3 2.62 C-0.6 2.56 -0.7 2.2 -0.5 2.02';
  const BASS = 'M-0.75 0.02 C-0.75 -0.62 -0.32 -1.02 0.15 -1.02 C0.72 -1.02 1.02 -0.58 1.02 0.0 C1.02 1.0 0.2 1.9 -0.95 2.42';

  function staff(opts) {
    const clef = opts.clef || 'treble';
    const sig = opts.sig || 0;
    const notes = opts.notes || [];
    const nSig = Math.abs(sig);
    const sigX = 62, sigW = nSig * 11;
    const noteX0 = sigX + sigW + (nSig ? 26 : 18);
    const melodic = opts.layout === 'melodic';
    const W = Math.max(200, noteX0 + (notes.length ? (melodic ? notes.length * 56 : 60) : 26) + 14);
    const svg = el('svg', { viewBox: `0 0 ${W} ${H}`, class: 'staff', role: 'img', 'aria-label': 'Music staff' });
    for (let i = 0; i < 5; i++) el('line', { x1: 8, x2: W - 8, y1: TOP + i * SP, y2: TOP + i * SP, class: 'staff-line' }, svg);
    el('line', { x1: 8, x2: 8, y1: TOP, y2: TOP + 4 * SP, class: 'staff-line' }, svg);
    el('line', { x1: W - 8, x2: W - 8, y1: TOP, y2: TOP + 4 * SP, class: 'staff-line' }, svg);

    // clef
    if (clef === 'treble') {
      const g = el('g', { transform: `translate(34 ${TOP + 3 * SP}) scale(${SP})` }, svg);
      el('path', { d: TREBLE, class: 'clef-stroke' }, g);
      el('circle', { cx: -0.42, cy: 2.14, r: 0.24, class: 'clef-fill' }, g);
    } else {
      const g = el('g', { transform: `translate(30 ${TOP + SP}) scale(${SP})` }, svg);
      el('path', { d: BASS, class: 'clef-stroke' }, g);
      el('circle', { cx: -0.62, cy: 0.05, r: 0.3, class: 'clef-fill' }, g);
      el('circle', { cx: 1.5, cy: -0.5, r: 0.16, class: 'clef-fill' }, g);
      el('circle', { cx: 1.5, cy: 0.5, r: 0.16, class: 'clef-fill' }, g);
    }

    // y for a diatonic index (octave*7 + letter)
    const bottom = clef === 'treble' ? 30 : 18;
    const yOf = (d) => TOP + 4 * SP - (d - bottom) * (SP / 2);
    const accText = (a) => (a > 0 ? '♯' : a < 0 ? '♭' : '♮');
    const drawAcc = (x, y, ch) => {
      const t = el('text', { x, y: y + (ch === '♭' ? 4.5 : 6), class: 'acc', 'text-anchor': 'middle' }, svg);
      t.textContent = ch;
    };

    // key signature
    const SHARP_POS = [8, 5, 9, 6, 3, 7, 4]; // staff positions from the bottom line, treble
    const FLAT_POS = [4, 7, 3, 6, 2, 5, 1];
    const shift = clef === 'treble' ? 0 : -2;
    for (let i = 0; i < nSig; i++) {
      const pos = (sig > 0 ? SHARP_POS : FLAT_POS)[i] + shift;
      drawAcc(sigX + i * 11, TOP + 4 * SP - pos * (SP / 2), sig > 0 ? '♯' : '♭');
    }

    // notes
    notes.forEach((n, i) => {
      const d = n.o * 7 + n.l;
      const y = yOf(d);
      const x = noteX0 + (melodic ? i * 56 + 22 : 28);
      const pos = d - bottom;
      for (let p = -2; p >= pos; p -= 2) el('line', { x1: x - 13, x2: x + 13, y1: yOf(bottom + p), y2: yOf(bottom + p), class: 'staff-line' }, svg);
      for (let p = 10; p <= pos; p += 2) el('line', { x1: x - 13, x2: x + 13, y1: yOf(bottom + p), y2: yOf(bottom + p), class: 'staff-line' }, svg);
      const g = el('g', { transform: `translate(${x} ${y}) rotate(-18)` }, svg);
      el('ellipse', { cx: 0, cy: 0, rx: 7.4, ry: 5.1, class: 'notehead' }, g);
      el('ellipse', { cx: 0, cy: 0, rx: 3.9, ry: 2.6, class: 'notehole', transform: 'rotate(50)' }, g);
      if (n.a !== 0) {
        const ax = x - 17 - (!melodic && i % 2 ? 11 : 0);
        if (Math.abs(n.a) === 2) { drawAcc(ax - 4, y, accText(n.a)); drawAcc(ax + 5, y, accText(n.a)); }
        else drawAcc(ax, y, accText(n.a));
      }
    });
    return { el: svg };
  }

  function visual(v, extra) {
    if (!v) return null;
    if (v.kind === 'piano') return piano(Object.assign({}, v, extra || {})).el;
    if (v.kind === 'staff') return staff(v).el;
    if (v.kind === 'text') {
      const d = document.createElement('div');
      d.className = 'bigtext';
      d.textContent = v.big;
      return d;
    }
    return null;
  }

  root.Render = { piano, staff, visual };
})(window);
