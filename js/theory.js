/* Tonic — music theory engine.
   Notes are {l, a, o}: letter index 0-6 (C..B), accidental (-2..2), octave.
   Everything is spelled properly (E♭ major has a G, not an F𝄪), because
   learning the right spelling is half the point. */
(function (root) {
  'use strict';

  const LETTERS = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
  const LETTER_PC = [0, 2, 4, 5, 7, 9, 11];
  const mod = (n, m) => ((n % m) + m) % m;

  // ---------- notes ----------
  function note(s, o) {
    const l = LETTERS.indexOf(s[0].toUpperCase());
    let a = 0;
    for (const ch of s.slice(1)) {
      if (ch === '#' || ch === '♯') a++;
      else if (ch === 'b' || ch === '♭') a--;
      else if (ch === 'x' || ch === '×') a += 2;
    }
    return { l, a, o: o === undefined ? 4 : o };
  }
  const midi = (n) => 12 * (n.o + 1) + LETTER_PC[n.l] + n.a;
  const pc = (n) => mod(LETTER_PC[n.l] + n.a, 12);
  function accStr(a) {
    if (a === 2) return '×';
    if (a > 0) return '♯'.repeat(a);
    if (a < 0) return '♭'.repeat(-a);
    return '';
  }
  // ---------- how note names are written (a display setting) ----------
  // 'en'   — C D E F♯ B♭
  // 'both' — the letter, then the French solfège name: C do, F♯ fa♯, B♭ si♭
  // 'fr'   — do ré mi fa♯ si♭
  // Only the display changes: keys, parsing and answer checking always use the English spelling.
  const SOLFEGE = ['do', 'ré', 'mi', 'fa', 'sol', 'la', 'si'];
  const NAMINGS = ['en', 'both', 'fr'];
  let naming = 'en';
  const namingListeners = [];
  function setNaming(m) {
    const next = NAMINGS.includes(m) ? m : 'en';
    if (next === naming) return;
    naming = next;
    namingListeners.forEach((fn) => fn(naming));
  }
  const getNaming = () => naming;
  const onNaming = (fn) => { namingListeners.push(fn); };
  const fmtEn = (n) => LETTERS[n.l] + accStr(n.a);
  const fmtFr = (n) => SOLFEGE[n.l] + accStr(n.a);
  function fmt(n) {
    if (naming === 'fr') return fmtFr(n);
    if (naming === 'both') return fmtEn(n) + ' ' + fmtFr(n);
    return fmtEn(n);
  }
  // Accepts a note object or an English spelling such as 'F#', 'B♭'.
  const asNote = (x) => (typeof x === 'string' ? note(x) : x);
  const nm = (x) => fmt(asNote(x));
  const letterName = (l) => fmt({ l, a: 0, o: 4 });
  // A root plus a chord symbol. French symbols keep "m" attached (lam, rém7) but put a space
  // before words (do maj7, ré sus4) so they stay readable. 'both' shows the English symbol, then the French one.
  function withSym(x, sym) {
    const n = asNote(x);
    if (!sym) return fmt(n);
    const fr = fmtFr(n) + (/^(maj|sus|add|\()/.test(sym) ? ' ' : '') + sym;
    if (naming === 'fr') return fr;
    if (naming === 'both') return fmtEn(n) + sym + ' ' + fr;
    return fmtEn(n) + sym;
  }
  // A list of notes (or chord symbols). In 'both' the French names follow in brackets:
  // "C – E – G (do – mi – sol)" reads better than "C do – E mi – G sol".
  function spell(items, sep) {
    sep = sep === undefined ? ' – ' : sep;
    const seps = Array.isArray(sep) ? sep : items.map(() => sep);
    const join = (names) => names.reduce((s, x, i) => s + (i ? seps[i - 1] : '') + x, '');
    const parts = items.map((it) => (Array.isArray(it) ? it : [it, '']));
    const saved = naming;
    if (saved !== 'both') return join(parts.map(([x, sym]) => withSym(x, sym)));
    naming = 'en'; const en = join(parts.map(([x, sym]) => withSym(x, sym)));
    naming = 'fr'; const fr = join(parts.map(([x, sym]) => withSym(x, sym)));
    naming = saved;
    return items.length > 1 ? en + ' (' + fr + ')' : en + ' ' + fr;
  }
  // Note names inside prose are written as tokens: {C}, {F#}, {Dm7}, {B°}, or a list {E G B D F} / {C – E – G}.
  // Text outside braces is left alone, so "A sharp" or "a C" in a sentence is never mistaken for a note.
  const TOKEN_ITEM = /^([A-G](?:#|♯|b|♭)?)(.*)$/;
  function tx(str) {
    if (typeof str !== 'string' || str.indexOf('{') < 0) return str;
    return str.replace(/\{([A-G][^{}]*)\}/g, (whole, body) => {
      const bits = body.split(/(\s*[–→,·]\s*|\s+)/);
      const items = [], seps = [];
      for (let i = 0; i < bits.length; i++) {
        if (i % 2) { seps.push(bits[i]); continue; }
        const m2 = TOKEN_ITEM.exec(bits[i]);
        if (!m2) return whole;
        items.push([m2[1], m2[2]]);
      }
      return items.length === 1 ? withSym(items[0][0], items[0][1]) : spell(items, seps);
    });
  }

  // ---------- intervals: [diatonic steps, semitones] ----------
  const IV = {
    P1: [0, 0], m2: [1, 1], M2: [1, 2], A2: [1, 3], m3: [2, 3], M3: [2, 4],
    P4: [3, 5], A4: [3, 6], d5: [4, 6], P5: [4, 7], A5: [4, 8], m6: [5, 8],
    M6: [5, 9], d7: [6, 9], m7: [6, 10], M7: [6, 11], P8: [7, 12],
    m9: [8, 13], M9: [8, 14], A9: [8, 15], P11: [10, 17], A11: [10, 18], M13: [12, 21],
  };
  const IV_NAME = {
    P1: 'Unison', m2: 'Minor 2nd', M2: 'Major 2nd', m3: 'Minor 3rd', M3: 'Major 3rd',
    P4: 'Perfect 4th', A4: 'Augmented 4th', d5: 'Diminished 5th', P5: 'Perfect 5th',
    A5: 'Augmented 5th', m6: 'Minor 6th', M6: 'Major 6th', d7: 'Diminished 7th',
    m7: 'Minor 7th', M7: 'Major 7th', P8: 'Octave', m9: 'Minor 9th', M9: 'Major 9th',
  };
  // Names by size in semitones — used when there is no spelling (ear, keyboard).
  const SEMI_NAME = ['Unison', 'Minor 2nd', 'Major 2nd', 'Minor 3rd', 'Major 3rd', 'Perfect 4th',
    'Tritone', 'Perfect 5th', 'Minor 6th', 'Major 6th', 'Minor 7th', 'Major 7th', 'Octave'];
  const SEMI_HINT = [
    'the same note twice',
    '1 semitone — the tightest, most dissonant step. Think of the “Jaws” theme.',
    '2 semitones — one whole step, the first two notes of a major scale.',
    '3 semitones — the sad, dark third that makes a chord minor.',
    '4 semitones — the bright, happy third that makes a chord major.',
    '5 semitones — open and strong, like the start of “Here Comes the Bride”.',
    '6 semitones — exactly half an octave. Tense and restless.',
    '7 semitones — hollow, stable and powerful. The power-chord interval.',
    '8 semitones — a bittersweet, yearning leap.',
    '9 semitones — a warm, sweet leap, like “My Bonnie Lies Over the Ocean”.',
    '10 semitones — bluesy and unresolved, the top of a dominant 7th chord.',
    '11 semitones — one semitone short of an octave. Sharp and dreamy.',
    '12 semitones — the same note, one register higher.',
  ];

  function up(n, iv) {
    const [st, se] = IV[iv];
    const d = n.o * 7 + n.l + st;
    const o = Math.floor(d / 7), l = mod(d, 7);
    return { l, o, a: midi(n) + se - (12 * (o + 1) + LETTER_PC[l]) };
  }
  function down(n, iv) {
    const [st, se] = IV[iv];
    const d = n.o * 7 + n.l - st;
    const o = Math.floor(d / 7), l = mod(d, 7);
    return { l, o, a: midi(n) - se - (12 * (o + 1) + LETTER_PC[l]) };
  }

  // ---------- chords ----------
  const CHORDS = {
    maj:   { sym: '',        name: 'major',               iv: ['P1', 'M3', 'P5'],             formula: '1 3 5',        feel: 'bright and stable' },
    min:   { sym: 'm',       name: 'minor',               iv: ['P1', 'm3', 'P5'],             formula: '1 ♭3 5',       feel: 'darker and sadder' },
    dim:   { sym: '°',       name: 'diminished',          iv: ['P1', 'm3', 'd5'],             formula: '1 ♭3 ♭5',      feel: 'tense and unstable' },
    aug:   { sym: '+',       name: 'augmented',           iv: ['P1', 'M3', 'A5'],             formula: '1 3 ♯5',       feel: 'dreamy and unresolved' },
    sus2:  { sym: 'sus2',    name: 'sus2',                iv: ['P1', 'M2', 'P5'],             formula: '1 2 5',        feel: 'open and airy — no third at all' },
    sus4:  { sym: 'sus4',    name: 'sus4',                iv: ['P1', 'P4', 'P5'],             formula: '1 4 5',        feel: 'suspended — the 4th wants to fall to the 3rd' },
    maj7:  { sym: 'maj7',    name: 'major 7th',           iv: ['P1', 'M3', 'P5', 'M7'],       formula: '1 3 5 7',      feel: 'lush and jazzy' },
    dom7:  { sym: '7',       name: 'dominant 7th',        iv: ['P1', 'M3', 'P5', 'm7'],       formula: '1 3 5 ♭7',     feel: 'bluesy — it badly wants to resolve' },
    min7:  { sym: 'm7',      name: 'minor 7th',           iv: ['P1', 'm3', 'P5', 'm7'],       formula: '1 ♭3 5 ♭7',    feel: 'mellow and smooth' },
    m7b5:  { sym: 'ø7',      name: 'half-diminished 7th', iv: ['P1', 'm3', 'd5', 'm7'],       formula: '1 ♭3 ♭5 ♭7',   feel: 'mysterious and unsettled' },
    dim7:  { sym: '°7',      name: 'diminished 7th',      iv: ['P1', 'm3', 'd5', 'd7'],       formula: '1 ♭3 ♭5 ♭♭7',  feel: 'dramatic — a stack of minor 3rds' },
    mMaj7: { sym: 'm(maj7)', name: 'minor-major 7th',     iv: ['P1', 'm3', 'P5', 'M7'],       formula: '1 ♭3 5 7',     feel: 'the spy-movie chord' },
    six:   { sym: '6',       name: 'major 6th',           iv: ['P1', 'M3', 'P5', 'M6'],       formula: '1 3 5 6',      feel: 'sweet and vintage' },
    min6:  { sym: 'm6',      name: 'minor 6th',           iv: ['P1', 'm3', 'P5', 'M6'],       formula: '1 ♭3 5 6',     feel: 'smoky and bittersweet' },
    add9:  { sym: 'add9',    name: 'add9',                iv: ['P1', 'M3', 'P5', 'M9'],       formula: '1 3 5 9',      feel: 'a major triad with extra shimmer' },
    dom9:  { sym: '9',       name: 'dominant 9th',        iv: ['P1', 'M3', 'P5', 'm7', 'M9'], formula: '1 3 5 ♭7 9',   feel: 'funky and rich' },
    maj9:  { sym: 'maj9',    name: 'major 9th',           iv: ['P1', 'M3', 'P5', 'M7', 'M9'], formula: '1 3 5 7 9',    feel: 'silky and wide open' },
    min9:  { sym: 'm9',      name: 'minor 9th',           iv: ['P1', 'm3', 'P5', 'm7', 'M9'], formula: '1 ♭3 5 ♭7 9',  feel: 'deep and soulful' },
  };
  const chordNotes = (rootNote, q) => CHORDS[q].iv.map((iv) => up(rootNote, iv));
  const chordSym = (rootNote, q) => withSym(rootNote, CHORDS[q].sym);
  const chordLong = (rootNote, q) => fmt(rootNote) + ' ' + CHORDS[q].name;
  const chordPcs = (rootPc, q) => CHORDS[q].iv.map((iv) => mod(rootPc + IV[iv][1], 12));

  // ---------- scales ----------
  const SCALES = {
    major:      { name: 'major',            iv: ['P1', 'M2', 'M3', 'P4', 'P5', 'M6', 'M7'], feel: 'the bright “do-re-mi” scale' },
    minor:      { name: 'natural minor',    iv: ['P1', 'M2', 'm3', 'P4', 'P5', 'm6', 'm7'], feel: 'major with ♭3, ♭6 and ♭7 — dark and sad' },
    harmonic:   { name: 'harmonic minor',   iv: ['P1', 'M2', 'm3', 'P4', 'P5', 'm6', 'M7'], feel: 'natural minor with a raised 7th — that exotic gap near the top' },
    melodic:    { name: 'melodic minor',    iv: ['P1', 'M2', 'm3', 'P4', 'P5', 'M6', 'M7'], feel: 'a major scale with just a ♭3' },
    dorian:     { name: 'Dorian',           iv: ['P1', 'M2', 'm3', 'P4', 'P5', 'M6', 'm7'], feel: 'minor with a bright raised 6th — funky and hopeful' },
    phrygian:   { name: 'Phrygian',         iv: ['P1', 'm2', 'm3', 'P4', 'P5', 'm6', 'm7'], feel: 'minor with a ♭2 — dark, Spanish-sounding' },
    lydian:     { name: 'Lydian',           iv: ['P1', 'M2', 'M3', 'A4', 'P5', 'M6', 'M7'], feel: 'major with a ♯4 — floating and magical' },
    mixolydian: { name: 'Mixolydian',       iv: ['P1', 'M2', 'M3', 'P4', 'P5', 'M6', 'm7'], feel: 'major with a ♭7 — rock and blues' },
    locrian:    { name: 'Locrian',          iv: ['P1', 'm2', 'm3', 'P4', 'd5', 'm6', 'm7'], feel: 'minor with ♭2 and ♭5 — the most unstable mode' },
    majpent:    { name: 'major pentatonic', iv: ['P1', 'M2', 'M3', 'P5', 'M6'],             feel: 'the major scale minus the 4th and 7th — no clashes' },
    minpent:    { name: 'minor pentatonic', iv: ['P1', 'm3', 'P4', 'P5', 'm7'],             feel: 'five notes, the backbone of rock and blues solos' },
    blues:      { name: 'blues',            iv: ['P1', 'm3', 'P4', 'd5', 'P5', 'm7'],       feel: 'minor pentatonic plus the gritty ♭5 “blue note”' },
    wholetone:  { name: 'whole tone',       iv: ['P1', 'M2', 'M3', 'd5', 'm6', 'm7'],       feel: 'all whole steps — weightless and dreamlike' },
  };
  const scaleNotes = (rootNote, s) => SCALES[s].iv.map((iv) => up(rootNote, iv));
  const scalePcs = (rootPc, s) => SCALES[s].iv.map((iv) => mod(rootPc + IV[iv][1], 12));

  // ---------- keys ----------
  // sig: positive = number of sharps, negative = number of flats.
  const MAJOR_KEYS = [
    ['C', 0], ['G', 1], ['D', 2], ['A', 3], ['E', 4], ['B', 5], ['F#', 6], ['C#', 7],
    ['F', -1], ['Bb', -2], ['Eb', -3], ['Ab', -4], ['Db', -5], ['Gb', -6], ['Cb', -7],
  ].map(([n, sig]) => ({ tonic: note(n), sig }));
  const majorKeyBySig = (sig) => MAJOR_KEYS.find((k) => k.sig === sig);
  const relMinor = (majTonic) => { const n = down({ ...majTonic, o: 4 }, 'm3'); return { l: n.l, a: n.a, o: 4 }; };
  const SHARP_ORDER = ['F', 'C', 'G', 'D', 'A', 'E', 'B'];
  const FLAT_ORDER = ['B', 'E', 'A', 'D', 'G', 'C', 'F'];
  function sigText(sig) {
    if (sig === 0) return 'no sharps or flats';
    const n = Math.abs(sig);
    return n + (sig > 0 ? ' sharp' : ' flat') + (n > 1 ? 's' : '');
  }
  function sigNotes(sig) {
    return (sig >= 0 ? SHARP_ORDER.slice(0, sig).map((x) => x + '♯') : FLAT_ORDER.slice(0, -sig).map((x) => x + '♭')).map(nm);
  }
  // The same notes as one readable list ("F♯ C♯ (fa♯ do♯)" in the English + French setting).
  const sigList = (sig) => spell(sig >= 0 ? SHARP_ORDER.slice(0, sig).map((x) => x + '♯') : FLAT_ORDER.slice(0, -sig).map((x) => x + '♭'), ' ');

  const DIATONIC = {
    major: {
      scale: 'major',
      triads: ['maj', 'min', 'min', 'maj', 'maj', 'min', 'dim'],
      sevenths: ['maj7', 'min7', 'min7', 'maj7', 'dom7', 'min7', 'm7b5'],
      numerals: ['I', 'ii', 'iii', 'IV', 'V', 'vi', 'vii°'],
      numerals7: ['Imaj7', 'ii7', 'iii7', 'IVmaj7', 'V7', 'vi7', 'viiø7'],
    },
    minor: {
      scale: 'minor',
      triads: ['min', 'dim', 'maj', 'min', 'min', 'maj', 'maj'],
      sevenths: ['min7', 'm7b5', 'maj7', 'min7', 'min7', 'maj7', 'dom7'],
      numerals: ['i', 'ii°', 'III', 'iv', 'v', 'VI', 'VII'],
      numerals7: ['i7', 'iiø7', 'IIImaj7', 'iv7', 'v7', 'VImaj7', 'VII7'],
    },
  };
  function diatonicChord(tonic, mode, degree, seventh) {
    const d = DIATONIC[mode];
    const r = scaleNotes(tonic, d.scale)[degree];
    const q = (seventh ? d.sevenths : d.triads)[degree];
    return { root: r, q, numeral: (seventh ? d.numerals7 : d.numerals)[degree] };
  }

  // ---------- pitch-class display ----------
  const PC_SHARP = ['C', 'C♯', 'D', 'D♯', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'A♯', 'B'];
  const PC_FLAT = ['C', 'D♭', 'D', 'E♭', 'E', 'F', 'G♭', 'G', 'A♭', 'A', 'B♭', 'B'];
  const PC_BOTH = PC_SHARP.map((s, i) => (s === PC_FLAT[i] ? s : s + ' / ' + PC_FLAT[i]));
  const IS_BLACK = [0, 1, 0, 1, 0, 0, 1, 0, 1, 0, 1, 0];
  // Display name of a pitch class. style: 'sharp' (default), 'flat', or 'both' ("C♯ / D♭").
  // PC_SHARP / PC_FLAT above stay English: they are parsed back into notes elsewhere.
  function pcName(p, style) {
    p = mod(p, 12);
    const s = nm(PC_SHARP[p]), f = nm(PC_FLAT[p]);
    if (style === 'flat') return f;
    if (style === 'both') return s === f ? s : s + ' / ' + f;
    return s;
  }
  // The usual spelling for a chord/scale root on each pitch class.
  const ROOT_MAJORISH = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'];
  const ROOT_MINORISH = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'G#', 'A', 'Bb', 'B'];
  const MINORISH = { min: 1, dim: 1, min7: 1, m7b5: 1, dim7: 1, mMaj7: 1, min6: 1, min9: 1,
    minor: 1, harmonic: 1, melodic: 1, dorian: 1, phrygian: 1, locrian: 1, minpent: 1, blues: 1 };
  const rootFor = (pcNum, type, o) => note((MINORISH[type] ? ROOT_MINORISH : ROOT_MAJORISH)[mod(pcNum, 12)], o);

  // ---------- seeded randomness ----------
  function hashStr(str) {
    let h = 1779033703 ^ str.length;
    for (let i = 0; i < str.length; i++) {
      h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
      h = (h << 13) | (h >>> 19);
    }
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return (h ^= h >>> 16) >>> 0;
  }
  function makeRng(seed) {
    let a = typeof seed === 'string' ? hashStr(seed) : seed >>> 0;
    const r = function () {
      a |= 0; a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    r.int = (lo, hi) => lo + Math.floor(r() * (hi - lo + 1));
    r.pick = (arr) => arr[Math.floor(r() * arr.length)];
    r.shuffle = (arr) => {
      const a2 = arr.slice();
      for (let i = a2.length - 1; i > 0; i--) {
        const j = Math.floor(r() * (i + 1));
        [a2[i], a2[j]] = [a2[j], a2[i]];
      }
      return a2;
    };
    r.chance = (p) => r() < p;
    return r;
  }

  root.Theory = {
    LETTERS, LETTER_PC, mod, note, midi, pc, fmt, accStr,
    SOLFEGE, NAMINGS, setNaming, getNaming, onNaming, fmtEn, nm, letterName, withSym, spell, tx, pcName, IV, IV_NAME, SEMI_NAME, SEMI_HINT, up, down,
    CHORDS, chordNotes, chordSym, chordLong, chordPcs, SCALES, scaleNotes, scalePcs,
    MAJOR_KEYS, majorKeyBySig, relMinor, SHARP_ORDER, FLAT_ORDER, sigText, sigNotes, sigList,
    DIATONIC, diatonicChord, PC_SHARP, PC_FLAT, PC_BOTH, IS_BLACK, rootFor, MINORISH, makeRng, hashStr,
  };
})(typeof window !== 'undefined' ? window : globalThis);
