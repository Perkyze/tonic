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

  // A note label as SVG text. "F♯ fa♯" (the English + French naming) is stacked on two lines,
  // the French name smaller; long single names (sol♯) get a smaller font so they fit a key or dot.
  // lineH: gap between the two lines; the block is centred on y unless top is true (then y is the first line).
  function label(parent, x, y, text, cls, lineH, top) {
    const t = el('text', { x, y, class: cls, 'text-anchor': 'middle' }, parent);
    const parts = String(text).split(' ');
    if (parts.length === 2 && !/\d/.test(text)) {
      const y0 = top ? y : y - lineH / 2;
      t.setAttribute('y', y0);
      t.setAttribute('class', cls + ' two');
      el('tspan', { x, y: y0 }, t).textContent = parts[0];
      el('tspan', { x, y: y0 + lineH, class: 'sub' }, t).textContent = parts[1];
    } else {
      if ([...String(text)].length >= 4) t.setAttribute('class', cls + ' long');
      t.textContent = text;
    }
    return t;
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
          const two = String(lab).indexOf(' ') > 0;
          label(gL, cx, (black ? BH - 9 : WH - 10) - (two ? (black ? 8 : 10) : 0), lab, 'klabel' + (black ? ' on-black' : '') + (st ? ' l-' + st : ''), black ? 8 : 10, true);
        } else if (st && st !== 'sel') {
          const cx = xOf[m] + (black ? BW : WW) / 2;
          el('circle', { cx, cy: black ? BH - 13 : WH - 15, r: black ? 3.5 : 4.5, class: 'kdot d-' + st }, gL);
        } else if (!black && (opts.labelAll || (opts.hintC && m % 12 === 0))) {
          // quiet landmarks so you can find your way around
          const nm = T.pcName(m % 12);
          label(gL, xOf[m] + WW / 2, WH - 8 - (nm.indexOf(' ') > 0 ? 9 : 0), nm, 'khint' + (st ? ' on-sel' : ''), 9, true);
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

  // ---------- guitar chord box (neck upright, thickest string on the left) ----------
  function chordBox(frets, opts) {
    opts = opts || {};
    const L = 24, SPX = 17, TOPY = 32, FH = 23, NF = 4;
    const twoLine = opts.notes && opts.notes.some((x) => x && String(x).indexOf(' ') > 0);
    const W = L * 2 + 5 * SPX, Hh = TOPY + NF * FH + (opts.notes ? (twoLine ? 38 : 28) : 12);
    const svg = el('svg', { viewBox: `0 0 ${W} ${Hh}`, class: 'chordbox', role: 'img', 'aria-label': 'Guitar chord diagram: ' + frets.map((f) => (f < 0 ? 'x' : f)).join(' ') });
    el('rect', { x: L - 1.5, y: TOPY - 5, width: 5 * SPX + 3, height: 5.5, rx: 1.5, class: 'cb-nut' }, svg);
    for (let k = 1; k <= NF; k++) el('line', { x1: L, x2: L + 5 * SPX, y1: TOPY + k * FH, y2: TOPY + k * FH, class: 'cb-fret' }, svg);
    for (let i = 0; i < 6; i++) el('line', { x1: L + i * SPX, x2: L + i * SPX, y1: TOPY, y2: TOPY + NF * FH, class: 'cb-string', 'stroke-width': 2 - i * 0.2 }, svg);
    frets.forEach((f, i) => {
      const x = L + i * SPX;
      if (f < 0) { const t = el('text', { x, y: TOPY - 10, class: 'cb-mute', 'text-anchor': 'middle' }, svg); t.textContent = '×'; }
      else if (f === 0) el('circle', { cx: x, cy: TOPY - 15, r: 4.2, class: 'cb-open' }, svg);
      else el('circle', { cx: x, cy: TOPY + (f - 0.5) * FH, r: 6.8, class: 'cb-dot' }, svg);
      if (opts.notes && opts.notes[i]) {
        label(svg, x, TOPY + NF * FH + 18, opts.notes[i], 'cb-note', 10, true);
      }
    });
    return { el: svg };
  }

  // ---------- fretboard (neck lying down, thickest string at the bottom) ----------
  // opts: from/to (frets shown), dots: [{s, f, label, cls}], string (highlight one), onFret(s, f)
  function fretboard(opts) {
    const from = opts.from || 1, to = opts.to || 5;
    const n = to - from + 1;
    const fw = n > 7 ? 30 : 46;
    const hasOpen = from === 1;
    const X0 = hasOpen ? 42 : 16, SPY = 19, TOPY = 18;
    const W = X0 + n * fw + 12, Hh = TOPY + 5 * SPY + 32;
    const svg = el('svg', { viewBox: `0 0 ${W} ${Hh}`, class: 'fretboard' + (opts.onFret ? ' fb-live' : '') + (n > 7 ? ' fb-long' : ''), role: opts.onFret ? 'group' : 'img', 'aria-label': 'Guitar fretboard' });
    el('rect', { x: X0, y: TOPY - 9, width: n * fw, height: 5 * SPY + 18, rx: 3, class: 'fb-board' }, svg);
    const xOf = (f) => (f === 0 ? X0 - 20 : X0 + (f - from + 0.5) * fw);
    const yOf = (s) => TOPY + (5 - s) * SPY;
    for (let f = from; f <= to; f++) {
      if ([3, 5, 7, 9].includes(f)) el('circle', { cx: xOf(f), cy: TOPY + 2.5 * SPY, r: 5, class: 'fb-inlay' }, svg);
      if (f === 12) { el('circle', { cx: xOf(f), cy: TOPY + 1.5 * SPY, r: 5, class: 'fb-inlay' }, svg); el('circle', { cx: xOf(f), cy: TOPY + 3.5 * SPY, r: 5, class: 'fb-inlay' }, svg); }
      if (n <= 7 || [3, 5, 7, 9, 12].includes(f)) {
        const t = el('text', { x: xOf(f), y: Hh - 6, class: 'fb-num', 'text-anchor': 'middle' }, svg);
        t.textContent = f;
      }
    }
    for (let k = 0; k <= n; k++) {
      const x = X0 + k * fw;
      el('line', { x1: x, x2: x, y1: TOPY - 9, y2: TOPY + 5 * SPY + 9, class: k === 0 && hasOpen ? 'fb-nut' : 'fb-fret' }, svg);
    }
    for (let s = 0; s < 6; s++) {
      el('line', { x1: hasOpen ? X0 - 34 : X0, x2: X0 + n * fw, y1: yOf(s), y2: yOf(s), class: 'fb-string' + (opts.string === s ? ' hl' : ''), 'stroke-width': 2.7 - s * 0.34 }, svg);
    }
    const gD = el('g', {}, svg);
    const api = { el: svg };
    api.set = function (dots) {
      gD.textContent = '';
      (dots || []).forEach((d) => {
        if (d.f !== 0 && (d.f < from || d.f > to)) return;
        if (d.f === 0 && !hasOpen) return;
        const r = fw < 40 ? 7.2 : 8.2;
        const cls = 'fdot' + (d.cls ? ' d-' + d.cls : '') + (d.f === 0 ? ' open' : '');
        const text = d.label ? String(d.label) : '';
        const two = text.indexOf(' ') > 0;
        const longest = Math.max(0, ...text.split(' ').map((p) => [...p].length));
        // a name that does not fit in the round dot gets a rounded tag instead (sol♯, or F♯ over fa♯)
        if (two || longest >= 4) {
          const w = Math.min(fw - 3, Math.max(2 * r, longest * (two ? 4.4 : 4.6) + 5)), hh = two ? SPY - 1 : 2 * r;
          el('rect', { x: xOf(d.f) - w / 2, y: yOf(d.s) - hh / 2, width: w, height: hh, rx: Math.min(r, hh / 2), class: cls }, gD);
        } else el('circle', { cx: xOf(d.f), cy: yOf(d.s), r, class: cls }, gD);
        if (text) label(gD, xOf(d.f), two ? yOf(d.s) + 2.5 : yOf(d.s) + 3, text, 'flabel' + (d.cls ? ' l-' + d.cls : ''), 7.2, false);
      });
    };
    api.set(opts.dots);
    if (opts.onFret) {
      const gH = el('g', {}, svg);
      for (let s = 0; s < 6; s++) {
        for (let f = hasOpen ? 0 : from; f <= to; f++) {
          if (f !== 0 && f < from) continue;
          const x = f === 0 ? X0 - 36 : X0 + (f - from) * fw;
          el('rect', { x, y: yOf(s) - SPY / 2, width: f === 0 ? 36 : fw, height: SPY, class: 'fb-hit', 'data-s': s, 'data-f': f }, gH);
        }
      }
      svg.addEventListener('pointerdown', (e) => {
        const t = e.target;
        if (t && t.getAttribute && t.getAttribute('data-s') !== null) { e.preventDefault(); opts.onFret(+t.getAttribute('data-s'), +t.getAttribute('data-f')); }
      });
    }
    return api;
  }

  function visual(v, extra) {
    if (!v) return null;
    if (v.kind === 'piano') return piano(Object.assign({}, v, extra || {})).el;
    if (v.kind === 'staff') return staff(v).el;
    if (v.kind === 'chordbox') return chordBox(v.frets, v).el;
    if (v.kind === 'fretboard') return fretboard(v).el;
    if (v.kind === 'row') {
      const d = document.createElement('div');
      d.className = 'vrow';
      v.items.forEach((it) => {
        const fig = document.createElement('figure');
        fig.className = 'f-' + it.v.kind;
        fig.appendChild(visual(it.v));
        if (it.cap) { const c = document.createElement('figcaption'); c.textContent = it.cap; fig.appendChild(c); }
        d.appendChild(fig);
      });
      return d;
    }
    if (v.kind === 'text') {
      const d = document.createElement('div');
      d.className = 'bigtext';
      d.textContent = v.big;
      return d;
    }
    return null;
  }

  root.Render = { piano, staff, chordBox, fretboard, visual };
})(window);
