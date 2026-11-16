/* Tonic — the Learn path. Twelve short lessons for people starting from zero.
   Each lesson is a few illustrated cards (read, look, listen) and then a
   five-question quiz on exactly what was just taught.
   Card: { h: title, p: html, v: visual, a: audio events, al: audio button label }
   Quiz: [[generatorId, difficulty, options, count], ...] */
(function (root) {
  'use strict';
  const T = root.Theory, GT = root.Guitar;
  const n = (s, o) => T.note(s, o);
  const m = (s, o) => T.midi(n(s, o));

  // --- small builders ---
  function piano(names, lo, hi, opts) {
    const marks = [], labels = {};
    names.forEach(([nm, o, lab]) => { const mm = m(nm, o); marks.push(mm); labels[mm] = lab === undefined ? T.fmt(n(nm, o)) : lab; });
    return Object.assign({ kind: 'piano', lo, hi, marks, labels }, opts || {});
  }
  const mel = (midis, step, at) => midis.map((x, i) => ({ at: (at || 0) + i * step, midis: [x], dur: step * 1.25 }));
  const blk = (midis, at, dur) => ({ at: at || 0, midis, dur: dur || 1.3 });
  const chordOf = (r, o, q) => T.chordNotes(n(r, o), q).map(T.midi);
  const scaleOf = (r, o, s) => T.scaleNotes(n(r, o), s).map(T.midi).concat([m(r, o) + 12]);
  const seqChords = (list, step) => list.map((c, i) => blk(c, i * step, step * 0.95));
  const staff = (notes, layout, sig) => ({ kind: 'staff', clef: 'treble', sig: sig || 0, layout: layout || 'melodic', notes: notes.map(([nm, o]) => n(nm, o)) });
  const box = (id, withNotes) => { const sh = GT.shapeById(id); return { kind: 'chordbox', frets: sh.frets, notes: withNotes ? GT.shapeNotes(sh) : null }; };
  const strums = (ids, step) => [].concat(...ids.map((id, i) => GT.strum(GT.shapeById(id).frets, i * step)));
  const whites = (lo) => ['C', 'D', 'E', 'F', 'G', 'A', 'B'].map((x) => [x, lo]);

  const LESSONS = [
    {
      id: 'alphabet', icon: '🔤', title: 'The musical alphabet', blurb: 'Seven note names and where they live on a keyboard',
      cards: [
        { h: 'Seven letters, over and over',
          p: 'Music uses just seven note names: <b>A B C D E F G</b>. After G it starts again at A. On a piano, those are the white keys.',
          v: piano(whites(4).concat(whites(5)), 60, 83), a: mel(scaleOf('C', 4, 'major'), 0.34), al: 'Hear C up to C' },
        { h: 'Use the black keys as a map',
          p: 'Black keys come in groups of <b>two</b> and <b>three</b>. <b>C</b> is always just left of a group of two. <b>F</b> is just left of a group of three. Find those two and you can name every other key by counting letters.',
          v: piano([['C', 3], ['F', 3], ['C', 4], ['F', 4]], 48, 71) },
        { h: 'Right is higher',
          p: 'Move right and notes sound <b>higher</b>; move left and they sound <b>lower</b>. Every C sounds like “the same note” in a higher or lower voice. The distance from one C to the next is called an <b>octave</b>.',
          v: piano([['C', 4], ['C', 5]], 60, 83), a: mel([60, 72], 0.7).concat([blk([60, 72], 1.6)]), al: 'Hear two Cs' },
      ],
      quiz: [['piano-note', 1, { white: true }, 3], ['ear-direction', 1, null, 2]],
    },
    {
      id: 'steps', icon: '🪜', title: 'Sharps, flats and steps', blurb: 'The black keys, half steps and whole steps',
      cards: [
        { h: 'The black keys have two names',
          p: 'A <b>sharp (♯)</b> means “one key to the right”. A <b>flat (♭)</b> means “one key to the left”. So the black key between C and D is both <b>C♯</b> and <b>D♭</b> — one key, two names.',
          v: piano([['C', 4], ['C#', 4], ['D', 4]], 60, 83), a: mel([60, 61, 62], 0.6), al: 'Hear C, C♯, D' },
        { h: 'Half steps and whole steps',
          p: 'From any key to the very next key — black or white — is a <b>half step</b> (also called a semitone). Two half steps make a <b>whole step</b>. These two small distances build every scale and chord.',
          v: piano([['E', 4], ['F#', 4, 'F♯'], ['F', 4]], 60, 83), a: mel([64, 65], 0.6).concat(mel([64, 66], 0.6, 1.6)), al: 'Half step, then whole step' },
        { h: 'Two places to watch out for',
          p: '<b>E–F</b> and <b>B–C</b> have no black key between them. They are only a <b>half step</b> apart even though both are white keys. Everywhere else, two neighbouring white keys are a whole step apart.',
          v: piano([['E', 4], ['F', 4], ['B', 4], ['C', 5]], 60, 83) },
      ],
      quiz: [['piano-note', 1, null, 2], ['interval-math', 1, null, 2], ['semitones', 1, null, 1]],
    },
    {
      id: 'major-scale', icon: '☀️', title: 'The major scale', blurb: 'The do-re-mi pattern behind most music',
      cards: [
        { h: 'A scale is a ladder of notes',
          p: 'The <b>major scale</b> is the bright “do-re-mi” sound: seven notes, then the first one again an octave higher. C major is the easy one — every white key from C to C.',
          v: piano(whites(4).concat([['C', 5]]), 60, 83), a: mel(scaleOf('C', 4, 'major'), 0.34), al: 'Hear C major' },
        { h: 'The secret is the pattern',
          p: 'What makes it <i>major</i> is the order of steps: <b>whole, whole, half — whole, whole, whole, half</b>. Start on any note, follow that pattern, and you get that note’s major scale.',
          v: { kind: 'text', big: 'W  W  H  W  W  W  H' } },
        { h: 'Try it from G',
          p: 'Follow the pattern from G: G A B C D E… and then a whole step up from E is <b>F♯</b>, not F. That one black key is why the key of G “has one sharp”.',
          v: piano([['G', 3], ['A', 3], ['B', 3], ['C', 4], ['D', 4], ['E', 4], ['F#', 4], ['G', 4]], 48, 71), a: mel(scaleOf('G', 3, 'major'), 0.34), al: 'Hear G major' },
      ],
      quiz: [['scale-degree', 1, null, 3], ['build-scale', 3, { scale: 'major', roots: [0, 7, 5] }, 2]],
    },
    {
      id: 'intervals', icon: '↕️', title: 'Intervals', blurb: 'Measuring and hearing the distance between two notes',
      cards: [
        { h: 'An interval is a distance',
          p: 'We name intervals by counting letter names, including both ends. C to D is a <b>2nd</b>, C to E is a <b>3rd</b>, C to G is a <b>5th</b>, and C to the next C is an <b>octave</b>.',
          v: piano([['C', 4], ['D', 4], ['E', 4], ['G', 4], ['C', 5]], 60, 83),
          a: mel([60, 62], 0.5).concat(mel([60, 64], 0.5, 1.4), mel([60, 67], 0.5, 2.8), mel([60, 72], 0.5, 4.2)), al: 'Hear a 2nd, 3rd, 5th, octave' },
        { h: 'Each one has its own sound',
          p: 'A <b>major 3rd</b> (4 semitones) sounds bright and sweet. A <b>perfect 5th</b> (7 semitones) sounds open and strong. An <b>octave</b> (12) sounds like one note in two voices.',
          v: piano([['C', 4], ['E', 4], ['G', 4]], 60, 83), a: [blk([60, 64], 0, 1.2), blk([60, 67], 1.5, 1.2), blk([60, 72], 3, 1.4)], al: 'Hear them together' },
        { h: 'Major and minor sizes',
          p: '2nds, 3rds, 6ths and 7ths come in two sizes. The bigger one is <b>major</b>; one semitone smaller is <b>minor</b>. C–E is a major 3rd (4 semitones); C–E♭ is a minor 3rd (3).',
          v: piano([['C', 4], ['Eb', 4], ['E', 4]], 60, 83), a: mel([60, 64], 0.6).concat(mel([60, 63], 0.6, 1.7)), al: 'Major 3rd, then minor 3rd' },
      ],
      quiz: [['piano-interval', 1, null, 2], ['ear-interval', 1, null, 2], ['build-interval', 1, null, 1]],
    },
    {
      id: 'major-chords', icon: '🎹', title: 'Your first chord', blurb: 'How a major chord is built: 1 – 3 – 5',
      cards: [
        { h: 'A chord is notes played together',
          p: 'The most important chord is the <b>major triad</b>: three notes — the <b>1st, 3rd and 5th</b> notes of a major scale. Starting on C, that is <b>C – E – G</b>.',
          v: piano([['C', 4], ['E', 4], ['G', 4]], 60, 83), a: [blk(chordOf('C', 4, 'maj'))].concat(mel(chordOf('C', 4, 'maj'), 0.3, 1.5)), al: 'Hear C major' },
        { h: 'The shape to remember: 4 + 3',
          p: 'Count semitones: from the root go up <b>4</b>, then up <b>3</b> more. That shape makes a major chord from any note. From G it gives G – B – D.',
          v: piano([['G', 3], ['B', 3], ['D', 4]], 48, 71), a: [blk(chordOf('G', 3, 'maj'))], al: 'Hear G major' },
        { h: 'Three chords, thousands of songs',
          p: '<b>C</b>, <b>F</b> and <b>G</b> major use only white keys. Play them one after another and you already have the backbone of countless songs.',
          v: piano([['F', 3], ['A', 3], ['C', 4]], 48, 71),
          a: seqChords([chordOf('C', 4, 'maj'), chordOf('F', 3, 'maj'), chordOf('G', 3, 'maj'), chordOf('C', 4, 'maj')], 0.9), al: 'Hear C – F – G – C' },
      ],
      quiz: [['chord-notes', 1, { q: 'maj' }, 2], ['build-chord', 1, { q: 'maj' }, 3]],
    },
    {
      id: 'minor-chords', icon: '🌧️', title: 'Major or minor?', blurb: 'One note turns a happy chord sad',
      cards: [
        { h: 'One note changes everything',
          p: 'Take a major chord and lower the middle note (the 3rd) by one semitone. You get a <b>minor</b> chord: C – <b>E♭</b> – G. Major sounds bright; minor sounds darker and sadder.',
          v: piano([['C', 4], ['Eb', 4], ['G', 4]], 60, 83), a: [blk(chordOf('C', 4, 'maj'), 0, 1.4), blk(chordOf('C', 4, 'min'), 1.8, 1.6)], al: 'C major, then C minor' },
        { h: 'The minor shape: 3 + 4',
          p: 'Minor flips the recipe: from the root go up <b>3</b> semitones, then up <b>4</b>. A minor is the all-white-keys one: <b>A – C – E</b>.',
          v: piano([['A', 3], ['C', 4], ['E', 4]], 48, 71), a: [blk(chordOf('A', 3, 'min'))].concat(mel(chordOf('A', 3, 'min'), 0.3, 1.5)), al: 'Hear A minor' },
        { h: 'Train your ear',
          p: 'When you hear a chord, ask yourself: <b>sunny or cloudy?</b> Listen for the middle note. Your ear already knows this difference from every song you have heard — now you are giving it a name.',
          a: [blk(chordOf('D', 4, 'min'), 0, 1.3), blk(chordOf('D', 4, 'maj'), 1.7, 1.3), blk(chordOf('E', 4, 'min'), 3.4, 1.3), blk(chordOf('E', 4, 'maj'), 5.1, 1.5)], al: 'Minor, major, minor, major' },
      ],
      quiz: [['ear-chord', 1, null, 3], ['build-chord', 1, { q: 'min' }, 1], ['chord-notes', 2, { q: 'min' }, 1]],
    },
    {
      id: 'staff', icon: '🎼', title: 'Reading notes', blurb: 'Lines, spaces and the treble clef',
      cards: [
        { h: 'Five lines and four spaces',
          p: 'Written music sits on a <b>staff</b>. The higher a note sits, the higher it sounds. The swirl at the start is the <b>treble clef</b>; it curls around the line for the note <b>G</b>.',
          v: staff([['G', 4]], 'chord'), a: [blk([67], 0, 1)], al: 'Hear that G' },
        { h: 'The lines: E G B D F',
          p: 'From the bottom line up, the notes on the lines are <b>E G B D F</b> — “Every Good Boy Does Fine”.',
          v: staff([['E', 4], ['G', 4], ['B', 4], ['D', 5], ['F', 5]]), a: mel([64, 67, 71, 74, 77], 0.45), al: 'Hear the lines' },
        { h: 'The spaces spell FACE',
          p: 'The notes in the spaces, from the bottom, spell a word: <b>F A C E</b>.',
          v: staff([['F', 4], ['A', 4], ['C', 5], ['E', 5]]), a: mel([65, 69, 72, 76], 0.45), al: 'Hear the spaces' },
        { h: 'Middle C',
          p: 'Just below the staff, on its own short line, sits <b>middle C</b> — the C near the middle of a piano. From there the notes simply continue letter by letter: C, D, E…',
          v: staff([['C', 4], ['D', 4], ['E', 4]]), a: mel([60, 62, 64], 0.5), al: 'Hear C, D, E' },
      ],
      quiz: [['read-note', 1, null, 5]],
    },
    {
      id: 'guitar-strings', icon: '🎸', title: 'Guitar: the six strings', blurb: 'String names and how frets work',
      cards: [
        { h: 'Six strings, six notes',
          p: 'From the thickest string (the 6th) to the thinnest (the 1st), a guitar is tuned <b>E A D G B E</b>. Memory trick: <i>Eddie Ate Dynamite, Good Bye Eddie</i>.',
          v: { kind: 'fretboard', from: 1, to: 4, dots: GT.OPEN.map((nm, s) => ({ s, f: 0, label: nm })) }, a: GT.pluck([[0, 0], [1, 0], [2, 0], [3, 0], [4, 0], [5, 0]], 0.5), al: 'Hear the open strings' },
        { h: 'Reading the picture',
          p: 'In these diagrams the <b>thickest string is at the bottom</b>, as if the guitar were lying in your lap. The numbers underneath count the <b>frets</b>. A ring left of the neck means “play the string open”.',
          v: { kind: 'fretboard', from: 1, to: 4, string: 1, dots: [{ s: 1, f: 0, label: 'A' }, { s: 1, f: 2, label: 'B' }, { s: 1, f: 3, label: 'C' }] }, a: GT.pluck([[1, 0], [1, 2], [1, 3]], 0.55), al: 'Hear A, B, C' },
        { h: 'Each fret is one half step',
          p: 'Press a string just behind a fret and the note rises one semitone per fret — exactly like moving one key to the right on a piano. On the thickest string: open <b>E</b>, fret 1 <b>F</b>, fret 2 <b>F♯</b>, fret 3 <b>G</b>.',
          v: { kind: 'fretboard', from: 1, to: 4, string: 0, dots: [{ s: 0, f: 0, label: 'E' }, { s: 0, f: 1, label: 'F' }, { s: 0, f: 2, label: 'F♯' }, { s: 0, f: 3, label: 'G' }] }, a: GT.pluck([[0, 0], [0, 1], [0, 2], [0, 3]], 0.5), al: 'Hear E, F, F♯, G' },
      ],
      quiz: [['guitar-string', 1, null, 3], ['guitar-note', 1, null, 2]],
    },
    {
      id: 'guitar-chords', icon: '🤘', title: 'Guitar: first chords', blurb: 'Reading chord boxes — Em, Am, C, G, D',
      cards: [
        { h: 'How to read a chord box',
          p: 'A chord box is the neck standing upright, with the <b>thickest string on the left</b>. Dots show where your fingers go. <b>○</b> means play that string open; <b>×</b> means do not play it. This one is <b>E minor</b> — just two fingers.',
          v: box('E:min', true), a: strums(['E:min']), al: 'Strum E minor' },
        { h: 'Two easy minor chords',
          p: '<b>E minor</b> and <b>A minor</b>. Notice the × on A minor: skip the thickest string so the lowest note you hear is A, the chord’s root.',
          v: { kind: 'row', items: [{ v: box('E:min'), cap: 'Em' }, { v: box('A:min'), cap: 'Am' }] }, a: strums(['E:min', 'A:min'], 1.6), al: 'Strum Em, then Am' },
        { h: 'Three major chords',
          p: '<b>C</b>, <b>G</b> and <b>D</b>. With these three plus E minor you can already play along with a huge number of songs.',
          v: { kind: 'row', items: [{ v: box('C:maj'), cap: 'C' }, { v: box('G:maj'), cap: 'G' }, { v: box('D:maj'), cap: 'D' }] }, a: strums(['G:maj', 'C:maj', 'D:maj', 'G:maj'], 1.5), al: 'Strum G – C – D – G' },
        { h: 'Same theory, different instrument',
          p: 'A guitar chord uses the same notes as on a piano, just spread across the strings. Open C plays C – E – G – C – E: six strings, but still only the three notes <b>C, E and G</b>.',
          v: box('C:maj', true), a: strums(['C:maj']), al: 'Strum C' },
      ],
      quiz: [['guitar-chord-id', 1, null, 5]],
    },
    {
      id: 'keys', icon: '🔑', title: 'Keys and key signatures', blurb: 'What it means for a song to be “in G”',
      cards: [
        { h: 'A key is a song’s home',
          p: 'Most songs use the notes of one scale. If that scale is G major, the song is “in the key of G”, and the note G feels like <b>home</b> — the place the music wants to end.',
          a: seqChords([chordOf('G', 3, 'maj'), chordOf('C', 4, 'maj'), chordOf('D', 4, 'maj'), chordOf('G', 3, 'maj')], 0.9), al: 'Hear it come home to G' },
        { h: 'The key signature',
          p: 'G major always uses F♯. Rather than writing a ♯ before every F, we put one sharp at the start of each line. That is the <b>key signature</b>: it tells you which notes stay sharp or flat for the whole piece.',
          v: { kind: 'staff', clef: 'treble', sig: 1, notes: [] } },
        { h: 'Reading them quickly',
          p: '<b>Sharps:</b> go one semitone up from the last sharp. <b>Flats:</b> the second-to-last flat names the key. Two to memorise: no sharps or flats is <b>C major</b>, one flat is <b>F major</b>.',
          v: { kind: 'row', items: [{ v: { kind: 'staff', clef: 'treble', sig: 2, notes: [] }, cap: 'Last sharp C♯ → D major' }, { v: { kind: 'staff', clef: 'treble', sig: -2, notes: [] }, cap: 'Flats B♭ E♭ → B♭ major' }] } },
      ],
      quiz: [['key-sig', 1, null, 3], ['key-sig', 2, null, 2]],
    },
    {
      id: 'chord-family', icon: '👪', title: 'Chords that belong together', blurb: 'The chord family of a key and the famous I – IV – V',
      cards: [
        { h: 'Every key has a family of chords',
          p: 'Build a chord on each note of C major, using only white keys, and you get seven chords: <b>C, Dm, Em, F, G, Am</b> and <b>B°</b>. Songs in C are made almost entirely from these.',
          v: { kind: 'text', big: 'C  Dm  Em  F  G  Am  B°' },
          a: seqChords(['C', 'D', 'E', 'F', 'G', 'A', 'B'].map((r, i) => chordOf(r, i < 5 ? 3 : 3, ['maj', 'min', 'min', 'maj', 'maj', 'min', 'dim'][i])), 0.7), al: 'Hear the family' },
        { h: 'Roman numerals',
          p: 'Musicians number them <b>I ii iii IV V vi vii°</b>. Capitals are major chords, lowercase are minor. The order of major and minor is the same in <i>every</i> major key — only the letters change.',
          v: { kind: 'text', big: 'I  ii  iii  IV  V  vi  vii°' } },
        { h: 'The big three, plus one',
          p: '<b>I, IV and V</b> are the three major chords: C, F, G in the key of C; G, C, D in the key of G. Add <b>vi</b> (A minor in C) and you have the “four chords” behind a huge share of pop songs.',
          a: seqChords([chordOf('C', 4, 'maj'), chordOf('G', 3, 'maj'), chordOf('A', 3, 'min'), chordOf('F', 3, 'maj')], 1.0), al: 'Hear I – V – vi – IV' },
      ],
      quiz: [['chord-in-key', 2, null, 3], ['ear-progression', 3, null, 2]],
    },
    {
      id: 'pentatonic', icon: '🔥', title: 'The pentatonic scale', blurb: 'Five notes that always sound good — and the guitar “box”',
      cards: [
        { h: 'Five notes, no wrong ones',
          p: 'The <b>minor pentatonic</b> scale has only five notes: <b>1 ♭3 4 5 ♭7</b>. A minor pentatonic is <b>A C D E G</b> — all white keys. It is the sound of rock and blues solos.',
          v: piano([['A', 3], ['C', 4], ['D', 4], ['E', 4], ['G', 4], ['A', 4]], 48, 71), a: mel(scaleOf('A', 3, 'minpent'), 0.34), al: 'Hear A minor pentatonic' },
        { h: 'The guitar “box”',
          p: 'On guitar those five notes make a famous shape at the <b>5th fret</b>: two notes on every string. The highlighted dots are the root, A. Most guitarists learn to solo right here.',
          v: { kind: 'fretboard', from: 5, to: 8, dots: [[0, 5, 1], [0, 8], [1, 5], [1, 7], [2, 5], [2, 7, 1], [3, 5], [3, 7], [4, 5], [4, 8], [5, 5, 1], [5, 8]].map(([s, f, r]) => ({ s, f, cls: r ? 'root' : null, label: T.PC_SHARP[GT.pcAt(s, f)] })) },
          a: GT.pluck([[0, 5], [0, 8], [1, 5], [1, 7], [2, 5], [2, 7], [3, 5], [3, 7], [4, 5], [4, 8], [5, 5], [5, 8]], 0.26), al: 'Hear the box' },
        { h: 'Same notes, brighter home',
          p: 'Play the same five notes but treat <b>C</b> as home and you have <b>C major pentatonic</b>: C D E G A. Same notes as A minor pentatonic, a sunnier mood — the two scales are relatives.',
          v: piano([['C', 4], ['D', 4], ['E', 4], ['G', 4], ['A', 4], ['C', 5]], 60, 83), a: mel(scaleOf('C', 4, 'majpent'), 0.34), al: 'Hear C major pentatonic' },
      ],
      quiz: [['build-scale', 4, { scale: 'minpent', roots: [9, 4, 2] }, 2], ['build-scale', 3, { scale: 'majpent', roots: [0, 7] }, 1], ['guitar-find', 1, null, 2]],
    },
  ];

  root.Lessons = { LESSONS, byId: (id) => LESSONS.find((l) => l.id === id) };
})(typeof window !== 'undefined' ? window : globalThis);
