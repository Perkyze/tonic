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
    // ------------------------------------------------------------ Chapter 5
    {
      id: 'seventh-chords', icon: '7️⃣', title: 'Seventh chords', blurb: 'Add one more note for a richer, jazzier chord',
      cards: [
        { h: 'Add one more note',
          p: 'A triad uses the 1st, 3rd and 5th. Keep stacking and add the <b>7th</b> and you get a seventh chord. C major plus B gives <b>C major 7</b>: C – E – G – B. It sounds lush and dreamy.',
          v: piano([['C', 4], ['E', 4], ['G', 4], ['B', 4]], 60, 83), a: [blk(chordOf('C', 4, 'maj'), 0, 1.3), blk(chordOf('C', 4, 'maj7'), 1.7, 1.6)], al: 'C, then C major 7' },
        { h: 'The dominant 7th',
          p: 'Lower that top note by a semitone and the mood changes completely. <b>G7</b> is G – B – D – <b>F</b>: a major chord with a ♭7. It sounds restless and badly wants to move to C. This is the bluesy “7” chord.',
          v: piano([['G', 3], ['B', 3], ['D', 4], ['F', 4]], 48, 71), a: seqChords([chordOf('G', 3, 'dom7'), chordOf('C', 4, 'maj')], 1.3), al: 'Hear G7 resolve to C' },
        { h: 'The minor 7th',
          p: 'Start from a minor chord and add a ♭7: <b>D minor 7</b> is D – F – A – C. Smooth and mellow. Put the three types in a row — Dm7, G7, Cmaj7 — and you have the most famous progression in jazz.',
          v: piano([['D', 4], ['F', 4], ['A', 4], ['C', 5]], 60, 83), a: seqChords([chordOf('D', 4, 'min7'), chordOf('G', 3, 'dom7'), chordOf('C', 4, 'maj7')], 1.3), al: 'Hear Dm7 – G7 – Cmaj7' },
      ],
      quiz: [['chord-notes', 3, { q: 'maj7' }, 1], ['chord-notes', 3, { q: 'dom7' }, 1], ['build-chord', 3, { q: 'min7' }, 1], ['ear-chord', 3, null, 2]],
    },
    {
      id: 'chord-colours', icon: '🎨', title: 'Sus, diminished, augmented', blurb: 'Three chord colours beyond major and minor',
      cards: [
        { h: 'Suspended: no third at all',
          p: 'Replace the 3rd of a chord with the 4th and you get a <b>sus4</b>: C – <b>F</b> – G. With no 3rd it is neither major nor minor; it hangs in the air until the F falls back to E.',
          v: piano([['C', 4], ['F', 4], ['G', 4]], 60, 83), a: [blk(chordOf('C', 4, 'sus4'), 0, 1.3), blk(chordOf('C', 4, 'maj'), 1.6, 1.6)], al: 'Csus4, then C' },
        { h: 'Diminished: squeezed and tense',
          p: 'Stack two minor 3rds (3 + 3 semitones) and you get a <b>diminished</b> chord: B – D – F. It sounds nervous and unstable, and loves to resolve up a semitone — here, to C.',
          v: piano([['B', 3], ['D', 4], ['F', 4]], 48, 71), a: seqChords([chordOf('B', 3, 'dim'), chordOf('C', 4, 'maj')], 1.3), al: 'B diminished, then C' },
        { h: 'Augmented: stretched and dreamy',
          p: 'Stack two major 3rds (4 + 4) for an <b>augmented</b> chord: C – E – G♯. The raised 5th makes it float, like a question that has not been answered yet.',
          v: piano([['C', 4], ['E', 4], ['G#', 4]], 60, 83), a: [blk(chordOf('C', 4, 'aug'), 0, 1.4)].concat(mel(chordOf('C', 4, 'aug'), 0.3, 1.7)), al: 'Hear C augmented' },
      ],
      quiz: [['chord-formula', 2, null, 2], ['build-chord', 3, { q: 'sus4' }, 1], ['build-chord', 3, { q: 'dim' }, 1], ['ear-chord', 2, null, 1]],
    },
    {
      id: 'inversions', icon: '🔄', title: 'Inversions', blurb: 'The same chord with a different note on the bottom',
      cards: [
        { h: 'Same notes, new order',
          p: 'A chord is still the same chord whichever note is lowest. Move the C of C major to the top and you get <b>E – G – C</b>: the <b>first inversion</b>. Same three notes, slightly lighter sound.',
          v: piano([['E', 4], ['G', 4], ['C', 5]], 60, 83), a: [blk([60, 64, 67], 0, 1.3), blk([64, 67, 72], 1.6, 1.6)], al: 'Root position, then 1st inversion' },
        { h: 'Second inversion',
          p: 'Move the next note up too and the 5th is on the bottom: <b>G – C – E</b>, the <b>second inversion</b>. To name an inverted chord, restack its notes in 3rds — the note that ends up lowest is the root.',
          v: piano([['G', 4], ['C', 5], ['E', 5]], 60, 83), a: [blk([67, 72, 76], 0, 1.6)], al: 'Hear the 2nd inversion' },
        { h: 'Why bother?',
          p: 'Inversions let chords flow into each other without your hand jumping around. Here C, F and G are played with the closest possible notes — listen to how smoothly they connect.',
          v: piano([['C', 4], ['F', 4], ['A', 4]], 60, 83), a: [blk([60, 64, 67], 0, 1), blk([60, 65, 69], 1.1, 1), blk([59, 62, 67], 2.2, 1), blk([60, 64, 67], 3.3, 1.6)], al: 'C – F – G – C, close together' },
      ],
      quiz: [['piano-chord', 4, { pool: ['maj', 'min'] }, 4], ['chord-notes', 2, null, 1]],
    },
    // ------------------------------------------------------------ Chapter 6
    {
      id: 'minor-scale', icon: '🌙', title: 'The minor scale', blurb: 'The darker sibling of the major scale',
      cards: [
        { h: 'The natural minor scale',
          p: 'Play the white keys from <b>A to A</b> and you hear the <b>natural minor scale</b>. Its step pattern is <b>whole, half, whole, whole, half, whole, whole</b> — and it sounds darker and sadder than major.',
          v: piano([['A', 3], ['B', 3], ['C', 4], ['D', 4], ['E', 4], ['F', 4], ['G', 4], ['A', 4]], 48, 71), a: mel(scaleOf('A', 3, 'minor'), 0.34), al: 'Hear A minor' },
        { h: 'Relatives: same notes, different home',
          p: 'A minor uses exactly the same notes as C major. They are <b>relative</b> keys. The relative minor always starts on the 6th note of the major scale — or 3 semitones below its home note.',
          v: { kind: 'text', big: 'C major  ↔  A minor' } },
        { h: 'Hear the difference',
          p: 'Same seven notes, but where the music <i>rests</i> changes everything. Listen to the scale from C, then from A.',
          a: mel(scaleOf('C', 4, 'major'), 0.3).concat(mel(scaleOf('A', 3, 'minor'), 0.3, 3)), al: 'C major, then A minor' },
      ],
      quiz: [['build-scale', 4, { scale: 'minor', roots: [9, 4, 2] }, 2], ['relative-key', 2, null, 2], ['ear-scale', 2, null, 1]],
    },
    {
      id: 'minor-keys', icon: '🧲', title: 'Chords in a minor key', blurb: 'The minor chord family and the harmonic minor trick',
      cards: [
        { h: 'The minor chord family',
          p: 'Build a chord on each note of A minor and you get <b>Am, B°, C, Dm, Em, F, G</b>. In Roman numerals: <b>i ii° III iv v VI VII</b>. The home chord is now minor.',
          v: { kind: 'text', big: 'Am  B°  C  Dm  Em  F  G' },
          a: seqChords([['A', 'min'], ['B', 'dim'], ['C', 'maj'], ['D', 'min'], ['E', 'min'], ['F', 'maj'], ['G', 'maj']].map(([r, q], i) => chordOf(r, i < 2 ? 3 : 4, q)), 0.7), al: 'Hear the family' },
        { h: 'The raised 7th',
          p: 'Composers wanted a stronger pull back home, so they raised the 7th note: G becomes <b>G♯</b>. That is the <b>harmonic minor</b> scale — hear the dramatic leap near the top.',
          v: piano([['A', 3], ['B', 3], ['C', 4], ['D', 4], ['E', 4], ['F', 4], ['G#', 4], ['A', 4]], 48, 71), a: mel(scaleOf('A', 3, 'harmonic'), 0.34), al: 'Hear A harmonic minor' },
        { h: 'A stronger way home',
          p: 'That G♯ turns the v chord (E minor) into <b>V: E major</b>. Listen: E minor to A minor sounds gentle; E major to A minor sounds like it <i>has</i> to land. Most minor-key songs borrow this V chord.',
          a: [blk(chordOf('E', 3, 'min'), 0, 1), blk(chordOf('A', 3, 'min'), 1.1, 1.4), blk(chordOf('E', 3, 'maj'), 3.1, 1), blk(chordOf('A', 3, 'min'), 4.2, 1.6)], al: 'Em → Am, then E → Am' },
      ],
      quiz: [['chord-in-key', 3, { mode: 'minor' }, 3], ['build-scale', 4, { scale: 'harmonic', roots: [9, 4, 2] }, 1], ['ear-scale', 3, null, 1]],
    },
    {
      id: 'bass-clef', icon: '🎻', title: 'The bass clef', blurb: 'Reading the low notes',
      cards: [
        { h: 'A clef for low notes',
          p: 'Low instruments and the pianist’s left hand read the <b>bass clef</b>. Its two dots sit either side of the line for <b>F</b> — the F below middle C.',
          v: { kind: 'staff', clef: 'bass', sig: 0, layout: 'chord', notes: [n('F', 3)] }, a: [blk([53], 0, 1)], al: 'Hear that F' },
        { h: 'The lines: G B D F A',
          p: 'From the bottom line up: <b>G B D F A</b> — “Good Boys Do Fine Always”.',
          v: { kind: 'staff', clef: 'bass', sig: 0, layout: 'melodic', notes: [n('G', 2), n('B', 2), n('D', 3), n('F', 3), n('A', 3)] }, a: mel([43, 47, 50, 53, 57], 0.45), al: 'Hear the lines' },
        { h: 'The spaces: A C E G',
          p: 'The spaces, from the bottom: <b>A C E G</b> — “All Cows Eat Grass”.',
          v: { kind: 'staff', clef: 'bass', sig: 0, layout: 'melodic', notes: [n('A', 2), n('C', 3), n('E', 3), n('G', 3)] }, a: mel([45, 48, 52, 55], 0.45), al: 'Hear the spaces' },
        { h: 'Where the two clefs meet',
          p: '<b>Middle C</b> sits on a short line just <i>above</i> the bass staff — the very same note that sits just below the treble staff. The two staves are one continuous ladder.',
          v: { kind: 'staff', clef: 'bass', sig: 0, layout: 'melodic', notes: [n('A', 3), n('B', 3), n('C', 4)] }, a: mel([57, 59, 60], 0.5), al: 'Hear A, B, middle C' },
      ],
      quiz: [['read-note', 2, { clef: 'bass' }, 5]],
    },
    // ------------------------------------------------------------ Chapter 7
    {
      id: 'guitar-fretboard', icon: '🗺️', title: 'Guitar: mapping the neck', blurb: 'Natural notes on the two thickest strings',
      cards: [
        { h: 'The low E string',
          p: 'Learn the natural notes on the thickest string first: open <b>E</b>, fret 1 <b>F</b>, fret 3 <b>G</b>, fret 5 <b>A</b>. E to F is a half step (one fret); the others are whole steps (two frets).',
          v: { kind: 'fretboard', from: 1, to: 5, string: 0, dots: [[0, 'E'], [1, 'F'], [3, 'G'], [5, 'A']].map(([f, label]) => ({ s: 0, f, label })) }, a: GT.pluck([[0, 0], [0, 1], [0, 3], [0, 5]], 0.5), al: 'Hear E, F, G, A' },
        { h: 'The A string',
          p: 'Same idea one string up: open <b>A</b>, fret 2 <b>B</b>, fret 3 <b>C</b>, fret 5 <b>D</b>. Most chords are named from a note on one of these two strings, so they are worth knowing cold.',
          v: { kind: 'fretboard', from: 1, to: 5, string: 1, dots: [[0, 'A'], [2, 'B'], [3, 'C'], [5, 'D']].map(([f, label]) => ({ s: 1, f, label })) }, a: GT.pluck([[1, 0], [1, 2], [1, 3], [1, 5]], 0.5), al: 'Hear A, B, C, D' },
        { h: 'The 5th-fret trick',
          p: 'Fret 5 of a string is the same note as the next open string: fret 5 on the E string is <b>A</b>, fret 5 on the A string is <b>D</b>. That is how guitars are tuned by ear. (One exception: the G string reaches B at fret 4.)',
          v: { kind: 'fretboard', from: 1, to: 5, dots: [{ s: 0, f: 5, label: 'A', cls: 'root' }, { s: 1, f: 0, label: 'A', cls: 'root' }, { s: 1, f: 5, label: 'D' }, { s: 2, f: 0, label: 'D' }] }, a: GT.pluck([[0, 5], [1, 0], [1, 5], [2, 0]], 0.55), al: 'Hear the matching pairs' },
      ],
      quiz: [['guitar-note', 2, null, 3], ['guitar-find', 2, null, 2]],
    },
    {
      id: 'guitar-sevenths', icon: '🎷', title: 'Guitar: 7th chords', blurb: 'Lift a finger and the chord turns bluesy',
      cards: [
        { h: 'Lift one finger',
          p: 'Play an open <b>E</b> chord, then lift the finger on the 4th string. That open string is D — the ♭7 — and the chord becomes <b>E7</b>. Same shape, one finger fewer, instantly bluesier.',
          v: { kind: 'row', items: [{ v: box('E:maj'), cap: 'E' }, { v: box('E:dom7'), cap: 'E7' }] }, a: strums(['E:maj', 'E:dom7'], 1.7), al: 'Strum E, then E7' },
        { h: 'A7 and D7',
          p: '<b>A7</b> works the same way: an A chord with the middle finger lifted. <b>D7</b> is a small triangle shape. Together with E7 these are the three chords of a blues in A.',
          v: { kind: 'row', items: [{ v: box('A:dom7'), cap: 'A7' }, { v: box('D:dom7'), cap: 'D7' }] }, a: strums(['A:dom7', 'D:dom7'], 1.7), al: 'Strum A7, then D7' },
        { h: 'A blues in three chords',
          p: 'Play <b>A7 – D7 – A7 – E7</b> and you are playing the blues. Each 7th chord leans forward into the next one; that constant pull is the sound of the style.',
          a: strums(['A:dom7', 'D:dom7', 'A:dom7', 'E:dom7'], 1.4), al: 'Strum A7 – D7 – A7 – E7' },
        { h: 'Minor 7ths',
          p: 'Lift a finger from a minor chord and you get a mellow <b>minor 7th</b>: <b>Am7</b> and <b>Em7</b>. They are among the easiest chords on the guitar and sound instantly sophisticated.',
          v: { kind: 'row', items: [{ v: box('A:min7'), cap: 'Am7' }, { v: box('E:min7'), cap: 'Em7' }] }, a: strums(['A:min7', 'E:min7'], 1.7), al: 'Strum Am7, then Em7' },
      ],
      quiz: [['guitar-chord-id', 2, null, 5]],
    },
    {
      id: 'guitar-octaves', icon: '🪞', title: 'Guitar: octaves', blurb: 'Fret 12 and the shape that finds any note',
      cards: [
        { h: 'Fret 12 is the open string again',
          p: 'Twelve frets is twelve semitones — one octave. So fret 12 of every string is the same note as that string played open, just higher. Everything above fret 12 repeats the pattern from the start.',
          v: { kind: 'fretboard', from: 1, to: 12, dots: GT.OPEN.map((nm, s) => ({ s, f: 12, label: nm })).concat(GT.OPEN.map((nm, s) => ({ s, f: 0, label: nm }))) }, a: GT.pluck([[0, 0], [0, 12], [1, 0], [1, 12]], 0.55), al: 'Open, then fret 12' },
        { h: 'The octave shape',
          p: 'From any note on the two thickest strings, go <b>two strings up and two frets higher</b> and you land on the same note one octave up. G on the 6th string fret 3 → G on the 4th string fret 5.',
          v: { kind: 'fretboard', from: 1, to: 5, dots: [{ s: 0, f: 3, label: 'G', cls: 'root' }, { s: 2, f: 5, label: 'G', cls: 'root' }, { s: 1, f: 3, label: 'C' }, { s: 3, f: 5, label: 'C' }] }, a: GT.pluck([[0, 3], [2, 5], [1, 3], [3, 5]], 0.55), al: 'Hear the octaves' },
        { h: 'Any note, anywhere',
          p: 'Between the open strings, the 5th-fret trick, the octave shape and fret 12, you can find any note on the neck. Here is every <b>C</b> up to fret 12 — notice the octave shapes hiding in it.',
          v: { kind: 'fretboard', from: 1, to: 12, dots: GT.positions(0, 0, 12).map((p) => ({ s: p.s, f: p.f, label: 'C', cls: 'root' })) } },
      ],
      quiz: [['guitar-note', 3, null, 3], ['guitar-find', 2, null, 2]],
    },
    // ------------------------------------------------------------ Chapter 8
    {
      id: 'ear-progressions', icon: '👂', title: 'Hearing chord changes', blurb: 'Recognise I, IV, V and vi by ear',
      cards: [
        { h: 'Follow the bass',
          p: 'To hear which chord is playing, listen to the <b>lowest note</b>. In the key of C the bass walks C → F → G → C for <b>I – IV – V – I</b>. Hum the bass line and you have the progression.',
          a: seqChords([[36, 60, 64, 67], [41, 60, 65, 69], [43, 59, 62, 67], [36, 60, 64, 67]].map((c) => c.map((x) => x + 12)), 1.05), al: 'Hear I – IV – V – I' },
        { h: 'V pulls, I rests',
          p: 'Each chord has a feeling. <b>I</b> is home. <b>IV</b> feels like stepping away, open and bright. <b>V</b> is tense and wants to go home. Listen to V resolve to I.',
          a: seqChords([[55, 59, 62, 67], [48, 60, 64, 67]], 1.4), al: 'Hear V go home to I' },
        { h: 'The minor one: vi',
          p: '<b>vi</b> is the relative minor — the sad cousin of I. When a bright progression suddenly turns wistful, that is usually vi. Listen for it as the third chord here.',
          a: seqChords([[48, 60, 64, 67], [43, 59, 62, 67], [45, 60, 64, 69], [41, 60, 65, 69]], 1.05), al: 'Hear I – V – vi – IV' },
      ],
      quiz: [['ear-progression', 3, null, 3], ['chord-in-key', 2, null, 2]],
    },
    {
      id: 'ear-degrees', icon: '🎯', title: 'Notes that pull', blurb: 'Hearing where a note sits in its key',
      cards: [
        { h: 'Every note has a job',
          p: 'Inside a key, each note has its own character. <b>1</b> is home — total rest. <b>5</b> is strong and steady. <b>3</b> is sweet and settled. Those three are the stable notes: together they make the home chord.',
          v: piano([['C', 4, '1'], ['E', 4, '3'], ['G', 4, '5']], 60, 83), a: mel(scaleOf('C', 4, 'major'), 0.28).concat(mel([60, 64, 67], 0.6, 2.8)), al: 'The scale, then 1 – 3 – 5' },
        { h: 'The restless notes',
          p: 'The others lean toward a neighbour. <b>7</b> aches to rise to 1. <b>4</b> wants to fall to 3. <b>2</b> wants to step down to 1. That pull is what makes melodies feel like they are going somewhere.',
          v: piano([['B', 3, '7'], ['C', 4, '1'], ['D', 4, '2'], ['E', 4, '3'], ['F', 4, '4']], 48, 71), a: mel([59, 60], 0.6).concat(mel([65, 64], 0.6, 1.6), mel([62, 60], 0.6, 3.2)), al: '7 → 1, 4 → 3, 2 → 1' },
        { h: 'How to find a note by ear',
          p: 'Hum the note you heard, then walk down the scale step by step until it feels like home. Count your steps: land on home after two steps down and the note was <b>3</b>. With practice you will skip the walking.',
          a: mel([64, 62, 60], 0.6), al: 'Walk down: 3 – 2 – 1' },
      ],
      quiz: [['ear-degree', 2, null, 2], ['ear-degree', 3, null, 3]],
    },
    {
      id: 'modes', icon: '🌈', title: 'Meet the modes', blurb: 'Same notes, seven different moods',
      cards: [
        { h: 'Same notes, new home',
          p: 'Play the white keys from D to D instead of C to C. Same seven notes, completely new flavour: that is <b>D Dorian</b>. A <b>mode</b> is what you get when you treat a different note of the scale as home.',
          v: piano([['D', 4], ['E', 4], ['F', 4], ['G', 4], ['A', 4], ['B', 4], ['C', 5], ['D', 5]], 60, 83), a: mel(scaleOf('D', 4, 'dorian'), 0.32), al: 'Hear D Dorian' },
        { h: 'Two to learn first',
          p: '<b>Dorian</b> is a minor scale with a brighter, raised 6th — funky and hopeful. <b>Mixolydian</b> is a major scale with a ♭7 — the sound of rock and blues. Here is G Mixolydian: all white keys from G.',
          v: piano([['G', 3], ['A', 3], ['B', 3], ['C', 4], ['D', 4], ['E', 4], ['F', 4], ['G', 4]], 48, 71), a: mel(scaleOf('G', 3, 'mixolydian'), 0.32), al: 'Hear G Mixolydian' },
        { h: 'All seven',
          p: 'Starting on each white key in turn: <b>C</b> Ionian (major), <b>D</b> Dorian, <b>E</b> Phrygian, <b>F</b> Lydian, <b>G</b> Mixolydian, <b>A</b> Aeolian (natural minor), <b>B</b> Locrian. You already know two of them by another name.',
          v: { kind: 'text', big: 'Ion · Dor · Phr · Lyd · Mix · Aeo · Loc' } },
      ],
      quiz: [['mode-char', 4, null, 3], ['build-scale', 4, { scale: 'dorian', roots: [2, 9, 7] }, 1], ['ear-scale', 4, null, 1]],
    },
  ];

  // The Learn map: each chapter is an island of three lessons.
  // isle: the island's name, mark: its landmark, land/land2: grass colours, seed: shape of the coastline.
  const CHAPTERS = [
    { title: 'First notes', blurb: 'Note names, steps and the major scale', ids: ['alphabet', 'steps', 'major-scale'],
      isle: 'Do-Re Beach', mark: '🌴', land: '#3ddc97', land2: '#1fa877', seed: 3 },
    { title: 'Intervals and chords', blurb: 'Distances between notes, major and minor', ids: ['intervals', 'major-chords', 'minor-chords'],
      isle: 'Triad Cove', mark: '🛖', land: '#7bd87a', land2: '#45a94a', seed: 11 },
    { title: 'Reading and guitar', blurb: 'The staff, the six strings, first chords', ids: ['staff', 'guitar-strings', 'guitar-chords'],
      isle: 'Campfire Key', mark: '🏕️', land: '#ffb15c', land2: '#d9822b', seed: 7 },
    { title: 'Keys and harmony', blurb: 'Key signatures, chord families, pentatonics', ids: ['keys', 'chord-family', 'pentatonic'],
      isle: 'Keystone Isle', mark: '🏰', land: '#b49bff', land2: '#7f62e0', seed: 19 },
    { title: 'Richer chords', blurb: 'Sevenths, new colours and inversions', ids: ['seventh-chords', 'chord-colours', 'inversions'],
      isle: 'Blossom Reef', mark: '🌸', land: '#ff9ad2', land2: '#e0629f', seed: 23 },
    { title: 'The minor side', blurb: 'Minor scales, minor keys and the bass clef', ids: ['minor-scale', 'minor-keys', 'bass-clef'],
      isle: 'Misty Pines', mark: '🌲', land: '#4fc3a1', land2: '#2a8a74', seed: 5 },
    { title: 'Guitar, next steps', blurb: 'The neck, 7th chords and octaves', ids: ['guitar-fretboard', 'guitar-sevenths', 'guitar-octaves'],
      isle: 'Fretboard Peaks', mark: '🏔️', land: '#8fd3f4', land2: '#4ea3cf', seed: 13 },
    { title: 'Ears and modes', blurb: 'Hearing chords and notes, and the seven modes', ids: ['ear-progressions', 'ear-degrees', 'modes'],
      isle: 'Mode Volcano', mark: '🌋', land: '#ff8a7a', land2: '#d4554a', seed: 29 },
  ];

  root.Lessons = { CHAPTERS, LESSONS, byId: (id) => LESSONS.find((l) => l.id === id) };
})(typeof window !== 'undefined' ? window : globalThis);
