/* Tonic — the Deep Cut round.
   An open question with many right answers. Every valid answer is ranked from
   "everyone says that" to "deep cut", and the more obscure your answer, the
   more it scores. Obscurity comes from a built-in ranking of how common a
   chord/scale type and its root are in everyday music — not live player data. */
(function (root) {
  'use strict';
  const T = root.Theory;
  const Q = root.Questions;
  const { mod, fmt, pc } = T;

  // 0 = the first thing anyone would say, 1 = properly obscure
  const CHORD_W = { maj: 0, min: 0.05, dom7: 0.25, min7: 0.3, maj7: 0.35, sus4: 0.45, sus2: 0.5, six: 0.55, add9: 0.55,
    dim: 0.6, dom9: 0.65, aug: 0.7, min6: 0.7, m7b5: 0.75, maj9: 0.75, min9: 0.78, dim7: 0.85, mMaj7: 1 };
  const SCALE_W = { major: 0, minor: 0.08, majpent: 0.3, minpent: 0.32, mixolydian: 0.45, dorian: 0.47, blues: 0.5,
    harmonic: 0.55, lydian: 0.6, phrygian: 0.7, melodic: 0.75, locrian: 0.9, wholetone: 1 };
  const ROOT_W = [0, 0.8, 0.15, 0.55, 0.25, 0.2, 0.8, 0.1, 0.7, 0.2, 0.45, 0.6];

  const CHORD_TYPES = Object.keys(CHORD_W).map((id) => ({ id, label: T.CHORDS[id].sym || 'major', sub: T.CHORDS[id].formula }));
  CHORD_TYPES[1].label = 'minor';
  const SCALE_TYPES = Object.keys(SCALE_W).map((id) => ({ id, label: T.SCALES[id].name, sub: T.SCALES[id].iv.length + ' notes' }));

  function rank(list) {
    list.sort((a, b) => a.raw - b.raw);
    const n = list.length;
    list.forEach((a, i) => { a.score = n === 1 ? 100 : Math.round(5 + (95 * i) / (n - 1)); });
    return list;
  }

  function chordAnswers(given) {
    const out = [];
    for (let r = 0; r < 12; r++) {
      for (const q in CHORD_W) {
        const pcs = T.chordPcs(r, q);
        if (!given.every((g) => pcs.includes(g))) continue;
        const pos = given.reduce((s, g) => s + pcs.indexOf(g), 0) / given.length / 4;
        const rn = Q.bestRoot(r, q, false);
        out.push({ rootPc: r, type: q, label: T.chordSym(rn, q), notes: T.chordNotes(rn, q), pcs,
          raw: 0.55 * CHORD_W[q] + 0.2 * ROOT_W[r] + 0.25 * pos });
      }
    }
    return rank(out);
  }
  function scaleAnswers(given, chordRoot) {
    const out = [];
    for (let r = 0; r < 12; r++) {
      for (const s in SCALE_W) {
        const pcs = T.scalePcs(r, s);
        if (!given.every((g) => pcs.includes(g))) continue;
        const rn = Q.bestRoot(r, s, true);
        out.push({ rootPc: r, type: s, label: fmt(rn) + ' ' + T.SCALES[s].name, notes: T.scaleNotes(rn, s), pcs,
          raw: 0.6 * SCALE_W[s] + 0.15 * ROOT_W[r] + (r === chordRoot ? 0 : 0.25) });
      }
    }
    return rank(out);
  }

  const names = (pcs, flat) => pcs.map((p) => (flat ? T.PC_FLAT : T.PC_SHARP)[p]);
  const joinAnd = (a) => (a.length <= 1 ? a.join('') : a.slice(0, -1).join(', ') + ' and ' + a[a.length - 1]);

  function make(rng, tier) {
    const flat = rng.chance(0.5);
    for (let tries = 0; tries < 200; tries++) {
      let kind = 'chord', given, label, chordRoot = null, title;
      if (tier === 'beginner') {
        const a = rng.pick([0, 2, 4, 5, 7, 9, 11]);
        given = [a, mod(a + rng.pick([3, 4, 7]), 12)];
      } else if (tier === 'intermediate') {
        if (rng.chance(0.4)) kind = 'scale';
        const a = rng.int(0, 11);
        given = [a, mod(a + rng.int(1, 11), 12)];
      } else {
        if (rng.chance(0.5)) kind = 'scale';
        const a = rng.int(0, 11);
        const b = mod(a + rng.pick([2, 3, 4, 5]), 12);
        given = [a, b, mod(b + rng.pick([2, 3, 4, 5]), 12)];
      }
      if (kind === 'scale') {
        const q = tier === 'advanced' ? rng.pick(['maj7', 'min7', 'dom7', 'm7b5']) : rng.pick(['maj', 'min']);
        chordRoot = rng.int(0, 11);
        const rn = Q.bestRoot(chordRoot, q, false);
        given = T.chordPcs(chordRoot, q);
        label = Q.chordLabel(rn, q);
        title = `Name a scale that contains every note of <b>${label}</b>`;
        const answers = scaleAnswers(given, chordRoot);
        if (answers.length < 6) continue;
        return { kind, title, given, givenNames: T.chordNotes(rn, q).map(fmt), types: SCALE_TYPES, answers, noun: 'scale',
          hint: `${label} = ${T.chordNotes(rn, q).map(fmt).join(' – ')}` };
      }
      if (new Set(given).size !== given.length) continue;
      const answers = chordAnswers(given);
      if (answers.length < 6) continue;
      const gn = names(given, flat);
      title = `Name a chord that contains ${given.length === 2 ? 'both ' : ''}<b>${joinAnd(gn)}</b>`;
      return { kind, title, given, givenNames: gn, types: CHORD_TYPES, answers, noun: 'chord', hint: null };
    }
    throw new Error('deep cut: no prompt found');
  }

  // Look up a guess. Returns the ranked answer, or a description of why it misses.
  function check(round, rootPc, type) {
    const hit = round.answers.find((a) => a.rootPc === rootPc && a.type === type);
    if (hit) return { ok: true, answer: hit };
    const isScale = round.kind === 'scale';
    const rn = Q.bestRoot(rootPc, type, isScale);
    const notes = isScale ? T.scaleNotes(rn, type) : T.chordNotes(rn, type);
    const pcs = notes.map(pc);
    const missing = round.given.map((g, i) => (pcs.includes(g) ? null : round.givenNames[i])).filter(Boolean);
    return { ok: false, label: isScale ? fmt(rn) + ' ' + T.SCALES[type].name : T.chordSym(rn, type), notes, missing };
  }

  function verdict(score) {
    if (score >= 90) return 'Deep cut!';
    if (score >= 65) return 'Niche pick';
    if (score >= 35) return 'Solid choice';
    return 'Crowd-pleaser';
  }

  root.DeepCut = { make, check, verdict, CHORD_TYPES, SCALE_TYPES };
})(typeof window !== 'undefined' ? window : globalThis);
