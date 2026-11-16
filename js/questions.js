/* Tonic — question generators.
   Every generator takes (rng, difficulty 1-5) and returns a self-contained
   question: prompt, optional audio / visual, an input spec with the answer,
   and an explanation that teaches the idea behind it. */
(function (root) {
  'use strict';
  const T = root.Theory;
  const { note, midi, pc, fmt, up, down, IV, IV_NAME, SEMI_NAME, SEMI_HINT, CHORDS, SCALES, mod } = T;

  const cap = (s) => s[0].toUpperCase() + s.slice(1);
  const ORD = ['1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th'];
  const SOLF = ['do', 're', 'mi', 'fa', 'sol', 'la', 'ti'];
  const clamp = (x, lo, hi) => Math.max(lo, Math.min(hi, x));

  // ---------- helpers ----------
  // Pick whichever enharmonic root gives the cleanest spelling.
  function bestRoot(pcNum, type, isScale, o) {
    const p = mod(pcNum, 12);
    const names = [...new Set([T.PC_SHARP[p], T.PC_FLAT[p]])];
    const pref = fmt(T.rootFor(p, type));
    let best = null, bestCost = 1e9;
    for (const nm of names) {
      const r = note(nm, o === undefined ? 4 : o);
      const ns = isScale ? T.scaleNotes(r, type) : T.chordNotes(r, type);
      let cost = 0;
      for (const n of ns) cost += Math.abs(n.a) + (Math.abs(n.a) > 1 ? 10 : 0);
      if (nm === pref) cost -= 0.5;
      if (cost < bestCost) { bestCost = cost; best = r; }
    }
    return best;
  }
  const TRIAD_WORD = { maj: 1, min: 1, dim: 1, aug: 1 };
  const chordLabel = (r, q) => (TRIAD_WORD[q] ? fmt(r) + ' ' + CHORDS[q].name : fmt(r) + CHORDS[q].sym);
  const qualityLabel = (q) => cap(CHORDS[q].name);
  const scaleLabel = (s) => cap(SCALES[s].name);
  const spell = (notes) => notes.map(fmt).join(' – ');
  const keyName = (tonic, mode) => fmt(tonic) + ' ' + mode;

  function choice(rng, correct, distractors, n) {
    n = n || 4;
    const toOpt = (d) => (typeof d === 'string' ? { label: d } : d);
    const c = toOpt(correct);
    const seen = new Set([c.label]);
    const out = [c];
    for (const d of distractors) {
      if (out.length >= n) break;
      const o = toOpt(d);
      if (!seen.has(o.label)) { seen.add(o.label); out.push(o); }
    }
    const sh = rng.shuffle(out);
    return { kind: 'choice', options: sh, answer: sh.indexOf(c) };
  }

  function prange(midis, minOct) {
    const lo = Math.floor(Math.min(...midis) / 12) * 12;
    let hi = lo + 12 * (minOct || 2) - 1;
    while (hi < Math.max(...midis)) hi += 12;
    return { lo, hi };
  }
  function pianoOf(notes, extra) {
    const midis = notes.map(midi);
    const labels = {};
    notes.forEach((n) => { labels[midi(n)] = fmt(n); });
    return Object.assign({ kind: 'piano', marks: midis, labels }, prange(midis), extra || {});
  }

  const mel = (midis, step, dur, at) => midis.map((m, i) => ({ at: (at || 0) + i * step, midis: [m], dur: dur || step * 1.3 }));
  const blk = (midis, at, dur) => [{ at: at || 0, midis, dur: dur || 1.4 }];

  function noteDistractors(rng, correct, extra) {
    const out = [];
    const cpc = pc(correct);
    // skip look-alikes of the answer and oddball spellings (B♯, E♯, C♭, F♭) that only confuse
    const odd = (n) => (n.a === 1 && (n.l === 6 || n.l === 2)) || (n.a === -1 && (n.l === 0 || n.l === 3));
    const push = (n) => { if (Math.abs(n.a) <= 1 && pc(n) !== cpc && !odd(n)) out.push(fmt(n)); };
    const alt = rng.shuffle([-1, 1]);
    push({ l: correct.l, a: correct.a + alt[0], o: 4 });
    (extra || []).forEach(push);
    push({ l: correct.l, a: correct.a + alt[1], o: 4 });
    for (const st of rng.shuffle([-1, 1, -2, 2])) {
      push({ l: mod(correct.l + st, 7), a: correct.a, o: 4 });
      push({ l: mod(correct.l + st, 7), a: 0, o: 4 });
    }
    return out;
  }

  function keyFromSig(sig, mode) {
    const maj = T.majorKeyBySig(sig).tonic;
    return mode === 'minor' ? T.relMinor(maj) : { l: maj.l, a: maj.a, o: 4 };
  }

  const GENS = [];
  const def = (id, skill, sense, min, max, make) => GENS.push({ id, skill, sense, min, max, make });

  // =====================================================================
  // EAR
  // =====================================================================
  def('ear-interval', 'intervals', 'ear', 1, 5, (rng, d) => {
    const pool = d <= 1 ? [2, 4, 7, 12] : d === 2 ? [2, 3, 4, 5, 7, 12] : [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
    const s = rng.pick(pool);
    const low = rng.int(52, 64);
    const mk = (semi) => {
      if (d >= 5) return blk([low, low + semi], 0, 1.8);
      const order = d === 4 ? [low + semi, low] : [low, low + semi];
      return mel(order, 0.7, 0.75).concat(blk([low, low + semi], 1.6, 1.5));
    };
    const others = rng.shuffle(pool.filter((x) => x !== s));
    // keep the closest-sounding neighbour in the options when there is one
    others.sort((a, b) => (Math.abs(a - s) === 1 ? -1 : 0) - (Math.abs(b - s) === 1 ? -1 : 0));
    const opt = (semi) => ({ label: SEMI_NAME[semi], audio: mk(semi) });
    return {
      key: 'ear-interval:' + s,
      prompt: 'What interval do you hear?',
      sub: d >= 5 ? 'Both notes are played together.' : d === 4 ? 'Played from the top note down.' : 'Two notes, one after the other — then together.',
      audio: mk(s),
      input: choice(rng, opt(s), others.map(opt)),
      answerText: SEMI_NAME[s],
      explain: `<b>${SEMI_NAME[s]}</b>: ${SEMI_HINT[s]}`,
      reveal: Object.assign({ kind: 'piano', marks: [low, low + s] }, prange([low, low + s])),
    };
  });

  def('ear-chord', 'chords', 'ear', 1, 5, (rng, d) => {
    const pool = [null,
      ['maj', 'min'],
      ['maj', 'min', 'dim', 'aug'],
      ['maj', 'min', 'maj7', 'dom7', 'min7'],
      ['maj7', 'dom7', 'min7', 'm7b5', 'dim7', 'sus4', 'sus2'],
      ['maj7', 'dom7', 'min7', 'm7b5', 'dim7', 'mMaj7', 'six', 'min6', 'dom9', 'maj9'],
    ][d];
    const q = rng.pick(pool);
    const rootMidi = rng.int(48, 58);
    const mk = (qq) => {
      const ms = CHORDS[qq].iv.map((iv) => rootMidi + IV[iv][1]);
      return blk(ms, 0, 1.3).concat(mel(ms, 0.28, 0.9, 1.5));
    };
    const opt = (qq) => ({ label: qualityLabel(qq), audio: mk(qq) });
    const r = bestRoot(rootMidi, q, false, Math.floor(rootMidi / 12) - 1);
    const notes = T.chordNotes(r, q);
    return {
      key: 'ear-chord:' + q,
      prompt: 'What kind of chord is this?',
      sub: 'You’ll hear it as a block, then one note at a time.',
      audio: mk(q),
      input: choice(rng, opt(q), rng.shuffle(pool.filter((x) => x !== q)).map(opt)),
      answerText: qualityLabel(q),
      explain: `<b>${qualityLabel(q)}</b> — ${CHORDS[q].feel}. Formula: <b>${CHORDS[q].formula}</b>. That was ${chordLabel(r, q)}: ${spell(notes)}.`,
      reveal: pianoOf(notes),
    };
  });

  def('ear-scale', 'scales', 'ear', 2, 5, (rng, d) => {
    const pool = [null, null,
      ['major', 'minor'],
      ['major', 'minor', 'harmonic', 'majpent', 'minpent'],
      ['major', 'minor', 'dorian', 'mixolydian', 'lydian', 'phrygian', 'harmonic'],
      ['dorian', 'phrygian', 'lydian', 'mixolydian', 'locrian', 'melodic', 'harmonic', 'blues', 'wholetone'],
    ][d];
    const s = rng.pick(pool);
    const rootMidi = rng.int(55, 65);
    const mk = (ss) => mel(SCALES[ss].iv.map((iv) => rootMidi + IV[iv][1]).concat([rootMidi + 12]), 0.34, 0.5);
    const opt = (ss) => ({ label: scaleLabel(ss), audio: mk(ss) });
    const r = bestRoot(rootMidi, s, true, Math.floor(rootMidi / 12) - 1);
    const notes = T.scaleNotes(r, s);
    return {
      key: 'ear-scale:' + s,
      prompt: 'Which scale is this?',
      audio: mk(s),
      input: choice(rng, opt(s), rng.shuffle(pool.filter((x) => x !== s)).map(opt)),
      answerText: scaleLabel(s),
      explain: `<b>${scaleLabel(s)}</b> — ${SCALES[s].feel}. That was ${fmt(r)} ${SCALES[s].name}: ${spell(notes)}.`,
      reveal: pianoOf(notes),
    };
  });

  const DEGREE_FEEL = [
    'home base — total rest', 'restless, wants to step down to 1', 'sweet and settled — it gives the key its major colour',
    'leans down toward 3', 'strong and stable, second only to home', 'gentle and a little wistful',
    'the leading tone — it aches to rise to 1',
  ];
  def('ear-degree', 'harmony', 'ear', 2, 4, (rng, d) => {
    const pool = d <= 2 ? [0, 2, 4] : d === 3 ? [0, 1, 2, 3, 4] : [0, 1, 2, 3, 4, 5, 6];
    const deg = rng.pick(pool);
    const t = rng.int(55, 62);
    const MAJ = [0, 2, 4, 5, 7, 9, 11];
    const cadence = [[0, 4, 7], [0, 5, 9], [-1, 2, 7], [0, 4, 7]].map((c, i) => ({ at: i * 0.55, midis: c.map((x) => t + x), dur: 0.52 }));
    const mk = (dg) => cadence.concat([{ at: 2.7, midis: [t + MAJ[dg]], dur: 1.3 }]);
    const opt = (dg) => ({ label: `${dg + 1} · ${SOLF[dg]}`, audio: [{ at: 0, midis: [t], dur: 0.5 }, { at: 0.55, midis: [t + MAJ[dg]], dur: 1.1 }] });
    const r = bestRoot(t, 'major', true, Math.floor(t / 12) - 1);
    const sc = T.scaleNotes(r, 'major');
    return {
      key: 'ear-degree:' + deg,
      prompt: 'Which scale degree is the last note?',
      sub: 'First you’ll hear the key (four chords), then one single note.',
      audio: mk(deg),
      input: choice(rng, opt(deg), rng.shuffle(pool.filter((x) => x !== deg)).map(opt)),
      answerText: `${deg + 1} (${SOLF[deg]})`,
      explain: `Degree <b>${deg + 1} (${SOLF[deg]})</b> — ${DEGREE_FEEL[deg]}. The key was ${fmt(r)} major and the note was ${fmt(sc[deg])}. Each degree has its own “pull” toward home; learning that feeling is how you play by ear.`,
      reveal: Object.assign(pianoOf([sc[deg]]), { marks: [midi(sc[deg])] }),
    };
  });

  const PROGS = {
    major: [[0, 3, 4, 0], [0, 4, 5, 3], [0, 5, 3, 4], [5, 3, 0, 4], [0, 5, 1, 4], [0, 3, 5, 4], [0, 4, 3, 0], [1, 4, 0, 5], [0, 2, 3, 4]],
    minor: [[0, 5, 2, 6], [0, 3, 4, 0], [0, 6, 5, 6], [0, 3, 6, 2], [0, 5, 3, 4]],
  };
  def('ear-progression', 'harmony', 'ear', 3, 5, (rng, d) => {
    const mode = d >= 5 ? rng.pick(['major', 'minor']) : 'major';
    const pool = d <= 3 ? PROGS.major.slice(0, 4) : PROGS[mode];
    const prog = rng.pick(pool);
    const t = rng.int(48, 55);
    const D = T.DIATONIC[mode];
    const sc = SCALES[D.scale].iv.map((iv) => IV[iv][1]);
    const mk = (degs) => degs.map((dg, i) => {
      const rootPc = mod(t + sc[dg], 12);
      let bass = 36 + rootPc; if (bass < 40) bass += 12;
      const upper = T.chordPcs(rootPc, D.triads[dg]).map((p) => 55 + mod(p - 55, 12));
      return { at: i * 1.05, midis: [bass].concat(upper), dur: i === 3 ? 1.6 : 1.0 };
    });
    const lab = (degs) => degs.map((dg) => D.numerals[dg]).join(' – ');
    const opt = (degs) => ({ label: lab(degs), audio: mk(degs) });
    const r = bestRoot(t, D.scale, true);
    const chords = prog.map((dg) => { const c = T.diatonicChord(r, mode, dg, false); return T.chordSym(c.root, c.q); }).join(' – ');
    return {
      key: 'ear-prog:' + mode + ':' + prog.join(''),
      prompt: 'Which chord progression is this?',
      sub: `Four chords in a ${mode} key. Follow the bass note.`,
      audio: mk(prog),
      input: choice(rng, opt(prog), rng.shuffle(pool.filter((x) => x !== prog)).map(opt)),
      answerText: lab(prog),
      explain: `<b>${lab(prog)}</b> — in ${fmt(r)} ${mode} that’s ${chords}. Listen to the bass: it moves through scale degrees ${prog.map((x) => x + 1).join(' → ')}. Capital numerals are major chords, lowercase are minor.`,
    };
  });

  // =====================================================================
  // EYE
  // =====================================================================
  def('piano-note', 'reading', 'eye', 1, 1, (rng) => {
    const m = rng.int(60, 71);
    const p = m % 12;
    const black = T.IS_BLACK[p];
    const same = [...Array(12).keys()].filter((x) => T.IS_BLACK[x] === black && x !== p);
    return {
      key: 'piano-note:' + p,
      prompt: 'Which note is the highlighted key?',
      visual: { kind: 'piano', lo: 48, hi: 71, marks: [m] },
      input: choice(rng, T.PC_BOTH[p], rng.shuffle(same).map((x) => T.PC_BOTH[x])),
      answerText: T.PC_BOTH[p],
      explain: black
        ? `<b>${T.PC_BOTH[p]}</b>. Black keys borrow their name from a neighbour: one semitone above ${T.PC_SHARP[p][0]} is ${T.PC_SHARP[p]}, one below ${T.PC_FLAT[p][0]} is ${T.PC_FLAT[p]} — same key, two names.`
        : `<b>${T.PC_SHARP[p]}</b>. Use the black keys as landmarks: C sits just left of every group of two black keys, F just left of every group of three.`,
      reveal: { kind: 'piano', lo: 48, hi: 71, marks: [m], labels: { [m]: black ? T.PC_SHARP[p] : T.PC_SHARP[p] } },
    };
  });

  function staffPosText(clef, n) {
    const p = n.o * 7 + n.l - (clef === 'treble' ? 30 : 18);
    if (p === -2 && clef === 'treble') return 'on the first ledger line below the staff — that’s middle C';
    if (p === 10 && clef === 'bass') return 'on the first ledger line above the staff — that’s middle C';
    if (p < 0) return 'below the staff — count down letter by letter from the bottom line';
    if (p > 8) return 'above the staff — count up letter by letter from the top line';
    return p % 2 === 0 ? `on line ${p / 2 + 1}, counting from the bottom` : `in space ${(p + 1) / 2}, counting from the bottom`;
  }
  def('read-note', 'reading', 'eye', 1, 3, (rng, d) => {
    const clef = d <= 1 ? 'treble' : rng.chance(0.55) ? 'bass' : 'treble';
    const range = clef === 'treble' ? [[30, 38], [28, 40], [26, 42]][d - 1] : [[18, 26], [18, 26], [14, 30]][d - 1];
    const dd = rng.int(range[0], range[1]);
    const n = { l: mod(dd, 7), a: 0, o: Math.floor(dd / 7) };
    const mn = clef === 'treble'
      ? 'Treble lines, bottom to top: <b>E G B D F</b> (Every Good Boy Does Fine). Spaces spell <b>F A C E</b>.'
      : 'Bass lines, bottom to top: <b>G B D F A</b> (Good Boys Do Fine Always). Spaces: <b>A C E G</b> (All Cows Eat Grass).';
    return {
      key: 'read-note:' + clef + ':' + T.LETTERS[n.l],
      prompt: 'Name this note.',
      visual: { kind: 'staff', clef, sig: 0, notes: [n], layout: 'chord' },
      input: { kind: 'choice', layout: 'letters', options: T.LETTERS.map((x) => ({ label: x })), answer: n.l },
      answerText: T.LETTERS[n.l],
      explain: `That’s <b>${T.LETTERS[n.l]}</b>, sitting ${staffPosText(clef, n)}. ${mn}`,
    };
  });

  def('key-sig', 'keys', 'eye', 1, 4, (rng, d) => {
    const lim = d <= 1 ? 2 : d === 2 ? 4 : 7;
    const sig = rng.int(-lim, lim);
    const minor = d >= 4 || (d === 3 && rng.chance(0.45));
    const mode = minor ? 'minor' : 'major';
    const name = (s) => keyName(keyFromSig(s, mode), mode);
    const ds = rng.shuffle([sig - 1, sig + 1, sig - 2, sig + 2, -sig].filter((s) => s !== sig && Math.abs(s) <= 7)).map(name);
    if (minor) ds.splice(1, 0, keyName(T.majorKeyBySig(sig).tonic, 'minor'));
    const majName = keyName(T.majorKeyBySig(sig).tonic, 'major');
    let why;
    if (sig === 0) why = 'No sharps or flats means <b>C major</b>.';
    else if (sig > 0) {
      const last = T.sigNotes(sig)[sig - 1];
      why = `${cap(T.sigText(sig))} (${T.sigNotes(sig).join(' ')}). Trick for sharps: go one semitone <i>up</i> from the last sharp (${last}) and you land on <b>${majName}</b>.`;
    } else if (sig === -1) why = 'One flat (B♭) is <b>F major</b> — that one you simply memorise.';
    else why = `${cap(T.sigText(sig))} (${T.sigNotes(sig).join(' ')}). Trick for flats: the <i>second-to-last</i> flat names the key — <b>${majName}</b>.`;
    if (minor) why += ` The relative minor lives 3 semitones below the major tonic: <b>${name(sig)}</b>.`;
    return {
      key: 'key-sig:' + sig + (minor ? 'm' : ''),
      prompt: `Which <b>${mode}</b> key has this key signature?`,
      visual: { kind: 'staff', clef: d >= 3 && rng.chance(0.3) ? 'bass' : 'treble', sig, notes: [] },
      input: choice(rng, name(sig), ds),
      answerText: name(sig),
      explain: why,
    };
  });

  const SAME_SET = (a, b) => a.length === b.length && a.slice().sort().join() === b.slice().sort().join();
  def('piano-chord', 'chords', 'eye', 2, 5, (rng, d) => {
    const pool = [null, null,
      ['maj', 'min'],
      ['maj', 'min', 'dim', 'aug', 'sus4', 'maj7', 'dom7', 'min7'],
      ['maj', 'min', 'dom7', 'maj7', 'min7', 'm7b5', 'dim7'],
      ['maj7', 'dom7', 'min7', 'm7b5', 'mMaj7', 'six', 'min6', 'dom9', 'maj9', 'min9', 'add9'],
    ][d];
    const q = rng.pick(pool);
    const r = bestRoot(rng.int(0, 11), q, false, 3);
    const notes = T.chordNotes(r, q);
    const canInvert = d === 4 && !['dim7', 'aug', 'm7b5'].includes(q);
    const inv = canInvert ? rng.int(1, notes.length - 1) : 0;
    const shown = notes.map((n, i) => (i < inv ? { l: n.l, a: n.a, o: n.o + 1 } : n));
    const myPcs = notes.map(pc);
    const ds = [];
    const add = (rr, qq) => {
      const r2 = pc(rr) === pc(r) ? r : bestRoot(pc(rr), qq, false, 3); // respell borrowed roots (no "F× minor")
      if (!SAME_SET(T.chordNotes(r2, qq).map(pc), myPcs)) ds.push(chordLabel(r2, qq));
    };
    const otherQ = rng.shuffle(pool.filter((x) => x !== q));
    if (otherQ[0]) add(r, otherQ[0]);
    const tones = rng.shuffle(notes.slice(1));
    add({ l: tones[0].l, a: tones[0].a, o: 3 }, inv ? q : otherQ[0] || q);
    if (otherQ[1]) add(r, otherQ[1]);
    if (tones[1]) add({ l: tones[1].l, a: tones[1].a, o: 3 }, q);
    add({ l: tones[0].l, a: tones[0].a, o: 3 }, q);
    otherQ.slice(2).forEach((qq) => add(r, qq));
    const invName = ['', '1st', '2nd', '3rd'][inv];
    return {
      key: 'piano-chord:' + q + (inv ? ':inv' : ''),
      prompt: 'What chord is this?',
      sub: d === 4 ? 'Careful — the root might not be the lowest note.' : null,
      visual: Object.assign({ kind: 'piano', marks: shown.map(midi) }, prange(shown.map(midi))),
      audioAfter: blk(shown.map(midi), 0, 1.6),
      input: choice(rng, chordLabel(r, q), ds),
      answerText: chordLabel(r, q),
      explain: `<b>${chordLabel(r, q)}</b> = ${spell(notes)} (formula ${CHORDS[q].formula}) — ${CHORDS[q].feel}.` +
        (inv ? ` Here the root ${fmt(r)} isn’t on the bottom: this is the <b>${invName} inversion</b>. Restack the notes in 3rds to find the root.` : ''),
      reveal: pianoOf(shown),
    };
  });

  def('piano-interval', 'intervals', 'eye', 1, 2, (rng, d) => {
    const pool = d <= 1 ? [1, 2, 3, 4, 5, 7, 12] : [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
    const s = rng.pick(pool);
    const low = rng.int(53, 62);
    const others = rng.shuffle(pool.filter((x) => x !== s));
    others.sort((a, b) => (Math.abs(a - s) === 1 ? -1 : 0) - (Math.abs(b - s) === 1 ? -1 : 0));
    return {
      key: 'piano-interval:' + s,
      prompt: 'What interval is this?',
      sub: 'Count the semitones (every key, black and white) between the two.',
      visual: Object.assign({ kind: 'piano', marks: [low, low + s] }, prange([low, low + s])),
      audioAfter: mel([low, low + s], 0.6, 0.9),
      input: choice(rng, SEMI_NAME[s], others.map((x) => SEMI_NAME[x])),
      answerText: SEMI_NAME[s],
      explain: `${s} semitone${s > 1 ? 's' : ''} apart = <b>${SEMI_NAME[s]}</b>: ${SEMI_HINT[s]}`,
    };
  });

  def('staff-interval', 'intervals', 'eye', 3, 4, (rng, d) => {
    const pool = d <= 3 ? ['m2', 'M2', 'm3', 'M3', 'P4', 'P5', 'm6', 'M6', 'P8'] : ['m2', 'M2', 'm3', 'M3', 'P4', 'A4', 'd5', 'P5', 'm6', 'M6', 'm7', 'M7', 'P8'];
    let low, hi, iv;
    for (let tries = 0; tries < 60; tries++) {
      iv = rng.pick(pool);
      const dd = rng.int(28, 33);
      low = { l: mod(dd, 7), a: d >= 4 ? rng.pick([0, 0, 0, -1, 1]) : rng.pick([0, 0, 0, 0, -1, 1]), o: Math.floor(dd / 7) };
      hi = up(low, iv);
      if (Math.abs(hi.a) <= 1) break;
    }
    const steps = IV[iv][0];
    const sameNum = Object.keys(IV_NAME).filter((k) => k !== iv && IV[k][0] === steps && k !== 'P1');
    const near = rng.shuffle(Object.keys(IV_NAME).filter((k) => k !== iv && Math.abs(IV[k][0] - steps) === 1 && k !== 'P1' && IV[k][0] <= 7));
    const ds = rng.shuffle(sameNum).slice(0, 2).concat(near).map((k) => IV_NAME[k]);
    const size = iv === 'P8' ? 'an octave' : 'some kind of ' + ORD[steps];
    return {
      key: 'staff-interval:' + iv,
      prompt: 'What interval is this?',
      visual: { kind: 'staff', clef: 'treble', sig: 0, notes: [low, hi], layout: 'melodic' },
      audioAfter: mel([midi(low), midi(hi)], 0.6, 0.9),
      input: choice(rng, IV_NAME[iv], ds),
      answerText: IV_NAME[iv],
      explain: `${fmt(low)} up to ${fmt(hi)}. Step 1 — count the letter names, including both ends: ${steps + 1}, so it’s ${size}. Step 2 — count semitones: ${IV[iv][1]}, which makes it a <b>${IV_NAME[iv].toLowerCase()}</b>.`,
    };
  });

  // =====================================================================
  // BRAIN
  // =====================================================================
  def('semitones', 'intervals', 'brain', 1, 2, (rng, d) => {
    const pool = d <= 1 ? [1, 2, 3, 4, 7, 12] : [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
    const s = rng.pick(pool);
    const reverse = d >= 2 && rng.chance(0.5);
    const nb = rng.shuffle([s - 1, s + 1, s - 2, s + 2, s + 3, s - 3].filter((x) => x >= 1 && x <= 12));
    return {
      key: 'semitones:' + s,
      prompt: reverse ? `Which interval spans <b>${s} semitone${s > 1 ? 's' : ''}</b>?` : `How many semitones are in a <b>${SEMI_NAME[s].toLowerCase()}</b>?`,
      sub: 'A semitone (half step) is the distance from one key to the very next one.',
      input: reverse ? choice(rng, SEMI_NAME[s], nb.map((x) => SEMI_NAME[x])) : choice(rng, String(s), nb.map(String)),
      answerText: reverse ? SEMI_NAME[s] : String(s),
      explain: `<b>${SEMI_NAME[s]}</b> = ${SEMI_HINT[s]}`,
      reveal: { kind: 'piano', lo: 60, hi: 83, marks: [60, 60 + s], labels: { 60: 'C', [60 + s]: T.PC_SHARP[s % 12] } },
    };
  });

  def('interval-math', 'intervals', 'brain', 1, 4, (rng, d) => {
    const pool = d <= 1 ? ['m2', 'M2'] : d === 2 ? ['M2', 'm3', 'M3', 'P4', 'P5'] : ['m2', 'M2', 'm3', 'M3', 'P4', 'A4', 'P5', 'm6', 'M6', 'm7', 'M7'];
    let start, res, iv, dir;
    for (let tries = 0; tries < 60; tries++) {
      iv = rng.pick(pool);
      dir = d >= 4 ? -1 : 1;
      start = { l: rng.int(0, 6), a: d >= 3 ? rng.pick([0, 0, -1, 1]) : 0, o: 4 };
      res = dir > 0 ? up(start, iv) : down(start, iv);
      if (Math.abs(res.a) <= 1) break;
    }
    const nm = d <= 1 ? (iv === 'm2' ? 'half step (semitone)' : 'whole step (2 semitones)') : IV_NAME[iv].toLowerCase();
    const steps = IV[iv][0];
    const extra = rng.shuffle(pool.filter((x) => x !== iv)).slice(0, 2).map((x) => (dir > 0 ? up(start, x) : down(start, x)));
    const a = d <= 1 ? 'a' : /^[aeiou]/i.test(nm) ? 'an' : 'a';
    return {
      key: 'interval-math:' + iv + (dir < 0 ? ':down' : ''),
      prompt: `What note is ${a} <b>${nm}</b> ${dir > 0 ? 'above' : 'below'} <b>${fmt(start)}</b>?`,
      input: choice(rng, fmt(res), noteDistractors(rng, res, extra)),
      answerText: fmt(res),
      explain: d <= 1
        ? `<b>${fmt(res)}</b>. ${iv === 'm2' ? 'A half step is the very next key.' : 'A whole step skips exactly one key.'} Watch out for E–F and B–C: those white keys have no black key between them, so they’re only a half step apart.`
        : `<b>${fmt(res)}</b>. Count ${steps + 1} letter names ${dir > 0 ? 'up' : 'down'} from ${T.LETTERS[start.l]} to land on ${T.LETTERS[res.l]}, then adjust until the distance is ${IV[iv][1]} semitones.`,
    };
  });

  def('scale-degree', 'scales', 'brain', 1, 3, (rng, d) => {
    const mode = d >= 3 && rng.chance(0.5) ? 'minor' : 'major';
    const lim = d <= 1 ? 1 : d === 2 ? 4 : 6;
    const tonic = keyFromSig(rng.int(-lim, lim), mode);
    const sc = T.scaleNotes(tonic, mode);
    const deg = rng.int(1, 6);
    const extra = rng.shuffle(sc.filter((_, i) => i !== deg && i !== 0)).slice(0, 2);
    return {
      key: 'scale-degree:' + mode + ':' + deg,
      prompt: `What is the <b>${ORD[deg]}</b> note of the <b>${keyName(tonic, mode)}</b> scale?`,
      input: choice(rng, fmt(sc[deg]), noteDistractors(rng, sc[deg], extra)),
      answerText: fmt(sc[deg]),
      explain: `${cap(keyName(tonic, mode))}: ${sc.map((n, i) => (i === deg ? `<b>${fmt(n)}</b>` : fmt(n))).join(' – ')}. ` +
        (mode === 'major' ? 'Every major scale follows the same steps: whole, whole, half, whole, whole, whole, half.' : 'Natural minor steps: whole, half, whole, whole, half, whole, whole.'),
    };
  });

  def('chord-in-key', 'harmony', 'brain', 2, 5, (rng, d) => {
    const mode = d === 3 ? rng.pick(['major', 'minor']) : d === 5 ? rng.pick(['major', 'minor']) : d === 4 ? 'major' : 'major';
    const lim = d <= 2 ? 3 : d === 3 ? (mode === 'minor' ? 3 : 6) : 6;
    const seventh = d >= 4;
    const tonic = keyFromSig(rng.int(-lim, lim), mode);
    const D = T.DIATONIC[mode];
    const all = [0, 1, 2, 3, 4, 5, 6].map((i) => T.diatonicChord(tonic, mode, i, seventh));
    const reverse = d >= 3 && rng.chance(0.4);
    const deg = reverse ? rng.int(0, 6) : rng.int(1, 6);
    const c = all[deg];
    const lab = (x) => (seventh ? T.chordSym(x.root, x.q) : chordLabel(x.root, x.q));
    const listing = all.map((x, i) => (i === deg ? `<b>${T.chordSym(x.root, x.q)}</b>` : T.chordSym(x.root, x.q))).join(' – ');
    const pattern = seventh
      ? (mode === 'major' ? 'maj7, m7, m7, maj7, 7, m7, ø7' : 'm7, ø7, maj7, m7, m7, maj7, 7')
      : (mode === 'major' ? 'major, minor, minor, major, major, minor, diminished' : 'minor, diminished, major, minor, minor, major, major');
    const explain = `${cap(keyName(tonic, mode))}: ${listing}. Build a chord on each scale note using only notes of the key and the qualities always fall in this order: ${pattern}.`;
    const nums = seventh ? D.numerals7 : D.numerals;
    if (reverse) {
      return {
        key: 'chord-in-key:' + mode + ':' + deg + (seventh ? ':7' : '') + ':rev',
        prompt: `In <b>${keyName(tonic, mode)}</b>, which Roman numeral is <b>${lab(c)}</b>?`,
        input: choice(rng, nums[deg], rng.shuffle(nums.filter((_, i) => i !== deg))),
        answerText: nums[deg],
        explain,
      };
    }
    const flip = seventh
      ? { maj7: 'dom7', dom7: 'maj7', min7: 'dom7', m7b5: 'min7' }[c.q]
      : { maj: 'min', min: 'maj', dim: 'min' }[c.q];
    const ds = [lab({ root: c.root, q: flip })];
    rng.shuffle(all.filter((_, i) => i !== deg && i !== 0)).forEach((x) => ds.push(lab(x)));
    return {
      key: 'chord-in-key:' + mode + ':' + deg + (seventh ? ':7' : ''),
      prompt: `In <b>${keyName(tonic, mode)}</b>, what is the <b>${nums[deg]}</b> chord?`,
      input: choice(rng, lab(c), ds),
      answerText: lab(c),
      explain,
    };
  });

  def('relative-key', 'keys', 'brain', 2, 3, (rng, d) => {
    const sig = rng.int(d <= 2 ? -4 : -6, d <= 2 ? 4 : 6);
    const toMinor = rng.chance(0.5);
    const maj = keyFromSig(sig, 'major'), min = keyFromSig(sig, 'minor');
    const from = toMinor ? maj : min, to = toMinor ? min : maj;
    const toMode = toMinor ? 'minor' : 'major';
    const ds = [keyName(from, toMode)];
    rng.shuffle([sig - 1, sig + 1, sig + 3, sig - 3].filter((s) => Math.abs(s) <= 7)).forEach((s) => ds.push(keyName(keyFromSig(s, toMode), toMode)));
    return {
      key: 'relative:' + toMode,
      prompt: `What is the <b>relative ${toMode}</b> of <b>${keyName(from, toMinor ? 'major' : 'minor')}</b>?`,
      input: choice(rng, keyName(to, toMode), ds),
      answerText: keyName(to, toMode),
      explain: `<b>${keyName(maj, 'major')}</b> and <b>${keyName(min, 'minor')}</b> are relatives: same notes, same key signature (${T.sigText(sig)}), different home note. The relative minor always starts 3 semitones <i>below</i> the major — or on the major scale’s 6th note.`,
    };
  });

  const TONE_NAME = ['root', '3rd', '5th', '7th', '9th'];
  def('chord-tone', 'chords', 'brain', 2, 4, (rng, d) => {
    const pool = d <= 2 ? ['maj', 'min'] : d === 3 ? ['maj', 'min', 'dim', 'aug', 'dom7', 'maj7', 'min7'] : ['m7b5', 'dim7', 'mMaj7', 'dom9', 'maj9', 'min9', 'maj7', 'dom7'];
    let q, r, notes, idx;
    for (let tries = 0; tries < 60; tries++) {
      q = rng.pick(pool);
      r = d <= 2 ? note(rng.pick(['C', 'D', 'E', 'F', 'G', 'A', 'B', 'Bb', 'Eb'])) : bestRoot(rng.int(0, 11), q, false);
      notes = T.chordNotes(r, q);
      idx = rng.int(1, notes.length - 1);
      if (d >= 3 && notes.length > 3 && rng.chance(0.6)) idx = notes.length - 1;
      if (Math.abs(notes[idx].a) <= 1) break;
    }
    const extra = rng.shuffle(notes.filter((_, i) => i !== idx)).slice(0, 2);
    return {
      key: 'chord-tone:' + q + ':' + idx,
      prompt: `What is the <b>${TONE_NAME[idx]}</b> of <b>${chordLabel(r, q)}</b>?`,
      input: choice(rng, fmt(notes[idx]), noteDistractors(rng, notes[idx], extra)),
      answerText: fmt(notes[idx]),
      explain: `${chordLabel(r, q)} is spelled ${notes.map((n, i) => (i === idx ? `<b>${fmt(n)}</b>` : fmt(n))).join(' – ')}. A ${CHORDS[q].name} chord uses the formula <b>${CHORDS[q].formula}</b> — numbers are steps of the major scale built on the root.`,
      reveal: pianoOf(notes),
    };
  });

  def('sig-count', 'keys', 'brain', 2, 3, (rng, d) => {
    const mode = d >= 3 && rng.chance(0.5) ? 'minor' : 'major';
    const sig = rng.int(d <= 2 ? -5 : -7, d <= 2 ? 5 : 7);
    const tonic = keyFromSig(sig, mode);
    const lab = (s) => cap(T.sigText(s));
    const ds = rng.shuffle([sig - 1, sig + 1, -sig, sig + 2, sig - 2].filter((s) => s !== sig && Math.abs(s) <= 7)).map(lab);
    return {
      key: 'sig-count:' + sig + (mode === 'minor' ? 'm' : ''),
      prompt: `How many sharps or flats does <b>${keyName(tonic, mode)}</b> have?`,
      input: choice(rng, lab(sig), ds),
      answerText: lab(sig),
      explain: `<b>${cap(keyName(tonic, mode))}</b> has ${T.sigText(sig)}${sig ? ': ' + T.sigNotes(sig).join(' ') : ''}.` +
        (mode === 'minor' ? ` It shares that signature with its relative major, ${keyName(keyFromSig(sig, 'major'), 'major')}.` : '') +
        ' Sharps always arrive in the order F C G D A E B; flats arrive in the reverse order, B E A D G C F.',
      reveal: { kind: 'staff', clef: 'treble', sig, notes: [] },
    };
  });

  def('chord-formula', 'chords', 'brain', 2, 4, (rng, d) => {
    const pool = d <= 2 ? ['maj', 'min', 'dim', 'aug'] : d === 3 ? ['maj', 'min', 'dim', 'aug', 'sus2', 'sus4', 'maj7', 'dom7', 'min7'] : ['maj7', 'dom7', 'min7', 'm7b5', 'dim7', 'mMaj7', 'six', 'min6', 'dom9', 'add9'];
    const q = rng.pick(pool);
    const reverse = rng.chance(0.5);
    const others = rng.shuffle(pool.filter((x) => x !== q));
    others.sort((a, b) => Math.abs(CHORDS[a].iv.length - CHORDS[q].iv.length) - Math.abs(CHORDS[b].iv.length - CHORDS[q].iv.length));
    const r = note('C', 4);
    return {
      key: 'chord-formula:' + q,
      prompt: reverse ? `Which chord has the formula <b>${CHORDS[q].formula}</b>?` : `Which formula builds a <b>${CHORDS[q].name}</b> chord?`,
      sub: 'Numbers are steps of the major scale starting on the chord’s root.',
      input: reverse ? choice(rng, qualityLabel(q), others.map(qualityLabel)) : choice(rng, CHORDS[q].formula, others.map((x) => CHORDS[x].formula)),
      answerText: reverse ? qualityLabel(q) : CHORDS[q].formula,
      explain: `<b>${qualityLabel(q)}</b> = <b>${CHORDS[q].formula}</b> — ${CHORDS[q].feel}. On C that gives ${spell(T.chordNotes(r, q))}.`,
      reveal: pianoOf(T.chordNotes(r, q)),
      audioAfter: blk(T.chordNotes(r, q).map(midi), 0, 1.6),
    };
  });

  const MODES = [
    { id: 'major', label: 'Ionian (major)', desc: 'exactly the plain major scale', white: 'C' },
    { id: 'dorian', label: 'Dorian', desc: 'a natural minor scale with a raised 6th', white: 'D' },
    { id: 'phrygian', label: 'Phrygian', desc: 'a natural minor scale with a ♭2', white: 'E' },
    { id: 'lydian', label: 'Lydian', desc: 'a major scale with a ♯4', white: 'F' },
    { id: 'mixolydian', label: 'Mixolydian', desc: 'a major scale with a ♭7', white: 'G' },
    { id: 'minor', label: 'Aeolian (natural minor)', desc: 'exactly the plain natural minor scale', white: 'A' },
    { id: 'locrian', label: 'Locrian', desc: 'a natural minor scale with a ♭2 and a ♭5', white: 'B' },
  ];
  def('mode-char', 'scales', 'brain', 4, 5, (rng, d) => {
    const mi = rng.int(0, 6);
    const m = MODES[mi];
    const form = d >= 5 ? rng.pick(['notes', 'notes', 'desc']) : rng.pick(['desc', 'white']);
    let prompt, visual = null, r = note(m.white), tail = '';
    if (form === 'desc') prompt = `Which mode is <b>${m.desc}</b>?`;
    else if (form === 'white') prompt = `Play only white keys from <b>${m.white} up to ${m.white}</b>. Which mode is that?`;
    else {
      for (let tries = 0; tries < 40; tries++) {
        r = bestRoot(rng.int(0, 11), m.id, true);
        if (T.scaleNotes(r, m.id).every((n) => Math.abs(n.a) <= 1)) break;
      }
      prompt = 'These notes, starting from the first one — which mode?';
      visual = { kind: 'text', big: T.scaleNotes(r, m.id).map(fmt).join('  ') };
      tail = ` Compare with ${fmt(r)} ${T.MINORISH[m.id] ? 'natural minor' : 'major'} and spot the altered note.`;
    }
    const sc = T.scaleNotes(r, m.id);
    return {
      key: 'mode:' + m.id,
      prompt, visual,
      input: choice(rng, m.label, rng.shuffle(MODES.filter((x) => x !== m)).map((x) => x.label)),
      answerText: m.label,
      explain: `<b>${m.label}</b> is ${m.desc} — ${SCALES[m.id].feel}. The seven modes are the major scale started on each of its notes: 1 Ionian, 2 Dorian, 3 Phrygian, 4 Lydian, 5 Mixolydian, 6 Aeolian, 7 Locrian.${tail}`,
      reveal: pianoOf(sc),
      audioAfter: mel(sc.map(midi).concat([midi(sc[0]) + 12]), 0.3, 0.45),
    };
  });

  // =====================================================================
  // BUILD (tap the keyboard)
  // =====================================================================
  def('build-interval', 'intervals', 'build', 1, 2, (rng, d) => {
    const pool = d <= 1 ? [2, 3, 4, 5, 7, 12] : [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
    const s = rng.pick(pool);
    const given = rng.int(60, 69);
    return {
      key: 'build-interval:' + s,
      prompt: `Tap the note a <b>${SEMI_NAME[s].toLowerCase()}</b> above the marked key.`,
      sub: `The marked key is ${T.PC_BOTH[given % 12]}.`,
      input: { kind: 'piano', lo: 60, hi: 83, given: [given], targetMidis: [given + s], exact: true, max: 1 },
      answerText: T.PC_BOTH[(given + s) % 12],
      explain: `<b>${SEMI_NAME[s]}</b> = ${s} semitone${s > 1 ? 's' : ''}. From ${T.PC_BOTH[given % 12]}, count up ${s} key${s > 1 ? 's' : ''} (black and white both count) and you land on <b>${T.PC_BOTH[(given + s) % 12]}</b>.`,
      audioAfter: mel([given, given + s], 0.6, 0.9),
    };
  });

  def('build-chord', 'chords', 'build', 1, 5, (rng, d) => {
    const pool = [null,
      ['maj', 'min'], ['maj', 'min'],
      ['dim', 'aug', 'sus4', 'sus2', 'dom7', 'maj7', 'min7'],
      ['m7b5', 'dim7', 'mMaj7', 'six', 'min6', 'maj7', 'dom7', 'min7'],
      ['dom9', 'maj9', 'min9', 'add9', 'm7b5', 'mMaj7'],
    ][d];
    const q = rng.pick(pool);
    const r = d <= 1 ? note(rng.pick(['C', 'D', 'E', 'F', 'G', 'A']), 4) : bestRoot(rng.int(0, 11), q, false, 4);
    const notes = T.chordNotes(r, q);
    const n = notes.length;
    const how = q === 'maj' ? ' Shortcut: from the root, go up 4 semitones, then 3 more.' : q === 'min' ? ' Shortcut: from the root, go up 3 semitones, then 4 more.' : '';
    return {
      key: 'build-chord:' + q,
      prompt: `Build <b>${chordLabel(r, q)}</b> on the keyboard.`,
      sub: `Tap its ${n} notes — any octave works.`,
      input: { kind: 'piano', lo: 60, hi: 83, targetPcs: notes.map(pc), max: n + 2 },
      answerText: spell(notes),
      explain: `<b>${chordLabel(r, q)}</b> = ${spell(notes)}. Formula <b>${CHORDS[q].formula}</b> — ${CHORDS[q].feel}.${how}`,
      reveal: pianoOf(notes),
      audioAfter: blk(notes.map(midi), 0, 1.6),
    };
  });

  def('build-scale', 'scales', 'build', 3, 5, (rng, d) => {
    const pool = d <= 3 ? ['major', 'major', 'majpent', 'minor'] : d === 4 ? ['minor', 'harmonic', 'dorian', 'mixolydian', 'minpent'] : ['lydian', 'phrygian', 'locrian', 'melodic', 'blues', 'wholetone'];
    const s = rng.pick(pool);
    let r;
    for (let tries = 0; tries < 40; tries++) {
      r = bestRoot(rng.int(0, 11), s, true, 4);
      const ns = T.scaleNotes(r, s);
      const accs = ns.filter((n) => n.a !== 0).length;
      if (ns.every((n) => Math.abs(n.a) <= 1) && (d > 3 || accs <= 4)) break;
    }
    const notes = T.scaleNotes(r, s);
    return {
      key: 'build-scale:' + s,
      prompt: `Tap every note of the <b>${fmt(r)} ${SCALES[s].name}</b> scale.`,
      sub: `${notes.length} different notes — any octave, any order.`,
      input: { kind: 'piano', lo: 60, hi: 83, targetPcs: notes.map(pc), max: notes.length + 3 },
      answerText: spell(notes),
      explain: `<b>${fmt(r)} ${SCALES[s].name}</b>: ${spell(notes)} — ${SCALES[s].feel}.` + (s === 'major' ? ' Steps: whole, whole, half, whole, whole, whole, half.' : ''),
      reveal: pianoOf(notes),
      audioAfter: mel(notes.map(midi).concat([midi(notes[0]) + 12]), 0.3, 0.45),
    };
  });

  // =====================================================================
  // Assembly
  // =====================================================================
  const byId = {};
  GENS.forEach((g) => { byId[g.id] = g; });

  function make(gen, rng, d) {
    const dd = clamp(d, gen.min, gen.max);
    const q = gen.make(rng, dd);
    q.gen = gen.id; q.skill = gen.skill; q.sense = gen.sense; q.diff = dd;
    return q;
  }

  const SKILLS = [
    { id: 'intervals', name: 'Intervals', icon: '↕', blurb: 'The distance between two notes' },
    { id: 'chords', name: 'Chords', icon: '♫', blurb: 'Triads, 7ths and beyond' },
    { id: 'scales', name: 'Scales & Modes', icon: '∿', blurb: 'Major, minor and the seven modes' },
    { id: 'keys', name: 'Keys', icon: '♯', blurb: 'Key signatures and relatives' },
    { id: 'reading', name: 'Reading', icon: '𝄚', blurb: 'Notes on the staff and keyboard' },
    { id: 'harmony', name: 'Harmony', icon: 'V', blurb: 'How chords work inside a key' },
  ];
  const SENSES = { ear: 'Ear', eye: 'Eye', brain: 'Brain', build: 'Build' };

  const TIERS = {
    beginner: { name: 'Beginner', blurb: 'New to theory, or it’s been a while', range: [1, 2],
      slots: [['eye', 1], ['ear', 1], ['brain', 1], ['eye', 1], ['ear', 2], ['build', 1], ['brain', 2], ['ear', 1]] },
    intermediate: { name: 'Intermediate', blurb: 'I know my scales and basic chords', range: [2, 3],
      slots: [['eye', 2], ['ear', 2], ['brain', 2], ['eye', 3], ['ear', 3], ['build', 3], ['brain', 3], ['ear', 3]] },
    advanced: { name: 'Advanced', blurb: 'Modes, 7th chords, bring it on', range: [3, 5],
      slots: [['eye', 3], ['ear', 3], ['brain', 3], ['eye', 4], ['ear', 4], ['build', 4], ['brain', 4], ['ear', 5]] },
  };

  function pickGen(rng, sense, d, used, skill) {
    let c = GENS.filter((g) => (!sense || g.sense === sense) && (!skill || g.skill === skill) && g.min <= d && g.max >= d);
    const fresh = c.filter((g) => !used || !used.has(g.id));
    if (fresh.length) c = fresh;
    if (!c.length) c = GENS.filter((g) => (!sense || g.sense === sense) && (!skill || g.skill === skill));
    if (!c.length) c = GENS;
    return rng.pick(c);
  }

  // The same eight questions for everyone on a given day and tier.
  function daily(dateStr, tier) {
    const rng = T.makeRng('tonic:' + dateStr + ':' + tier);
    const used = new Set();
    return TIERS[tier].slots.map(([sense, d]) => {
      const g = pickGen(rng, sense, d, used);
      used.add(g.id);
      return make(g, rng, d);
    });
  }

  // Practice: sample a few candidates and serve the one you're weakest at.
  function practice(rng, opts) {
    const [lo, hi] = TIERS[opts.tier].range;
    const items = opts.items || {};
    const recentGens = new Set(opts.recentGens || []);
    const recentKeys = new Set(opts.recentKeys || []);
    let best = null, bestScore = 1e9;
    for (let i = 0; i < 6; i++) {
      const d = rng.int(lo, hi);
      const g = pickGen(rng, null, d, recentGens, opts.skill === 'mix' ? null : opts.skill);
      const q = make(g, rng, d);
      const it = items[q.key];
      const strength = it ? it.s : 0.35;
      // weak items float to the top, but never the exact thing you just saw
      const score = strength + rng() * 0.45 + (recentKeys.has(q.key) ? 5 : 0);
      if (score < bestScore) { bestScore = score; best = q; }
    }
    return best;
  }

  // Survival: difficulty climbs every few questions.
  function survival(rng, tier, n, lastGen) {
    const [lo] = TIERS[tier].range;
    const d = clamp(lo + Math.floor(n / 4), 1, 5);
    const g = pickGen(rng, rng.chance(0.18) ? 'build' : rng.pick(['ear', 'eye', 'brain']), d, lastGen ? new Set([lastGen]) : null);
    return make(g, rng, d);
  }

  root.Questions = { GENS, byId, make, daily, practice, survival, SKILLS, SENSES, TIERS, bestRoot, chordLabel };
})(typeof window !== 'undefined' ? window : globalThis);
