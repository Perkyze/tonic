/* Shared mock data and helpers for the three Learn-page concepts.
   Mirrors js/lessons.js (titles + icons only) with fake progress so every state shows:
   chapters 1–2 done, chapter 3 lesson 1 done, lesson 8 is "up next", the rest locked. */
(function () {
  'use strict';
  const RAW = [
    ['First notes', 'Note names, steps and the major scale', [
      ['🔤', 'The musical alphabet'], ['🪜', 'Sharps, flats and steps'], ['☀️', 'The major scale']]],
    ['Intervals and chords', 'Distances between notes, major and minor', [
      ['↕️', 'Intervals'], ['🎹', 'Your first chord'], ['🌧️', 'Major or minor?']]],
    ['Reading and guitar', 'The staff, the six strings, first chords', [
      ['🎼', 'Reading notes'], ['🎸', 'Guitar: the six strings'], ['🤘', 'Guitar: first chords']]],
    ['Keys and harmony', 'Key signatures, chord families, pentatonics', [
      ['🔑', 'Keys and key signatures'], ['👪', 'Chords that belong together'], ['🔥', 'The pentatonic scale']]],
    ['Richer chords', 'Sevenths, new colours and inversions', [
      ['7️⃣', 'Seventh chords'], ['🎨', 'Sus, diminished, augmented'], ['🔄', 'Inversions']]],
    ['The minor side', 'Minor scales, minor keys and the bass clef', [
      ['🌙', 'The minor scale'], ['🧲', 'Chords in a minor key'], ['🎻', 'The bass clef']]],
    ['Guitar, next steps', 'The neck, 7th chords and octaves', [
      ['🗺️', 'Guitar: mapping the neck'], ['🎷', 'Guitar: 7th chords'], ['🪞', 'Guitar: octaves']]],
    ['Ears and modes', 'Hearing chords and notes, and the seven modes', [
      ['👂', 'Hearing chord changes'], ['🎯', 'Notes that pull'], ['🌈', 'Meet the modes']]],
  ];
  const STARS = [3, 3, 2, 3, 2, 3, 1];
  const CUR = STARS.length;
  const curChapter = Math.floor(CUR / 3);

  const lessons = [];
  const chapters = RAW.map(([title, blurb, ls], ci) => {
    const ch = { ci, num: ci + 1, title, blurb };
    ch.lessons = ls.map(([icon, ltitle], li) => {
      const i = ci * 3 + li;
      const l = { i, ci, li, num: i + 1, icon, title: ltitle, mins: 3 + ((i * 7) % 3),
        state: i < CUR ? 'done' : i === CUR ? 'current' : 'locked', stars: STARS[i] || 0 };
      lessons.push(l);
      return l;
    });
    ch.open = ci <= curChapter;
    ch.done = ch.lessons.every((l) => l.state === 'done');
    ch.starCount = ch.lessons.reduce((a, l) => a + l.stars, 0);
    ch.doneCount = ch.lessons.filter((l) => l.state === 'done').length;
    return ch;
  });

  // seeded random so the scenery is stable between reloads
  function rng(seed) {
    let a = seed >>> 0;
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  const STAR = '<svg viewBox="0 0 24 24"><path d="M12 2.6l2.9 6 6.5.8-4.8 4.5 1.2 6.5L12 17.3l-5.8 3.1 1.2-6.5L2.6 9.4l6.5-.8z"/></svg>';
  function stars(n, cls) {
    let s = '<span class="stars ' + (cls || '') + '" aria-label="' + n + ' of 3 stars">';
    for (let k = 0; k < 3; k++) s += '<i class="' + (k < n ? 'on' : '') + '">' + STAR + '</i>';
    return s + '</span>';
  }

  // The Tonic eighth-note, as a little character
  function mascot(opts) {
    const o = Object.assign({ body: '#ffd23f', dark: '#c9960a', ink: '#15122b', mood: 'happy', prop: '' }, opts);
    const mouth = o.mood === 'wow'
      ? '<ellipse cx="33" cy="76" rx="4" ry="5" fill="' + o.ink + '"/>'
      : '<path d="M27 74q6 6 12 0" stroke="' + o.ink + '" stroke-width="3" fill="none" stroke-linecap="round"/>';
    return '<svg class="mascot" viewBox="0 0 80 100" aria-hidden="true">' +
      '<ellipse cx="34" cy="96" rx="22" ry="4" fill="rgba(0,0,0,.18)"/>' +
      '<rect x="48" y="8" width="8" height="64" rx="4" fill="' + o.dark + '"/>' +
      '<path d="M54 8c14 3 20 13 15 27-2-9-7-13-15-14z" fill="' + o.dark + '"/>' +
      '<ellipse cx="33" cy="72" rx="23" ry="18" transform="rotate(-18 33 72)" fill="' + o.body + '"/>' +
      '<ellipse cx="26" cy="64" rx="8" ry="4" transform="rotate(-18 26 64)" fill="rgba(255,255,255,.35)"/>' +
      '<circle cx="25" cy="70" r="4.2" fill="' + o.ink + '"/><circle cx="41" cy="65" r="4.2" fill="' + o.ink + '"/>' +
      '<circle cx="26.3" cy="68.6" r="1.4" fill="#fff"/><circle cx="42.3" cy="63.6" r="1.4" fill="#fff"/>' +
      mouth + '<circle cx="18" cy="78" r="3.4" fill="#ff7a9a" opacity=".55"/><circle cx="47" cy="72" r="3.4" fill="#ff7a9a" opacity=".55"/>' +
      o.prop + '</svg>';
  }

  const ICONS = {
    today: '<path d="M4 11l8-7 8 7v8a1 1 0 0 1-1 1h-4v-6h-6v6H5a1 1 0 0 1-1-1z"/>',
    learn: '<path d="M9 4L3 6.5v13L9 17l6 2.5 6-2.5v-13L15 6.5 9 4z"/><path d="M9 4v13M15 6.5v13"/>',
    practice: '<path d="M9 18V6l11-2v12"/><circle cx="6" cy="18" r="3"/><circle cx="17" cy="16" r="3"/>',
    profile: '<circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6"/>',
  };
  function tabbar(theme) {
    const t = [['today', 'Today'], ['learn', 'Learn'], ['practice', 'Practice'], ['profile', 'Profile']];
    return '<nav class="tabbar ' + (theme || '') + '" aria-label="Main"><div class="tabbar-in">' +
      t.map(([id, label]) => '<button class="tab' + (id === 'learn' ? ' on' : '') + '"><span class="tab-ico"><svg viewBox="0 0 24 24">' +
        ICONS[id] + '</svg></span>' + label + '</button>').join('') + '</div></nav>';
  }

  const totalStars = lessons.reduce((a, l) => a + l.stars, 0);
  const trophies = chapters.filter((c) => c.done).length;

  window.TONIC = { chapters, lessons, CUR, curChapter, rng, stars, mascot, tabbar, totalStars, trophies, streak: 12 };
})();
