/* Tonic — guitar: standard tuning, open-position chord shapes, fretboard maths. */
(function (root) {
  'use strict';
  const T = root.Theory;

  // Strings are indexed 0..5 from the thickest (6th, low E) to the thinnest (1st, high E).
  const TUNING = [40, 45, 50, 55, 59, 64];
  const OPEN = ['E', 'A', 'D', 'G', 'B', 'E'];
  const ORD = ['6th', '5th', '4th', '3rd', '2nd', '1st'];

  // Frets per string, thickest first. x = don't play, 0 = open.
  const RAW = [
    ['C', 'maj', 'x32010'], ['A', 'maj', 'x02220'], ['G', 'maj', '320003'], ['E', 'maj', '022100'], ['D', 'maj', 'xx0232'], ['F', 'maj', 'xx3211'],
    ['A', 'min', 'x02210'], ['E', 'min', '022000'], ['D', 'min', 'xx0231'], ['B', 'min', 'x24432'], ['F#', 'min', '244222'],
    ['E', 'dom7', '020100'], ['A', 'dom7', 'x02020'], ['D', 'dom7', 'xx0212'], ['G', 'dom7', '320001'], ['B', 'dom7', 'x21202'],
    ['A', 'min7', 'x02010'], ['E', 'min7', '020000'], ['D', 'min7', 'xx0211'],
    ['C', 'maj7', 'x32000'], ['A', 'maj7', 'x02120'], ['D', 'maj7', 'xx0222'], ['G', 'maj7', '320002'], ['F', 'maj7', 'xx3210'], ['E', 'maj7', '021100'],
    ['D', 'sus4', 'xx0233'], ['D', 'sus2', 'xx0230'], ['A', 'sus4', 'x02230'], ['A', 'sus2', 'x02200'], ['E', 'sus4', '022200'],
    ['C', 'add9', 'x32030'],
  ];
  const SHAPES = RAW.map(([r, q, f]) => {
    const rootNote = T.note(r, 3);
    return { root: rootNote, rootPc: T.pc(rootNote), q, frets: f.split('').map((c) => (c === 'x' ? -1 : +c)), id: r + ':' + q };
  });
  const shapeFor = (rootPc, q) => SHAPES.find((s) => s.rootPc === T.mod(rootPc, 12) && s.q === q) || null;
  const shapeById = (id) => SHAPES.find((s) => s.id === id);

  const midiAt = (s, f) => TUNING[s] + f;
  const pcAt = (s, f) => (TUNING[s] + f) % 12;
  const shapeMidis = (frets) => frets.map((f, s) => (f < 0 ? null : midiAt(s, f))).filter((m) => m !== null);
  const shapeText = (frets) => frets.map((f) => (f < 0 ? '×' : f)).join(' ');
  // Note name for each string of a shape, spelled the way the chord spells it.
  function shapeNotes(shape) {
    const names = {};
    T.chordNotes(shape.root, shape.q).forEach((n) => { names[T.pc(n)] = T.fmt(n); });
    return shape.frets.map((f, s) => (f < 0 ? null : names[pcAt(s, f)]));
  }
  // A downward strum: thickest string first, a few milliseconds apart.
  function strum(frets, at) {
    let i = 0;
    const out = [];
    frets.forEach((f, s) => {
      if (f < 0) return;
      out.push({ at: (at || 0) + i * 0.045, midis: [midiAt(s, f)], dur: 1.9, voice: 'pluck' });
      i++;
    });
    return out;
  }
  const pluck = (pairs, step) => pairs.map(([s, f], i) => ({ at: i * (step || 0.4), midis: [midiAt(s, f)], dur: 0.9, voice: 'pluck' }));
  // Every place a pitch class (or set of them) can be played between two frets.
  function positions(pcs, from, to) {
    const set = new Set([].concat(pcs));
    const out = [];
    for (let s = 0; s < 6; s++) for (let f = from; f <= to; f++) if (set.has(pcAt(s, f))) out.push({ s, f });
    return out;
  }
  const where = (p) => `${ORD[p.s]} string ${p.f === 0 ? 'open' : 'fret ' + p.f}`;
  // Display name of an open string (OPEN itself stays English — it is the answer key).
  const openName = (s) => T.nm(OPEN[s]);

  root.Guitar = { TUNING, OPEN, openName, ORD, SHAPES, shapeFor, shapeById, midiAt, pcAt, shapeMidis, shapeText, shapeNotes, strum, pluck, positions, where };
})(typeof window !== 'undefined' ? window : globalThis);
