/* Tonic — saved progress (localStorage): XP, streak, skill levels,
   per-item strength for smart practice, achievements. */
(function (root) {
  'use strict';
  const KEY = 'tonic.v1';
  const EPOCH = Date.UTC(2026, 10, 16); // Daily Set #1

  const fresh = () => ({
    v: 1, tier: null, sound: true, xp: 0,
    guitar: true,      // include guitar questions outside the Guitar track
    keyLabels: false,  // print note names on the tap-the-keyboard rounds
    streak: { count: 0, best: 0, last: null },
    daily: {}, skills: {}, items: {}, ach: {}, lessons: {},
    counters: { correct: 0, answered: 0, ear: 0, build: 0, guitar: 0, fast: 0, bestCombo: 0, dailies: 0, perfects: 0, deepBest: 0, deepRound: 0, lessons: 0, hints: 0 },
    survivalBest: 0,
  });

  let mem = null;
  function load() {
    if (mem) return mem;
    try {
      const raw = root.localStorage.getItem(KEY);
      mem = raw ? Object.assign(fresh(), JSON.parse(raw)) : fresh();
      mem.counters = Object.assign(fresh().counters, mem.counters);
    } catch (e) { mem = fresh(); }
    return mem;
  }
  function save() {
    try { root.localStorage.setItem(KEY, JSON.stringify(mem)); } catch (e) { /* private mode: play on without saving */ }
  }
  function reset() { mem = fresh(); save(); }

  // ---------- dates ----------
  const pad = (n) => String(n).padStart(2, '0');
  function dateStr(d) { d = d || new Date(); return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  const today = () => dateStr();
  function dayDiff(a, b) {
    const [ay, am, ad] = a.split('-').map(Number), [by, bm, bd] = b.split('-').map(Number);
    return Math.round((Date.UTC(by, bm - 1, bd) - Date.UTC(ay, am - 1, ad)) / 86400000);
  }
  function dayNumber(ds) {
    const [y, m, d] = (ds || today()).split('-').map(Number);
    return Math.round((Date.UTC(y, m - 1, d) - EPOCH) / 86400000) + 1;
  }
  function msToMidnight() {
    const n = new Date();
    return new Date(n.getFullYear(), n.getMonth(), n.getDate() + 1).getTime() - n.getTime();
  }

  // ---------- levels ----------
  const TITLES = [[1, 'Bedroom Hummer'], [3, 'Busker'], [5, 'Open-Mic Regular'], [8, 'Session Player'], [12, 'Bandleader'], [16, 'Arranger'], [20, 'Virtuoso'], [25, 'Maestro']];
  const xpAt = (lvl) => 60 * lvl * (lvl - 1); // total XP needed to reach a level
  function levelInfo(xp) {
    let lvl = 1;
    while (xpAt(lvl + 1) <= xp) lvl++;
    let title = TITLES[0][1];
    TITLES.forEach(([l, t]) => { if (lvl >= l) title = t; });
    const base = xpAt(lvl), next = xpAt(lvl + 1);
    return { level: lvl, title, into: xp - base, span: next - base, pct: (xp - base) / (next - base) };
  }
  const SKILL_STEP = 40; // skill points per skill level
  function skillInfo(id) {
    const s = load().skills[id] || { pts: 0, seen: 0, correct: 0 };
    const level = Math.floor(s.pts / SKILL_STEP);
    return { level, pct: (s.pts % SKILL_STEP) / SKILL_STEP, seen: s.seen, correct: s.correct, acc: s.seen ? s.correct / s.seen : 0 };
  }

  // ---------- streak ----------
  function liveStreak() {
    const s = load().streak;
    if (!s.last) return 0;
    return dayDiff(s.last, today()) <= 1 ? s.count : 0;
  }

  // ---------- answers ----------
  function recordAnswer(q, correct, seconds, combo) {
    const st = load();
    const sk = st.skills[q.skill] || (st.skills[q.skill] = { pts: 0, seen: 0, correct: 0 });
    sk.seen++;
    if (correct) { sk.correct++; sk.pts += 2 + q.diff * 2; } else sk.pts = Math.max(0, sk.pts - q.diff);
    const it = st.items[q.key] || (st.items[q.key] = { n: 0, c: 0, s: 0.2 });
    it.n++; if (correct) it.c++;
    it.s += ((correct ? 1 : 0) - it.s) * 0.4;
    const c = st.counters;
    c.answered++;
    if (correct) {
      c.correct++;
      if (q.sense === 'ear') c.ear++;
      if (q.sense === 'build') c.build++;
      if (q.skill === 'guitar') c.guitar++;
      if (seconds < 3) c.fast++;
    }
    c.bestCombo = Math.max(c.bestCombo, combo || 0);
    save();
  }

  // ---------- achievements ----------
  const ACH = [
    { id: 'first', icon: '🎬', name: 'Opening Night', desc: 'Finish your first Daily Set', test: (s) => s.counters.dailies >= 1 },
    { id: 'lesson1', icon: '📖', name: 'First Lesson', desc: 'Complete a lesson in the Learn path', test: (s) => s.counters.lessons >= 1 },
    { id: 'lesson6', icon: '🎒', name: 'Good Student', desc: 'Complete 6 lessons', test: (s) => s.counters.lessons >= 6 },
    { id: 'lessonAll', icon: '🎓', name: 'Graduate', desc: 'Complete 12 lessons', test: (s) => s.counters.lessons >= 12 },
    { id: 'lesson24', icon: '🧑‍🏫', name: 'Scholar', desc: 'Complete all 24 lessons', test: (s) => s.counters.lessons >= 24 },
    { id: 'chapter1', icon: '🏆', name: 'Chapter One', desc: 'Win your first chapter trophy', test: (s) => (s.counters.chapters || 0) >= 1 },
    { id: 'chapter8', icon: '🏛️', name: 'Full Shelf', desc: 'Win all 8 chapter trophies', test: (s) => (s.counters.chapters || 0) >= 8 },
    { id: 'stars30', icon: '⭐', name: 'Star Collector', desc: 'Earn 30 lesson stars', test: (s) => (s.counters.stars || 0) >= 30 },
    { id: 'stars72', icon: '🌟', name: 'Perfectionist', desc: 'Earn every star: 3 on all 24 lessons', test: (s) => (s.counters.stars || 0) >= 72 },
    { id: 'guitar25', icon: '🎸', name: 'Six-String Starter', desc: 'Answer 25 guitar questions correctly', test: (s) => s.counters.guitar >= 25 },
    { id: 'perfect', icon: '🌹', name: 'Standing Ovation', desc: 'Get every question right in a Daily Set', test: (s) => s.counters.perfects >= 1 },
    { id: 'streak3', icon: '🔥', name: 'Warming Up', desc: 'Play 3 days in a row', test: (s) => s.streak.best >= 3 },
    { id: 'streak7', icon: '📅', name: 'Week-long Residency', desc: 'Play 7 days in a row', test: (s) => s.streak.best >= 7 },
    { id: 'streak30', icon: '🌍', name: 'World Tour', desc: 'Play 30 days in a row', test: (s) => s.streak.best >= 30 },
    { id: 'combo5', icon: '⚡', name: 'On a Roll', desc: 'Reach a 5× combo', test: (s) => s.counters.bestCombo >= 5 },
    { id: 'combo10', icon: '🚀', name: 'Unstoppable', desc: 'Reach a 10× combo', test: (s) => s.counters.bestCombo >= 10 },
    { id: 'ear25', icon: '👂', name: 'Good Ears', desc: 'Answer 25 ear questions correctly', test: (s) => s.counters.ear >= 25 },
    { id: 'ear100', icon: '🏅', name: 'Golden Ears', desc: 'Answer 100 ear questions correctly', test: (s) => s.counters.ear >= 100 },
    { id: 'build25', icon: '🏗️', name: 'Chord Architect', desc: 'Build 25 chords, scales or intervals', test: (s) => s.counters.build >= 25 },
    { id: 'fast20', icon: '⏱️', name: 'Quick Draw', desc: 'Give 20 correct answers in under 3 seconds', test: (s) => s.counters.fast >= 20 },
    { id: 'deep90', icon: '💿', name: 'Crate Digger', desc: 'Score 90+ obscurity on one Deep Cut answer', test: (s) => s.counters.deepBest >= 90 },
    { id: 'deep100', icon: '💎', name: 'The Deepest Cut', desc: 'Find the single most obscure answer', test: (s) => s.counters.deepBest >= 100 },
    { id: 'deep250', icon: '👑', name: 'Niche Royalty', desc: 'Score 250+ in one Deep Cut round', test: (s) => s.counters.deepRound >= 250 },
    { id: 'surv10', icon: '🛡️', name: 'Still Standing', desc: 'Survive 10 questions in Survival', test: (s) => s.survivalBest >= 10 },
    { id: 'surv25', icon: '🗿', name: 'Iron Chops', desc: 'Survive 25 questions in Survival', test: (s) => s.survivalBest >= 25 },
    { id: 'c100', icon: '💯', name: 'Century', desc: 'Answer 100 questions correctly', test: (s) => s.counters.correct >= 100 },
    { id: 'c500', icon: '🪵', name: 'Woodshedder', desc: 'Answer 500 questions correctly', test: (s) => s.counters.correct >= 500 },
    { id: 'lvl5', icon: '⭐', name: 'Rising Star', desc: 'Reach level 5', test: (s) => levelInfo(s.xp).level >= 5 },
    { id: 'lvl10', icon: '🎤', name: 'Headliner', desc: 'Reach level 10', test: (s) => levelInfo(s.xp).level >= 10 },
  ];
  function checkAchievements() {
    const st = load();
    const fresh2 = [];
    ACH.forEach((a) => {
      if (!st.ach[a.id] && a.test(st)) { st.ach[a.id] = today(); fresh2.push(a); }
    });
    if (fresh2.length) save();
    return fresh2;
  }

  // ---------- session results ----------
  function addXp(n) {
    const st = load();
    const before = levelInfo(st.xp);
    st.xp += Math.max(0, Math.round(n));
    save();
    const after = levelInfo(st.xp);
    return { before, after, leveled: after.level > before.level, gained: Math.round(n) };
  }
  function recordDeep(total, best) {
    const c = load().counters;
    c.deepBest = Math.max(c.deepBest, best);
    c.deepRound = Math.max(c.deepRound, total);
    save();
  }
  function finishDaily(result) {
    const st = load();
    const t = today();
    if (st.daily[t]) return { already: true, streak: liveStreak() };
    st.daily[t] = result;
    const gap = st.streak.last ? dayDiff(st.streak.last, t) : null;
    st.streak.count = gap === 1 ? st.streak.count + 1 : 1;
    st.streak.last = t;
    st.streak.best = Math.max(st.streak.best, st.streak.count);
    st.counters.dailies++;
    if (result.marks.every((m) => m === 1)) st.counters.perfects++;
    // keep the history from growing forever
    const keys = Object.keys(st.daily).sort();
    while (keys.length > 60) delete st.daily[keys.shift()];
    save();
    return { already: false, streak: st.streak.count };
  }
  // The optional Deep Cut bonus, played after the day's set: add its points to today's record.
  function addDailyDeep(total) {
    const rec = load().daily[today()];
    if (!rec) return null;
    if (rec.dc === null || rec.dc === undefined) {
      rec.dc = total;
      rec.score += total;
      delete rec.dcPicks;
      save();
    }
    return rec;
  }
  // Returns true the first time a chapter is completed (that is when its trophy is awarded).
  function completeChapter(index) {
    const st = load();
    st.chapters = st.chapters || {};
    if (st.chapters[index]) return false;
    st.chapters[index] = today();
    st.counters.chapters = Object.keys(st.chapters).length;
    save();
    return true;
  }
  // ---------- chapters on the Learn trail (stored as "islands" for older saves) ----------
  // A chapter opens when the one before it is complete. Your level gives a head start,
  // and a chapter stays open once it has been opened (or once you have progress on it or past it).
  const HEAD_START = { beginner: 1, intermediate: 4, advanced: 8 };
  function islands() {
    const st = load();
    const CH = root.Lessons.CHAPTERS;
    st.islands = st.islands || {};
    const out = CH.map((ch) => {
      const done = ch.ids.filter((id) => st.lessons[id]).length;
      return { done, total: ch.ids.length, complete: done === ch.ids.length, open: false, fresh: false };
    });
    let furthest = -1;
    out.forEach((o, i) => { if (o.done) furthest = i; });
    let changed = false;
    out.forEach((o, i) => {
      o.open = !!st.islands[i] || i < (HEAD_START[st.tier] || 1) || i <= furthest || (i > 0 && out[i - 1].complete);
      if (o.open && !st.islands[i]) { st.islands[i] = today(); changed = true; }
    });
    // chapters opened since the trail was last seen get a short "now open" moment
    if (!st.islandsSeen) { st.islandsSeen = {}; out.forEach((o, i) => { if (o.open) st.islandsSeen[i] = 1; }); changed = true; }
    out.forEach((o, i) => { o.fresh = o.open && !st.islandsSeen[i]; });
    if (changed) save();
    return out;
  }
  function markIslandsSeen() {
    const st = load();
    st.islandsSeen = st.islandsSeen || {};
    Object.keys(st.islands || {}).forEach((i) => { st.islandsSeen[i] = 1; });
    save();
  }

  function setStars(n) { const c = load().counters; c.stars = Math.max(c.stars || 0, n); save(); }
  function finishLesson(id, correct, total) {
    const st = load();
    const prev = st.lessons[id];
    const first = !prev;
    st.lessons[id] = { done: true, best: Math.max(prev ? prev.best : 0, correct), total };
    st.counters.lessons = Object.keys(st.lessons).length;
    save();
    return { first };
  }
  function recordSurvival(n) {
    const st = load();
    const best = n > st.survivalBest;
    if (best) { st.survivalBest = n; save(); }
    return best;
  }

  root.Store = {
    load, save, reset, today, dateStr, dayNumber, msToMidnight, levelInfo, skillInfo, liveStreak,
    recordAnswer, checkAchievements, addXp, recordDeep, finishDaily, addDailyDeep, finishLesson, completeChapter, setStars, recordSurvival, islands, markIslandsSeen, ACH,
    todayResult: () => load().daily[today()] || null,
  };
})(window);
