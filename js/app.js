/* Tonic — screens and game flow. */
(function () {
  'use strict';
  const T = window.Theory, Q = window.Questions, A = window.TonicAudio, R = window.Render, S = window.Store,
    DC = window.DeepCut, GT = window.Guitar, L = window.Lessons;
  const app = document.getElementById('app');
  const clamp = (x, lo, hi) => Math.max(lo, Math.min(hi, x));
  const num = (n) => Math.round(n).toLocaleString('en-US');
  const reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---------- tiny DOM helper ----------
  function h(tag, props) {
    const e = document.createElement(tag);
    if (props) {
      for (const k in props) {
        const v = props[k];
        if (v === null || v === undefined || v === false) continue;
        if (k === 'class') e.className = v;
        else if (k === 'html') e.innerHTML = v;
        else if (k.slice(0, 2) === 'on') e.addEventListener(k.slice(2), v);
        else if (k === 'style') Object.assign(e.style, v);
        else e.setAttribute(k, v === true ? '' : v);
      }
    }
    const add = (c) => {
      if (c === null || c === undefined || c === false) return;
      if (Array.isArray(c)) c.forEach(add);
      else e.appendChild(c.nodeType ? c : document.createTextNode(String(c)));
    };
    for (let i = 2; i < arguments.length; i++) add(arguments[i]);
    return e;
  }
  const plain = (html) => { const d = document.createElement('div'); d.innerHTML = html; return d.textContent; };

  let disposers = [];
  let onKey = null;
  const later = (fn, ms) => { const id = setTimeout(fn, ms); disposers.push(() => clearTimeout(id)); return id; };
  // tab: 'today' | 'learn' | 'practice' | 'profile' shows the bottom tab bar; omit it for focused flows
  function show(node, tab) {
    disposers.forEach((f) => f());
    disposers = [];
    onKey = null;
    A.stop();
    document.querySelectorAll('.sheet-wrap, .confetti, .toast, .tabbar').forEach((n) => n.remove());
    app.textContent = '';
    node.classList.add('screen');
    if (tab) { node.classList.add('tabbed'); document.body.appendChild(tabbar(tab)); }
    app.appendChild(node);
    window.scrollTo(0, 0);
  }
  document.addEventListener('keydown', (e) => {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    if (onKey) onKey(e);
  });
  // a focused button handles its own Space / Enter
  const onButton = (e) => {
    const ae = document.activeElement;
    return (e.key === ' ' || e.key === 'Enter') && ae && ae.tagName === 'BUTTON' && !ae.disabled;
  };

  function toast(text) {
    document.querySelectorAll('.toast').forEach((n) => n.remove());
    const t = h('div', { class: 'toast', role: 'status' }, text);
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 2400);
  }
  function countUp(el, to, ms) {
    if (reduced || !to || document.hidden) { el.textContent = num(to); return; }
    const t0 = performance.now();
    let finished = false;
    const step = (t) => {
      if (finished) return;
      const p = clamp((t - t0) / ms, 0, 1);
      el.textContent = num(to * (1 - Math.pow(1 - p, 3)));
      if (p < 1) requestAnimationFrame(step); else finished = true;
    };
    requestAnimationFrame(step);
    // animation frames pause in background tabs — always land on the real number
    setTimeout(() => { finished = true; el.textContent = num(to); }, ms + 250);
  }
  function confetti() {
    if (reduced) return;
    const box = h('div', { class: 'confetti', 'aria-hidden': 'true' });
    const colors = ['#ffd23f', '#3ddc97', '#ff6b6b', '#9b7bff', '#4cc9f0', '#ff7ac6'];
    for (let i = 0; i < 70; i++) {
      box.appendChild(h('i', { style: {
        left: Math.random() * 100 + '%', background: colors[i % colors.length],
        animationDelay: Math.random() * 0.5 + 's', animationDuration: 1.6 + Math.random() * 1.4 + 's',
        transform: `rotate(${Math.random() * 360}deg)`, width: 6 + Math.random() * 6 + 'px', height: 8 + Math.random() * 10 + 'px',
      } }));
    }
    document.body.appendChild(box);
    setTimeout(() => box.remove(), 3400);
  }

  const SENSE = {
    ear: { icon: '👂', label: 'Ear' }, eye: { icon: '👁️', label: 'Eye' },
    brain: { icon: '🧠', label: 'Brain' }, build: { icon: '🎹', label: 'Build' },
  };
  const skillName = (id) => (Q.SKILLS.find((s) => s.id === id) || {}).name || id;
  const logo = () => h('span', { class: 'logo', 'aria-hidden': 'true', html:
    '<svg viewBox="0 0 64 64"><rect width="64" height="64" rx="16" fill="#ffd23f"/><ellipse cx="26" cy="44" rx="10" ry="7.5" transform="rotate(-20 26 44)" fill="#15122b"/><rect x="33" y="14" width="5" height="31" rx="2" fill="#15122b"/><path d="M38 14c10 2 13 9 9 18-1-7-4-9-9-10z" fill="#15122b"/></svg>' });
  const speaker = () => h('span', { class: 'ico', 'aria-hidden': 'true', html:
    '<svg viewBox="0 0 24 24"><path d="M4 9v6h4l5 4V5L8 9H4z" fill="currentColor"/><path d="M16 8.5a5 5 0 010 7M18.5 6a8.5 8.5 0 010 12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>' });
  const backHeader = (label, fn) => h('header', { class: 'top' },
    h('button', { class: 'chip', onclick: fn, 'aria-label': 'Back' }, '← ' + label),
    h('div', { class: 'brand' }, logo(), h('span', null, 'Tonic')));

  // =====================================================================
  // Onboarding
  // =====================================================================
  function onboarding() {
    let pick = 'beginner';
    const cards = Object.keys(Q.TIERS).map((id) => {
      const t = Q.TIERS[id];
      return h('button', { class: 'tier' + (id === pick ? ' on' : ''), 'data-id': id, 'aria-pressed': id === pick ? 'true' : 'false', onclick: () => select(id) },
        h('strong', null, t.name), h('span', null, t.blurb));
    });
    function select(id) {
      pick = id;
      cards.forEach((c) => { const on = c.getAttribute('data-id') === id; c.classList.toggle('on', on); c.setAttribute('aria-pressed', on ? 'true' : 'false'); });
    }
    show(h('main', { class: 'onboard' },
      h('div', { class: 'brand big' }, logo(), h('span', null, 'Tonic')),
      h('h1', null, 'Learn music theory a few minutes at a time.'),
      h('ul', { class: 'pitch' },
        h('li', null, h('b', null, 'Start from zero.'), ' Short lessons teach notes, chords and scales on piano and guitar.'),
        h('li', null, h('b', null, 'Play a set every day.'), ' Eight quick questions for your ears, eyes and brain.'),
        h('li', null, h('b', null, 'Every answer teaches.'), ' Right or wrong, you see and hear why — and hints are always there.')),
      h('h2', { class: 'eyebrow' }, 'Where are you starting from?'),
      h('div', { class: 'tiers' }, cards),
      h('button', { class: 'btn big', onclick: () => {
        const st = S.load();
        st.tier = pick; st.keyLabels = pick === 'beginner';
        S.save(); A.unlock(); home();
      } }, 'Let’s play'),
      h('p', { class: 'fine' }, 'You can change your level any time. Progress is saved on this device.')));
  }

  // =====================================================================
  // Home
  // =====================================================================
  function marksRow(marks, dc) {
    return h('div', { class: 'marks' },
      marks.map((m) => h('i', { class: m ? 'ok' : 'no' })),
      dc !== undefined && dc !== null ? h('span', { class: 'dcchip' }, '💿 ', num(dc)) : null);
  }
  // ---------- navigation: four tabs along the bottom ----------
  const TAB_ICONS = {
    today: '<svg viewBox="0 0 24 24"><path d="M3 11.5 12 4l9 7.500V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/></svg>',
    learn: '<svg viewBox="0 0 24 24"><path d="M5 4h11a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3z"/><path d="M5 17a3 3 0 0 1 3-3h11"/></svg>',
    practice: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4"/><circle cx="12" cy="12" r="1" fill="currentColor"/></svg>',
    profile: '<svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4.500 21c.6-4 3.600-6 7.500-6s6.900 2 7.500 6"/></svg>',
  };
  function tabbar(active) {
    const tabs = [['today', 'Today', home], ['learn', 'Learn', lessons], ['practice', 'Practice', practiceTab], ['profile', 'Profile', profile]];
    return h('nav', { class: 'tabbar', 'aria-label': 'Main' }, h('div', { class: 'tabbar-in' },
      tabs.map(([id, label, fn]) => h('button', { class: 'tab' + (id === active ? ' on' : ''), 'aria-current': id === active ? 'page' : null, onclick: () => { if (id !== active) fn(); } },
        h('span', { class: 'tab-ico', 'aria-hidden': 'true', html: TAB_ICONS[id] }), h('span', null, label)))));
  }
  function topbar() {
    const st = S.load();
    const lv = S.levelInfo(st.xp);
    const streak = S.liveStreak();
    return h('header', { class: 'top' },
      h('div', { class: 'brand' }, logo(), h('span', null, 'Tonic')),
      h('div', { class: 'chips' },
        h('span', { class: 'chip streak' + (streak ? ' lit' : ''), title: 'Daily streak' }, '🔥 ', String(streak)),
        h('button', { class: 'chip lvchip', onclick: profile, 'aria-label': `Level ${lv.level}, ${lv.title}. Open profile` },
          h('b', null, 'Lv ' + lv.level), h('span', { class: 'mini' }, h('i', { style: { width: Math.round(lv.pct * 100) + '%' } })))));
  }
  // Monday-to-Sunday strip showing which days this week had a Daily Set
  function weekStrip(st) {
    const now = new Date();
    const dow = (now.getDay() + 6) % 7;
    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - dow + i);
      const done = !!st.daily[S.dateStr(d)];
      days.push(h('div', { class: 'wd' + (done ? ' done' : '') + (i === dow ? ' today' : '') + (i > dow ? ' future' : '') },
        h('span', null, 'MTWTFSS'[i]), h('i', null, done ? '✓' : '')));
    }
    return h('section', { class: 'week', 'aria-label': 'Daily Sets played this week' }, days);
  }
  function learnCard(st) {
    const doneN = L.LESSONS.filter((l) => st.lessons[l.id]).length;
    const next = L.LESSONS.find((l) => !st.lessons[l.id]);
    const idx = next ? L.LESSONS.indexOf(next) + 1 : 0;
    return h('section', { class: 'learn' },
      h('div', { class: 'learn-top' },
        h('div', { class: 'eyebrow' }, `Continue learning · ${doneN} of ${L.LESSONS.length}`),
        h('span', { class: 'bar' }, h('i', { style: { width: Math.round((doneN / L.LESSONS.length) * 100) + '%' } }))),
      next
        ? h('div', { class: 'learn-next' },
          h('span', { class: 'learn-ico', 'aria-hidden': 'true' }, next.icon),
          h('div', null, h('strong', null, `Lesson ${idx} · ${next.title}`), h('span', null, `${next.blurb} · about 3 min`)))
        : h('div', { class: 'learn-next' }, h('span', { class: 'learn-ico', 'aria-hidden': 'true' }, '🎓'),
          h('div', null, h('strong', null, 'Every lesson complete'), h('span', null, 'Revisit any of them whenever you like.'))),
      h('div', { class: 'hero-row' },
        next ? h('button', { class: 'btn', onclick: () => { A.unlock(); lesson(next, 0); } }, doneN ? 'Next lesson' : 'Start learning') : null,
        h('button', { class: 'ghost', onclick: lessons }, 'See the path')));
  }
  function modeCard(cls, icon, title, sub, fn) {
    return h('button', { class: 'mode m-' + cls, onclick: () => { A.unlock(); fn(); } },
      h('span', { class: 'mode-ico', 'aria-hidden': 'true' }, icon), h('strong', null, title), h('span', null, sub));
  }

  // ---------- Today ----------
  function home() {
    const st = S.load();
    if (!st.tier) return onboarding();
    A.setEnabled(st.sound);
    Q.setGuitar(st.guitar);
    const done = S.todayResult();
    const n = S.dayNumber();
    const tier = Q.TIERS[st.tier];
    const dateLabel = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
    const inProgress = st.progress && st.progress.date === S.today() && st.progress.tier === st.tier && st.progress.i > 0;

    let hero;
    if (done) {
      const cd = h('b', null, '');
      const tick = () => {
        const ms = S.msToMidnight();
        const hh = Math.floor(ms / 3600000), mm = Math.floor((ms % 3600000) / 60000), ss = Math.floor((ms % 60000) / 1000);
        cd.textContent = `${hh}h ${String(mm).padStart(2, '0')}m ${String(ss).padStart(2, '0')}s`;
      };
      tick();
      const iv = setInterval(tick, 1000);
      hero = h('section', { class: 'hero done' },
        h('div', { class: 'eyebrow' }, `Daily Set #${n} · done`),
        h('div', { class: 'hero-score' }, num(done.score), h('small', null, ' pts')),
        marksRow(done.marks, done.dc),
        h('div', { class: 'hero-row' },
          h('button', { class: 'btn', onclick: () => share(done) }, 'Share result'),
          h('p', { class: 'next' }, 'Next set in ', cd)));
      hero.__dispose = () => clearInterval(iv);
    } else {
      hero = h('section', { class: 'hero' },
        h('div', { class: 'eyebrow' }, `Daily Set #${n} · ${dateLabel}`),
        h('h1', null, inProgress ? 'Your set is waiting.' : 'Today’s set is ready.'),
        h('p', null, `8 questions + the Deep Cut encore · ${tier.name}`),
        h('div', { class: 'marks' }, Array.from({ length: 8 }, (_, i) => h('i', { class: inProgress && i < st.progress.i ? (st.progress.marks[i] ? 'ok' : 'no') : '' })), h('span', { class: 'dcchip' }, '💿')),
        h('button', { class: 'btn big', onclick: () => { A.unlock(); startDaily(); } }, inProgress ? 'Continue' : 'Play today’s set'));
    }

    // newcomers see the lessons first; everyone else sees the daily set first
    const learnFirst = st.tier === 'beginner' && Object.keys(st.lessons).length < 4;
    const learn = learnCard(st);
    show(h('main', { class: 'home' },
      topbar(),
      weekStrip(st),
      learnFirst ? [learn, hero] : [hero, learn],
      h('section', { class: 'modes' },
        modeCard('mix', '🎯', 'Smart Practice', 'Ten questions aimed at your weak spots', () => startPractice('mix')),
        modeCard('find', '🔎', 'Chord & Scale Finder', 'See and hear any chord or scale', () => explorer()))), 'today');
    if (hero.__dispose) disposers.push(hero.__dispose);
  }

  // ---------- Practice ----------
  function practiceTab() {
    const st = S.load();
    show(h('main', { class: 'practice' },
      topbar(),
      h('h1', null, 'Practice'),
      h('button', { class: 'feature', onclick: () => { A.unlock(); startPractice('mix'); } },
        h('span', { class: 'feature-ico', 'aria-hidden': 'true' }, '🎯'),
        h('span', { class: 'feature-main' }, h('strong', null, 'Smart Practice'), h('span', null, 'Ten questions picked from what you miss most, then a second chance at any you get wrong.')),
        h('span', { class: 'feature-go' }, 'Start')),
      h('h2', { class: 'eyebrow' }, 'Train a skill'),
      h('div', { class: 'skills' }, Q.SKILLS.map((sk) => {
        const info = S.skillInfo(sk.id);
        return h('button', { class: 'skill s-' + sk.id, onclick: () => { A.unlock(); startPractice(sk.id); } },
          h('span', { class: 'skill-ico', 'aria-hidden': 'true' }, sk.icon),
          h('span', { class: 'skill-main' }, h('strong', null, sk.name), h('span', null, sk.blurb)),
          h('span', { class: 'skill-lv' }, 'Lv ' + info.level),
          h('span', { class: 'bar' }, h('i', { style: { width: Math.round(info.pct * 100) + '%' } })));
      })),
      h('h2', { class: 'eyebrow' }, 'Games and tools'),
      h('section', { class: 'modes three' },
        modeCard('surv', '❤️', 'Survival', st.survivalBest ? `Three lives. Best run: ${st.survivalBest}` : 'Three lives. It keeps getting harder', startSurvival),
        modeCard('deep', '💿', 'Deep Cut', 'Many right answers. Go niche', startDeepFree),
        modeCard('find', '🔎', 'Finder', 'Any chord or scale, on piano and guitar', () => explorer()))), 'practice');
    onKey = (e) => { if (e.key === 'Escape') home(); };
  }

  function shareText(res) {
    const st = S.load();
    const grid = res.marks.map((m) => (m ? '🟩' : '🟥')).join('');
    const url = /^https?:/.test(location.protocol) ? '\n' + location.origin + location.pathname : '';
    return `Tonic #${S.dayNumber()} · ${Q.TIERS[res.tier || st.tier].name}\n${grid} 💿${res.dc}\n${num(res.score)} pts · 🔥${S.liveStreak()}${url}`;
  }
  function share(res) {
    const text = shareText(res);
    const fallback = () => {
      const ta = h('textarea', { class: 'sharebox', readonly: true }, text);
      document.body.appendChild(ta);
      ta.select();
      let ok = false;
      try { ok = document.execCommand('copy'); } catch (e) { /* ignore */ }
      ta.remove();
      toast(ok ? 'Copied — paste it anywhere' : text);
    };
    if (navigator.share && /Android|iPhone|iPad/i.test(navigator.userAgent)) navigator.share({ text }).catch(() => {});
    else if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(text).then(() => toast('Copied — paste it anywhere'), fallback);
    else fallback();
  }

  // =====================================================================
  // Learn path
  // =====================================================================
  const CHAPTERS = [
    { title: 'First notes', blurb: 'Note names, steps and the major scale', ids: ['alphabet', 'steps', 'major-scale'] },
    { title: 'Intervals and chords', blurb: 'Distances between notes, major and minor', ids: ['intervals', 'major-chords', 'minor-chords'] },
    { title: 'Reading and guitar', blurb: 'The staff, the six strings, first chords', ids: ['staff', 'guitar-strings', 'guitar-chords'] },
    { title: 'Keys and harmony', blurb: 'Key signatures, chord families, pentatonics', ids: ['keys', 'chord-family', 'pentatonic'] },
  ];
  const starCount = (rec) => (!rec ? 0 : rec.best >= rec.total ? 3 : rec.best >= rec.total * 0.6 ? 2 : 1);
  const starRow = (n) => h('span', { class: 'stars', 'aria-label': n + ' of 3 stars' }, [0, 1, 2].map((i) => h('i', { class: i < n ? 'on' : '' }, '★')));

  // The Learn tab: a winding path of lessons, grouped into four chapters.
  function lessons() {
    const st = S.load();
    const next = L.LESSONS.find((l) => !st.lessons[l.id]);
    const doneN = L.LESSONS.filter((l) => st.lessons[l.id]).length;
    const PW = 320, ROW = 108, R = 36;
    let nextEl = null;
    const chapters = CHAPTERS.map((ch, ci) => {
      const list = ch.ids.map((id) => L.byId(id));
      const chDone = list.filter((l) => st.lessons[l.id]).length;
      const pct = Math.round((chDone / list.length) * 100);
      const xs = list.map((_, i) => PW / 2 + ((i + ci) % 2 === 0 ? -70 : 70));
      const ys = list.map((_, i) => i * ROW + 20 + R);
      let d = '';
      for (let i = 0; i < list.length - 1; i++) {
        const my = (ys[i] + ys[i + 1]) / 2;
        d += `M${xs[i]} ${ys[i]} C${xs[i]} ${my} ${xs[i + 1]} ${my} ${xs[i + 1]} ${ys[i + 1]} `;
      }
      const nodes = list.map((les, i) => {
        const rec = st.lessons[les.id];
        const n = L.LESSONS.indexOf(les) + 1;
        const state = rec ? 'done' : les === next ? 'cur' : 'todo';
        const left = xs[i] < PW / 2;
        const btn = h('button', { class: 'node ' + state, style: { left: xs[i] - R + 'px', top: ys[i] - R + 'px' },
          'aria-label': `Lesson ${n}: ${les.title}${rec ? ', completed' : les === next ? ', up next' : ''}`, onclick: () => lessonSheet(les) },
        h('span', { class: 'node-ico', 'aria-hidden': 'true' }, les.icon),
        rec ? h('span', { class: 'node-check', 'aria-hidden': 'true' }, '✓') : null,
        les === next ? h('span', { class: 'node-start', 'aria-hidden': 'true' }, 'Start') : null);
        if (les === next) nextEl = btn;
        const label = h('div', { class: 'node-label ' + (left ? 'r' : 'l'), style: left ? { left: xs[i] + R + 14 + 'px', top: ys[i] - 26 + 'px' } : { right: PW - xs[i] + R + 14 + 'px', top: ys[i] - 26 + 'px' } },
          h('span', { class: 'eyebrow' }, 'Lesson ' + n), h('strong', null, les.title), rec ? starRow(starCount(rec)) : null);
        return [btn, label];
      });
      const line = `<svg viewBox="0 0 ${PW} ${list.length * ROW}" aria-hidden="true"><path d="${d}"/></svg>`;
      const ring = h('div', { class: 'ring', 'aria-label': `${chDone} of ${list.length} lessons done` }, h('b', null, `${chDone}/${list.length}`));
      ring.style.setProperty('--p', pct);
      return h('section', { class: 'chapter' + (chDone === list.length ? ' complete' : '') },
        h('div', { class: 'chapter-head' },
          h('div', null, h('span', { class: 'eyebrow' }, 'Chapter ' + (ci + 1)), h('strong', null, ch.title), h('span', null, ch.blurb)),
          ring),
        h('div', { class: 'path', style: { height: list.length * ROW + 'px' } }, h('div', { class: 'path-line', html: line }), nodes));
    });
    show(h('main', { class: 'lessons' },
      topbar(),
      h('div', { class: 'learn-head' },
        h('h1', null, 'Learn'),
        h('p', { class: 'lead' }, doneN === L.LESSONS.length ? 'All twelve lessons done. Tap any of them to revisit it.' : `${doneN} of ${L.LESSONS.length} lessons done. Each one takes about three minutes.`),
        h('span', { class: 'bar' }, h('i', { style: { width: Math.round((doneN / L.LESSONS.length) * 100) + '%' } }))),
      chapters), 'learn');
    if (nextEl && L.LESSONS.indexOf(next) > 2) nextEl.scrollIntoView({ block: 'center' });
    onKey = (e) => { if (e.key === 'Escape') { if (document.querySelector('.sheet-wrap.modal')) document.querySelector('.sheet-wrap.modal').remove(); else home(); } };
  }
  // Tapping a lesson on the path opens this card.
  function lessonSheet(les) {
    document.querySelectorAll('.sheet-wrap').forEach((n) => n.remove());
    const rec = S.load().lessons[les.id];
    const n = L.LESSONS.indexOf(les) + 1;
    const wrap = h('div', { class: 'sheet-wrap modal', onclick: (e) => { if (e.target === wrap) wrap.remove(); } },
      h('div', { class: 'sheet info', role: 'dialog', 'aria-label': les.title },
        h('div', { class: 'sheet-head' },
          h('span', { class: 'sheet-ico big', 'aria-hidden': 'true' }, les.icon),
          h('div', null, h('span', { class: 'eyebrow' }, 'Lesson ' + n), h('strong', null, les.title))),
        h('p', { class: 'explain' }, les.blurb + '.'),
        h('div', { class: 'meta' },
          h('span', null, `${les.cards.length} short cards`), h('span', null, '5 questions'), h('span', null, 'About 3 min'),
          rec ? h('span', { class: 'best' }, `Best ${rec.best}/${rec.total}`) : null),
        h('button', { class: 'btn big go', onclick: () => { A.unlock(); lesson(les, 0); } }, rec ? 'Review lesson' : 'Start lesson'),
        h('button', { class: 'ghost', onclick: () => wrap.remove() }, 'Not now')));
    document.body.appendChild(wrap);
    wrap.querySelector('.go').focus({ preventScroll: true });
  }

  function lesson(les, idx) {
    const card = les.cards[idx];
    const n = L.LESSONS.indexOf(les) + 1;
    const last = idx === les.cards.length - 1;
    const play = () => { if (card.a) A.play(card.a); };
    const go = (d) => {
      if (d > 0 && last) return startLesson(les);
      const j = idx + d;
      if (j >= 0) lesson(les, j);
    };
    show(h('main', { class: 'lesson' },
      h('div', { class: 'hud' },
        h('button', { class: 'x', onclick: lessons, 'aria-label': 'Close lesson' }, '✕'),
        h('div', { class: 'segs' }, les.cards.map((_, i) => h('i', { class: i < idx ? 'ok' : i === idx ? 'cur' : '' })), h('i', { class: 'quizseg' })),
        h('div', { class: 'hud-step' }, `${idx + 1}/${les.cards.length}`)),
      h('article', { class: 'lcard' },
        h('div', { class: 'eyebrow' }, `Lesson ${n} · ${les.title}`),
        h('h2', null, card.h),
        h('p', { class: 'ltext', html: card.p }),
        card.v ? h('div', { class: 'visual v-' + card.v.kind }, R.visual(card.v)) : null,
        card.a ? h('button', { class: 'ghost hear', onclick: play }, speaker(), card.al || 'Hear it') : null),
      h('div', { class: 'lnav' },
        idx > 0 ? h('button', { class: 'ghost', onclick: () => go(-1) }, '← Back') : h('span'),
        h('button', { class: 'btn', onclick: () => go(1) }, last ? 'Try 5 questions' : 'Next', h('kbd', null, '↵')))));
    onKey = (e) => {
      if (onButton(e)) return;
      if (e.key === 'Enter' || e.key === 'ArrowRight') { e.preventDefault(); go(1); }
      else if (e.key === 'ArrowLeft') go(-1);
      else if (e.key === ' ') { e.preventDefault(); play(); }
      else if (e.key === 'Escape') lessons();
    };
  }
  function startLesson(les) {
    const st = S.load();
    const rng = T.makeRng(Date.now() >>> 0);
    const qs = Q.lessonQuiz(rng, les.quiz);
    advance({ mode: 'lesson', title: les.title, lesson: les, tier: st.tier, qs, total: qs.length, i: 0, score: 0, combo: 0, bestCombo: 0, marks: [], log: [], rng });
  }

  // =====================================================================
  // Sessions
  // =====================================================================
  function startDaily() {
    const st = S.load();
    const date = S.today();
    if (st.daily[date]) return home();
    const qs = Q.daily(date, st.tier);
    const ses = { mode: 'daily', title: 'Daily Set', date, tier: st.tier, qs, total: qs.length, i: 0, score: 0, combo: 0, bestCombo: 0, marks: [], log: [] };
    const p = st.progress;
    if (p && p.date === date && p.tier === st.tier) {
      ses.i = p.i; ses.score = p.score; ses.combo = p.combo; ses.bestCombo = p.bestCombo; ses.marks = p.marks.slice();
      ses.log = p.marks.map((m, k) => ({ q: qs[k], correct: !!m, pts: p.pts[k] }));
    }
    advance(ses);
  }
  function startPractice(skill) {
    const st = S.load();
    advance({ mode: 'practice', title: skill === 'mix' ? 'Smart Practice' : skillName(skill), skill, tier: st.tier, total: 10, i: 0, score: 0, combo: 0, bestCombo: 0, marks: [], log: [], rng: T.makeRng(Date.now() >>> 0) });
  }
  function startSurvival() {
    const st = S.load();
    advance({ mode: 'survival', title: 'Survival', tier: st.tier, lives: 3, i: 0, score: 0, combo: 0, bestCombo: 0, marks: [], log: [], rng: T.makeRng(Date.now() >>> 0) });
  }
  function startDeepFree() {
    const st = S.load();
    const round = DC.make(T.makeRng(Date.now() >>> 0), st.tier);
    runDeepCut(round, { title: 'Deep Cut', onDone: (total, best, picks) => deepResults(round, total, best, picks) });
  }

  function advance(ses) {
    if (ses.mode === 'daily') {
      if (ses.i < ses.total) return runQuestion(ses, ses.qs[ses.i]);
      return deepIntro(ses);
    }
    if (ses.mode === 'survival') {
      const last = ses.log.length ? ses.log[ses.log.length - 1].q.gen : null;
      if (ses.lives > 0) return runQuestion(ses, Q.survival(ses.rng, ses.tier, ses.i, last));
      return results(ses);
    }
    // practice and lessons: ten (or five) questions, then a second chance at the ones you missed
    if (ses.i < ses.total) {
      if (ses.mode === 'lesson') return runQuestion(ses, ses.qs[ses.i]);
      return runQuestion(ses, Q.practice(ses.rng, {
        skill: ses.skill, tier: ses.tier, items: S.load().items,
        recentGens: ses.log.slice(ses.skill === 'mix' ? -3 : -1).map((l) => l.q.gen),
        recentKeys: ses.log.slice(-5).map((l) => l.q.key),
      }));
    }
    if (!ses.retry) {
      ses.retry = ses.log.filter((l) => !l.correct).map((l) => l.q);
      ses.retryTotal = ses.retry.length;
      ses.fixed = 0;
      if (ses.retry.length) return retryIntro(ses);
    }
    if (ses.retry.length) return runQuestion(ses, ses.retry.shift(), true);
    return results(ses);
  }
  function retryIntro(ses) {
    const n = ses.retry.length;
    show(h('main', { class: 'interlude' },
      h('div', { class: 'disc still', 'aria-hidden': 'true' }, '🔁'),
      h('div', { class: 'eyebrow' }, 'Second chance'),
      h('h1', null, n === 1 ? 'One to try again' : `${n} to try again`),
      h('p', null, 'You just saw the explanations — now let’s make them stick. Same questions, no timer, nothing to lose.'),
      h('button', { class: 'btn big', onclick: () => advance(ses) }, 'Try again'),
      h('button', { class: 'ghost', onclick: () => { ses.retry = []; results(ses); } }, 'Skip to results')));
    onKey = (e) => { if (!onButton(e) && e.key === 'Enter') { e.preventDefault(); advance(ses); } };
  }
  function saveProgress(ses) {
    const st = S.load();
    st.progress = { date: ses.date, tier: ses.tier, i: ses.i, score: ses.score, combo: ses.combo, bestCombo: ses.bestCombo, marks: ses.marks.slice(), pts: ses.log.map((l) => l.pts), dcPicks: [] };
    S.save();
  }
  function quit(ses) {
    const msg = ses.mode === 'daily' ? 'Leave the Daily Set? Your progress is saved — you’ll pick up at the next question.' : 'Leave this session?';
    if (!window.confirm(msg)) return;
    if (ses.mode === 'lesson') lessons(); else home();
  }

  // =====================================================================
  // One question
  // =====================================================================
  const PRAISE = ['Nice!', 'Spot on!', 'Yes!', 'Nailed it!', 'In tune!', 'Pitch perfect!', 'Exactly!'];

  function hud(ses, retryLeft) {
    let mid;
    if (retryLeft) {
      mid = h('div', { class: 'hud-title' }, `🔁 Second chance · ${retryLeft} left`);
    } else if (ses.mode === 'survival') {
      mid = h('div', { class: 'hearts', 'aria-label': ses.lives + ' lives left' },
        [0, 1, 2].map((i) => h('i', { class: i < ses.lives ? 'on' : '' }, '♥')),
        h('span', null, 'Q' + (ses.i + 1)));
    } else {
      mid = h('div', { class: 'segs', 'aria-label': `Question ${Math.min(ses.i + 1, ses.total)} of ${ses.total}` },
        Array.from({ length: ses.total }, (_, i) => h('i', { class: i < ses.marks.length ? (ses.marks[i] ? 'ok' : 'no') : i === ses.i ? 'cur' : '' })));
    }
    return h('div', { class: 'hud' },
      h('button', { class: 'x', onclick: () => quit(ses), 'aria-label': 'Quit' }, '✕'),
      mid,
      h('div', { class: 'score', 'aria-label': 'Score' }, num(ses.score)));
  }

  function runQuestion(ses, q, retry) {
    const inp = q.input;
    const isSurv = ses.mode === 'survival';
    const relaxed = !!retry || ses.mode === 'lesson'; // no clock: just think
    const windowSec = inp.kind === 'piano' ? (inp.exact ? 12 : 12 + 3 * inp.targetPcs.length) : inp.kind === 'fret' ? 14 : 10;
    const limitSec = windowSec + 6;
    const retryLeft = retry ? ses.retry.length + 1 : 0;
    let done = false, raf = 0, tStart = 0, sheetWrap = null, playing = 0, usedHint = false;

    // --- listen button for ear questions
    let listen = null;
    function playMain() {
      const len = A.play(q.audio);
      if (listen) {
        listen.classList.add('playing');
        clearTimeout(playing);
        playing = setTimeout(() => listen && listen.classList.remove('playing'), len * 1000);
      }
      return len;
    }
    if (q.audio) {
      listen = h('button', { class: 'listen', onclick: playMain, 'aria-label': 'Play the sound again' },
        h('span', { class: 'ring' }), h('span', { class: 'ring r2' }), speaker(), h('em', null, 'Listen again'));
    }

    // --- visual
    let visualEl = R.visual(q.visual);
    const visualBox = h('div', { class: 'visual' + (q.visual ? ' v-' + q.visual.kind : '') }, visualEl, listen);

    // --- timer / speed bonus bar
    const barFill = h('i');
    const bar = relaxed ? null : h('div', { class: 'timebar' + (isSurv ? ' hard' : ''), title: isSurv ? 'Time left' : 'Speed bonus' }, barFill);

    // --- hint
    const hintText = h('p', { class: 'hint', role: 'note' });
    const hintBtn = q.hint ? h('button', { class: 'hintbtn', onclick: showHint, title: relaxed ? 'Show a hint' : 'Show a hint (gives up the speed bonus)' }, '💡 Hint', h('kbd', null, 'H')) : null;
    function showHint() {
      if (done || usedHint || !q.hint) return;
      usedHint = true;
      hintText.textContent = '💡 ' + q.hint;
      hintText.classList.add('on');
      hintBtn.disabled = true;
      barFill.style.transform = 'scaleX(0)';
    }

    // --- answers
    let answersEl, optBtns = [], pianoApi = null, fbApi = null, checkBtn = null, fretPick = null;
    const sel = new Set();
    if (inp.kind === 'choice') {
      const letters = inp.layout === 'letters';
      const long = inp.options.some((o) => o.label.length > 15);
      optBtns = inp.options.map((o, i) => h('button', { class: 'opt', onclick: () => pick(i) },
        letters ? null : h('kbd', null, String(i + 1)), h('span', null, o.label)));
      answersEl = h('div', { class: 'opts' + (letters ? ' letters' : long || inp.layout === 'one' || inp.options.length < 3 ? ' one' : '') }, optBtns);
    } else if (inp.kind === 'fret') {
      fbApi = R.fretboard({ from: inp.from, to: inp.to, dots: [], onFret: (s, f) => {
        if (done) return;
        A.play(GT.pluck([[s, f]]));
        fretPick = { s, f };
        fbApi.set([{ s, f, cls: 'sel' }]);
        checkBtn.disabled = false;
      } });
      checkBtn = h('button', { class: 'btn', disabled: true, onclick: checkFret }, 'Check');
      answersEl = h('div', { class: 'pianoin' },
        h('div', { class: 'tray' }, fbApi.el),
        h('div', { class: 'pianoin-row' }, h('span', { class: 'count' }, 'Tap a string at a fret'), checkBtn));
    } else {
      const given = inp.given || [];
      const state = () => { const s2 = {}; given.forEach((m) => { s2[m] = 'given'; }); sel.forEach((m) => { s2[m] = 'sel'; }); return s2; };
      const counter = h('span', { class: 'count' }, '');
      const need = inp.exact ? inp.targetMidis.length : inp.targetPcs.length;
      const refresh = () => {
        pianoApi.set(state());
        checkBtn.disabled = sel.size === 0;
        counter.textContent = `${sel.size} / ${need} selected`;
      };
      pianoApi = R.piano({ lo: inp.lo, hi: inp.hi, hintC: true, labelAll: S.load().keyLabels, state: state(), onKey: (m) => {
        if (done) return;
        A.note(m, 0.5);
        if (given.includes(m)) return;
        if (sel.has(m)) sel.delete(m);
        else {
          if (inp.max === 1) sel.clear();
          else if (sel.size >= inp.max) { toast('That’s more notes than you need — tap one to remove it'); return; }
          sel.add(m);
        }
        refresh();
      } });
      checkBtn = h('button', { class: 'btn', disabled: true, onclick: checkPiano }, 'Check');
      answersEl = h('div', { class: 'pianoin' },
        h('div', { class: 'tray' }, pianoApi.el),
        h('div', { class: 'pianoin-row' }, counter,
          h('button', { class: 'ghost', onclick: () => { if (!done) { sel.clear(); refresh(); } } }, 'Clear'), checkBtn));
      counter.textContent = `0 / ${need} selected`;
    }

    const comboEl = h('div', { class: 'combo' + (!retry && ses.combo >= 2 ? ' on' : '') }, !retry && ses.combo >= 2 ? `🔥 ${ses.combo} in a row · ×${(1 + Math.min(ses.combo, 10) * 0.1).toFixed(1)}` : '');
    const hudEl = hud(ses, retryLeft);
    const page = h('main', { class: 'play' },
      hudEl,
      h('div', { class: 'qcard sense-' + q.sense },
        h('div', { class: 'qtop' },
          h('span', { class: 'tag' }, SENSE[q.sense].icon + ' ' + SENSE[q.sense].label + ' · ' + skillName(q.skill)),
          comboEl),
        h('h2', { class: 'prompt', html: q.prompt }),
        q.sub ? h('p', { class: 'sub' }, q.sub) : null,
        (q.visual || q.audio) ? visualBox : null,
        h('div', { class: 'qfoot' }, hintBtn, hintText),
        bar),
      answersEl);
    show(page);

    // --- clock
    const audioLen = q.audio ? playMain() : 0;
    tStart = performance.now() + audioLen * 1000;
    const tickFn = () => {
      if (done) return;
      const el = (performance.now() - tStart) / 1000;
      const span = isSurv ? limitSec : windowSec;
      if (isSurv || !usedHint) barFill.style.transform = `scaleX(${clamp(1 - el / span, 0, 1)})`;
      if (isSurv && el >= limitSec) { finish(false, { timeout: true }); return; }
      raf = requestAnimationFrame(tickFn);
    };
    if (!relaxed) raf = requestAnimationFrame(tickFn);
    disposers.push(() => { done = true; cancelAnimationFrame(raf); clearTimeout(playing); });

    onKey = (e) => {
      const k = e.key;
      if (onButton(e)) return;
      if (done) {
        if (k === 'Enter' || (k === ' ' && !q.audio)) { e.preventDefault(); next(); }
        else if (k === ' ' && q.audio) { e.preventDefault(); playMain(); }
        return;
      }
      if (k === ' ' && q.audio) { e.preventDefault(); playMain(); return; }
      if (inp.kind === 'choice') {
        if (inp.layout === 'letters') {
          const i = T.LETTERS.indexOf(k.toUpperCase());
          if (i >= 0) { pick(i); return; }
        } else if (/^[1-9]$/.test(k) && +k <= inp.options.length) { pick(+k - 1); return; }
      } else if (k === 'Enter') {
        e.preventDefault();
        if (inp.kind === 'fret') checkFret(); else if (sel.size) checkPiano();
        return;
      }
      if (k === 'h' || k === 'H') showHint();
    };

    function pick(i) {
      if (done) return;
      const ok = i === inp.answer;
      optBtns.forEach((b, j) => {
        b.disabled = true;
        if (j === inp.answer) b.classList.add('correct');
        else if (j === i) b.classList.add('wrong');
        else b.classList.add('dim');
      });
      finish(ok, { chosen: i });
    }
    function checkPiano() {
      if (done || !sel.size) return;
      const st2 = {};
      (inp.given || []).forEach((m) => { st2[m] = 'given'; });
      let ok;
      if (inp.exact) {
        ok = sel.size === inp.targetMidis.length && inp.targetMidis.every((m) => sel.has(m));
        sel.forEach((m) => { st2[m] = inp.targetMidis.includes(m) ? 'good' : 'bad'; });
        inp.targetMidis.forEach((m) => { if (!sel.has(m)) st2[m] = 'miss'; });
      } else {
        const got = new Set([...sel].map((m) => m % 12));
        const want = new Set(inp.targetPcs);
        ok = got.size === want.size && [...want].every((p) => got.has(p));
        sel.forEach((m) => { st2[m] = want.has(m % 12) ? 'good' : 'bad'; });
        want.forEach((p) => { if (!got.has(p)) { for (let m = inp.lo; m <= inp.hi; m++) if (m % 12 === p) { st2[m] = 'miss'; break; } } });
      }
      pianoApi.set(st2);
      checkBtn.disabled = true;
      finish(ok, {});
    }
    function checkFret() {
      if (done || !fretPick) return;
      const ok = GT.pcAt(fretPick.s, fretPick.f) === inp.targetPc;
      const dots = GT.positions(inp.targetPc, 0, inp.to).map((p) => ({ s: p.s, f: p.f, cls: 'good', label: T.PC_SHARP[inp.targetPc] }));
      if (!ok) dots.push({ s: fretPick.s, f: fretPick.f, cls: 'bad', label: T.PC_SHARP[GT.pcAt(fretPick.s, fretPick.f)] });
      fbApi.set(dots);
      checkBtn.disabled = true;
      finish(ok, {});
    }

    function finish(ok, info) {
      if (done) return;
      done = true;
      cancelAnimationFrame(raf);
      const elapsed = Math.max(0, (performance.now() - tStart) / 1000);
      let pts = 0, bonus = 0, mult = 1;
      if (retry) {
        if (ok) ses.fixed++;
        S.recordAnswer(q, ok, 99, 0);
      } else {
        if (ok) {
          bonus = relaxed || usedHint ? 0 : Math.round(50 * clamp(1 - elapsed / windowSec, 0, 1));
          mult = 1 + Math.min(ses.combo, 10) * 0.1;
          pts = Math.round((100 + bonus) * mult);
          ses.combo++;
          ses.bestCombo = Math.max(ses.bestCombo, ses.combo);
        } else {
          ses.combo = 0;
          if (isSurv) ses.lives--;
        }
        ses.score += pts;
        ses.marks.push(ok ? 1 : 0);
        ses.log.push({ q, correct: ok, pts });
        ses.i++;
        S.recordAnswer(q, ok, relaxed || usedHint ? 99 : elapsed, ses.combo);
        if (ses.mode === 'daily') saveProgress(ses);
      }
      A.stop();
      A.sfx(ok ? 'good' : 'bad', retry ? 0 : ses.combo);
      if (info.timeout) optBtns.forEach((b, j) => { b.disabled = true; b.classList.add(j === inp.answer ? 'correct' : 'dim'); });
      if (hintBtn) hintBtn.disabled = true;

      // refresh the HUD in place
      if (!retry) {
        const fresh = hud(Object.assign({}, ses, { i: ses.i - 1 }));
        hudEl.replaceWith(fresh);
        const scoreEl = fresh.querySelector('.score');
        if (ok && scoreEl) scoreEl.classList.add('bump');
        comboEl.className = 'combo' + (ses.combo >= 2 ? ' on pop' : '');
        comboEl.textContent = ses.combo >= 2 ? `🔥 ${ses.combo} in a row` : '';
      }

      // show the answer on the question's own picture when it has one
      let revealEl = null;
      if (q.reveal) {
        if (q.visual && q.visual.kind === q.reveal.kind && visualEl) {
          const nv = R.visual(q.reveal);
          visualEl.replaceWith(nv); visualEl = nv;
        } else revealEl = h('div', { class: 'reveal r-' + q.reveal.kind }, R.visual(q.reveal));
      }
      if (q.audioAfter && !q.audio) later(() => A.play(q.audioAfter), 520);

      const parts = [];
      if (ok && !retry) {
        if (bonus > 0) parts.push(`speed +${bonus}`);
        if (usedHint && !relaxed) parts.push('hint used');
        if (mult > 1) parts.push(`combo ×${mult.toFixed(1)}`);
      }
      const chosen = info.chosen !== undefined ? inp.options[info.chosen] : null;
      const moreToRetry = !retry && (ses.mode === 'practice' || ses.mode === 'lesson') && ses.i >= ses.total && ses.marks.some((m) => !m);
      const isLast = retry ? ses.retry.length === 0
        : (isSurv && ses.lives <= 0) || ((ses.mode === 'practice' || ses.mode === 'lesson') && ses.i >= ses.total && !moreToRetry);
      // the explanation scrolls if it is long; Continue always stays in reach
      const sheet = h('div', { class: 'sheet ' + (ok ? 'good' : 'bad'), role: 'status' }, h('div', { class: 'sheet-body' },
        h('div', { class: 'sheet-head' },
          h('span', { class: 'sheet-ico', 'aria-hidden': 'true' }, ok ? '✓' : '✗'),
          h('div', null,
            h('strong', null, ok ? (retry ? 'Got it this time!' : PRAISE[Math.floor(Math.random() * PRAISE.length)]) : info.timeout ? 'Out of time' : 'Not quite'),
            h('span', { class: 'pts' }, ok ? (retry ? 'That’s how it sticks.' : `+${pts}` + (parts.length ? ` · ${parts.join(' · ')}` : '')) : 'Answer: ', ok ? null : h('b', null, q.answerText)))),
        h('p', { class: 'explain', html: q.explain }),
        revealEl,
        h('div', { class: 'sheet-actions' },
          q.audio ? h('button', { class: 'ghost', onclick: () => A.play(q.audio) }, speaker(), ok ? 'Hear it again' : 'Right answer') : null,
          !ok && chosen && chosen.audio ? h('button', { class: 'ghost', onclick: () => A.play(chosen.audio) }, speaker(), 'Your answer') : null,
          q.audioAfter ? h('button', { class: 'ghost', onclick: () => A.play(q.audioAfter) }, speaker(), 'Hear it') : null)),
        h('button', { class: 'btn big go', onclick: next }, isLast ? 'See results' : 'Continue', h('kbd', null, '↵')));
      sheetWrap = h('div', { class: 'sheet-wrap' }, sheet);
      document.body.appendChild(sheetWrap);
      sheet.querySelector('.go').focus({ preventScroll: true });
      // make room for the sheet and keep the answers visible just above it
      requestAnimationFrame(() => {
        const sh = sheet.offsetHeight;
        page.style.paddingBottom = sh + 24 + 'px';
        const over = answersEl.getBoundingClientRect().bottom - (window.innerHeight - sh - 12);
        if (over > 0) window.scrollBy({ top: over, behavior: reduced ? 'auto' : 'smooth' });
      });
    }
    function next() {
      if (sheetWrap) sheetWrap.remove();
      advance(ses);
    }
  }

  // =====================================================================
  // Deep Cut
  // =====================================================================
  function deepIntro(ses) {
    const round = DC.make(T.makeRng('dc:' + ses.date + ':' + ses.tier), ses.tier);
    show(h('main', { class: 'interlude' },
      h('div', { class: 'disc', 'aria-hidden': 'true' }, '💿'),
      h('div', { class: 'eyebrow' }, 'Encore'),
      h('h1', null, 'The Deep Cut'),
      h('p', null, 'One question, lots of right answers. You get ', h('b', null, 'three picks'), '.'),
      h('p', null, 'Obvious answers score low. The more obscure your pick, the more it’s worth — up to 100 each. A wrong pick scores nothing.'),
      h('button', { class: 'btn big', onclick: () => runDeepCut(round, {
        title: 'Deep Cut', daily: true,
        initial: (S.load().progress || {}).dcPicks,
        onPick: (list) => { const st = S.load(); if (st.progress) { st.progress.dcPicks = list; S.save(); } },
        onDone: (total, best) => { ses.dc = total; ses.dcBest = best; results(ses); },
      }) }, 'Start the encore')));
    onKey = (e) => { if (e.key === 'Enter') { e.preventDefault(); document.querySelector('.interlude .btn').click(); } };
  }

  function runDeepCut(round, opts) {
    let root = null, type = null, total = 0, best = 0;
    const picks = [];
    const st0 = {};
    for (let m = 60; m <= 83; m++) if (round.given.includes(m % 12) && m < 72) st0[m] = 'mark';
    const labels0 = {};
    round.given.forEach((p, i) => { labels0[60 + p] = round.givenNames[i]; });

    const rootBtns = T.PC_SHARP.map((nm, p) => h('button', { class: 'pk' + (T.IS_BLACK[p] ? ' blk' : ''), onclick: () => { root = p; sync(); A.note(60 + p, 0.35); } },
      T.IS_BLACK[p] ? [h('span', null, T.PC_SHARP[p]), h('span', null, T.PC_FLAT[p])] : nm));
    const typeBtns = round.types.map((t) => h('button', { class: 'pk ty', onclick: () => { type = t.id; sync(); A.sfx('tap'); } }, h('strong', null, t.label), h('span', null, t.sub)));
    const lockBtn = h('button', { class: 'btn big', disabled: true, onclick: () => lock() }, 'Lock in');
    const slots = [0, 1, 2].map((i) => h('li', { class: 'slot' }, h('span', { class: 'slot-n' }, String(i + 1)), h('span', { class: 'slot-empty' }, 'Pick ' + (i + 1))));
    const totalEl = h('div', { class: 'score' }, '0');
    const pickers = h('div', { class: 'pickers' },
      h('h3', { class: 'eyebrow' }, 'Root'), h('div', { class: 'pk-roots' }, rootBtns),
      h('h3', { class: 'eyebrow' }, round.kind === 'scale' ? 'Scale' : 'Chord type'), h('div', { class: 'pk-types' }, typeBtns),
      lockBtn);
    const page = h('main', { class: 'play deep' },
      h('div', { class: 'hud' },
        h('button', { class: 'x', onclick: () => { if (window.confirm(opts.daily ? 'Leave the encore? Your locked-in picks are saved.' : 'Leave this round?')) home(); }, 'aria-label': 'Quit' }, '✕'),
        h('div', { class: 'hud-title' }, '💿 ' + opts.title),
        totalEl),
      h('div', { class: 'qcard sense-deep' },
        h('span', { class: 'tag' }, 'Three picks · rarer = more points'),
        h('h2', { class: 'prompt', html: round.title }),
        round.hint ? h('p', { class: 'sub' }, round.hint) : null,
        h('div', { class: 'visual v-piano' }, R.piano({ lo: 60, hi: 83, state: st0, labels: labels0 }).el)),
      h('ol', { class: 'slots' }, slots),
      pickers);
    show(page);
    // picks already locked in before leaving (Daily Set) stay locked in
    (opts.initial || []).forEach((p) => { root = p.root; type = p.type; lock(true); });

    function name() {
      if (root === null || type === null) return null;
      const c = DC.check(round, root, type);
      return c.ok ? c.answer.label : c.label;
    }
    function sync() {
      rootBtns.forEach((b, p) => b.classList.toggle('on', p === root));
      typeBtns.forEach((b, i) => b.classList.toggle('on', round.types[i].id === type));
      const nm = name();
      lockBtn.disabled = !nm;
      lockBtn.textContent = nm ? 'Lock in ' + nm : 'Lock in';
    }
    function lock(quiet) {
      if (root === null || type === null || picks.length >= 3) return;
      if (picks.some((p) => p.root === root && p.type === type)) { toast('You already used that one'); return; }
      const c = DC.check(round, root, type);
      const sfx = quiet === true ? () => {} : A.sfx;
      const slot = slots[picks.length];
      slot.textContent = '';
      if (c.ok) {
        const a = c.answer;
        total += a.score; best = Math.max(best, a.score);
        const fill = h('i');
        slot.className = 'slot hit';
        slot.append(h('span', { class: 'slot-n' }, String(picks.length + 1)),
          h('div', { class: 'slot-main' },
            h('strong', null, a.label), h('span', { class: 'slot-notes' }, a.notes.map(T.fmt).join(' – ')),
            h('div', { class: 'meter' }, fill), h('em', null, DC.verdict(a.score))),
          h('span', { class: 'slot-pts' }, '+' + a.score));
        requestAnimationFrame(() => requestAnimationFrame(() => { fill.style.width = a.score + '%'; }));
        setTimeout(() => { fill.style.width = a.score + '%'; }, 300);
        sfx('deep', a.score);
        if (quiet !== true) later(() => A.play([{ at: 0, midis: a.notes.map((n) => T.midi(n)), dur: 1.4 }]), 420);
        picks.push({ root, type, ok: true, label: a.label, score: a.score });
      } else {
        slot.className = 'slot miss';
        slot.append(h('span', { class: 'slot-n' }, String(picks.length + 1)),
          h('div', { class: 'slot-main' },
            h('strong', null, c.label), h('span', { class: 'slot-notes' }, c.notes.map(T.fmt).join(' – ')),
            h('em', null, `No ${c.missing.join(' or ')} in there`)),
          h('span', { class: 'slot-pts' }, '0'));
        sfx('bad');
        picks.push({ root, type, ok: false, label: c.label, score: 0 });
      }
      if (quiet !== true && opts.onPick) opts.onPick(picks.map((p) => ({ root: p.root, type: p.type })));
      totalEl.textContent = num(total);
      totalEl.classList.remove('bump'); void totalEl.offsetWidth; totalEl.classList.add('bump');
      root = null; type = null; sync();
      if (picks.length >= 3) finishRound();
    }
    function finishRound() {
      S.recordDeep(total, best);
      const mine = new Set(picks.filter((p) => p.ok).map((p) => p.label));
      const sorted = round.answers.slice().sort((a, b) => b.score - a.score);
      const obvious = sorted[sorted.length - 1], deepest = sorted[0];
      const board = h('section', { class: 'board' },
        h('h3', null, `${round.answers.length} ${round.noun}s would have worked`),
        h('p', { class: 'sub' }, 'Most obvious: ', h('b', null, obvious.label), ' · Deepest cut: ', h('b', null, deepest.label)),
        h('div', { class: 'board-list' }, sorted.map((a) => h('span', { class: 'ans' + (mine.has(a.label) ? ' mine' : ''), title: a.notes.map(T.fmt).join(' – ') }, a.label, h('b', null, String(a.score))))),
        h('button', { class: 'btn big', onclick: () => opts.onDone(total, best, picks) }, opts.daily ? 'See results' : 'Finish'));
      pickers.replaceWith(board);
      onKey = (e) => { if (e.key === 'Enter') { e.preventDefault(); opts.onDone(total, best, picks); } };
      later(() => board.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' }), 700);
    }
  }

  function deepResults(round, total, best) {
    const xp = S.addXp(Math.round(total / 6));
    const ach = S.checkAchievements();
    if (total >= 200) { confetti(); A.sfx('win'); }
    show(h('main', { class: 'results' },
      h('div', { class: 'eyebrow' }, 'Deep Cut'),
      h('h1', null, total >= 250 ? 'Niche royalty.' : total >= 180 ? 'Properly obscure.' : total >= 90 ? 'Decent digging.' : 'Stick to the hits?'),
      bigScore(total, 'of 300'),
      xpBlock(xp), achBlock(ach),
      h('div', { class: 'actions' },
        h('button', { class: 'btn big', onclick: startDeepFree }, 'Another round'),
        h('button', { class: 'ghost', onclick: home }, 'Home'))));
  }

  // =====================================================================
  // Results
  // =====================================================================
  function bigScore(n, sub) {
    const v = h('span', null, '0');
    later(() => countUp(v, n, 900), 150);
    return h('div', { class: 'bigscore' }, v, h('small', null, sub));
  }
  function xpBlock(xp) {
    const a = xp.after;
    const fill = h('i', { style: { width: (xp.leveled ? 0 : Math.round(xp.before.pct * 100)) + '%' } });
    later(() => { fill.style.width = Math.round(a.pct * 100) + '%'; }, 500);
    if (xp.leveled) later(() => A.sfx('level'), 900);
    return h('div', { class: 'xp' + (xp.leveled ? ' up' : '') },
      h('div', { class: 'xp-row' }, h('strong', null, xp.leveled ? `Level up! Lv ${a.level} · ${a.title}` : `Lv ${a.level} · ${a.title}`), h('span', null, `+${num(xp.gained)} XP`)),
      h('span', { class: 'bar' }, fill));
  }
  function achBlock(list) {
    if (!list.length) return null;
    return h('div', { class: 'newach' }, list.map((a) => h('div', { class: 'ach on' }, h('span', { class: 'ach-ico' }, a.icon), h('div', null, h('em', null, 'Achievement unlocked'), h('strong', null, a.name), h('span', null, a.desc)))));
  }
  function recap(log) {
    return h('section', { class: 'recap' },
      h('h2', { class: 'eyebrow' }, 'Review'),
      log.map((l) => h('details', { class: l.correct ? 'ok' : 'no' },
        h('summary', null,
          h('i', { class: 'mk' }, l.correct ? '✓' : '✗'),
          h('span', { class: 'rq' }, SENSE[l.q.sense].icon + ' ' + plain(l.q.prompt)),
          h('b', null, l.q.answerText)),
        h('p', { class: 'explain', html: l.q.explain }))));
  }

  const tile = (tone, label, value) => h('div', { class: 'tile t-' + tone }, h('em', null, label), h('strong', null, value));
  // The medal at the top of a results screen. tone: great | good | low
  function emblem(icon, tone, starsN) {
    return h('div', { class: 'emblem e-' + tone, 'aria-hidden': 'true' },
      h('span', { class: 'emblem-ring' }), h('span', { class: 'emblem-ring r2' }),
      h('span', { class: 'emblem-core' }, icon),
      starsN === undefined ? null : h('span', { class: 'emblem-stars' }, [0, 1, 2].map((i) => h('i', { class: i < starsN ? 'on' : '' }, '★'))));
  }

  function results(ses) {
    const correct = ses.marks.filter(Boolean).length;
    const totalQ = ses.marks.length;
    const fixedTile = ses.retryTotal ? tile('sky', '2nd try', `${ses.fixed}/${ses.retryTotal}`) : null;
    let title, score = ses.score, sub = 'points', xpGain, tiles, primary, icon, tone, starsN, lead = null, party = false;
    if (ses.mode === 'daily') {
      score = ses.score + (ses.dc || 0);
      const r = S.finishDaily({ score, marks: ses.marks.slice(), dc: ses.dc || 0, tier: ses.tier, bestCombo: ses.bestCombo });
      const st = S.load(); st.progress = null; S.save();
      title = ['Rough gig. Tomorrow’s another show.', 'Rough gig. Tomorrow’s another show.', 'Sound check done.', 'Sound check done.', 'Solid set.', 'Solid set.', 'Encore!', 'Encore!', 'Standing ovation!'][correct];
      xpGain = Math.round(score / 10) + 20;
      icon = '🎤'; tone = correct >= 6 ? 'great' : correct >= 4 ? 'good' : 'low';
      tiles = [tile('mint', 'Correct', `${correct}/8`), tile('yellow', 'Deep cut', '💿 ' + (ses.dc || 0)), tile('orange', 'Day streak', '🔥 ' + r.streak)];
      const res = { score, marks: ses.marks, dc: ses.dc || 0, tier: ses.tier };
      lead = marksRow(ses.marks, ses.dc || 0);
      primary = h('div', { class: 'actions' },
        h('button', { class: 'btn big', onclick: () => share(res) }, 'Share result'),
        h('button', { class: 'ghost', onclick: home }, 'Done'));
      party = correct >= 6;
    } else if (ses.mode === 'lesson') {
      const les = ses.lesson;
      const r = S.finishLesson(les.id, correct, totalQ);
      const nextLes = L.LESSONS[L.LESSONS.indexOf(les) + 1];
      title = correct === totalQ ? 'Lesson mastered!' : correct >= totalQ * 0.6 ? 'Lesson complete!' : 'Lesson done — worth a second look.';
      score = correct; sub = `of ${totalQ} correct`;
      xpGain = r.first ? 40 + correct * 8 : correct * 4;
      icon = les.icon; tone = correct >= totalQ * 0.6 ? 'great' : 'good';
      starsN = correct >= totalQ ? 3 : correct >= totalQ * 0.6 ? 2 : 1;
      tiles = [tile('mint', 'Correct', `${correct}/${totalQ}`), fixedTile, tile('yellow', 'Lessons', `${Object.keys(S.load().lessons).length}/${L.LESSONS.length}`)];
      primary = h('div', { class: 'actions' },
        nextLes ? h('button', { class: 'btn big', onclick: () => lesson(nextLes, 0) }, `Next: ${nextLes.title}`) : h('button', { class: 'btn big', onclick: home }, 'Back home'),
        correct < totalQ ? h('button', { class: 'ghost', onclick: () => lesson(les, 0) }, 'Review this lesson') : null,
        h('button', { class: 'ghost', onclick: lessons }, 'Back to the path'));
      party = correct >= totalQ * 0.6;
    } else if (ses.mode === 'practice') {
      title = correct === totalQ ? 'Flawless.' : correct >= totalQ * 0.7 ? 'Good session.' : 'That’s how you learn.';
      xpGain = ses.log.reduce((s, l) => s + (l.correct ? 6 + l.q.diff * 2 : 1), 0) + (ses.fixed || 0) * 3;
      icon = '🎯'; tone = correct === totalQ ? 'great' : correct >= totalQ * 0.5 ? 'good' : 'low';
      tiles = [tile('mint', 'Correct', `${correct}/${totalQ}`), tile('orange', 'Best combo', '🔥 ' + ses.bestCombo), fixedTile];
      primary = h('div', { class: 'actions' },
        h('button', { class: 'btn big', onclick: () => startPractice(ses.skill) }, 'Go again'),
        h('button', { class: 'ghost', onclick: practiceTab }, 'Done'));
      party = correct === totalQ;
    } else {
      const isBest = S.recordSurvival(correct);
      title = isBest && correct > 0 ? 'New personal best!' : correct >= 10 ? 'What a run.' : 'Out of lives.';
      score = correct; sub = 'questions survived';
      xpGain = correct * 6;
      icon = '❤️'; tone = isBest && correct > 0 ? 'great' : correct >= 5 ? 'good' : 'low';
      tiles = [tile('yellow', 'Points', num(ses.score)), tile('orange', 'Best combo', '🔥 ' + ses.bestCombo), tile('mint', 'Best run', String(S.load().survivalBest))];
      primary = h('div', { class: 'actions' },
        h('button', { class: 'btn big', onclick: startSurvival }, 'Try again'),
        h('button', { class: 'ghost', onclick: practiceTab }, 'Done'));
      party = isBest && correct >= 5;
    }
    const xp = S.addXp(xpGain);
    const ach = S.checkAchievements();
    if (party) { confetti(); A.sfx('win'); }
    show(h('main', { class: 'results' },
      emblem(icon, tone, starsN),
      h('div', { class: 'eyebrow center' }, ses.mode === 'daily' ? `Daily Set #${S.dayNumber()} · ${Q.TIERS[ses.tier].name}` : ses.mode === 'lesson' ? `Lesson ${L.LESSONS.indexOf(ses.lesson) + 1} · ${ses.lesson.title}` : ses.title),
      h('h1', { class: 'center' }, title),
      ses.mode === 'lesson' ? null : bigScore(score, sub), // a lesson's score is already in its tiles and stars
      lead,
      h('div', { class: 'tiles' }, tiles, tile('violet', 'XP earned', '+' + num(xpGain))),
      xpBlock(xp), achBlock(ach), primary, recap(ses.log)));
  }

  // =====================================================================
  // Chord & Scale Finder
  // =====================================================================
  function explorer() {
    const state = { mode: 'chord', root: 0, type: 'maj' };
    const out = h('section', { class: 'found' });
    const modeBtns = [['chord', 'Chords'], ['scale', 'Scales']].map(([id, label]) => h('button', { class: 'seg', onclick: () => {
      if (state.mode === id) return;
      state.mode = id; state.type = id === 'chord' ? 'maj' : 'major';
      buildTypes(); render();
    } }, label));
    const rootBtns = T.PC_SHARP.map((nm, p) => h('button', { class: 'pk' + (T.IS_BLACK[p] ? ' blk' : ''), onclick: () => { state.root = p; render(true); } },
      T.IS_BLACK[p] ? [h('span', null, T.PC_SHARP[p]), h('span', null, T.PC_FLAT[p])] : nm));
    const typeBox = h('div', { class: 'chips-wrap' });
    let typeBtns = [];
    function buildTypes() {
      const ids = state.mode === 'chord' ? Object.keys(T.CHORDS) : Object.keys(T.SCALES);
      typeBtns = ids.map((id) => {
        const plainName = { maj: 'major', min: 'minor', dim: 'dim', aug: 'aug' };
        const label = state.mode === 'chord' ? (plainName[id] || T.CHORDS[id].sym) : T.SCALES[id].name;
        return h('button', { class: 'tchip', 'data-id': id, onclick: () => { state.type = id; render(true); } }, label);
      });
      typeBox.textContent = '';
      typeBtns.forEach((b) => typeBox.appendChild(b));
    }
    function current() {
      const isScale = state.mode === 'scale';
      const rn = Q.bestRoot(state.root, state.type, isScale, 4);
      const notes = isScale ? T.scaleNotes(rn, state.type) : T.chordNotes(rn, state.type);
      return { isScale, rn, notes };
    }
    function pianoAudio() {
      const { isScale, notes } = current();
      const ms = notes.map(T.midi);
      return isScale ? ms.concat([ms[0] + 12]).map((x, i) => ({ at: i * 0.32, midis: [x], dur: 0.45 }))
        : [{ at: 0, midis: ms, dur: 1.3 }].concat(ms.map((x, i) => ({ at: 1.5 + i * 0.28, midis: [x], dur: 0.9 })));
    }
    function render(sound) {
      const { isScale, rn, notes } = current();
      modeBtns.forEach((b, i) => b.classList.toggle('on', (i === 0) !== isScale));
      rootBtns.forEach((b, p) => b.classList.toggle('on', p === state.root));
      typeBtns.forEach((b) => b.classList.toggle('on', b.getAttribute('data-id') === state.type));
      const def = isScale ? T.SCALES[state.type] : T.CHORDS[state.type];
      const name = isScale ? T.fmt(rn) + ' ' + def.name : Q.chordLabel(rn, state.type);
      const ms = notes.map(T.midi);
      const labels = {};
      notes.forEach((nn) => { labels[T.midi(nn)] = T.fmt(nn); });
      let hi = 83; while (hi < Math.max(...ms)) hi += 12;
      const nameOf = {};
      notes.forEach((nn) => { nameOf[T.pc(nn)] = T.fmt(nn); });
      const rootPc = T.pc(rn);
      const shape = isScale ? null : GT.shapeFor(state.root, state.type);
      let guitarEl, guitarCap, guitarAudio = null;
      if (shape) {
        guitarEl = R.chordBox(shape.frets, { notes: GT.shapeNotes(shape) }).el;
        guitarCap = `Open-position shape: ${GT.shapeText(shape.frets)}`;
        guitarAudio = GT.strum(shape.frets);
      } else {
        const to = isScale ? 12 : 5;
        guitarEl = R.fretboard({ from: 1, to, dots: GT.positions(Object.keys(nameOf).map(Number), 0, to).map((p) => {
          const pcv = GT.pcAt(p.s, p.f);
          return { s: p.s, f: p.f, label: nameOf[pcv], cls: pcv === rootPc ? 'root' : null };
        }) }).el;
        guitarCap = isScale ? 'Every place the scale’s notes sit, up to fret 12. Yellow dots are the root.'
          : 'No simple open shape for this one — here is where its notes sit on the first five frets. Yellow dots are the root.';
      }
      out.textContent = '';
      out.append(
        h('div', { class: 'found-head' },
          h('h2', null, name),
          h('p', { class: 'found-notes' }, notes.map(T.fmt).join(' – ')),
          h('p', { class: 'sub' }, isScale ? cap(def.feel) + '.' : `Formula ${def.formula} — ${def.feel}.`)),
        h('div', { class: 'found-block' },
          h('div', { class: 'found-top' }, h('h3', { class: 'eyebrow' }, 'Piano'), h('button', { class: 'ghost small', onclick: () => A.play(pianoAudio()) }, speaker(), 'Play')),
          h('div', { class: 'tray' }, R.piano({ lo: 60, hi, marks: ms, labels }).el)),
        h('div', { class: 'found-block' },
          h('div', { class: 'found-top' }, h('h3', { class: 'eyebrow' }, 'Guitar'), guitarAudio ? h('button', { class: 'ghost small', onclick: () => A.play(guitarAudio) }, speaker(), 'Strum') : null),
          h('div', { class: 'tray g' + (shape ? ' box' : '') }, guitarEl),
          h('p', { class: 'sub' }, guitarCap)));
      if (sound) A.play(pianoAudio());
    }
    const cap = (s) => s[0].toUpperCase() + s.slice(1);
    buildTypes();
    show(h('main', { class: 'finder' },
      backHeader('Practice', practiceTab),
      h('h1', null, 'Chord & Scale Finder'),
      h('p', { class: 'lead' }, 'Pick a root and a type to see it on piano and guitar, and hear how it sounds.'),
      h('div', { class: 'segctl wide' }, modeBtns),
      h('div', { class: 'pk-roots' }, rootBtns),
      typeBox,
      out));
    render();
    onKey = (e) => { if (e.key === 'Escape') practiceTab(); };
  }

  // =====================================================================
  // Profile
  // =====================================================================
  function switchRow(title, sub, key, after) {
    const st = S.load();
    return h('div', { class: 'set' }, h('div', null, h('strong', null, title), h('span', null, sub)),
      h('button', { class: 'switch' + (st[key] ? ' on' : ''), role: 'switch', 'aria-checked': st[key] ? 'true' : 'false', 'aria-label': title, onclick: (e) => {
        st[key] = !st[key]; S.save();
        e.currentTarget.classList.toggle('on', st[key]); e.currentTarget.setAttribute('aria-checked', st[key] ? 'true' : 'false');
        if (after) after(st[key]);
      } }, h('i')));
  }
  function profile() {
    const st = S.load();
    const lv = S.levelInfo(st.xp);
    const c = st.counters;
    const acc = c.answered ? Math.round((c.correct / c.answered) * 100) : 0;
    const tierBtns = Object.keys(Q.TIERS).map((id) => h('button', { class: 'seg' + (st.tier === id ? ' on' : ''), 'aria-pressed': st.tier === id ? 'true' : 'false', onclick: () => {
      if (st.tier === id) return;
      st.tier = id; st.progress = null; S.save(); profile(); toast('Level set to ' + Q.TIERS[id].name);
    } }, Q.TIERS[id].name));
    const unlocked = S.ACH.filter((a) => st.ach[a.id]).length;
    // unlocked achievements first, so progress is the first thing you see
    const achs = S.ACH.slice().sort((a, b) => (st.ach[b.id] ? 1 : 0) - (st.ach[a.id] ? 1 : 0));
    show(h('main', { class: 'profile' },
      h('header', { class: 'top' }, h('div', { class: 'brand' }, logo(), h('span', null, 'Tonic'))),
      h('section', { class: 'card me' },
        h('div', { class: 'me-lv' }, String(lv.level)),
        h('div', null, h('strong', null, lv.title), h('span', null, `${num(st.xp)} XP total · ${num(lv.span - lv.into)} to next level`), h('span', { class: 'bar' }, h('i', { style: { width: Math.round(lv.pct * 100) + '%' } })))),
      h('div', { class: 'tiles' },
        tile('orange', 'Streak', '🔥 ' + S.liveStreak()), tile('yellow', 'Best streak', String(st.streak.best)),
        tile('mint', 'Accuracy', acc + '%'), tile('violet', 'Correct', num(c.correct))),
      h('h2', { class: 'eyebrow' }, `Achievements · ${unlocked}/${S.ACH.length}`),
      h('div', { class: 'achs' }, achs.map((a) => h('div', { class: 'ach' + (st.ach[a.id] ? ' on' : '') },
        h('span', { class: 'ach-ico' }, st.ach[a.id] ? a.icon : '🔒'), h('div', null, h('strong', null, a.name), h('span', null, a.desc))))),
      h('h2', { class: 'eyebrow' }, 'Settings'),
      h('section', { class: 'card settings' },
        h('div', { class: 'set' }, h('div', null, h('strong', null, 'Level'), h('span', null, 'Sets the difficulty of your Daily Set and practice')), h('div', { class: 'segctl' }, tierBtns)),
        switchRow('Note names on keys', 'Print C D E F G A B on the keyboard when you build chords and scales', 'keyLabels'),
        switchRow('Guitar questions', 'Mix guitar into the Daily Set, practice and Survival', 'guitar', (v) => Q.setGuitar(v)),
        switchRow('Sound', 'Needed for the ear rounds', 'sound', (v) => { A.setEnabled(v); if (v) A.sfx('lock'); }),
        h('div', { class: 'set' }, h('div', null, h('strong', null, 'Reset progress'), h('span', null, 'Erase XP, streak, lessons and achievements on this device')),
          h('button', { class: 'ghost danger', onclick: () => { if (window.confirm('Erase all your Tonic progress on this device? This can’t be undone.')) { S.reset(); home(); } } }, 'Reset')))), 'profile');
    onKey = (e) => { if (e.key === 'Escape') home(); };
  }

  // Handy while developing: Tonic.preview('key-sig', 3) or Tonic.deep('advanced') from the console.
  window.Tonic = {
    preview(genId, d, seed, o) {
      const st = S.load();
      if (!st.tier) { st.tier = 'intermediate'; S.save(); }
      const g = Q.byId[genId];
      const rng = T.makeRng(seed === undefined ? Date.now() >>> 0 : seed);
      const ses = { mode: 'practice', title: 'Preview', skill: g.skill, tier: st.tier, total: 1, i: 0, score: 0, combo: 0, bestCombo: 0, marks: [], log: [], rng };
      runQuestion(ses, Q.make(g, rng, d || g.min, o));
    },
    deep(tier, seed) {
      const round = DC.make(T.makeRng(seed === undefined ? Date.now() >>> 0 : seed), tier || 'intermediate');
      runDeepCut(round, { title: 'Deep Cut', onDone: (total, best) => deepResults(round, total, best) });
    },
    lesson(id, idx) { lesson(L.byId(id), idx || 0); },
    home, lessons, explorer, practice: practiceTab, profile,
  };

  home();
})();
